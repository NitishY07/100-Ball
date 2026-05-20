import React from 'react';
import { Settings, Play, Radio, ExternalLink, LogOut, Trophy } from 'lucide-react';

export function TopNavBar({ matchState }) {
  const currentHash = window.location.hash || '#/';

  if (!matchState) return null;

  const { tournament, teamA, teamB, innings, currentInnings, status } = matchState;
  
  const currentInningsData = innings && innings[currentInnings - 1];
  const runs = currentInningsData ? currentInningsData.runs : 0;
  const wickets = currentInningsData ? currentInningsData.wickets : 0;
  const balls = currentInningsData ? currentInningsData.ballsBowled : 0;
  const battingTeam = currentInningsData ? (currentInningsData.battingTeam === 'teamA' ? teamA : teamB) : teamA;

  return (
    <header className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.5rem 1.5rem',
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '1.5rem',
      fontFamily: 'var(--font-display), sans-serif'
    }}>
      {/* Left: Active Match Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Trophy size={18} style={{ color: 'var(--accent-light)' }} />
        <div>
          <div style={{ fontWeight: 800, color: 'white', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>{teamA.shortName}</span>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>vs</span>
            <span>{teamB.shortName}</span>
            {status !== 'setup' && (
              <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem', fontSize: '0.8rem', color: 'var(--accent-light)', marginLeft: '0.5rem', fontWeight: 800 }}>
                {battingTeam.shortName} {runs}/{wickets} ({balls}b)
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{tournament}</div>
        </div>
      </div>

      {/* Center: Main Navigation Tabs */}
      <nav style={{ display: 'flex', gap: '0.5rem' }}>
        <a 
          href="#/" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '0.35rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            textDecoration: 'none',
            color: currentHash === '#/' || currentHash === '' ? 'var(--accent-light)' : 'var(--text-secondary)',
            background: currentHash === '#/' || currentHash === '' ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
            border: currentHash === '#/' || currentHash === '' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <Settings size={14} /> Setup
        </a>
        
        <a 
          href="#/scorer" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '0.35rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            textDecoration: 'none',
            color: currentHash.startsWith('#/scorer') ? 'var(--accent-light)' : 'var(--text-secondary)',
            background: currentHash.startsWith('#/scorer') ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
            border: currentHash.startsWith('#/scorer') ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <Play size={14} /> Scorer Console
        </a>

        <a 
          href="#/operator" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.8rem',
            borderRadius: '0.35rem',
            fontSize: '0.85rem',
            fontWeight: 700,
            textDecoration: 'none',
            color: currentHash.startsWith('#/operator') ? 'var(--accent-light)' : 'var(--text-secondary)',
            background: currentHash.startsWith('#/operator') ? 'rgba(255, 255, 255, 0.04)' : 'transparent',
            border: currentHash.startsWith('#/operator') ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid transparent',
            transition: 'all 0.2s'
          }}
        >
          <Radio size={14} /> Graphics Operator
        </a>
      </nav>

      {/* Right: External links & Exit */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <a 
          href="#/overlay" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            textDecoration: 'none',
            color: 'var(--text-secondary)',
            padding: '0.3rem 0.6rem',
            borderRadius: '0.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)'
          }}
        >
          Live GFX <ExternalLink size={12} />
        </a>

        <a 
          href="#/public" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            textDecoration: 'none',
            color: 'var(--text-secondary)',
            padding: '0.3rem 0.6rem',
            borderRadius: '0.25rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)'
          }}
        >
          Fan View <ExternalLink size={12} />
        </a>

        <a 
          href="#/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.4rem 0.75rem',
            borderRadius: '0.35rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            textDecoration: 'none',
            color: '#ff5e57',
            background: 'rgba(255, 94, 87, 0.08)',
            border: '1px solid rgba(255, 94, 87, 0.15)',
            marginLeft: '0.5rem'
          }}
        >
          <LogOut size={12} /> Exit Match
        </a>
      </div>
    </header>
  );
}
