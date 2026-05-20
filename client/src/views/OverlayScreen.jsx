import React, { useEffect, useState } from 'react';

export function OverlayScreen({ matchState, isPreview = false }) {
  const [alertVisible, setAlertVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);

  useEffect(() => {
    if (matchState?.gfxMessage) {
      setCurrentAlert(matchState.gfxMessage);
      setAlertVisible(true);
      
      const timer = setTimeout(() => {
        setAlertVisible(false);
      }, 4000); // Hide after 4 seconds
      
      return () => clearTimeout(timer);
    }
  }, [matchState?.gfxMessage, matchState?.innings]);

  if (!matchState) return <div style={{ color: '#fff', padding: '2rem' }}>Awaiting GFX sync...</div>;

  const { psdLayers, activeSponsor, theme, innings, currentInnings, teamA, teamB, target } = matchState;
  const currentInningsData = innings[currentInnings - 1];
  const battingTeamKey = currentInningsData?.battingTeam;
  const battingTeam = battingTeamKey === 'teamA' ? teamA : teamB;
  const bowlingTeam = battingTeamKey === 'teamA' ? teamB : teamA;

  const striker = currentInningsData?.battingPerformance.find(p => p.playerId === currentInningsData.currentBatsmen.striker);
  const nonStriker = currentInningsData?.battingPerformance.find(p => p.playerId === currentInningsData.currentBatsmen.nonStriker);
  const bowler = currentInningsData?.bowlingPerformance.find(p => p.playerId === currentInningsData.currentBowler);

  // Active theme styling
  const themeClass = theme !== 'default' ? `theme-${theme}` : '';

  // Get color for teams
  const batTeamColor = battingTeam?.color || '#2563eb';
  const bowlTeamColor = bowlingTeam?.color || '#475569';

  // Calculate coordinates for Wagon Wheel SVG
  const wagonWheelBalls = currentInningsData?.ballsLog.filter(b => b.wagonWheelX !== null && b.wagonWheelY !== null) || [];

  return (
    <div className={`broadcast-gfx-canvas ${isPreview ? 'overlay-preview' : ''} ${themeClass}`}>
      <div className="scale-wrapper" style={{ transform: isPreview ? 'scale(0.5)' : 'none' }}>
        
        {/* 1. TV SCORE BUG */}
        {psdLayers.scoreBug && currentInningsData && (
          <div className="tv-scorebug">
            {/* Team Block */}
            <div className="bug-team" style={{ backgroundColor: batTeamColor }}>
              {battingTeam?.shortName}
            </div>
            
            {/* Score Block */}
            <div className="bug-score">
              {currentInningsData.runs}/{currentInningsData.wickets}
            </div>

            {/* Balls Block */}
            <div className="bug-balls">
              <span>{currentInningsData.balls}</span>
              <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Balls</p>
            </div>

            {/* Batting details inside scorebug */}
            <div className="bug-batsmen">
              {striker && (
                <div className="bug-batsman striking">
                  {striker.name.split(' ').pop()} <span>{striker.runs} ({striker.ballsFaced})</span>
                </div>
              )}
              {nonStriker && (
                <div className="bug-batsman">
                  {nonStriker.name.split(' ').pop()} <span>{nonStriker.runs} ({nonStriker.ballsFaced})</span>
                </div>
              )}
            </div>

            {/* Powerplay active */}
            {currentInningsData.balls < 25 && (
              <div className="bug-powerplay">
                PP
              </div>
            )}

            {/* Target Display (Innings 2) */}
            {currentInnings === 2 && target && (
              <div style={{ background: '#ffcc00', color: '#000', padding: '0 1rem', display: 'flex', alignItems: 'center', fontSize: '1.2rem', fontWeight: '900' }}>
                T: {target}
              </div>
            )}
          </div>
        )}

        {/* 2. LOWER THIRD BAR */}
        {psdLayers.lowerThird && (
          <div className="tv-lowerthird" style={{ borderLeftColor: batTeamColor }}>
            <div className="lt-title">
              {matchState.tournament}
            </div>
            <div className="lt-main">
              {matchState.gfxMessage || `${battingTeam?.name} are ${currentInningsData?.runs}/${currentInningsData?.wickets} off ${currentInningsData?.balls} balls`}
            </div>
          </div>
        )}

        {/* 3. FULL TEAM SQUAD / LINEUPS */}
        {psdLayers.teamLineup && (
          <div className="tv-card-center" style={{ borderTopColor: batTeamColor }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', borderBottom: '4px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
              <span>{battingTeam?.name.toUpperCase()} SQUAD</span>
              <span style={{ color: batTeamColor }}>{battingTeam?.shortName}</span>
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {battingTeam?.squad.map((player, idx) => (
                <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 600 }}>{idx + 1}. {player.name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{player.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. DYNAMIC PLAYER PROFILE HIGHLIGHT CARD */}
        {psdLayers.activePlayerCard && (
          <div className="tv-card-center" style={{ width: '600px', borderTopColor: batTeamColor }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--accent-light)' }}>
                {psdLayers.activePlayerCard.runs !== undefined ? psdLayers.activePlayerCard.runs : psdLayers.activePlayerCard.wickets}
              </div>
              <h2 style={{ fontSize: '2rem', marginTop: '0.5rem' }}>{psdLayers.activePlayerCard.name}</h2>
              <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Performance Card</span>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '4px' }}>
              {psdLayers.activePlayerCard.runs !== undefined ? (
                // Batter Stats
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Balls Faced</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{psdLayers.activePlayerCard.ballsFaced}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Fours (4s)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{psdLayers.activePlayerCard.fours}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sixes (6s)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{psdLayers.activePlayerCard.sixes}</div>
                  </div>
                </div>
              ) : (
                // Bowler Stats
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Balls Bowled</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{psdLayers.activePlayerCard.ballsBowled}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Runs Conceded</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{psdLayers.activePlayerCard.runsConceded}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Economy/5b</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                      {psdLayers.activePlayerCard.ballsBowled > 0 ? 
                        ((psdLayers.activePlayerCard.runsConceded / psdLayers.activePlayerCard.ballsBowled) * 5).toFixed(2) : 
                        '0.00'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. SVG WAGON WHEEL */}
        {psdLayers.wagonWheel && (
          <div className="tv-card-center" style={{ width: '500px', borderTopColor: batTeamColor }}>
            <h3 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>WAGON WHEEL (Batting Chart)</h3>
            <div className="wagon-wheel-gfx" style={{ width: '350px', height: '350px' }}>
              <div className="pitch-rect" style={{ left: '47%', width: '6%' }}></div>
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                {/* Draw mock boundary lines */}
                {wagonWheelBalls.map((ball, idx) => {
                  const xCoord = ball.wagonWheelX || 50;
                  const yCoord = ball.wagonWheelY || 50;
                  
                  let strokeColor = '#3b82f6'; // default singles
                  if (ball.runsBat === 4) strokeColor = '#10b981';
                  if (ball.runsBat === 6) strokeColor = '#7c3aed';

                  return (
                    <line 
                      key={idx}
                      x1="50%" 
                      y1="50%" 
                      x2={`${xCoord}%`} 
                      y2={`${yCoord}%`}
                      stroke={strokeColor} 
                      strokeWidth={ball.runsBat >= 4 ? 3 : 1.5}
                      strokeDasharray={ball.runsBat === 6 ? '5,5' : 'none'}
                    />
                  );
                })}
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#3b82f6' }}>● Singles/Runs</span>
              <span style={{ color: '#10b981' }}>● Fours (4s)</span>
              <span style={{ color: '#7c3aed' }}>● Sixes (6s)</span>
            </div>
          </div>
        )}

        {/* 6. CHARTS: WORM GRAPH */}
        {psdLayers.wormGraph && (
          <div className="tv-card-center" style={{ borderTopColor: batTeamColor }}>
            <h3 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>RUN CHASE WORM</h3>
            <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Innings 1 line */}
                <polyline
                  fill="none"
                  stroke={teamA.color}
                  strokeWidth="2.5"
                  points={matchState.graphs.worm
                    .filter(pt => pt.innings1Runs !== undefined)
                    .map(pt => `${pt.ball},${100 - (pt.innings1Runs / 2.5)}`) // scale down
                    .join(' ')}
                />
                {/* Innings 2 line */}
                {matchState.graphs.worm.some(pt => pt.innings2Runs !== undefined) && (
                  <polyline
                    fill="none"
                    stroke={teamB.color}
                    strokeWidth="2.5"
                    points={matchState.graphs.worm
                      .filter(pt => pt.innings2Runs !== undefined)
                      .map(pt => `${pt.ball},${100 - (pt.innings2Runs / 2.5)}`)
                      .join(' ')}
                  />
                )}
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
              <span style={{ color: teamA.color }}>■ {teamA.name}</span>
              <span style={{ color: teamB.color }}>■ {teamB.name}</span>
            </div>
          </div>
        )}

        {/* 7. CHARTS: MANHATTAN GRAPH */}
        {psdLayers.manhattanGraph && (
          <div className="tv-card-center" style={{ borderTopColor: batTeamColor }}>
            <h3 style={{ fontSize: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>MANHATTAN CHART (Runs per 5-ball set)</h3>
            <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              {Array.from({ length: 20 }).map((_, idx) => {
                const inn1Runs = matchState.graphs.manhattan.innings1[idx] || 0;
                const inn2Runs = matchState.graphs.manhattan.innings2[idx] || 0;
                const maxRuns = 30; // Max scale

                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '90%' }}>
                      <div style={{ flex: 1, height: `${(inn1Runs / maxRuns) * 100}%`, background: teamA.color, borderRadius: '2px 2px 0 0' }}></div>
                      <div style={{ flex: 1, height: `${(inn2Runs / maxRuns) * 100}%`, background: teamB.color, borderRadius: '2px 2px 0 0' }}></div>
                    </div>
                    <div style={{ fontSize: '0.65rem', textAlign: 'center', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                      {(idx + 1) * 5}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 8. MATCH SUMMARY */}
        {psdLayers.matchSummary && (
          <div className="tv-card-center" style={{ borderTopColor: batTeamColor }}>
            <h2 style={{ fontSize: '2.2rem', textAlign: 'center', marginBottom: '2rem' }}>MATCH SUMMARY</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {matchState.innings.map((inn, idx) => {
                const batTeam = inn.battingTeam === 'teamA' ? teamA : teamB;
                const bowlTeam = inn.battingTeam === 'teamA' ? teamB : teamA;
                
                return (
                  <div key={idx} className="glass" style={{ padding: '1.5rem', borderRadius: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.25rem', color: batTeam.color }}>{batTeam.name}</span>
                      <span style={{ fontWeight: 800, fontSize: '1.25rem' }}>{inn.runs}/{inn.wickets} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>({inn.balls} balls)</span></span>
                    </div>
                    
                    {/* Top Batters */}
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ color: 'var(--accent-light)', fontWeight: 600, marginBottom: '0.25rem' }}>Top Batters</div>
                      {[...inn.battingPerformance]
                        .sort((a,b) => b.runs - a.runs)
                        .slice(0, 2)
                        .map(p => (
                          <div key={p.playerId} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                            <span>{p.name}</span>
                            <span>{p.runs} ({p.ballsFaced})</span>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 9. MILESTONE ALERTS (FOUR, SIX, WICKET, 50, 100) */}
        {alertVisible && currentAlert && (
          <div className={`alert-gfx-banner ${
            currentAlert.includes('WICKET') ? 'alert-wicket' :
            currentAlert.includes('SIX') ? 'alert-six' :
            currentAlert.includes('FOUR') ? 'alert-four' : 'alert-six'
          }`}>
            {currentAlert}
          </div>
        )}

        {/* 10. SPONSOR WATERMARK */}
        {activeSponsor && (
          <div style={{ position: 'absolute', bottom: '50px', right: '80px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.8)', padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>
            <span>Powered by</span>
            <span>{matchState.sponsors.find(sp => sp.id === activeSponsor)?.name}</span>
            <span>{matchState.sponsors.find(sp => sp.id === activeSponsor)?.logo}</span>
          </div>
        )}
      </div>
    </div>
  );
}
