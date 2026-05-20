// The Hundred Cricket Scoring Engine
// Implements the official rules and match state transitions for 100-ball cricket matches.

export class HundredScoringEngine {
  static createInitialState(config) {
    const defaultSquad = (prefix) => Array.from({ length: 11 }, (_, i) => ({
      id: `${prefix}${i + 1}`,
      name: `${prefix} Player ${i + 1}`,
      role: i < 2 ? 'Batter' : i < 5 ? 'All-Rounder' : 'Bowler'
    }));

    const teamA = {
      name: config?.teamAName || 'Southern Brave',
      shortName: config?.teamAShort || 'SOB',
      color: config?.teamAColor || '#1c3c54',
      squad: config?.teamASquad || defaultSquad('A')
    };

    const teamB = {
      name: config?.teamBName || 'Trent Rockets',
      shortName: config?.teamBShort || 'TRT',
      color: config?.teamBColor || '#ffcc00',
      squad: config?.teamBSquad || defaultSquad('B')
    };

    const firstBatting = config?.tossDecision === 'bat' 
      ? (config?.tossWonBy === 'teamA' ? 'teamA' : 'teamB')
      : (config?.tossWonBy === 'teamA' ? 'teamB' : 'teamA');

    const battingTeam = firstBatting;
    const bowlingTeam = firstBatting === 'teamA' ? 'teamB' : 'teamA';

    const matchState = {
      matchId: config?.matchId || `match_${Date.now()}`,
      tournament: config?.tournament || "The Hundred Men's Competition",
      gender: config?.gender || 'men', // 'men' | 'women'
      status: 'setup', // 'setup' | 'innings1' | 'innings_break' | 'innings2' | 'completed' | 'super_over'
      venue: config?.venue || "Lord's, London",
      date: config?.date || new Date().toISOString().split('T')[0],
      teamA,
      teamB,
      toss: {
        wonBy: config?.tossWonBy || 'teamA',
        decision: config?.tossDecision || 'bat'
      },
      currentInnings: 1,
      target: null,
      innings: [
        this.createInningsState(1, battingTeam, bowlingTeam, teamA, teamB)
      ],
      graphs: {
        worm: [],
        manhattan: { innings1: [], innings2: [] },
        winProbability: []
      },
      freeHit: false,
      superOver: null,
      dls: {
        interrupted: false,
        revisedTarget: null,
        revisedBalls: null
      },
      activeSponsor: null,
      sponsors: [
        { id: 'sp1', name: 'Cazoo', logo: '🚗' },
        { id: 'sp2', name: 'KP Snacks', logo: '🥜' },
        { id: 'sp3', name: 'Vitality', logo: '❤️' }
      ],
      theme: 'default',
      psdLayers: {
        scoreBug: true,
        lowerThird: false,
        teamLineup: false,
        wagonWheel: false,
        wormGraph: false,
        manhattanGraph: false,
        matchSummary: false,
        milestoneAlert: false,
        boundaryAlert: false,
        wicketAlert: false,
        activePlayerCard: null // Holds player data for individual highlight
      },
      gfxMessage: null, // Custom alert message (milestones/boundaries)
      undoStack: [],
      redoStack: []
    };

    return matchState;
  }

  static createInningsState(inningsNum, battingTeamKey, bowlingTeamKey, teamA, teamB) {
    const battingTeam = battingTeamKey === 'teamA' ? teamA : teamB;
    const bowlingTeam = bowlingTeamKey === 'teamA' ? teamA : teamB;

    const battingPerformance = battingTeam.squad.map(player => ({
      playerId: player.id,
      name: player.name,
      runs: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      outType: null,
      bowlerId: null,
      fielderId: null,
      howOut: 'did_not_bat' // 'did_not_bat' | 'batting' | 'out' | 'retired'
    }));

    const bowlingPerformance = bowlingTeam.squad.map(player => ({
      playerId: player.id,
      name: player.name,
      runsConceded: 0,
      ballsBowled: 0,
      wickets: 0,
      wides: 0,
      noballs: 0,
      dots: 0
    }));

    // Start with first 2 players batting
    battingPerformance[0].howOut = 'batting';
    battingPerformance[1].howOut = 'batting';

    return {
      inningsNum,
      battingTeam: battingTeamKey,
      bowlingTeam: bowlingTeamKey,
      runs: 0,
      wickets: 0,
      balls: 0, // Legal balls only (0-100)
      extras: { wides: 0, noballs: 0, byes: 0, legbyes: 0, total: 0 },
      currentBatsmen: {
        striker: battingTeam.squad[0].id,
        nonStriker: battingTeam.squad[1].id
      },
      currentBowler: bowlingTeam.squad[10].id, // Default to last player in list
      battingPerformance,
      bowlingPerformance,
      ballsLog: [], // Ball-by-ball events
      fallOfWickets: [],
      currentSetBowler: bowlingTeam.squad[10].id,
      currentSetBalls: 0, // 0 to 5
      maxSetBalls: 5, // Bowler set can be 5 or 10
      currentSetRuns: 0,
      currentSetWickets: 0,
      bowlingSets: [], // Array of { bowlerId, balls, runs, wickets, setIndex }
      currentPartnership: {
        batters: [battingTeam.squad[0].id, battingTeam.squad[1].id],
        runs: 0,
        balls: 0,
        extras: 0
      },
      partnerships: []
    };
  }

