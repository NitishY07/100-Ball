import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';

const DEFAULT_SQUAD_A = [
  { id: 'A1', name: 'James Vince', role: 'Batter' },
  { id: 'A2', name: 'Finn Allen', role: 'Batter' },
  { id: 'A3', name: 'Leus du Plooy', role: 'Batter' },
  { id: 'A4', name: 'Alex Davies', role: 'Wicket-Keeper' },
  { id: 'A5', name: 'Colin Ackermann', role: 'All-Rounder' },
  { id: 'A6', name: 'Chris Jordan', role: 'All-Rounder' },
  { id: 'A7', name: 'George Garton', role: 'All-Rounder' },
  { id: 'A8', name: 'Rehan Ahmed', role: 'Bowler' },
  { id: 'A9', name: 'Craig Overton', role: 'Bowler' },
  { id: 'A10', name: 'Tymal Mills', role: 'Bowler' },
  { id: 'A11', name: 'Jofra Archer', role: 'Bowler' }
];

const DEFAULT_SQUAD_B = [
  { id: 'B1', name: 'Alex Hales', role: 'Batter' },
  { id: 'B2', name: 'Dawid Malan', role: 'Batter' },
  { id: 'B3', name: 'Tom Kohler-Cadmore', role: 'Batter' },
  { id: 'B4', name: 'Colin Munro', role: 'Batter' },
  { id: 'B5', name: 'Sam Hain', role: 'Batter' },
  { id: 'B6', name: 'Lewis Gregory', role: 'All-Rounder' },
  { id: 'B7', name: 'Daniel Sams', role: 'All-Rounder' },
  { id: 'B8', name: 'Imad Wasim', role: 'All-Rounder' },
  { id: 'B9', name: 'Luke Wood', role: 'Bowler' },
  { id: 'B10', name: 'Matthew Carter', role: 'Bowler' },
  { id: 'B11', name: 'Samuel Cook', role: 'Bowler' }
];

