import { API_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Layers, Sparkles, Image, Tv, CheckCircle, Save, UploadCloud } from 'lucide-react';

export function OperatorPanel({ matchState, triggerGfxAction }) {
  const [customMsg, setCustomMsg] = useState('');
  const [selectedPlayerCard, setSelectedPlayerCard] = useState('');
  const [activeTab, setActiveTab] = useState('templates');
  const [logoA, setLogoA] = useState('');
  const [logoB, setLogoB] = useState('');

  useEffect(() => {
    if (matchState?.teamA) setLogoA(matchState.teamA.logo || '');
    if (matchState?.teamB) setLogoB(matchState.teamB.logo || '');
  }, [matchState?.teamA?.logo, matchState?.teamB?.logo]);

  const [uploadingA, setUploadingA] = useState(false);
  const [uploadingB, setUploadingB] = useState(false);

  const handleFileUpload = async (teamKey, file) => {
    if (!file) return;
    
    const setUploading = teamKey === 'teamA' ? setUploadingA : setUploadingB;
    const setLogo = teamKey === 'teamA' ? setLogoA : setLogoB;
    
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        const res = await fetch('${API_URL}/api/upload', {
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
          handleUpdateTeamDetails(teamKey, { logo: data.url });
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

  if (!matchState) return <div>Loading match data...</div>;

  const { psdLayers, sponsors, activeSponsor, theme, innings, currentInnings } = matchState;
  const currentInningsData = innings[currentInnings - 1];
  const battingTeamKey = currentInningsData?.battingTeam;
  const battingTeam = battingTeamKey === 'teamA' ? matchState.teamA : matchState.teamB;
  const bowlingTeam = battingTeamKey === 'teamA' ? matchState.teamB : matchState.teamA;

  const handleUpdateTeamDetails = (teamKey, updates) => {
    triggerGfxAction({
      type: 'UPDATE_TEAM_DETAILS',
      teamKey,
      updates
    });
  };

  const toggleLayer = (layer, playerCardData = undefined) => {
    triggerGfxAction({
      type: 'TOGGLE_PSD_LAYER',
      layer,
      playerCardData
    });
  };

  const handleSetSponsor = (sponsorId) => {
    triggerGfxAction({
      type: 'SET_SPONSOR',
      sponsorId: sponsorId === activeSponsor ? null : sponsorId
    });
  };

  const handleSetTheme = (themeName) => {
    triggerGfxAction({
      type: 'SET_THEME',
      theme: themeName
    });
  };

  const handleSendCustomMsg = (e) => {
    e.preventDefault();
    triggerGfxAction({
      type: 'SET_GFX_MESSAGE',
      message: customMsg
    });
    setCustomMsg('');
  };

  const handlePlayerCardToggle = () => {
    if (psdLayers.activePlayerCard) {
      // If it is already active, hide it
      toggleLayer('activePlayerCard', null);
    } else {
      // Otherwise show the selected player
      if (!selectedPlayerCard) return;
      
      let playerObj = currentInningsData?.battingPerformance.find(p => p.playerId === selectedPlayerCard);
      if (!playerObj) {
        playerObj = currentInningsData?.bowlingPerformance.find(p => p.playerId === selectedPlayerCard);
      }
      
      if (playerObj) {
        toggleLayer('activePlayerCard', playerObj);
      }
    }
  };

  // List of themes
  const themesList = [
    { id: 'default', name: 'Default Navy & Blue', class: '' },
    { id: 'sob', name: 'Southern Brave (Green/Yellow)', class: 'theme-sob' },
    { id: 'trt', name: 'Trent Rockets (Yellow/Slate)', class: 'theme-trt' },
    { id: 'wef', name: 'Welsh Fire (Red/White)', class: 'theme-wef' },
    { id: 'ovi', name: 'Oval Invincibles (Teal)', class: 'theme-ovi' },
    { id: 'bip', name: 'Birmingham Phoenix (Orange)', class: 'theme-bip' },
    { id: 'los', name: 'London Spirit (Navy/Red)', class: 'theme-los' },
    { id: 'mno', name: 'Manchester Originals (Black/White)', class: 'theme-mno' },
    { id: 'nos', name: 'Northern Superchargers (Purple)', class: 'theme-nos' }
  ];

  return (
    <div style={{ padding: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-light)' }}>Broadcast Graphics Controller</h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Operate overlays & PSD-based layout maps in real-time</span>
        </div>
        <div className="match-meta-pill" style={{ background: '#1e293b', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)' }}></span>
          <span>OBS / vMix Source Synced</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        {/* Left Section: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* GFX Tabs */}
          <div className="glass" style={{ borderRadius: '0.75rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
              <button 
                onClick={() => setActiveTab('templates')}
                style={{ flex: 1, padding: '1rem', border: 'none', background: activeTab === 'templates' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'templates' ? 'var(--accent-light)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', borderBottom: activeTab === 'templates' ? '3px solid var(--accent)' : 'none' }}
              >
                <Tv size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> Overlay Controllers
              </button>
              <button 
                onClick={() => setActiveTab('psd')}
                style={{ flex: 1, padding: '1rem', border: 'none', background: activeTab === 'psd' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'psd' ? 'var(--accent-light)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', borderBottom: activeTab === 'psd' ? '3px solid var(--accent)' : 'none' }}
              >
                <Layers size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> PSD Layer Simulator
              </button>
              <button 
                onClick={() => setActiveTab('themes')}
                style={{ flex: 1, padding: '1rem', border: 'none', background: activeTab === 'themes' ? 'var(--bg-card)' : 'transparent', color: activeTab === 'themes' ? 'var(--accent-light)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', borderBottom: activeTab === 'themes' ? '3px solid var(--accent)' : 'none' }}
              >
                <Sparkles size={16} style={{ marginRight: '0.5rem', display: 'inline' }} /> Themes & Branding
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              {/* Tab 1: Template Controllers */}
              {activeTab === 'templates' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  {/* Basic Elements */}
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Standard Screens</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button 
                        onClick={() => toggleLayer('scoreBug')}
                        className={`btn ${psdLayers.scoreBug ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}
                      >
                        <span>Score Bug (TV HUD)</span>
                        {psdLayers.scoreBug ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>

                      <button 
                        onClick={() => toggleLayer('lowerThird')}
                        className={`btn ${psdLayers.lowerThird ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}
                      >
                        <span>Lower Third Bar</span>
                        {psdLayers.lowerThird ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>

                      <button 
                        onClick={() => toggleLayer('teamLineup')}
                        className={`btn ${psdLayers.teamLineup ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}
                      >
                        <span>Lineups: {battingTeam?.shortName} squad</span>
                        {psdLayers.teamLineup ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>

                      <button 
                        onClick={() => toggleLayer('matchSummary')}
                        className={`btn ${psdLayers.matchSummary ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}
                      >
                        <span>End of Innings / Match Summary</span>
                        {psdLayers.matchSummary ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>

                      <button 
                        onClick={() => triggerGfxAction({ type: 'TOGGLE_POWERPLAY' })}
                        className={`btn ${currentInningsData?.powerplayActive ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderLeft: '4px solid #ffcc00' }}
                      >
                        <span>Toggle Powerplay (P1 Overlay)</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{currentInningsData?.powerplayActive ? 'ON' : 'OFF'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Graphics / Graphs */}
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data Overlays</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <button 
                        onClick={() => toggleLayer('wagonWheel')}
                        className={`btn ${psdLayers.wagonWheel ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}
                      >
                        <span>Striker's Wagon Wheel</span>
                        {psdLayers.wagonWheel ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>

                      <button 
                        onClick={() => toggleLayer('wormGraph')}
                        className={`btn ${psdLayers.wormGraph ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}
                      >
                        <span>Worm Graph (Run Chase)</span>
                        {psdLayers.wormGraph ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>

                      <button 
                        onClick={() => toggleLayer('manhattanGraph')}
                        className={`btn ${psdLayers.manhattanGraph ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}
                      >
                        <span>Manhattan Graph (5-ball sets)</span>
                        {psdLayers.manhattanGraph ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: PSD Layer Simulator */}
              {activeTab === 'psd' && (
                <div>
                  <div className="glass" style={{ padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.3)', borderLeft: '4px solid var(--accent)' }}>
                    <h4 style={{ color: 'var(--accent-light)' }}>Photoshop PSD Link Active</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Simulated PSD Link: <code>C:\Broadcast\Templates\TheHundred_v2.psd</code>. Modifying the layers below automatically pushes updates to the overlays.
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="glass" style={{ padding: '1rem', borderRadius: '0.5rem' }}>
                      <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Visible PSD Groups</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {Object.keys(psdLayers).filter(k => k !== 'activePlayerCard').map((layer) => (
                          <div key={layer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.25rem' }}>
                            <span style={{ fontSize: '0.85rem', fontFamily: 'monospace' }}>[{psdLayers[layer] ? '■' : ' '}] Group: {layer.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).toUpperCase()}</span>
                            <input 
                              type="checkbox" 
                              checked={psdLayers[layer]} 
                              onChange={() => toggleLayer(layer)} 
                              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass" style={{ padding: '1rem', borderRadius: '0.5rem' }}>
                      <h4 style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}>Simulate PSD Data Import</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Mock Photoshop layer updates from file systems. Simulate updating custom banner data:
                      </p>
                      
                      <form onSubmit={handleSendCustomMsg} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          placeholder="PSD Text Layer: GFX_MESSAGE_TXT"
                          value={customMsg}
                          onChange={e => setCustomMsg(e.target.value)}
                          style={{ padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white', fontSize: '0.85rem' }}
                        />
                        <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                          Update text layer (PSD mock write)
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Themes & Branding */}
              {activeTab === 'themes' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    {/* Themes */}
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Color Themes (Official Franchise)</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        {themesList.map((t) => (
                          <button 
                            key={t.id}
                            onClick={() => handleSetTheme(t.id)}
                            className={`btn ${theme === t.id ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ fontSize: '0.85rem', padding: '0.5rem 0.25rem' }}
                          >
                            {t.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sponsors & Commercials */}
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Commercial & Sponsors</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Trigger live sponsor watermarks or full-frame commercial panels during boundary breaks.
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {sponsors.map(sp => (
                          <button 
                            key={sp.id}
                            onClick={() => handleSetSponsor(sp.id)}
                            className={`btn ${activeSponsor === sp.id ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ justifyContent: 'space-between' }}
                          >
                            <span>{sp.logo} {sp.name}</span>
                            {activeSponsor === sp.id ? <CheckCircle size={16} /> : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Team Branding & Logos */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem', color: 'var(--accent-light)' }}>Team Branding & Logo Settings</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                      {/* Team A Branding */}
                      <div className="glass" style={{ padding: '1.25rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.01)' }}>
                        <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: matchState.teamA.color }}></span>
                          {matchState.teamA.name} ({matchState.teamA.shortName}) Details
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Logo URL</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <input 
                                type="text"
                                value={logoA}
                                onChange={e => setLogoA(e.target.value)}
                                placeholder="https://example.com/logo-a.png"
                                style={{ flex: 1, padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white', fontSize: '0.85rem' }}
                              />
                              <button 
                                onClick={() => handleUpdateTeamDetails('teamA', { logo: logoA })}
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Save size={14} /> Apply
                              </button>
                              <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>
                                <UploadCloud size={14} />
                                {uploadingA ? '...' : 'Upload'}
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={e => handleFileUpload('teamA', e.target.files[0])}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            </div>
                          </div>
                          
                          {/* Logo presets */}
                          <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Preset Logos</label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button 
                                onClick={() => {
                                  setLogoA('https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Southern_Brave_logo.svg/200px-Southern_Brave_logo.svg.png');
                                  handleUpdateTeamDetails('teamA', { logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Southern_Brave_logo.svg/200px-Southern_Brave_logo.svg.png' });
                                }}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                Southern Brave
                              </button>
                              <button 
                                onClick={() => {
                                  setLogoA('https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/Sri_Lanka_Cricket_logo.svg/200px-Sri_Lanka_Cricket_logo.svg.png');
                                  handleUpdateTeamDetails('teamA', { logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/Sri_Lanka_Cricket_logo.svg/200px-Sri_Lanka_Cricket_logo.svg.png' });
                                }}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                Sri Lanka
                              </button>
                              <button 
                                onClick={() => {
                                  setLogoA('');
                                  handleUpdateTeamDetails('teamA', { logo: '' });
                                }}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Team B Branding */}
                      <div className="glass" style={{ padding: '1.25rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.01)' }}>
                        <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: matchState.teamB.color }}></span>
                          {matchState.teamB.name} ({matchState.teamB.shortName}) Details
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Logo URL</label>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <input 
                                type="text"
                                value={logoB}
                                onChange={e => setLogoB(e.target.value)}
                                placeholder="https://example.com/logo-b.png"
                                style={{ flex: 1, padding: '0.4rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white', fontSize: '0.85rem' }}
                              />
                              <button 
                                onClick={() => handleUpdateTeamDetails('teamB', { logo: logoB })}
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                              >
                                <Save size={14} /> Apply
                              </button>
                              <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.4rem 0.75rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>
                                <UploadCloud size={14} />
                                {uploadingB ? '...' : 'Upload'}
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={e => handleFileUpload('teamB', e.target.files[0])}
                                  style={{ display: 'none' }}
                                />
                              </label>
                            </div>
                          </div>
                          
                          {/* Logo presets */}
                          <div>
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Preset Logos</label>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <button 
                                onClick={() => {
                                  setLogoB('https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Trent_Rockets_logo.svg/200px-Trent_Rockets_logo.svg.png');
                                  handleUpdateTeamDetails('teamB', { logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Trent_Rockets_logo.svg/200px-Trent_Rockets_logo.svg.png' });
                                }}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                Trent Rockets
                              </button>
                              <button 
                                onClick={() => {
                                  setLogoB('https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/Sri_Lanka_Cricket_logo.svg/200px-Sri_Lanka_Cricket_logo.svg.png');
                                  handleUpdateTeamDetails('teamB', { logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/Sri_Lanka_Cricket_logo.svg/200px-Sri_Lanka_Cricket_logo.svg.png' });
                                }}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                Sri Lanka
                              </button>
                              <button 
                                onClick={() => {
                                  setLogoB('');
                                  handleUpdateTeamDetails('teamB', { logo: '' });
                                }}
                                className="btn btn-secondary"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                              >
                                Clear
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Custom Messages & Milestones */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--accent-light)' }}>Dynamic Player Profile Showcase</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Select a player from either team to highlight their individual innings card in the broadcast overlay.
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <select 
                value={selectedPlayerCard} 
                onChange={e => setSelectedPlayerCard(e.target.value)}
                style={{ flex: 1, padding: '0.6rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
              >
                <option value="">-- Choose Player to Highlight --</option>
                <optgroup label={`${battingTeam?.name} (Batting)`}>
                  {currentInningsData?.battingPerformance.map(p => (
                    <option key={p.playerId} value={p.playerId}>{p.name} ({p.runs} runs off {p.ballsFaced}b)</option>
                  ))}
                </optgroup>
                <optgroup label={`${bowlingTeam?.name} (Bowling)`}>
                  {currentInningsData?.bowlingPerformance.map(p => (
                    <option key={p.playerId} value={p.playerId}>{p.name} ({p.ballsBowled} balls, {p.wickets} wickets)</option>
                  ))}
                </optgroup>
              </select>

              <button 
                onClick={handlePlayerCardToggle}
                className={`btn ${psdLayers.activePlayerCard ? 'btn-primary' : 'btn-secondary'}`}
              >
                {psdLayers.activePlayerCard ? 'Hide Highlight Card' : 'Show Highlight Card'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Section: Match GFX Preview & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Broadcast Outlets</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Use the links below to load overlays as browser sources in streaming applications.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a 
                href="/overlay" 
                target="_blank" 
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', width: '100%', textDecoration: 'none', display: 'flex', justifyContent: 'center' }}
              >
                Open OBS Source Overlay
              </a>
              <a 
                href="/public" 
                target="_blank" 
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', width: '100%', textDecoration: 'none', display: 'flex', justifyContent: 'center' }}
              >
                Open Public Fan Scorecard
              </a>
            </div>
          </div>

          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Scoring Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Batter:</span>
                <span>
                  {currentInningsData?.currentBatsmen.striker ? 
                    currentInningsData.battingPerformance.find(p => p.playerId === currentInningsData.currentBatsmen.striker)?.name : 
                    'None'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bowler:</span>
                <span>
                  {currentInningsData?.currentBowler ? 
                    currentInningsData.bowlingPerformance.find(p => p.playerId === currentInningsData.currentBowler)?.name : 
                    'None'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Score:</span>
                <span>{currentInningsData?.runs}/{currentInningsData?.wickets}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Balls Bowled:</span>
                <span>{currentInningsData?.balls}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