  static processAction(state, action) {
    // Save history for undo
    const backupState = JSON.parse(JSON.stringify(state));
    delete backupState.undoStack;
    delete backupState.redoStack;
    
    state.undoStack = state.undoStack || [];
    state.undoStack.push(backupState);
    state.redoStack = []; // Clear redo stack on new action

    if (action.type === 'SETUP') {
      return this.createInitialState(action.config);
    }

    if (state.status === 'setup') {
      state.status = 'innings1';
    }

    const innings = state.innings[state.currentInnings - 1];

    switch (action.type) {
      case 'BALL':
        this.handleBall(state, innings, action.ballData);
        break;
      case 'CHANGE_BOWLER':
        this.handleBowlerChange(innings, action.bowlerId, action.maxSetBalls || 5);
        break;
      case 'DLS_ADJUST':
        state.dls.interrupted = true;
        state.dls.revisedTarget = action.target;
        state.dls.revisedBalls = action.balls;
        if (state.currentInnings === 2) {
          state.target = action.target;
        }
        break;
      case 'TOGGLE_PSD_LAYER':
        state.psdLayers[action.layer] = !state.psdLayers[action.layer];
        if (action.playerCardData !== undefined) {
          state.psdLayers.activePlayerCard = action.playerCardData;
        }
        break;
      case 'SET_THEME':
        state.theme = action.theme;
        break;
      case 'SET_SPONSOR':
        state.activeSponsor = action.sponsorId;
        break;
      case 'SET_GFX_MESSAGE':
        state.gfxMessage = action.message;
        break;
      case 'SUPER_OVER':
        this.setupSuperOver(state);
        break;
      default:
        break;
    }

    // Check innings or match completion
    this.checkMatchProgression(state);

    return state;
  }

