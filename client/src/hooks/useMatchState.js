import { API_URL } from '../config';
import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = API_URL;

export function useMatchState() {
  const [matchState, setMatchState] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to scoring server');
    });

    newSocket.on('match-update', (state) => {
      setMatchState(state);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from scoring server');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const sendAction = useCallback(async (action) => {
    try {
      const response = await fetch(`${SERVER_URL}/api/match/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      });
      const data = await response.json();
      if (response.ok) {
        setMatchState(data);
      } else {
        console.error('Action failed:', data.error);
        alert(data.error || 'Failed to apply scoring action');
      }
    } catch (err) {
      console.error('Failed to send action:', err);
    }
  }, []);

  const triggerGfxAction = useCallback((gfxAction) => {
    if (socket) {
      socket.emit('gfx-action', gfxAction);
    }
  }, [socket]);

  const undo = useCallback(async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/match/undo`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setMatchState(data);
      }
    } catch (err) {
      console.error('Undo failed:', err);
    }
  }, []);

  const redo = useCallback(async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/match/redo`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setMatchState(data);
      }
    } catch (err) {
      console.error('Redo failed:', err);
    }
  }, []);

  const reset = useCallback(async () => {
    try {
      const response = await fetch(`${SERVER_URL}/api/match/reset`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        setMatchState(data);
      }
    } catch (err) {
      console.error('Reset failed:', err);
    }
  }, []);

  return {
    matchState,
    connected,
    sendAction,
    triggerGfxAction,
    undo,
    redo,
    reset
  };
}
