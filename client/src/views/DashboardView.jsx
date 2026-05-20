import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Play, Calendar, MapPin, Activity, CheckCircle, HelpCircle } from 'lucide-react';

export function DashboardView({ onMatchActivated }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [tournament, setTournament] = useState("The Hundred Men's Competition");
  const [venue, setVenue] = useState("Lord's, London");
  const [teamAName, setTeamAName] = useState('Southern Brave');
  const [teamAShort, setTeamAShort] = useState('SOB');
  const [teamAColor, setTeamAColor] = useState('#1c3c54');
  const [teamBName, setTeamBName] = useState('Trent Rockets');
  const [teamBShort, setTeamBShort] = useState('TRT');
  const [teamBColor, setTeamBColor] = useState('#ffcc00');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/matches');
      if (!res.ok) throw new Error('Failed to fetch matches');
      const data = await res.json();
      setMatches(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not connect to the API server. Make sure it is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    try {
      // 1. Create the match
      const createRes = await fetch('http://localhost:5000/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament,
          venue,
          teamA: { name: teamAName, shortName: teamAShort, color: teamAColor, logo: '' },
          teamB: { name: teamBName, shortName: teamBShort, color: teamBColor, logo: '' }
        })
      });
      if (!createRes.ok) throw new Error('Failed to create match');
      const createData = await createRes.json();

      // 2. Activate the match
      await handleActivateMatch(createData.id);
    } catch (err) {
      alert('Error creating match: ' + err.message);
    }
  };

  const handleActivateMatch = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/matches/${id}/activate`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to activate match');
      
      if (onMatchActivated) {
        onMatchActivated(id);
      }
      
      // Redirect to scorer console inside the match
      window.location.hash = '/scorer';
    } catch (err) {
      alert('Error activating match: ' + err.message);
    }
  };

  const handleDeleteMatch = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this match? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`http://localhost:5000/api/matches/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete match');
      fetchMatches();
    } catch (err) {
      alert('Error deleting match: ' + err.message);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'setup': return { text: 'Not Started', color: 'rgba(255, 255, 255, 0.4)', bg: 'rgba(255, 255, 255, 0.05)' };
      case 'innings1': return { text: '1st Innings', color: '#ff5e57', bg: 'rgba(255, 94, 87, 0.15)' };
      case 'innings2': return { text: '2nd Innings', color: '#2ecc71', bg: 'rgba(46, 204, 113, 0.15)' };
      case 'completed': return { text: 'Completed', color: '#f1c40f', bg: 'rgba(241, 196, 15, 0.15)' };
      default: return { text: status, color: 'white', bg: 'rgba(255,255,255,0.1)' };
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'var(--font-display), sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white', margin: 0, letterSpacing: '-0.5px' }}>
            The Hundred <span style={{ color: 'var(--accent-light)' }}>Admin Dashboard</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0 0', fontSize: '0.95rem' }}>
            Create and manage multiple matches, configure lineups, and control graphics outputs.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={fetchMatches} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Refresh Matches
        </button>
      </div>

      {error && (
        <div className="glass" style={{ padding: '1rem', borderLeft: '4px solid #ff5e57', background: 'rgba(255, 94, 87, 0.1)', color: '#ff7f7a', marginBottom: '1.5rem', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Main Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 4fr', gap: '2rem' }}>
        
        {/* Match List Column */}
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: 'var(--accent-light)' }} /> Available Matches
          </h3>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>Loading matches...</div>
            </div>
          ) : matches.length === 0 ? (
            <div className="glass" style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: '0.75rem', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' }}>
              <HelpCircle size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <h4 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.25rem' }}>No Matches Found</h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>Use the panel on the right to create your first cricket match.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {matches.map((match) => {
                const badge = getStatusLabel(match.status);
                return (
                  <div 
                    key={match.id}
                    className="glass match-card"
                    style={{ 
                      borderRadius: '0.75rem',
                      padding: '1.25rem',
                      border: match.isActive ? '1px solid rgba(46, 204, 113, 0.4)' : '1px solid var(--border-color)',
                      background: match.isActive ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.05), rgba(255,255,255,0.02))' : 'rgba(255, 255, 255, 0.02)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      position: 'relative'
                    }}
                  >
                    {match.isActive && (
                      <span style={{ 
                        position: 'absolute', 
                        top: '1rem', 
                        right: '1rem', 
                        background: 'rgba(46, 204, 113, 0.15)', 
                        color: '#2ecc71', 
                        fontSize: '0.75rem', 
                        padding: '0.2rem 0.5rem', 
                        borderRadius: '0.25rem', 
                        fontWeight: 700,
                        border: '1px solid rgba(46, 204, 113, 0.3)'
                      }}>
                        Active Match
                      </span>
                    )}

                    {/* Match Meta info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                      <span style={{ background: badge.bg, color: badge.color, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '50px', fontWeight: 700 }}>
                        {badge.text}
                      </span>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={12} /> {match.venue}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1rem', color: 'white', margin: '0 0 0.75rem 0', fontWeight: 600 }}>
                      {match.tournament}
                    </h4>

                    {/* Team vs Team score display */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '1rem 0' }}>
                      {/* Team A block */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: match.teamA.color, shrink: 0 }}></span>
                        <div>
                          <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>{match.teamA.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{match.teamA.shortName}</div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 800 }}>VS</div>

                      {/* Team B block */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: match.teamB.color, shrink: 0 }}></span>
                        <div>
                          <div style={{ fontWeight: 700, color: 'white', fontSize: '1rem' }}>{match.teamB.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{match.teamB.shortName}</div>
                        </div>
                      </div>

                      {/* Current Score block */}
                      {match.status !== 'setup' && (
                        <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 0.75rem', borderRadius: '0.35rem', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                            {match.score.runs}/{match.score.wickets}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                            {match.score.balls} Balls Bowled
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          onClick={() => handleActivateMatch(match.id)}
                          className={match.isActive ? "btn btn-primary" : "btn btn-secondary"}
                          style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                          <Play size={12} /> {match.isActive ? 'Enter Match' : 'Activate & Enter'}
                        </button>
                      </div>

                      <button 
                        onClick={(e) => handleDeleteMatch(match.id, e)}
                        className="btn btn-secondary" 
                        style={{ padding: '0.35rem', color: '#ff5e57', border: '1px solid rgba(255, 94, 87, 0.2)', background: 'rgba(255, 94, 87, 0.05)' }}
                        title="Delete Match"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Match Column */}
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} style={{ color: 'var(--accent-light)' }} /> Create New Match
          </h3>

          <form onSubmit={handleCreateMatch} className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Tournament</label>
              <input 
                type="text" 
                value={tournament}
                onChange={e => setTournament(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Venue</label>
              <input 
                type="text" 
                value={venue}
                onChange={e => setVenue(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white', fontSize: '0.85rem' }}
              />
            </div>

            {/* Team A Config */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'white', margin: '0 0 0.5rem 0', fontWeight: 600 }}>Team A Settings</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input 
                  type="text" 
                  placeholder="Team A Name" 
                  value={teamAName}
                  onChange={e => setTeamAName(e.target.value)}
                  required
                  style={{ padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white', fontSize: '0.8rem' }}
                />
                <input 
                  type="text" 
                  placeholder="Short" 
                  value={teamAShort}
                  onChange={e => setTeamAShort(e.target.value)}
                  required
                  maxLength={3}
                  style={{ padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white', fontSize: '0.8rem', textAlign: 'center' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Color:</label>
                <input 
                  type="color" 
                  value={teamAColor}
                  onChange={e => setTeamAColor(e.target.value)}
                  style={{ border: 'none', background: 'transparent', width: '30px', height: '24px', cursor: 'pointer', padding: 0 }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{teamAColor}</span>
              </div>
            </div>

            {/* Team B Config */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'white', margin: '0 0 0.5rem 0', fontWeight: 600 }}>Team B Settings</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input 
                  type="text" 
                  placeholder="Team B Name" 
                  value={teamBName}
                  onChange={e => setTeamBName(e.target.value)}
                  required
                  style={{ padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white', fontSize: '0.8rem' }}
                />
                <input 
                  type="text" 
                  placeholder="Short" 
                  value={teamBShort}
                  onChange={e => setTeamBShort(e.target.value)}
                  required
                  maxLength={3}
                  style={{ padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white', fontSize: '0.8rem', textAlign: 'center' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Color:</label>
                <input 
                  type="color" 
                  value={teamBColor}
                  onChange={e => setTeamBColor(e.target.value)}
                  style={{ border: 'none', background: 'transparent', width: '30px', height: '24px', cursor: 'pointer', padding: 0 }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{teamBColor}</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '0.6rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}
            >
              <Plus size={16} /> Create & Start Match
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
