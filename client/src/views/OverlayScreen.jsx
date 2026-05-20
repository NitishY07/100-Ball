import React, { useEffect, useState } from 'react';

export function OverlayScreen({ matchState, isPreview = false }) {
  const [alertVisible, setAlertVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);

  useEffect(() => {
    if (!matchState?.gfxMessage) {
      setAlertVisible(false);
      return;
    }
    
    setCurrentAlert(matchState.gfxMessage);
    setAlertVisible(true);
    
    const timer = setTimeout(() => {
      setAlertVisible(false);
    }, 4000); // Hide after 4 seconds
    
    return () => clearTimeout(timer);
  }, [matchState?.gfxMessageId, matchState?.gfxMessage]);

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
        {psdLayers.scoreBug && currentInningsData && (() => {
          // Calculate ball counts for 100-ball format
          const totalBalls = currentInningsData.balls;
          
          // Current over remaining or set details
          const setBallsRemaining = 5 - (totalBalls % 5);
          
          // Run rate (per 5-ball set)
          const computedCRR = totalBalls > 0 
            ? ((currentInningsData.runs / totalBalls) * 5).toFixed(1)
            : '0.0';

          // Current over balls log (last 6 balls of this over/set)
          const startLegalBall = Math.floor((totalBalls - 1) / 6) * 6 + 1;
          const overBalls = currentInningsData.ballsLog.filter(b => 
            b.legalBallNum >= startLegalBall || (b.legalBallNum === 0 && startLegalBall === 1)
          );

          // Active partnership or toss info
          const tossWonBy = matchState.toss?.wonBy;
          const tossWonTeam = tossWonBy === 'teamA' ? teamA : teamB;

          return (
            <div className="tv-scorebug-new">
              {/* Logo Left */}
              <div className="bug-section bug-logo-left" style={{ borderLeft: `4px solid ${batTeamColor}` }}>
                <div className="section-content">
                  <div 
                    className="circular-team-logo" 
                    style={{ 
                      backgroundImage: battingTeam?.logo 
                        ? `url(${battingTeam.logo})` 
                        : `linear-gradient(135deg, ${batTeamColor}, #000)` 
                    }}
                  >
                    {!battingTeam?.logo && battingTeam?.shortName?.slice(0, 2)}
                  </div>
                </div>
              </div>

              {/* Team Info Panel */}
              <div className="bug-section bug-team-info">
                <div className="section-content">
                  <div className="team-names">
                    <span className="bat-team-code">{battingTeam?.shortName}</span>
                    <span className="vs-code">v {bowlingTeam?.shortName}</span>
                  </div>
                </div>
              </div>

              {/* Score Block */}
              <div className="bug-section bug-score-block">
                <div className="section-content">
                  <div className="score-wrapper-outer">
                    <div className="score-badge" style={{ backgroundColor: batTeamColor }}>
                      <span className="score-val">{currentInningsData.runs}-{currentInningsData.wickets}</span>
                      {currentInningsData?.powerplayActive && (
                        <span className="powerplay-badge">P1</span>
                      )}
                      {/* Target badge removed from here */}
                    </div>
                    <div className="crr-val">C.R.R. {computedCRR}</div>
                  </div>
                </div>
              </div>

              {/* Overs Block */}
              <div className="bug-section bug-overs-block">
                <div className="section-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="overs-val" style={{ lineHeight: '0.9', marginTop: '4px' }}>{totalBalls}</div>
                  <div className="overs-sub" style={{ fontSize: '1.2rem', letterSpacing: '2px', marginTop: '2px', color: '#fff' }}>BALLS</div>
                </div>
              </div>

              {/* Batsmen Block */}
              <div className="bug-section bug-batsmen-block" style={{ backgroundImage: `linear-gradient(90deg, ${batTeamColor}aa, #111111ee)` }}>
                <div className="section-content">
                  {striker && (
                    <div className="batsman-row active-striker">
                      <div className="batsman-name">
                        <span className="striker-bat-icon">🏏</span>
                        {striker.name.split(' ').pop().toUpperCase()}
                      </div>
                      <div className="batsman-runs">
                        {striker.runs} <span className="bf">({striker.ballsFaced})</span>
                      </div>
                    </div>
                  )}
                  <div className="batsman-divider-glow"></div>
                  {nonStriker && (
                    <div className="batsman-row">
                      <div className="batsman-name">
                        {nonStriker.name.split(' ').pop().toUpperCase()}
                      </div>
                      <div className="batsman-runs">
                        {nonStriker.runs} <span className="bf">({nonStriker.ballsFaced})</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Toss / Target Block */}
              <div className="bug-section bug-info-block">
                <div className="section-content">
                  {currentInnings === 2 ? (
                    <>
                      <div className="info-title">TARGET</div>
                      <div className="info-val">{target}</div>
                    </>
                  ) : (
                    <>
                      <div className="info-title">TOSS</div>
                      <div className="info-val">{tossWonTeam?.shortName}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Bowler Block */}
              <div className="bug-section bug-bowler-block" style={{ backgroundImage: `linear-gradient(90deg, #111111ee, ${bowlTeamColor}aa)` }}>
                <div className="section-content">
                  {bowler && (
                    <div className="bowler-top-row">
                      <span className="bowler-name">{bowler.name.split(' ').pop().toUpperCase()}</span>
                      <span className="bowler-stats">{bowler.wickets}-{bowler.runsConceded} <span className="overs">({bowler.ballsBowled}b)</span></span>
                    </div>
                  )}
                  <div className="bowler-recent-balls">
                    {overBalls.slice(-6).map((ball, idx) => (
                      <span key={idx} className={`recent-ball-box ${
                        ball.isWicket ? 'wicket' :
                        ball.runsAdded === 6 ? 'six' :
                        ball.runsAdded === 4 ? 'four' : ''
                      }`}>
                        {ball.isWicket ? 'W' :
                         ball.extraType === 'wide' ? 'Wd' :
                         ball.extraType === 'noball' ? 'Nb' :
                         ball.runsAdded === 0 ? '•' : ball.runsAdded}
                      </span>
                    ))}
                    {overBalls.length === 0 && <span className="recent-ball-box empty">•</span>}
                  </div>
                </div>
              </div>

              {/* Logo Right */}
              <div className="bug-section bug-logo-right" style={{ borderRight: `4px solid ${bowlTeamColor}` }}>
                <div className="section-content">
                  <div 
                    className="circular-team-logo bowling-logo" 
                    style={{ 
                      backgroundImage: bowlingTeam?.logo 
                        ? `url(${bowlingTeam.logo})` 
                        : `linear-gradient(135deg, ${bowlTeamColor}, #000)`,
                      borderRadius: bowlingTeam?.logo ? '4px' : '50%'
                    }}
                  >
                    {!bowlingTeam?.logo && bowlingTeam?.shortName?.slice(0, 2)}
                  </div>
                </div>
              </div>

              {/* Scorebug Alert Pill (Roll-out / Slide-out) */}
              {alertVisible && currentAlert && (
                <div className={`bug-alert-pill ${
                  currentAlert.includes('WICKET') ? 'alert-wicket' :
                  currentAlert.includes('SIX') ? 'alert-six' :
                  currentAlert.includes('FOUR') ? 'alert-four' : 'alert-six'
                }`}>
                  <span className="alert-text">
                    {currentAlert.includes('WICKET') ? 'WICKET' :
                     currentAlert.includes('SIX') ? 'SIX!' :
                     currentAlert.includes('FOUR') ? 'FOUR!' :
                     currentAlert.includes('50') ? '50!' :
                     currentAlert.includes('HUNDRED') ? '100!' : currentAlert}
                  </span>
                </div>
              )}
            </div>
          );
        })()}

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
          <div className="tv-card-center tv-card-squad" style={{ '--team-color': batTeamColor }}>
            <div className="card-header-bar">
              <div className="team-indicator" style={{ backgroundColor: batTeamColor }}></div>
              <h2 className="card-title">
                {battingTeam?.name} <span>Squad</span>
              </h2>
              <div className="team-badge" style={{ color: batTeamColor, borderColor: batTeamColor }}>
                {battingTeam?.shortName}
              </div>
            </div>
            
            <div className="squad-grid">
              {battingTeam?.squad.map((player, idx) => (
                <div 
                  key={player.id} 
                  className="squad-player-pill"
                  style={{ animationDelay: `${idx * 0.04}s` }}
                >
                  <div className="player-num-badge" style={{ borderColor: batTeamColor }}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="player-name-section">
                    <span className="player-name-text">{player.name}</span>
                  </div>
                  <span className={`player-role-badge role-${player.role.toLowerCase().replace(' ', '-')}`}>
                    {player.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. DYNAMIC PLAYER PROFILE HIGHLIGHT CARD */}
        {psdLayers.activePlayerCard && (
          <div className="tv-card-center tv-card-player" style={{ width: '650px', '--team-color': batTeamColor }}>
            <div className="player-hero-header">
              <div className="player-hero-glow" style={{ background: `radial-gradient(circle, ${batTeamColor}33 0%, transparent 70%)` }}></div>
              <div className="player-team-pill" style={{ backgroundColor: batTeamColor }}>
                {battingTeam?.name}
              </div>
              <h1 className="player-hero-name">{psdLayers.activePlayerCard.name}</h1>
              <p className="player-hero-sub">Player Stats Highlight</p>
            </div>

            <div className="player-stats-dashboard">
              {psdLayers.activePlayerCard.runs !== undefined ? (
                // Batter Stats
                <>
                  <div className="stat-giant-display">
                    <div className="stat-giant-val">{psdLayers.activePlayerCard.runs}</div>
                    <div className="stat-giant-lbl">Runs Scored</div>
                  </div>
                  <div className="stat-sub-grid">
                    <div className="stat-sub-item">
                      <span className="lbl">Balls Faced</span>
                      <span className="val">{psdLayers.activePlayerCard.ballsFaced}</span>
                    </div>
                    <div className="stat-sub-item">
                      <span className="lbl">Fours (4s)</span>
                      <span className="val boundary-4">{psdLayers.activePlayerCard.fours}</span>
                    </div>
                    <div className="stat-sub-item">
                      <span className="lbl">Sixes (6s)</span>
                      <span className="val boundary-6">{psdLayers.activePlayerCard.sixes}</span>
                    </div>
                    <div className="stat-sub-item">
                      <span className="lbl">Strike Rate</span>
                      <span className="val highlight">
                        {psdLayers.activePlayerCard.ballsFaced > 0 ? 
                          ((psdLayers.activePlayerCard.runs / psdLayers.activePlayerCard.ballsFaced) * 100).toFixed(1) : 
                          '0.0'}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                // Bowler Stats
                <>
                  <div className="stat-giant-display">
                    <div className="stat-giant-val wicket-color">{psdLayers.activePlayerCard.wickets}</div>
                    <div className="stat-giant-lbl">Wickets Taken</div>
                  </div>
                  <div className="stat-sub-grid">
                    <div className="stat-sub-item">
                      <span className="lbl">Balls Bowled</span>
                      <span className="val">{psdLayers.activePlayerCard.ballsBowled}</span>
                    </div>
                    <div className="stat-sub-item">
                      <span className="lbl">Runs Conceded</span>
                      <span className="val">{psdLayers.activePlayerCard.runsConceded}</span>
                    </div>
                    <div className="stat-sub-item">
                      <span className="lbl">Economy / 5b</span>
                      <span className="val highlight">
                        {psdLayers.activePlayerCard.ballsBowled > 0 ? 
                          ((psdLayers.activePlayerCard.runsConceded / psdLayers.activePlayerCard.ballsBowled) * 5).toFixed(2) : 
                          '0.00'}
                      </span>
                    </div>
                    <div className="stat-sub-item">
                      <span className="lbl">Dot Balls</span>
                      <span className="val dot-color">
                        {psdLayers.activePlayerCard.dots || 0}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 5. SVG WAGON WHEEL */}
        {psdLayers.wagonWheel && (
          <div className="tv-card-center tv-card-wagon" style={{ width: '850px', '--team-color': batTeamColor }}>
            <div className="card-header-bar">
              <div className="team-indicator" style={{ backgroundColor: batTeamColor }}></div>
              <h2 className="card-title">Wagon Wheel <span>Batting Chart</span></h2>
            </div>
            
            <div className="wagon-layout-grid">
              {/* Left Side: Stats Breakdown */}
              <div className="wagon-stats-panel">
                <div className="wagon-stat-row">
                  <span className="legend-dot singles-color"></span>
                  <span className="label">Singles & Runs</span>
                  <span className="value">
                    {wagonWheelBalls.filter(b => b.runsBat > 0 && b.runsBat < 4).length} Balls
                  </span>
                </div>
                <div className="wagon-stat-row">
                  <span className="legend-dot fours-color"></span>
                  <span className="label">Fours (4s)</span>
                  <span className="value boundary-4">
                    {wagonWheelBalls.filter(b => b.runsBat === 4).length} Hits
                  </span>
                </div>
                <div className="wagon-stat-row">
                  <span className="legend-dot sixes-color"></span>
                  <span className="label">Sixes (6s)</span>
                  <span className="value boundary-6">
                    {wagonWheelBalls.filter(b => b.runsBat === 6).length} Hits
                  </span>
                </div>
                <div className="wagon-stat-summary">
                  Total Boundary Runs: <strong style={{ color: '#fff' }}>
                    {wagonWheelBalls.filter(b => b.runsBat === 4 || b.runsBat === 6).reduce((sum, b) => sum + b.runsBat, 0)} Runs
                  </strong>
                </div>
              </div>

              {/* Right Side: Visual Wagon Wheel */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div className="wagon-wheel-gfx" style={{ width: '320px', height: '320px' }}>
                  {/* High Quality Cricket Ground Layout */}
                  <div className="cricket-pitch-visual">
                    <div className="pitch-crease crease-top"></div>
                    <div className="pitch-crease crease-bottom"></div>
                    <div className="stumps stumps-top"></div>
                    <div className="stumps stumps-bottom"></div>
                  </div>
                  
                  <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible' }}>
                    {wagonWheelBalls.map((ball, idx) => {
                      const xCoord = ball.wagonWheelX || 50;
                      const yCoord = ball.wagonWheelY || 50;
                      
                      let strokeColor = '#3b82f6'; // singles
                      let className = 'wagon-line-singles';
                      if (ball.runsBat === 4) { strokeColor = '#00ff87'; className = 'wagon-line-four'; }
                      if (ball.runsBat === 6) { strokeColor = '#7c3aed'; className = 'wagon-line-six'; }

                      return (
                        <line 
                          key={idx}
                          x1="50%" 
                          y1="50%" 
                          x2={`${xCoord}%`} 
                          y2={`${yCoord}%`}
                          stroke={strokeColor} 
                          className={`wagon-line-graphic ${className}`}
                          strokeWidth={ball.runsBat >= 6 ? 4.5 : ball.runsBat === 4 ? 3.5 : 1.8}
                          style={{ animationDelay: `${idx * 0.08}s` }}
                        />
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. CHARTS: WORM GRAPH */}
        {psdLayers.wormGraph && (
          <div className="tv-card-center tv-card-worm" style={{ width: '900px', '--team-color': batTeamColor }}>
            <div className="card-header-bar">
              <div className="team-indicator" style={{ backgroundColor: batTeamColor }}></div>
              <h2 className="card-title">Run Chase <span>Worm Graph</span></h2>
            </div>
            
            <div className="chart-wrapper">
              <div className="chart-y-axis">
                <span>150 Runs</span>
                <span>100 Runs</span>
                <span>50 Runs</span>
                <span>0 Runs</span>
              </div>
              <div className="chart-canvas-container">
                {/* Horizontal Gridlines */}
                <div className="chart-gridline" style={{ bottom: '0%' }}></div>
                <div className="chart-gridline" style={{ bottom: '33%' }}></div>
                <div className="chart-gridline" style={{ bottom: '66%' }}></div>
                <div className="chart-gridline" style={{ bottom: '100%' }}></div>

                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  {/* Innings 1 line */}
                  <polyline
                    fill="none"
                    stroke={teamA.color}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="worm-line-a"
                    points={matchState.graphs.worm
                      .filter(pt => pt.innings1Runs !== undefined)
                      .map(pt => `${pt.ball},${100 - (pt.innings1Runs / 2.5)}`)
                      .join(' ')}
                  />
                  
                  {/* Innings 2 line */}
                  {matchState.graphs.worm.some(pt => pt.innings2Runs !== undefined) && (
                    <polyline
                      fill="none"
                      stroke={teamB.color}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="worm-line-b"
                      points={matchState.graphs.worm
                        .filter(pt => pt.innings2Runs !== undefined)
                        .map(pt => `${pt.ball},${100 - (pt.innings2Runs / 2.5)}`)
                        .join(' ')}
                    />
                  )}
                </svg>
              </div>
            </div>
            
            <div className="chart-legends-footer">
              <div className="legend-team">
                <span className="color-block" style={{ backgroundColor: teamA.color }}></span>
                <span>{teamA.name}</span>
              </div>
              <div className="legend-team">
                <span className="color-block" style={{ backgroundColor: teamB.color }}></span>
                <span>{teamB.name}</span>
              </div>
              <span className="balls-label">Balls Bowled (1 - 100)</span>
            </div>
          </div>
        )}

        {/* 7. CHARTS: MANHATTAN GRAPH */}
        {psdLayers.manhattanGraph && (
          <div className="tv-card-center tv-card-manhattan" style={{ width: '950px', '--team-color': batTeamColor }}>
            <div className="card-header-bar">
              <div className="team-indicator" style={{ backgroundColor: batTeamColor }}></div>
              <h2 className="card-title">Manhattan Chart <span>Runs Per 5-Ball Set</span></h2>
            </div>
            
            <div className="chart-wrapper" style={{ height: '280px' }}>
              <div className="chart-y-axis">
                <span>30 Runs</span>
                <span>20 Runs</span>
                <span>10 Runs</span>
                <span>0 Runs</span>
              </div>
              
              <div className="manhattan-bars-container">
                {/* Gridlines */}
                <div className="chart-gridline" style={{ bottom: '0%' }}></div>
                <div className="chart-gridline" style={{ bottom: '33%' }}></div>
                <div className="chart-gridline" style={{ bottom: '66%' }}></div>
                <div className="chart-gridline" style={{ bottom: '100%' }}></div>

                <div className="bars-layout">
                  {Array.from({ length: 20 }).map((_, idx) => {
                    const inn1Runs = matchState.graphs.manhattan.innings1[idx] || 0;
                    const inn2Runs = matchState.graphs.manhattan.innings2[idx] || 0;
                    const maxRuns = 30;

                    return (
                      <div key={idx} className="manhattan-set-bar" style={{ animationDelay: `${idx * 0.03}s` }}>
                        <div className="bars-pair">
                          <div 
                            className="bar bar-team-a" 
                            style={{ 
                              height: `${(inn1Runs / maxRuns) * 100}%`, 
                              backgroundColor: teamA.color,
                              boxShadow: `0 0 10px ${teamA.color}44`
                            }}
                            title={`Set ${idx + 1}: ${teamA.name} - ${inn1Runs} runs`}
                          ></div>
                          <div 
                            className="bar bar-team-b" 
                            style={{ 
                              height: `${(inn2Runs / maxRuns) * 100}%`, 
                              backgroundColor: teamB.color,
                              boxShadow: `0 0 10px ${teamB.color}44`
                            }}
                            title={`Set ${idx + 1}: ${teamB.name} - ${inn2Runs} runs`}
                          ></div>
                        </div>
                        <div className="set-label">
                          {(idx + 1) * 5}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="chart-legends-footer" style={{ marginTop: '1.5rem' }}>
              <div className="legend-team">
                <span className="color-block" style={{ backgroundColor: teamA.color }}></span>
                <span>{teamA.name}</span>
              </div>
              <div className="legend-team">
                <span className="color-block" style={{ backgroundColor: teamB.color }}></span>
                <span>{teamB.name}</span>
              </div>
              <span className="balls-label">5-Ball Sets (5 - 100)</span>
            </div>
          </div>
        )}

        {/* 8. MATCH SUMMARY */}
        {psdLayers.matchSummary && (
          <div className="tv-card-center tv-card-summary" style={{ width: '900px', '--team-color': batTeamColor }}>
            <div className="card-header-bar">
              <div className="team-indicator" style={{ backgroundColor: batTeamColor }}></div>
              <h2 className="card-title">Match <span>Summary</span></h2>
            </div>
            
            <div className="summary-cards-container">
              {matchState.innings.map((inn, idx) => {
                const isCurrentInnings = matchState.currentInnings === (idx + 1);
                const batTeam = inn.battingTeam === 'teamA' ? teamA : teamB;
                
                // Sorted top performers
                const topBatters = [...inn.battingPerformance]
                  .sort((a,b) => b.runs - a.runs)
                  .slice(0, 2);
                  
                const topBowlers = [...inn.bowlingPerformance]
                  .sort((a,b) => b.wickets - a.wickets || a.runsConceded - b.runsConceded)
                  .slice(0, 1);

                return (
                  <div key={idx} className={`summary-innings-card ${isCurrentInnings ? 'active-innings' : ''}`}>
                    {isCurrentInnings && <div className="live-badge-glow">LIVE</div>}
                    
                    <div className="summary-innings-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span className="team-indicator-dot" style={{ backgroundColor: batTeam.color }}></span>
                        <span className="team-name">{batTeam.name}</span>
                      </div>
                      <div className="innings-score">
                        {inn.runs}/{inn.wickets} <span className="balls">({inn.balls}b)</span>
                      </div>
                    </div>
                    
                    <div className="summary-innings-details">
                      <div className="section-col">
                        <div className="section-title">Top Batsmen</div>
                        <div className="performers-list">
                          {topBatters.map(p => (
                            <div key={p.playerId} className="performer-row">
                              <span className="name">{p.name}</span>
                              <span className="stats">{p.runs} <span className="balls">({p.ballsFaced})</span></span>
                            </div>
                          ))}
                          {topBatters.length === 0 && <div className="no-data">No batting data</div>}
                        </div>
                      </div>
                      
                      <div className="section-col">
                        <div className="section-title">Top Bowlers</div>
                        <div className="performers-list">
                          {topBowlers.map(p => (
                            <div key={p.playerId} className="performer-row">
                              <span className="name">{p.name}</span>
                              <span className="stats highlight">{p.wickets} wkts <span className="runs">({p.runsConceded}r)</span></span>
                            </div>
                          ))}
                          {topBowlers.length === 0 && <div className="no-data">No bowling data</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 9. MILESTONE ALERTS REMOVED FROM CENTER */}


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
