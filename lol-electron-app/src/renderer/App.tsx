import React, { useState, useEffect } from 'react';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ChampionSelect } from './components/ChampionSelect';
import { Dashboard } from './components/Dashboard';
import { useLCUConnection } from './hooks/useLCUConnection';
import './styles/App.css';

const App: React.FC = () => {
  const {
    connectionStatus,
    summoner,
    champSelectSession,
    gamePhase,
    ownedChampions
  } = useLCUConnection();

  const [currentView, setCurrentView] = useState<'dashboard' | 'champion-select'>('dashboard');

  useEffect(() => {
    if (gamePhase === 'ChampSelect' && champSelectSession) {
      setCurrentView('champion-select');
    } else {
      setCurrentView('dashboard');
    }
  }, [gamePhase, champSelectSession]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>LoL Companion</h1>
          <ConnectionStatus status={connectionStatus} summoner={summoner} />
        </div>
      </header>

      <main className="app-main">
        {connectionStatus !== 'connected' ? (
          <div className="connection-screen">
            <div className="connection-message">
              <h2>Waiting for League of Legends</h2>
              <p>Please start League of Legends to continue</p>
              <div className="connection-spinner"></div>
            </div>
          </div>
        ) : (
          <>
            <nav className="app-nav">
              <button
                className={`nav-button ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => setCurrentView('dashboard')}
              >
                Dashboard
              </button>
              <button
                className={`nav-button ${currentView === 'champion-select' ? 'active' : ''}`}
                onClick={() => setCurrentView('champion-select')}
                disabled={!champSelectSession}
              >
                Champion Select
              </button>
            </nav>

            <div className="app-content">
              {currentView === 'dashboard' && (
                <Dashboard
                  summoner={summoner}
                  gamePhase={gamePhase}
                  ownedChampions={ownedChampions}
                />
              )}
              {currentView === 'champion-select' && champSelectSession && (
                <ChampionSelect
                  session={champSelectSession}
                  ownedChampions={ownedChampions}
                />
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;