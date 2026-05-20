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
app.use(express.json());

const BACKUP_DIR = path.join(__dirname, 'matches');
const BACKUP_FILE = path.join(BACKUP_DIR, 'active-match.json');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

let matchState = null;

// Try to load active match state from disk
try {
  if (fs.existsSync(BACKUP_FILE)) {
    const data = fs.readFileSync(BACKUP_FILE, 'utf8');
    matchState = JSON.parse(data);
    console.log('Restored match state from local backup');
  }
} catch (err) {
  console.error('Failed to restore match state:', err);
}

// Fallback initial state if none exists
if (!matchState) {
  matchState = HundredScoringEngine.createInitialState();
}

function saveStateToDisk() {
  try {
    // Avoid saving the undo/redo stacks to the backup file to keep it clean and lightweight
    const stateToSave = JSON.parse(JSON.stringify(matchState));
    delete stateToSave.undoStack;
    delete stateToSave.redoStack;
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(stateToSave, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to back up match state:', err);
  }
}

// Broadcast helper
function broadcastUpdate() {
  io.emit('match-update', matchState);
  saveStateToDisk();
}

// API Routes
app.get('/', (req, res) => {
  res.send('The Hundred Cricket Scoring & Broadcast Graphics API Server is running.');
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
      matchState.psdLayers[data.layer] = !matchState.psdLayers[data.layer];
      if (data.playerCardData !== undefined) {
        matchState.psdLayers.activePlayerCard = data.playerCardData;
      }
      broadcastUpdate();
    } else if (data.type === 'SET_GFX_MESSAGE') {
      matchState.gfxMessage = data.message;
      broadcastUpdate();
    } else if (data.type === 'SET_THEME') {
      matchState.theme = data.theme;
      broadcastUpdate();
    } else if (data.type === 'SET_SPONSOR') {
      matchState.activeSponsor = data.sponsorId;
      broadcastUpdate();
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
