import React, { useState, useEffect } from 'react';
import { Undo2, Redo2, RotateCcw, AlertTriangle, RefreshCw, Trophy, Settings } from 'lucide-react';

export function ScorerPanel({ matchState, sendAction, undo, redo, reset }) {
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [wicketType, setWicketType] = useState('bowled');
  const [outBatsmanId, setOutBatsmanId] = useState('');
  const [fielderId, setFielderId] = useState('');
  
  const [showDlsModal, setShowDlsModal] = useState(false);
  const [dlsTarget, setDlsTarget] = useState('');
  const [dlsBalls, setDlsBalls] = useState('');

  const [selectedBowlerId, setSelectedBowlerId] = useState('');
  const [bowlerSetBalls, setBowlerSetBalls] = useState(5);

  const innings = matchState?.innings[matchState.currentInnings - 1];
  const battingTeamKey = innings?.battingTeam;
  const bowlingTeamKey = innings?.bowlingTeam;
  
  const battingTeam = battingTeamKey === 'teamA' ? matchState?.teamA : matchState?.teamB;
  const bowlingTeam = bowlingTeamKey === 'teamA' ? matchState?.teamA : matchState?.teamB;

  const striker = innings?.battingPerformance.find(p => p.playerId === innings.currentBatsmen.striker);
  const nonStriker = innings?.battingPerformance.find(p => p.playerId === innings.currentBatsmen.nonStriker);
  const currentBowler = innings?.bowlingPerformance.find(p => p.playerId === innings.currentBowler);

  // Set default selected bowler
  useEffect(() => {
    if (innings?.currentBowler) {
      setSelectedBowlerId(innings.currentBowler);
    }
  }, [innings?.currentBowler]);

  // Keyboard Hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;

      if (e.key >= '0' && e.key <= '6' && e.key !== '5') {
        handleBallClick(parseInt(e.key), null);
      } else if (e.key === 'w' || e.key === 'W') {
        handleBallClick(0, 'wide');
      } else if (e.key === 'n' || e.key === 'N') {
        handleBallClick(0, 'no_ball');
      } else if (e.key === 'b' || e.key === 'B') {
        handleBallClick(1, 'bye');
      } else if (e.key === 'l' || e.key === 'L') {
        handleBallClick(1, 'leg_bye');
      } else if (e.key === 'p' || e.key === 'P') {
        sendAction({ type: 'TOGGLE_POWERPLAY' });
      } else if (e.key === 'u' || e.key === 'U') {
        undo();
      } else if (e.key === 'r' || e.key === 'R') {
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matchState, undo, redo]);

  if (!matchState || !innings) return <div>Loading match scoring engine...</div>;

  const handleBallClick = (runs, extraType = null, extraRuns = 0) => {
    sendAction({
      type: 'BALL',
      ballData: {
        runsBat: extraType ? 0 : runs,
        extraType,
        extraRuns: extraType ? (extraRuns || runs) : 0,
        wicketType: null
      }
    });
  };

  const handleWicketSubmit = (e) => {
    e.preventDefault();
    sendAction({
      type: 'BALL',
      ballData: {
        runsBat: 0,
        extraType: null,
        wicketType,
        outBatsmanId: outBatsmanId || innings.currentBatsmen.striker,
        fielderId: fielderId || null
      }
    });
    setShowWicketModal(false);
    setFielderId('');
  };

  const handleBowlerChangeSubmit = () => {
    if (!selectedBowlerId) return;

    // Check rules: Bowler cannot bowl more than 20 balls total
    const chosenBowlerStats = innings.bowlingPerformance.find(p => p.playerId === selectedBowlerId);
    if (chosenBowlerStats && chosenBowlerStats.ballsBowled >= 20) {
      alert("Validation Error: This bowler has already delivered their maximum limit of 20 balls!");
      return;
    }

    sendAction({
      type: 'CHANGE_BOWLER',
      bowlerId: selectedBowlerId,
      maxSetBalls: bowlerSetBalls
    });
  };

  const handleDlsSubmit = (e) => {
    e.preventDefault();
    if (!dlsTarget || !dlsBalls) return;
    sendAction({
      type: 'DLS_ADJUST',
      target: parseInt(dlsTarget),
      balls: parseInt(dlsBalls)
    });
    setShowDlsModal(false);
  };

  // Automated Calculations
  const crr = innings.balls > 0 ? ((innings.runs / innings.balls) * 5).toFixed(2) : '0.00';
  
  let rrr = '0.00';
  let ballsRemaining = 100 - innings.balls;
  if (matchState.dls.interrupted && matchState.dls.revisedBalls) {
    ballsRemaining = Math.max(0, matchState.dls.revisedBalls - innings.balls);
  }

  if (matchState.currentInnings === 2 && matchState.target) {
    const runsNeeded = Math.max(0, matchState.target - innings.runs);
    rrr = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 5).toFixed(2) : '0.00';
  }

  const projectedScore = innings.balls > 0 ? Math.round((innings.runs / innings.balls) * 100) : 0;

  // Bowler set warning
  const isSetOver = innings.currentSetBalls >= innings.maxSetBalls;
  const setBallsLimit = innings.maxSetBalls;

  // Ends swap trigger
  const nextSetEndChange = (innings.balls > 0 && innings.balls % 10 === 0) ? 'Ends Swap / Change Bowler Required!' : '';

  return (
    <div className="scoring-board-root">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--accent-light)' }}>Live Scorer Console</h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Status: {matchState.status.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={undo} className="btn btn-secondary" title="Undo (U)"><Undo2 size={18} /> Undo</button>
          <button onClick={redo} className="btn btn-secondary" title="Redo (R)"><Redo2 size={18} /> Redo</button>
          <button 
            onClick={() => sendAction({ type: 'TOGGLE_POWERPLAY' })} 
            className={`btn ${innings.powerplayActive ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontWeight: 700 }}
            title="Toggle Powerplay (P)"
          >
            Powerplay: {innings.powerplayActive ? 'ON' : 'OFF'}
          </button>
          {matchState.status === 'innings_break' && (
            <button 
              onClick={() => { if(confirm("Are you ready to start the 2nd Innings?")) sendAction({ type: 'START_INNINGS2' }); }} 
              className="btn btn-primary"
              style={{ background: '#7c3aed', color: '#fff', border: 'none' }}
            >
              Start 2nd Innings
            </button>
          )}
          <button onClick={() => setShowDlsModal(true)} className="btn btn-secondary" title="Rain / DLS Interruptions"><Settings size={18} /> DLS</button>
          <button onClick={() => { if(confirm("Are you sure you want to reset the match?")) reset(); }} className="btn btn-danger"><RotateCcw size={18} /> Reset</button>
        </div>
      </div>

      <div className="scorer-grid">
        {/* Left Side: Scoring Panels */}
        <div className="scoring-board">
          {/* Main Score glass */}
          <div className="glass scoreboard-header">
            <div className="score-display">
              <span className="match-meta-pill" style={{ background: battingTeam?.color, color: '#fff', width: 'fit-content' }}>
                {battingTeam?.name.toUpperCase()} (Innings {matchState.currentInnings})
              </span>
              <div className="score-main">
                {innings.runs}/{innings.wickets}
              </div>
              <div className="balls-display">
                Balls: <strong style={{ color: '#fff' }}>{innings.balls}</strong> / 100
                {matchState.freeHit && <span style={{ color: 'var(--warning)', marginLeft: '1rem', animation: 'pulse 0.5s infinite alternate' }}>★ FREE HIT ★</span>}
              </div>
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div>CRR: <strong style={{ color: '#fff' }}>{crr}</strong></div>
              {matchState.currentInnings === 2 && (
                <div>
                  RRR: <strong style={{ color: 'var(--accent-light)' }}>{rrr}</strong>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Need {Math.max(0, matchState.target - innings.runs)} runs in {ballsRemaining} balls
                  </div>
                </div>
              )}
              {matchState.currentInnings === 1 && (
                <div>Proj. Score: <strong style={{ color: '#fff' }}>{projectedScore}</strong></div>
              )}
              <div className="match-meta-pill">
                Powerplay: {innings.balls < 25 ? <span style={{ color: 'var(--success)' }}>ACTIVE</span> : <span style={{ color: 'var(--text-secondary)' }}>OFF</span>}
              </div>
            </div>
          </div>

          {/* Batting Box */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-light)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Batting</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Partnership: {innings.currentPartnership.runs} runs off {innings.currentPartnership.balls} balls</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {/* Striker */}
              <div className={`batsman-box glass ${innings.currentBatsmen.striker ? 'active-striker' : ''}`}>
                {striker ? (
                  <>
                    <h4 style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{striker.name} *</span>
                      <span style={{ fontSize: '1.25rem', color: 'var(--accent-light)' }}>{striker.runs}</span>
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      <span>Balls: {striker.ballsFaced}</span>
                      <span>4s/6s: {striker.fours}/{striker.sixes}</span>
                      <span>SR: {striker.ballsFaced > 0 ? ((striker.runs / striker.ballsFaced) * 100).toFixed(1) : '0.0'}</span>
                    </div>

                    {innings.battingPerformance.filter(p => p.howOut === 'did_not_bat').length > 0 && (
                      <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem' }}>
                        <select 
                          value=""
                          onChange={(e) => {
                            if (e.target.value && confirm(`Retire ${striker.name} and replace with ${innings.battingPerformance.find(p => p.playerId === e.target.value)?.name}?`)) {
                              sendAction({
                                type: 'RETIRE_BATSMAN',
                                batsmanId: striker.playerId,
                                newPlayerId: e.target.value
                              });
                            }
                          }}
                          style={{ width: '100%', padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.5)', color: 'var(--text-secondary)' }}
                        >
                          <option value="">⚙️ Retire / Change...</option>
                          {innings.battingPerformance.filter(p => p.howOut === 'did_not_bat').map(p => (
                            <option key={p.playerId} value={p.playerId}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>No Striker</div>
                )}
              </div>

              {/* Non-Striker */}
              <div className={`batsman-box glass`}>
                {nonStriker ? (
                  <>
                    <h4 style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{nonStriker.name}</span>
                      <span style={{ fontSize: '1.25rem' }}>{nonStriker.runs}</span>
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                      <span>Balls: {nonStriker.ballsFaced}</span>
                      <span>4s/6s: {nonStriker.fours}/{nonStriker.sixes}</span>
                      <span>SR: {nonStriker.ballsFaced > 0 ? ((nonStriker.runs / nonStriker.ballsFaced) * 100).toFixed(1) : '0.0'}</span>
                    </div>

                    {innings.battingPerformance.filter(p => p.howOut === 'did_not_bat').length > 0 && (
                      <div style={{ marginTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.5rem' }}>
                        <select 
                          value=""
                          onChange={(e) => {
                            if (e.target.value && confirm(`Retire ${nonStriker.name} and replace with ${innings.battingPerformance.find(p => p.playerId === e.target.value)?.name}?`)) {
                              sendAction({
                                type: 'RETIRE_BATSMAN',
                                batsmanId: nonStriker.playerId,
                                newPlayerId: e.target.value
                              });
                            }
                          }}
                          style={{ width: '100%', padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.5)', color: 'var(--text-secondary)' }}
                        >
                          <option value="">⚙️ Retire / Change...</option>
                          {innings.battingPerformance.filter(p => p.howOut === 'did_not_bat').map(p => (
                            <option key={p.playerId} value={p.playerId}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: 'var(--text-secondary)' }}>No Batter</div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
              <button 
                onClick={() => sendAction({ type: 'SWAP_STRIKE' })}
                className="btn btn-secondary"
                style={{ fontSize: '0.85rem', padding: '0.4rem 1.25rem', width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                ⇄ Swap Strike / Rotate Batsmen
              </button>
            </div>
          </div>

          {/* Bowler Box */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-light)' }}>Current Bowler</h3>
            <div className="bowler-box glass" style={{ borderLeft: '4px solid var(--accent)' }}>
              {currentBowler ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem' }}>{currentBowler.name}</h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Set balls: {innings.currentSetBalls} / {innings.maxSetBalls} (conceded {innings.currentSetRuns} runs)
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                      {currentBowler.ballsBowled} Balls | {currentBowler.wickets} Wkts
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Runs: {currentBowler.runsConceded} | Econ/5b: {currentBowler.ballsBowled > 0 ? ((currentBowler.runsConceded / currentBowler.ballsBowled) * 5).toFixed(2) : '0.00'}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>No Bowler Selected</div>
              )}
            </div>
            
            {/* Warning if set is complete */}
            {isSetOver && (
              <div className="glass" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'var(--warning)', color: 'var(--warning)', marginTop: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem' }}>
                <AlertTriangle size={18} />
                <span>5-ball Set is complete! Pick a bowler below to continue. {nextSetEndChange}</span>
              </div>
            )}
          </div>

          {/* Action Pad */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-light)' }}>Input Panel</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Runs (Bat)</span>
                <div className="runs-pad">
                  <button onClick={() => handleBallClick(0)} className="btn-run">0</button>
                  <button onClick={() => handleBallClick(1)} className="btn-run">1</button>
                  <button onClick={() => handleBallClick(2)} className="btn-run">2</button>
                  <button onClick={() => handleBallClick(3)} className="btn-run">3</button>
                  <button onClick={() => handleBallClick(4)} className="btn-run boundary">4</button>
                  <button onClick={() => handleBallClick(6)} className="btn-run boundary">6</button>
                  <button onClick={() => setShowWicketModal(true)} className="btn-wicket">WICKET</button>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>Extras</span>
                <div className="extras-pad">
                  <button onClick={() => handleBallClick(0, 'wide', 0)} className="btn-extra">WD (2r)</button>
                  <button onClick={() => handleBallClick(0, 'no_ball', 0)} className="btn-extra">NB (2r)</button>
                  <button onClick={() => handleBallClick(1, 'bye', 1)} className="btn-extra">BY (1r)</button>
                  <button onClick={() => handleBallClick(1, 'leg_bye', 1)} className="btn-extra">LB (1r)</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Bowler Manager & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Bowler Selection Card */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-light)' }}>Bowler Management</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Select Bowler</label>
                <select 
                  value={selectedBowlerId} 
                  onChange={e => setSelectedBowlerId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                >
                  <option value="">-- Select Bowler --</option>
                  {bowlingTeam?.squad.map(player => {
                    const stats = innings.bowlingPerformance.find(p => p.playerId === player.id);
                    const ballsBowled = stats?.ballsBowled || 0;
                    return (
                      <option key={player.id} value={player.id} disabled={ballsBowled >= 20}>
                        {player.name} ({ballsBowled}/20 balls) {ballsBowled >= 20 ? '[LIMIT REACHED]' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Set Length</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => setBowlerSetBalls(5)}
                    className={`btn ${bowlerSetBalls === 5 ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    5 Balls Set
                  </button>
                  <button 
                    onClick={() => setBowlerSetBalls(10)}
                    className={`btn ${bowlerSetBalls === 10 ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.5rem' }}
                  >
                    10 Balls Set
                  </button>
                </div>
              </div>
            </div>

            <button 
              onClick={handleBowlerChangeSubmit}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.6rem' }}
            >
              Rotate Bowler / Apply Change
            </button>
          </div>

          {/* Ball by Ball Timeline */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-light)' }}>Ball-by-Ball Timeline</h3>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', maxHeight: '300px' }}>
              {innings.ballsLog.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem' }}>No balls bowled yet in this innings.</div>
              ) : (
                [...innings.ballsLog].reverse().map((ball, idx) => {
                  let ballText = `${ball.runsBat} Runs`;
                  let classType = '';
                  
                  if (ball.extraType) {
                    ballText = `${ball.extraType.toUpperCase()} (+${ball.runsAdded})`;
                    classType = 'extra';
                  } else if (ball.runsBat === 4) {
                    ballText = 'FOUR (4)';
                    classType = 'four';
                  } else if (ball.runsBat === 6) {
                    ballText = 'SIX (6)';
                    classType = 'six';
                  }

                  if (ball.isWicket) {
                    ballText = `WICKET! (${ball.wicketType})`;
                    classType = 'wicket';
                  }

                  const bowlerName = bowlingTeam?.squad.find(p => p.id === ball.bowlerId)?.name || 'Bowler';
                  const batterName = battingTeam?.squad.find(p => p.id === ball.strikerId)?.name || 'Batter';

                  return (
                    <div key={idx} className="glass" style={{ padding: '0.6rem 0.8rem', borderRadius: '0.5rem', display: 'flex', justifyItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${classType === 'wicket' ? 'var(--danger)' : classType === 'four' ? 'var(--success)' : classType === 'six' ? '#7c3aed' : 'var(--border-color)'}` }}>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ball {ball.legalBallNum} {ball.freeHit ? '(Free Hit)' : ''}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{bowlerName} to {batterName}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span className={`timeline-ball ${classType}`} style={{ width: 'auto', padding: '0.2rem 0.6rem', borderRadius: '100px', height: 'fit-content', fontSize: '0.8rem' }}>
                          {ballText}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Wicket Modal */}
      {showWicketModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleWicketSubmit} className="glass" style={{ padding: '2rem', borderRadius: '1rem', width: '400px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--danger)' }}>Dismissal Operator</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Wicket Type</label>
                <select 
                  value={wicketType} 
                  onChange={e => setWicketType(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                >
                  <option value="bowled">Bowled</option>
                  <option value="caught">Caught</option>
                  <option value="lbw">LBW</option>
                  <option value="run_out">Run Out</option>
                  <option value="stumped">Stumped</option>
                  <option value="hit_wicket">Hit Wicket</option>
                  <option value="retired_out">Retired Out</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Batsman Dismissed</label>
                <select 
                  value={outBatsmanId} 
                  onChange={e => setOutBatsmanId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                >
                  <option value={innings.currentBatsmen.striker}>Striker: {striker?.name}</option>
                  <option value={innings.currentBatsmen.nonStriker}>Non-Striker: {nonStriker?.name}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Fielder Involvement (Optional)</label>
                <select 
                  value={fielderId} 
                  onChange={e => setFielderId(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                >
                  <option value="">None</option>
                  {bowlingTeam?.squad.map(player => (
                    <option key={player.id} value={player.id}>{player.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowWicketModal(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-danger">Confirm Dismissal</button>
            </div>
          </form>
        </div>
      )}

      {/* DLS Modal */}
      {showDlsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleDlsSubmit} className="glass" style={{ padding: '2rem', borderRadius: '1rem', width: '400px' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent-light)' }}>Rain Interruption / DLS Target</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Revised Target Score</label>
                <input 
                  type="number" 
                  value={dlsTarget} 
                  onChange={e => setDlsTarget(e.target.value)} 
                  required
                  placeholder="e.g. 104"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Revised Balls in Innings</label>
                <input 
                  type="number" 
                  value={dlsBalls} 
                  onChange={e => setDlsBalls(e.target.value)} 
                  required
                  placeholder="e.g. 75"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '0.25rem', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'white' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowDlsModal(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" className="btn btn-primary">Apply DLS Adjustments</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
