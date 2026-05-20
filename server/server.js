import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HundredScoringEngine } from './scoring-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json({ limit: '10mb' })); // support larger base64 uploads

// Serve uploads folder as static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
const BACKUP_DIR = path.join(__dirname, 'matches');
const ACTIVE_POINTER_FILE = path.join(BACKUP_DIR, 'active-match-id.txt');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

let activeMatchId = null;
let matchState = null;

// Read active match pointer
if (fs.existsSync(ACTIVE_POINTER_FILE)) {
  activeMatchId = fs.readFileSync(ACTIVE_POINTER_FILE, 'utf8').trim();
}

if (activeMatchId) {
  const matchFile = path.join(BACKUP_DIR, `match-${activeMatchId}.json`);
  if (fs.existsSync(matchFile)) {
    try {
      const data = fs.readFileSync(matchFile, 'utf8');
      matchState = JSON.parse(data);
      console.log(`Restored match state for active match ID: ${activeMatchId}`);
    } catch (err) {
      console.error('Failed to restore active match state:', err);
    }
  }
}

// Fallback initial state if none exists
if (!matchState) {
  activeMatchId = 'default';
  const matchFile = path.join(BACKUP_DIR, `match-${activeMatchId}.json`);
  if (fs.existsSync(matchFile)) {
    try {
      matchState = JSON.parse(fs.readFileSync(matchFile, 'utf8'));
    } catch (e) {
      matchState = HundredScoringEngine.createInitialState();
    }
  } else {
    matchState = HundredScoringEngine.createInitialState();
    matchState.id = activeMatchId;
    fs.writeFileSync(matchFile, JSON.stringify(matchState, null, 2), 'utf8');
  }
  fs.writeFileSync(ACTIVE_POINTER_FILE, activeMatchId, 'utf8');
}

