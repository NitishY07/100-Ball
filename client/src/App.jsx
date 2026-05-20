import React, { useEffect, useState } from 'react';
import { useMatchState } from './hooks/useMatchState';
import { SetupScreen } from './views/SetupScreen';
import { ScorerPanel } from './views/ScorerPanel';
import { OperatorPanel } from './views/OperatorPanel';
import { OverlayScreen } from './views/OverlayScreen';
import { PublicView } from './views/PublicView';
import { DashboardView } from './views/DashboardView';
import { TopNavBar } from './components/TopNavBar';
import { Award, ShieldAlert } from 'lucide-react';

export default function App() {
  const { matchState, connected, sendAction, triggerGfxAction, undo, redo, reset } = useMatchState();
  const [path, setPath] = useState(window.location.hash.slice(1) || '/dashboard');

  // Sync path on hash change
  useEffect(() => {
    const handleHashChange = () => {
      setPath(window.location.hash.slice(1) || '/dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Dynamically set transparent background for OBS overlay path
  useEffect(() => {
    if (path === '/overlay') {
      document.body.style.backgroundColor = 'transparent';
      document.body.style.background = 'transparent';
    } else {
      document.body.style.backgroundColor = '';
      document.body.style.background = '';
    }
  }, [path]);

  const navigate = (newPath) => {
    window.location.hash = newPath;
  };

  if (!connected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1.5rem', background: '#0a0f1d', color: '#fff' }}>
        <div className="glass" style={{ padding: '2.5rem', borderRadius: '1rem', textAlign: 'center', maxWidth: '450px' }}>
          <h2 style={{ fontSize: '1.8rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ShieldAlert size={28} /> Connection Offline
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Awaiting connection to the scoring backend server...
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div className="btn-run" style={{ width: '40px', height: '40px', animation: 'spin 1.5s linear infinite', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%' }}></div>
          </div>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show a loading screen while synchronizing with the backend
  if (!matchState) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '1rem', background: '#0a0f1d', color: '#fff' }}>
        <div className="btn-run" style={{ width: '40px', height: '40px', animation: 'spin 1.5s linear infinite', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>Synchronizing match state...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Standalone overlays (transparent backgrounds)
  if (path === '/overlay') {
    return <OverlayScreen matchState={matchState} />;
  }

  if (path === '/public') {
    return (
      <div style={{ background: '#070a13', minHeight: '100vh', color: '#fff' }}>
        <PublicView matchState={matchState} />
      </div>
    );
  }

  // Matches Dashboard
  if (path === '/dashboard') {
    return (
      <div style={{ background: '#0a0f1d', minHeight: '100vh', color: '#fff' }}>
        <DashboardView />
      </div>
    );
  }

  // Inside Active Match views with sticky TopNavBar
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0f1d', color: '#fff' }}>
      <TopNavBar matchState={matchState} />
      
      <div style={{ flex: 1, padding: '0 1.5rem 2.5rem 1.5rem', overflowY: 'auto' }}>
        {path === '/' && (
          matchState?.status === 'setup' ? (
            <SetupScreen sendAction={sendAction} />
          ) : (
            <div className="glass" style={{ padding: '3rem', borderRadius: '1rem', maxWidth: '600px', margin: '3rem auto', textAlign: 'center' }}>
              <Award size={64} style={{ color: 'var(--accent-light)', marginBottom: '1rem' }} />
              <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Active Match In Progress</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                A match between <strong>{matchState.teamA.name}</strong> and <strong>{matchState.teamB.name}</strong> has already been configured and is actively running.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button onClick={() => navigate('/scorer')} className="btn btn-primary">Open Scorer Panel</button>
                <button onClick={() => navigate('/operator')} className="btn btn-secondary">Open GFX Operator</button>
              </div>
            </div>
          )
        )}

        {path === '/scorer' && (
          <ScorerPanel 
            matchState={matchState} 
            sendAction={sendAction}
            undo={undo}
            redo={redo}
            reset={reset}
          />
        )}

        {path === '/operator' && (
          <OperatorPanel 
            matchState={matchState}
            triggerGfxAction={triggerGfxAction}
          />
        )}
      </div>
    </div>
  );
}
