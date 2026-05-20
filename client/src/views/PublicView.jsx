import React, { useState } from 'react';
import { BarChart3, LineChart, PieChart, Users, Milestone, Award, Circle } from 'lucide-react';

export function PublicView({ matchState }) {
  const [activeTab, setActiveTab] = useState('scorecard');

  if (!matchState) return <div style={{ color: '#fff', padding: '2rem' }}>Loading live scorecard...</div>;

  const { innings, currentInnings, teamA, teamB, target } = matchState;
  const currentInningsData = innings[currentInnings - 1];
  const battingTeamKey = currentInningsData?.battingTeam;
  const battingTeam = battingTeamKey === 'teamA' ? teamA : teamB;
  const bowlingTeam = battingTeamKey === 'teamA' ? teamB : teamA;

  // Calculate CRR & RRR
  const crr = currentInningsData?.balls > 0 ? ((currentInningsData.runs / currentInningsData.balls) * 5).toFixed(2) : '0.00';
  let rrr = '0.00';
  let ballsRemaining = 100 - (currentInningsData?.balls || 0);
  if (matchState.dls.interrupted && matchState.dls.revisedBalls) {
    ballsRemaining = Math.max(0, matchState.dls.revisedBalls - currentInningsData.balls);
  }
  if (matchState.currentInnings === 2 && target) {
    const runsNeeded = Math.max(0, target - currentInningsData.runs);
    rrr = ballsRemaining > 0 ? ((runsNeeded / ballsRemaining) * 5).toFixed(2) : '0.00';
  }

  // Get current batting squad & scores
  const battingSquad = currentInningsData?.battingPerformance || [];
  const bowlingSquad = currentInningsData?.bowlingPerformance || [];

  // Wagon wheel coords
  const wagonWheelBalls = currentInningsData?.ballsLog.filter(b => b.wagonWheelX !== null && b.wagonWheelY !== null) || [];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      
      {/* Live scoreboard banner */}
      <div className="glass" style={{ padding: '2rem', borderRadius: '1rem', borderLeft: `8px solid ${battingTeam?.color || '#2563eb'}`, marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>LIVE SCORECARD</span>
          <h1 style={{ fontSize: '2.5rem', margin: '0.25rem 0' }}>
            {battingTeam?.shortName} {currentInningsData?.runs}/{currentInningsData?.wickets}
          </h1>
          <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            Balls Bowled: <strong style={{ color: 'white' }}>{currentInningsData?.balls}</strong> / 100
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Run Rate</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{crr}</div>
          </div>
          {matchState.currentInnings === 2 && (
            <div>
              <div style={{ color: 'var(--accent-light)', fontSize: '0.9rem' }}>Req. Run Rate</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-light)' }}>{rrr}</div>
            </div>
          )}
          <div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Extras</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{currentInningsData?.extras.total}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('scorecard')}
          className={`btn ${activeTab === 'scorecard' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          <Milestone size={16} /> Scorecard
        </button>
        <button 
          onClick={() => setActiveTab('charts')}
          className={`btn ${activeTab === 'charts' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          <BarChart3 size={16} /> Graphs & Wagon Wheel
        </button>
        <button 
          onClick={() => setActiveTab('partnerships')}
          className={`btn ${activeTab === 'partnerships' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
        >
          <Users size={16} /> Partnerships & FOW
        </button>
      </div>

      {/* Scorecard Tab */}
      {activeTab === 'scorecard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Batting Card */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-light)' }}>Batting Card</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <th style={{ padding: '0.5rem' }}>Batter</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Runs</th>
                  <th style={{ textAlign: 'right' }}>Balls</th>
                  <th style={{ textAlign: 'right' }}>4s</th>
                  <th style={{ textAlign: 'right' }}>6s</th>
                  <th style={{ textAlign: 'right', paddingRight: '0.5rem' }}>SR</th>
                </tr>
              </thead>
              <tbody>
                {battingSquad.map(player => {
                  const sr = player.ballsFaced > 0 ? ((player.runs / player.ballsFaced) * 100).toFixed(1) : '0.0';
                  let statusText = 'did not bat';
                  if (player.howOut === 'batting') statusText = 'batting';
                  else if (player.howOut === 'out') {
                    statusText = player.outType;
                  }

                  return (
                    <tr key={player.playerId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{player.name}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{statusText}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{player.runs}</td>
                      <td style={{ textAlign: 'right' }}>{player.ballsFaced}</td>
                      <td style={{ textAlign: 'right' }}>{player.fours}</td>
                      <td style={{ textAlign: 'right' }}>{player.sixes}</td>
                      <td style={{ textAlign: 'right', paddingRight: '0.5rem', color: 'var(--accent-light)' }}>{sr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bowling Card */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-light)' }}>Bowling Card</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <th style={{ padding: '0.5rem' }}>Bowler</th>
                  <th style={{ textAlign: 'right' }}>Balls</th>
                  <th style={{ textAlign: 'right' }}>Runs</th>
                  <th style={{ textAlign: 'right' }}>Wkts</th>
                  <th style={{ textAlign: 'right' }}>Wd</th>
                  <th style={{ textAlign: 'right' }}>Nb</th>
                  <th style={{ textAlign: 'right', paddingRight: '0.5rem' }}>Econ/5b</th>
                </tr>
              </thead>
              <tbody>
                {bowlingSquad.filter(b => b.ballsBowled > 0).map(player => {
                  const econ = player.ballsBowled > 0 ? ((player.runsConceded / player.ballsBowled) * 5).toFixed(2) : '0.00';
                  return (
                    <tr key={player.playerId} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{player.name}</td>
                      <td style={{ textAlign: 'right' }}>{player.ballsBowled}</td>
                      <td style={{ textAlign: 'right' }}>{player.runsConceded}</td>
                      <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--success)' }}>{player.wickets}</td>
                      <td style={{ textAlign: 'right' }}>{player.wides}</td>
                      <td style={{ textAlign: 'right' }}>{player.noballs}</td>
                      <td style={{ textAlign: 'right', paddingRight: '0.5rem', color: 'var(--warning)' }}>{econ}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Worm Graph */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Run Chase Worm</h3>
            <div style={{ height: '250px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '4px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke={teamA.color}
                  strokeWidth="2"
                  points={matchState.graphs.worm
                    .filter(pt => pt.innings1Runs !== undefined)
                    .map(pt => `${pt.ball},${100 - (pt.innings1Runs / 2.5)}`)
                    .join(' ')}
                />
                {matchState.graphs.worm.some(pt => pt.innings2Runs !== undefined) && (
                  <polyline
                    fill="none"
                    stroke={teamB.color}
                    strokeWidth="2"
                    points={matchState.graphs.worm
                      .filter(pt => pt.innings2Runs !== undefined)
                      .map(pt => `${pt.ball},${100 - (pt.innings2Runs / 2.5)}`)
                      .join(' ')}
                  />
                )}
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
              <span style={{ color: teamA.color }}>■ {teamA.name}</span>
              <span style={{ color: teamB.color }}>■ {teamB.name}</span>
            </div>
          </div>

          {/* Wagon Wheel */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Striker's Wagon Wheel</h3>
            <div className="wagon-wheel-gfx">
              <div className="pitch-rect"></div>
              <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                {wagonWheelBalls.map((ball, idx) => {
                  const xCoord = ball.wagonWheelX || 50;
                  const yCoord = ball.wagonWheelY || 50;
                  let strokeColor = '#3b82f6';
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
                      strokeWidth={ball.runsBat >= 4 ? 2.5 : 1}
                    />
                  );
                })}
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8rem' }}>
              <span style={{ color: '#3b82f6' }}>● Singles</span>
              <span style={{ color: '#10b981' }}>● Fours (4s)</span>
              <span style={{ color: '#7c3aed' }}>● Sixes (6s)</span>
            </div>
          </div>

          {/* Manhattan Graph */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem', gridColumn: 'span 2' }}>
            <h3 style={{ marginBottom: '1rem' }}>Manhattan Chart (Runs per 5-ball set)</h3>
            <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
              {Array.from({ length: 20 }).map((_, idx) => {
                const inn1Runs = matchState.graphs.manhattan.innings1[idx] || 0;
                const inn2Runs = matchState.graphs.manhattan.innings2[idx] || 0;
                const maxRuns = 30;

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
        </div>
      )}

      {/* Partnerships Tab */}
      {activeTab === 'partnerships' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* Partnerships List */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--accent-light)' }}>Innings Partnerships</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentInningsData?.partnerships.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)' }}>No partnerships recorded yet.</div>
              ) : (
                currentInningsData?.partnerships.map((p, idx) => {
                  const player1 = battingSquad.find(pl => pl.playerId === p.batters[0])?.name || 'Batter 1';
                  const player2 = battingSquad.find(pl => pl.playerId === p.batters[1])?.name || 'Batter 2';
                  
                  return (
                    <div key={idx} className="glass" style={{ padding: '1rem', borderRadius: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{player1} & {player2}</span>
                        <span style={{ color: 'var(--accent-light)' }}>{p.runs} Runs</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        <span>Balls Faced: {p.balls}</span>
                        <span>Extras: {p.extras}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Fall of Wickets */}
          <div className="glass" style={{ padding: '1.5rem', borderRadius: '0.75rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>Fall of Wickets</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {currentInningsData?.fallOfWickets.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)' }}>No wickets fallen yet.</div>
              ) : (
                currentInningsData?.fallOfWickets.map((fow, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '4px', borderLeft: '3px solid var(--danger)' }}>
                    <span style={{ fontWeight: 600 }}>Wicket {fow.wicketNum}: {fow.batterName}</span>
                    <span>{fow.runs}/{fow.wicketNum} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>({fow.balls} balls)</span></span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