  static handleBall(state, innings, ballData) {
    const { runsBat, extraType, extraRuns = 0, wicketType, fielderId } = ballData;
    
    const strikerId = innings.currentBatsmen.striker;
    const nonStrikerId = innings.currentBatsmen.nonStriker;
    const bowlerId = innings.currentBowler;

    const batter = innings.battingPerformance.find(p => p.playerId === strikerId);
    const bowler = innings.bowlingPerformance.find(p => p.playerId === bowlerId);

    if (!batter || !bowler) return;

    let isLegalBall = true;
    let runsAdded = 0;
    let extraRunsAdded = 0;
    let batterRuns = 0;
    let bowlerRunsConceded = 0;
    let isWicket = !!wicketType;

    // In The Hundred, standard wide/no-ball penalty is 2 runs (or 1 run in some variations. We will make it 2 runs as per standard Hundred regulations).
    const penaltyRuns = 2;

    if (extraType === 'wide') {
      isLegalBall = false;
      extraRunsAdded = penaltyRuns + extraRuns; // 2 runs penalty + any runs run off wide
      runsAdded = extraRunsAdded;
      bowlerRunsConceded = extraRunsAdded;
      innings.extras.wides += extraRunsAdded;
      innings.extras.total += extraRunsAdded;
    } else if (extraType === 'no_ball') {
      isLegalBall = false;
      extraRunsAdded = penaltyRuns; // 2 runs penalty
      batterRuns = runsBat; // Runs off bat still go to batsman
      runsAdded = penaltyRuns + runsBat;
      bowlerRunsConceded = penaltyRuns + runsBat;
      innings.extras.noballs += penaltyRuns;
      innings.extras.total += penaltyRuns;
      state.freeHit = true; // Free hit on next ball
    } else {
      // Byes and Legbyes count as legal balls, but runs are extras
      if (extraType === 'bye') {
        extraRunsAdded = extraRuns;
        runsAdded = extraRuns;
        innings.extras.byes += extraRuns;
        innings.extras.total += extraRuns;
      } else if (extraType === 'leg_bye') {
        extraRunsAdded = extraRuns;
        runsAdded = extraRuns;
        innings.extras.legbyes += extraRuns;
        innings.extras.total += extraRuns;
      } else {
        // Normal runs off the bat
        batterRuns = runsBat;
        runsAdded = runsBat;
        bowlerRunsConceded = runsBat;
      }
      
      // Reset Free Hit status if legal ball bowled
      if (state.freeHit) {
        state.freeHit = false;
      }
    }

    // Process batter stats
    if (isLegalBall || extraType === 'no_ball') {
      batter.runs += batterRuns;
      batter.ballsFaced += 1;
      if (batterRuns === 4) batter.fours += 1;
      if (batterRuns === 6) batter.sixes += 1;
    }

    // Process bowler stats
    if (isLegalBall) {
      bowler.ballsBowled += 1;
      innings.balls += 1;
      innings.currentSetBalls += 1;
      
      if (bowlerRunsConceded === 0 && !isWicket) {
        bowler.dots += 1;
      }
    }
    
    bowler.runsConceded += bowlerRunsConceded;
    innings.runs += runsAdded;

    // Check Partnership progress
    innings.currentPartnership.runs += runsAdded;
    if (isLegalBall || extraType === 'no_ball') {
      innings.currentPartnership.balls += 1;
    }
    innings.currentPartnership.extras += extraRunsAdded;

    // Check Wicket
    let outPlayerName = '';
    if (isWicket) {
      // Free Hit validation: on free hit, only run out, obstructing the field, hitting ball twice are allowed
      const isFreeHitExempt = state.freeHit && (wicketType !== 'run_out');

      if (!isFreeHitExempt) {
        innings.wickets += 1;
        bowler.wickets += (wicketType !== 'run_out' && wicketType !== 'retired_out') ? 1 : 0;
        
        let outBatterId = strikerId;
        if (wicketType === 'run_out' && ballData.outBatsmanId) {
          outBatterId = ballData.outBatsmanId;
        }

        const outBatter = innings.battingPerformance.find(p => p.playerId === outBatterId);
        if (outBatter) {
          outBatter.howOut = 'out';
          outBatter.outType = wicketType;
          outBatter.bowlerId = (wicketType !== 'run_out' && wicketType !== 'retired_out') ? bowlerId : null;
          outBatter.fielderId = fielderId || null;
          outPlayerName = outBatter.name;
        }

        // Record Fall of Wicket
        innings.fallOfWickets.push({
          wicketNum: innings.wickets,
          runs: innings.runs,
          balls: innings.balls,
          batterName: outPlayerName,
          partnershipRuns: innings.currentPartnership.runs
        });

        // Save current partnership to list, reset
        innings.partnerships.push({ ...innings.currentPartnership });
        
        // Find next batsman
        const nextBatter = innings.battingPerformance.find(p => p.howOut === 'did_not_bat');
        
        if (nextBatter && innings.wickets < 10) {
          nextBatter.howOut = 'batting';
          if (outBatterId === strikerId) {
            innings.currentBatsmen.striker = nextBatter.playerId;
          } else {
            innings.currentBatsmen.nonStriker = nextBatter.playerId;
          }
          
          innings.currentPartnership = {
            batters: [innings.currentBatsmen.striker, innings.currentBatsmen.nonStriker],
            runs: 0,
            balls: 0,
            extras: 0
          };
        } else {
          // All out or no more players
          if (outBatterId === strikerId) {
            innings.currentBatsmen.striker = null;
          } else {
            innings.currentBatsmen.nonStriker = null;
          }
        }
      }
    }

    // GFX Alerts for milestones/boundaries
    let gfxMsg = null;
    let activePlayerCard = null;
    if (isWicket) {
      gfxMsg = `WICKET! ${outPlayerName} out (${wicketType})`;
    } else if (runsAdded === 4) {
      gfxMsg = `FOUR! Beautiful shot by ${batter.name}`;
    } else if (runsAdded === 6) {
      gfxMsg = `SIX! Huge hit from ${batter.name}`;
    } else if (batter.runs >= 50 && batter.runs - batterRuns < 50) {
      gfxMsg = `50! Milestone for ${batter.name} (${batter.ballsFaced} Balls)`;
      activePlayerCard = batter;
    } else if (batter.runs >= 100 && batter.runs - batterRuns < 100) {
      gfxMsg = `HUNDRED! Brilliant century for ${batter.name}`;
      activePlayerCard = batter;
    }

    if (gfxMsg) {
      state.gfxMessage = gfxMsg;
      state.psdLayers.boundaryAlert = runsAdded === 4 || runsAdded === 6;
      state.psdLayers.wicketAlert = isWicket;
      state.psdLayers.milestoneAlert = batter.runs >= 50 && (batter.runs - batterRuns < 50 || batter.runs - batterRuns < 100);
      if (activePlayerCard) {
        state.psdLayers.activePlayerCard = activePlayerCard;
      }
    }

    // Strike Rotation
    let rotateStrike = false;
    // Rotate strike on odd runs
    if (runsBat === 1 || runsBat === 3 || extraRuns === 1 || extraRuns === 3) {
      rotateStrike = true;
    }

    // Rotate strike if bowler change ends (every 10 balls)
    // Actually, at end changes, physical ends change, so strike rotates.
    // In our model: ends change at the END of ball 10, 20, 30, etc.
    if (isLegalBall && innings.balls > 0 && innings.balls % 10 === 0) {
      rotateStrike = !rotateStrike; // Ends swap, so strike rotates. If odd runs swap it once, and ends swap it again, they cancel out or add up.
    }

    if (rotateStrike && innings.currentBatsmen.striker && innings.currentBatsmen.nonStriker) {
      const temp = innings.currentBatsmen.striker;
      innings.currentBatsmen.striker = innings.currentBatsmen.nonStriker;
      innings.currentBatsmen.nonStriker = temp;
    }

    // Record Ball Log
    const ballRecord = {
      ballIndex: innings.ballsLog.length + 1,
      legalBallNum: innings.balls,
      strikerId,
      nonStrikerId,
      bowlerId,
      runsBat,
      extraType,
      extraRuns,
      runsAdded,
      wicketType,
      isWicket,
      fielderId,
      isLegalBall,
      freeHit: state.freeHit,
      totalRuns: innings.runs,
      totalWickets: innings.wickets,
      wagonWheelX: ballData.wagonWheelX || null,
      wagonWheelY: ballData.wagonWheelY || null
    };
    innings.ballsLog.push(ballRecord);

    // Track Worm Graph (total score at each legal ball)
    if (isLegalBall) {
      const graphPoint = state.graphs.worm.find(p => p.ball === innings.balls);
      if (graphPoint) {
        graphPoint[`innings${innings.inningsNum}Runs`] = innings.runs;
        graphPoint[`innings${innings.inningsNum}Wickets`] = innings.wickets;
      } else {
        const newPoint = { ball: innings.balls };
        newPoint[`innings${innings.inningsNum}Runs`] = innings.runs;
        newPoint[`innings${innings.inningsNum}Wickets`] = innings.wickets;
        state.graphs.worm.push(newPoint);
      }

      // Track Manhattan Graph (runs in sets of 5 balls)
      if (innings.balls % 5 === 0) {
        const setIndex = (innings.balls / 5) - 1;
        const setStartBall = setIndex * 5 + 1;
        const setRuns = innings.ballsLog
          .filter(b => b.legalBallNum >= setStartBall && b.legalBallNum <= innings.balls)
          .reduce((sum, b) => sum + b.runsAdded, 0);
        state.graphs.manhattan[`innings${innings.inningsNum}`][setIndex] = setRuns;
      }
    }

    // Update Win Probability (Basic dynamic simulation)
    this.updateWinProbability(state);
  }

