import { useState, useEffect } from 'react';
import type { Summoner, Champion, ChampSelectSession } from '../types';

export const useLCUConnection = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected');
  const [summoner, setSummoner] = useState<Summoner | null>(null);
  const [champSelectSession, setChampSelectSession] = useState<ChampSelectSession | null>(null);
  const [gamePhase, setGamePhase] = useState<string>('None');
  const [ownedChampions, setOwnedChampions] = useState<Champion[]>([]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const status = await window.electronAPI.getConnectionStatus();
        setConnectionStatus(status);

        if (status === 'connected') {
          const [summonerData, championsData, sessionData] = await Promise.all([
            window.electronAPI.getCurrentSummoner().catch(() => null),
            window.electronAPI.getOwnedChampions().catch(() => []),
            window.electronAPI.getChampSelectSession().catch(() => null),
          ]);

          setSummoner(summonerData);
          setOwnedChampions(championsData);
          setChampSelectSession(sessionData);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();

    window.electronAPI.onLcuStatusChanged((status) => {
      setConnectionStatus(status);
      if (status !== 'connected') {
        setSummoner(null);
        setChampSelectSession(null);
        setGamePhase('None');
        setOwnedChampions([]);
      }
    });

    window.electronAPI.onLcuConnected(async (data) => {
      console.log('LCU Connected event received:', data);
      setSummoner(data.summoner);
      
      // Use champions from the event if provided, otherwise fetch them
      if (data.champions) {
        console.log('Using champions from connect event:', data.champions.length);
        console.log('Sample champion data:', JSON.stringify(data.champions[0], null, 2));
        setOwnedChampions(data.champions);
      } else {
        try {
          const champions = await window.electronAPI.getOwnedChampions();
          console.log('Fetched champions separately:', champions.length);
          console.log('Sample champion data:', JSON.stringify(champions[0], null, 2));
          setOwnedChampions(champions);
        } catch (error) {
          console.error('Error fetching owned champions:', error);
        }
      }
    });

    window.electronAPI.onLcuDisconnected(() => {
      setSummoner(null);
      setChampSelectSession(null);
      setGamePhase('None');
      setOwnedChampions([]);
    });

    window.electronAPI.onChampSelectUpdate((session) => {
      setChampSelectSession(session);
      if (session) {
        setGamePhase('ChampSelect');
      }
    });

    window.electronAPI.onGameflowUpdate((phase) => {
      setGamePhase(phase);
      if (phase !== 'ChampSelect') {
        setChampSelectSession(null);
      }
    });

    return () => {
      // Cleanup event listeners if needed
    };
  }, []);

  return {
    connectionStatus,
    summoner,
    champSelectSession,
    gamePhase,
    ownedChampions,
  };
};