export function SetupScreen({ sendAction }) {
  const [tournament, setTournament] = useState("The Hundred Men's Competition");
  const [gender, setGender] = useState('men');
  const [venue, setVenue] = useState("Lord's, London");
  const [teamAName, setTeamAName] = useState('Southern Brave');
  const [teamAShort, setTeamAShort] = useState('SOB');
  const [teamAColor, setTeamAColor] = useState('#1c3c54');
  const [teamALogo, setTeamALogo] = useState('');
  const [teamBName, setTeamBName] = useState('Trent Rockets');
  const [teamBShort, setTeamBShort] = useState('TRT');
  const [teamBColor, setTeamBColor] = useState('#ffcc00');
  const [teamBLogo, setTeamBLogo] = useState('');
  const [tossWonBy, setTossWonBy] = useState('teamA');
  const [tossDecision, setTossDecision] = useState('bat');

  const [squadA, setSquadA] = useState(DEFAULT_SQUAD_A);
  const [squadB, setSquadB] = useState(DEFAULT_SQUAD_B);

  const [uploadingA, setUploadingA] = useState(false);
  const [uploadingB, setUploadingB] = useState(false);

  const handleFileUpload = async (team, file) => {
    if (!file) return;
    
    const setUploading = team === 'A' ? setUploadingA : setUploadingB;
    const setLogo = team === 'A' ? setTeamALogo : setTeamBLogo;
    
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        const res = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filename: file.name,
            base64Data
          })
        });
        const data = await res.json();
        if (data.url) {
          setLogo(data.url);
        } else {
          alert('Upload failed: ' + (data.error || 'Unknown error'));
        }
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Upload failed');
      setUploading(false);
    }
  };

  const handlePlayerNameChange = (team, index, name) => {
    if (team === 'A') {
      const updated = [...squadA];
      updated[index].name = name;
      setSquadA(updated);
    } else {
      const updated = [...squadB];
      updated[index].name = name;
      setSquadB(updated);
    }
  };

  const handleStartMatch = () => {
    sendAction({
      type: 'SETUP',
      config: {
        tournament,
        gender,
        venue,
        teamAName,
        teamAShort,
        teamAColor,
        teamALogo,
        teamBName,
        teamBShort,
        teamBColor,
        teamBLogo,
        tossWonBy,
        tossDecision,
        teamASquad: squadA,
        teamBSquad: squadB
      }
    });
    window.location.hash = '/scorer';
  };

  return (
    <div className="setup-container" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '1rem', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', color: 'var(--accent-light)' }}>
          Match Setup & Configuration
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Tournament Name</label>
            <input 
              type="text" 
              value={tournament} 
              onChange={e => setTournament(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Venue</label>
            <input 
              type="text" 
              value={venue} 
              onChange={e => setVenue(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Competition Gender</label>
            <select 
              value={gender} 
              onChange={e => setGender(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
            >
              <option value="men">Men's Competition</option>
              <option value="women">Women's Competition</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>Toss Winner & Decision</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select 
                value={tossWonBy} 
                onChange={e => setTossWonBy(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
              >
                <option value="teamA">Team A ({teamAShort})</option>
                <option value="teamB">Team B ({teamBShort})</option>
              </select>
              <select 
                value={tossDecision} 
                onChange={e => setTossDecision(e.target.value)}
                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
              >
                <option value="bat">Bat</option>
                <option value="bowl">Bowl</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Team A Configurations */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-light)' }}>Team A Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input 
                  type="text" 
                  value={teamAName} 
                  onChange={e => setTeamAName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Abbreviation</label>
                  <input 
                    type="text" 
                    value={teamAShort} 
                    onChange={e => setTeamAShort(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Theme Color</label>
                  <input 
                    type="color" 
                    value={teamAColor} 
                    onChange={e => setTeamAColor(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Logo URL</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={teamALogo} 
                    placeholder="https://example.com/logo.png"
                    onChange={e => setTeamALogo(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                  />
                  <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0, height: '38px', boxSizing: 'border-box' }}>
                    <UploadCloud size={16} />
                    {uploadingA ? '...' : 'Upload'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleFileUpload('A', e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Squad List (11 Players)</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingRight: '0.5rem' }}>
                  {squadA.map((player, idx) => (
                    <div key={player.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: '20px' }}>{idx + 1}</span>
                      <input 
                        type="text" 
                        value={player.name} 
                        onChange={e => handlePlayerNameChange('A', idx, e.target.value)}
                        style={{ flex: 1, padding: '0.35rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'white', fontSize: '0.85rem' }}
                      />
                      <span style={{ fontSize: '0.75rem', background: '#334155', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>{player.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Team B Configurations */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.02)' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-light)' }}>Team B Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Full Name</label>
                <input 
                  type="text" 
                  value={teamBName} 
                  onChange={e => setTeamBName(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Abbreviation</label>
                  <input 
                    type="text" 
                    value={teamBShort} 
                    onChange={e => setTeamBShort(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Theme Color</label>
                  <input 
                    type="color" 
                    value={teamBColor} 
                    onChange={e => setTeamBColor(e.target.value)}
                    style={{ width: '100%', height: '38px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Logo URL</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    value={teamBLogo} 
                    placeholder="https://example.com/logo.png"
                    onChange={e => setTeamBLogo(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                  />
                  <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0, height: '38px', boxSizing: 'border-box' }}>
                    <UploadCloud size={16} />
                    {uploadingB ? '...' : 'Upload'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={e => handleFileUpload('B', e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <div style={{ marginTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Squad List (11 Players)</h4>
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingRight: '0.5rem' }}>
                  {squadB.map((player, idx) => (
                    <div key={player.id} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', width: '20px' }}>{idx + 1}</span>
                      <input 
                        type="text" 
                        value={player.name} 
                        onChange={e => handlePlayerNameChange('B', idx, e.target.value)}
                        style={{ flex: 1, padding: '0.35rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'white', fontSize: '0.85rem' }}
                      />
                      <span style={{ fontSize: '0.75rem', background: '#334155', padding: '0.2rem 0.4rem', borderRadius: '0.25rem' }}>{player.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleStartMatch}
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '1.2rem', padding: '1rem' }}
        >
          Initialize & Start The Hundred Match
        </button>
      </div>
    </div>
  );
}