  static handleBowlerChange(innings, bowlerId, maxSetBalls) {
    // Commit the previous set if any balls were bowled
    if (innings.currentSetBalls > 0) {
      innings.bowlingSets.push({
        bowlerId: innings.currentBowler,
        balls: innings.currentSetBalls,
        runs: innings.currentSetRuns,
        wickets: innings.currentSetWickets,
        setIndex: innings.bowlingSets.length + 1
      });
    }

    // Start new set
    innings.currentBowler = bowlerId;
    innings.currentSetBowler = bowlerId;
    innings.currentSetBalls = 0;
    innings.maxSetBalls = maxSetBalls;
    innings.currentSetRuns = 0;
    innings.currentSetWickets = 0;
  }

  static checkMatchProgression(state) {
    const innings = state.innings[state.currentInnings - 1];
    
    // In The Hundred, innings complete when:
    // 1. 100 legal balls are bowled
    // 2. 10 wickets are down
    // 3. For Innings 2, batting team passes target score
    
    let isInningsComplete = false;
    
    if (state.status === 'innings1') {
      if (innings.balls >= 100 || innings.wickets >= 10) {
        isInningsComplete = true;
      }
      
      if (isInningsComplete) {
        state.status = 'innings_break';
        state.target = innings.runs + 1;
        
        // Prepare Innings 2
        const nextBatting = innings.bowlingTeam;
        const nextBowling = innings.battingTeam;
        
        state.innings.push(
          this.createInningsState(2, nextBatting, nextBowling, state.teamA, state.teamB)
        );
      }
    } else if (state.status === 'innings2') {
      const target = state.target;
      const ballsLimit = state.dls.interrupted && state.dls.revisedBalls ? state.dls.revisedBalls : 100;
      
      if (innings.runs >= target) {
        state.status = 'completed';
      } else if (innings.balls >= ballsLimit || innings.wickets >= 10) {
        state.status = 'completed';
      }
    }
  }