function saveStateToDisk() {
  if (!activeMatchId) return;
  try {
    // Avoid saving the undo/redo stacks to the backup file to keep it clean and lightweight
    const stateToSave = JSON.parse(JSON.stringify(matchState));
    delete stateToSave.undoStack;
    delete stateToSave.redoStack;
    const matchFile = path.join(BACKUP_DIR, `match-${activeMatchId}.json`);
    fs.writeFileSync(matchFile, JSON.stringify(stateToSave, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to back up match state:', err);
  }
}
let gfxClearTimeout = null;

function startGfxClearTimer() {
  if (gfxClearTimeout) {
    clearTimeout(gfxClearTimeout);
  }
  gfxClearTimeout = setTimeout(() => {
    if (matchState && matchState.gfxMessage) {
      const msg = matchState.gfxMessage.toUpperCase();
      // Only clear automated alerts, let custom banner texts remain
      if (msg.includes('WICKET') || msg.includes('FOUR') || msg.includes('SIX') || msg.includes('50') || msg.includes('HUNDRED')) {
        matchState.gfxMessage = null;
        matchState.psdLayers.boundaryAlert = false;
        matchState.psdLayers.wicketAlert = false;
        matchState.psdLayers.milestoneAlert = false;
        io.emit('match-update', matchState);
        saveStateToDisk();
      }
    }
  }, 4000);
}

// Broadcast helper
function broadcastUpdate() {
  io.emit('match-update', matchState);
  saveStateToDisk();

  // If there's an automated gfxMessage, schedule an auto-clear event
  if (matchState && matchState.gfxMessage) {
    const msg = matchState.gfxMessage.toUpperCase();
    if (msg.includes('WICKET') || msg.includes('FOUR') || msg.includes('SIX') || msg.includes('50') || msg.includes('HUNDRED')) {
      startGfxClearTimer();
    }
  }
}

// API Routes
app.get('/', (req, res) => {
  res.send('The Hundred Cricket Scoring & Broadcast Graphics API Server is running.');
});

app.post('/api/upload', (req, res) => {
  try {
    const { filename, base64Data } = req.body;
    if (!filename || !base64Data) {
      return res.status(400).json({ error: 'Missing filename or base64Data' });
    }

    const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Content, 'base64');
    
    const ext = path.extname(filename) || '.png';
    const cleanFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, cleanFilename);
    
    fs.writeFileSync(filePath, buffer);
    
    // We should make the returned URL absolute relative to the backend server
    const host = req.get('host') || 'localhost:5000';
    // Support either localhost or any relative domain, fallback to http since it's local
    const url = `http://${host}/uploads/${cleanFilename}`;
    
    res.json({ url });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/matches', (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const matches = [];
    for (const file of files) {
      if (file.startsWith('match-') && file.endsWith('.json')) {
        const matchId = file.substring(6, file.length - 5);
        const filePath = path.join(BACKUP_DIR, file);
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const currInn = data.currentInnings || 1;
          const innData = data.innings ? data.innings[currInn - 1] : null;
          const runs = innData ? innData.runs : 0;
          const wickets = innData ? innData.wickets : 0;
          const balls = innData ? innData.ballsBowled : 0;
          
          matches.push({
            id: matchId,
            isActive: matchId === activeMatchId,
            tournament: data.tournament || "The Hundred Match",
            venue: data.venue || "Lord's, London",
            status: data.status || 'setup',
            teamA: {
              name: data.teamA?.name || 'Team A',
              shortName: data.teamA?.shortName || 'TMA',
              color: data.teamA?.color || '#333333',
              logo: data.teamA?.logo || ''
            },
            teamB: {
              name: data.teamB?.name || 'Team B',
              shortName: data.teamB?.shortName || 'TMB',
              color: data.teamB?.color || '#777777',
              logo: data.teamB?.logo || ''
            },
            currentInnings: currInn,
            score: { runs, wickets, balls }
          });
        } catch (e) {
          console.error(`Failed to parse match file: ${file}`, e);
        }
      }
    }
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/matches', (req, res) => {
  try {
    const config = req.body || {};
    const matchId = `m-${Date.now()}`;
    const newState = HundredScoringEngine.createInitialState();
    
    newState.id = matchId;
    newState.tournament = config.tournament || "The Hundred Men's Competition";
    newState.venue = config.venue || "Lord's, London";
    newState.gender = config.gender || 'men';
    
    if (config.teamA) {
      newState.teamA = { ...newState.teamA, ...config.teamA };
    }
    if (config.teamB) {
      newState.teamB = { ...newState.teamB, ...config.teamB };
    }
    
    const matchFile = path.join(BACKUP_DIR, `match-${matchId}.json`);
    fs.writeFileSync(matchFile, JSON.stringify(newState, null, 2), 'utf8');
    
    res.json({ id: matchId, state: newState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/matches/:id/activate', (req, res) => {
  try {
    const { id } = req.params;
    const matchFile = path.join(BACKUP_DIR, `match-${id}.json`);
    if (!fs.existsSync(matchFile)) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    const data = fs.readFileSync(matchFile, 'utf8');
    matchState = JSON.parse(data);
    activeMatchId = id;
    
    fs.writeFileSync(ACTIVE_POINTER_FILE, activeMatchId, 'utf8');
    io.emit('match-update', matchState);
    
    res.json({ success: true, activeMatchId, state: matchState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/matches/:id', (req, res) => {
  try {
    const { id } = req.params;
    const matchFile = path.join(BACKUP_DIR, `match-${id}.json`);
    if (fs.existsSync(matchFile)) {
      fs.unlinkSync(matchFile);
    }
    
    if (activeMatchId === id) {
      activeMatchId = 'default';
      fs.writeFileSync(ACTIVE_POINTER_FILE, activeMatchId, 'utf8');
      const defaultFile = path.join(BACKUP_DIR, `match-${activeMatchId}.json`);
      if (fs.existsSync(defaultFile)) {
        matchState = JSON.parse(fs.readFileSync(defaultFile, 'utf8'));
      } else {
        matchState = HundredScoringEngine.createInitialState();
        matchState.id = activeMatchId;
        fs.writeFileSync(defaultFile, JSON.stringify(matchState, null, 2), 'utf8');
      }
      io.emit('match-update', matchState);
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/match', (req, res) => {
  res.json(matchState);
});

app.post('/api/match/action', (req, res) => {
  const action = req.body;
  if (!action || !action.type) {
    return res.status(400).json({ error: 'Invalid action payload' });
  }

  try {
    matchState = HundredScoringEngine.processAction(matchState, action);
    broadcastUpdate();
    res.json(matchState);
  } catch (err) {
    console.error('Error processing action:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/match/undo', (req, res) => {
  try {
    matchState = HundredScoringEngine.undo(matchState);
    broadcastUpdate();
    res.json(matchState);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/match/redo', (req, res) => {
  try {
    matchState = HundredScoringEngine.redo(matchState);
    broadcastUpdate();
    res.json(matchState);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/match/reset', (req, res) => {
  try {
    matchState = HundredScoringEngine.createInitialState();
    broadcastUpdate();
    res.json(matchState);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('match-update', matchState);

  socket.on('request-update', () => {
    socket.emit('match-update', matchState);
  });

  // Allows operators or clients to quick trigger specific events
  socket.on('gfx-action', (data) => {
    if (data.type === 'TOGGLE_PSD_LAYER') {
      if (data.layer === 'activePlayerCard') {
        if (data.playerCardData !== undefined) {
          matchState.psdLayers.activePlayerCard = data.playerCardData;
        } else {
          matchState.psdLayers.activePlayerCard = matchState.psdLayers.activePlayerCard ? null : false;
        }
      } else {
        matchState.psdLayers[data.layer] = !matchState.psdLayers[data.layer];
      }
      broadcastUpdate();
    } else if (data.type === 'SET_GFX_MESSAGE') {
      matchState.gfxMessage = data.message;
      if (data.message) {
        matchState.gfxMessageId = (matchState.gfxMessageId || 0) + 1;
      }
      broadcastUpdate();
    } else if (data.type === 'SET_THEME') {
      matchState.theme = data.theme;
      broadcastUpdate();
    } else if (data.type === 'SET_SPONSOR') {
      matchState.activeSponsor = data.sponsorId;
      broadcastUpdate();
    } else if (data.type === 'UPDATE_TEAM_DETAILS') {
      const { teamKey, updates } = data;
      if (teamKey === 'teamA' || teamKey === 'teamB') {
        matchState[teamKey] = {
          ...matchState[teamKey],
          ...updates
        };
        broadcastUpdate();
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