  static updateWinProbability(state) {
    if (state.status === 'setup') {
      state.graphs.winProbability.push({ ball: 0, probTeamA: 50 });
      return;
    }

    const currentInnings = state.innings[state.currentInnings - 1];
    const battingTeamKey = currentInnings.battingTeam;
    
    let probTeamA = 50;

    if (state.status === 'innings1') {
      // Starting from 50%, adjusting based on runs, wickets, balls
      const runs = currentInnings.runs;
      const wickets = currentInnings.wickets;
      const balls = currentInnings.balls;
      
      const runsBase = (runs / Math.max(1, balls)) * 100; // project score
      const wicketsImpact = wickets * 6; // each wicket reduces probability
      
      let scoreProb = 50 + (runsBase - 130) * 0.4 - wicketsImpact;
      probTeamA = Math.max(5, Math.min(95, scoreProb));
      
      // If teamA is bowling, invert
      if (battingTeamKey === 'teamB') {
        probTeamA = 100 - probTeamA;
      }
    } else if (state.status === 'innings2') {
      const runs = currentInnings.runs;
      const wickets = currentInnings.wickets;
      const balls = currentInnings.balls;
      const target = state.target;
      
      const ballsRemaining = Math.max(0, 100 - balls);
      const runsNeeded = Math.max(0, target - runs);
      
      if (runsNeeded === 0) {
        probTeamA = battingTeamKey === 'teamA' ? 100 : 0;
      } else if (ballsRemaining === 0 || wickets >= 10) {
        probTeamA = battingTeamKey === 'teamA' ? 0 : 100;
      } else {
        const requiredRate = (runsNeeded / ballsRemaining) * 5; // runs per 5 balls
        const wicketFactor = (10 - wickets) / 10;
        
        let chasingProb = 50 - (requiredRate - 6.5) * 15 + (wicketFactor - 0.5) * 40;
        chasingProb = Math.max(1, Math.min(99, chasingProb));
        
        if (battingTeamKey === 'teamA') {
          probTeamA = chasingProb;
        } else {
          probTeamA = 100 - chasingProb;
        }
      }
    } else if (state.status === 'completed') {
      const innings1 = state.innings[0];
      const innings2 = state.innings[1];
      if (innings2.runs >= state.target) {
        probTeamA = innings2.battingTeam === 'teamA' ? 100 : 0;
      } else {
        probTeamA = innings1.battingTeam === 'teamA' ? 100 : 0;
      }
    }

    state.graphs.winProbability.push({
      ball: currentInnings.balls + (state.currentInnings === 2 ? 100 : 0),
      probTeamA: Math.round(probTeamA)
    });
  }

  static undo(state) {
    if (!state.undoStack || state.undoStack.length === 0) return state;
    
    const previousState = state.undoStack.pop();
    const backupState = JSON.parse(JSON.stringify(state));
    delete backupState.undoStack;
    delete backupState.redoStack;
    
    previousState.undoStack = state.undoStack;
    previousState.redoStack = state.redoStack || [];
    previousState.redoStack.push(backupState);
    
    return previousState;
  }

  static redo(state) {
    if (!state.redoStack || state.redoStack.length === 0) return state;
    
    const nextState = state.redoStack.pop();
    const backupState = JSON.parse(JSON.stringify(state));
    delete backupState.undoStack;
    delete backupState.redoStack;
    
    nextState.undoStack = state.undoStack || [];
    nextState.undoStack.push(backupState);
    nextState.redoStack = state.redoStack;
    
    return nextState;
  }

  static setupSuperOver(state) {
    state.status = 'super_over';
    
    // Super over is a 5-ball tie-breaker
    // Re-initialize a miniature 1-over (5 balls) innings for each team
    state.superOver = {
      teamARuns: 0,
      teamAWickets: 0,
      teamBRuns: 0,
      teamBWickets: 0,
      currentBatting: state.innings[0].battingTeam === 'teamA' ? 'teamB' : 'teamA',
      ballsBowled: 0,
      currentInnings: 1 // 1 or 2 inside Super Over
    };
  }
}
