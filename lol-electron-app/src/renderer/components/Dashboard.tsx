import React from 'react';
import type { Summoner, Champion } from '../types';

interface DashboardProps {
  summoner: Summoner | null;
  gamePhase: string;
  ownedChampions: Champion[];
}

export const Dashboard: React.FC<DashboardProps> = ({ summoner, gamePhase, ownedChampions }) => {
  console.log('Dashboard received ownedChampions:', ownedChampions.length);
  if (ownedChampions.length > 0) {
    console.log('Sample champion in Dashboard:', JSON.stringify(ownedChampions[0], null, 2));
  }
  const getGamePhaseDisplay = (phase: string) => {
    switch (phase) {
      case 'None':
        return 'Main Menu';
      case 'Lobby':
        return 'In Lobby';
      case 'Matchmaking':
        return 'Finding Match';
      case 'ChampSelect':
        return 'Champion Select';
      case 'GameStart':
        return 'Loading Game';
      case 'InProgress':
        return 'In Game';
      case 'WaitingForStats':
        return 'Waiting for Stats';
      case 'PreEndOfGame':
        return 'End of Game';
      case 'EndOfGame':
        return 'Post Game';
      default:
        return phase;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'InProgress':
        return '#1e9f39';
      case 'ChampSelect':
      case 'Matchmaking':
        return '#f0d040';
      case 'Lobby':
      case 'None':
        return '#74b9ff';
      default:
        return '#6c757d';
    }
  };

  const getMockChampions = () => [
    { id: 1, name: 'Annie', alias: 'Annie', roles: ['Mage'], ownership: { owned: true }, purchased: Date.now(), title: 'the Dark Child' },
    { id: 103, name: 'Ahri', alias: 'Ahri', roles: ['Mage', 'Assassin'], ownership: { owned: true }, purchased: Date.now() - 1000, title: 'the Nine-Tailed Fox' },
    { id: 84, name: 'Akali', alias: 'Akali', roles: ['Assassin'], ownership: { owned: true }, purchased: Date.now() - 2000, title: 'the Rouge Assassin' },
    { id: 22, name: 'Ashe', alias: 'Ashe', roles: ['Marksman'], ownership: { owned: true }, purchased: Date.now() - 3000, title: 'the Frost Archer' },
    { id: 12, name: 'Alistar', alias: 'Alistar', roles: ['Tank', 'Support'], ownership: { owned: true }, purchased: Date.now() - 4000, title: 'the Minotaur' },
    { id: 32, name: 'Amumu', alias: 'Amumu', roles: ['Tank'], ownership: { owned: true }, purchased: Date.now() - 5000, title: 'the Sad Mummy' }
  ];

  const getRecentChampions = () => {
    if (ownedChampions.length === 0) return getMockChampions();
    
    console.log('All champions:', ownedChampions.length);
    const owned = ownedChampions.filter(champ => champ.ownership?.owned || champ.freeToPlay);
    console.log('Owned + F2P champions:', owned.length);
    const recent = owned.sort((a, b) => b.purchased - a.purchased).slice(0, 8);
    console.log('Recent champions:', recent.length, recent.map(c => c.name));
    return recent;
  };

  const getChampionsByRole = (role: string) => {
    if (ownedChampions.length === 0) return getMockChampions().filter(champ => champ.roles?.includes(role)).slice(0, 6);
    
    const filtered = ownedChampions.filter(champ => 
      (champ.ownership?.owned || champ.freeToPlay) && 
      champ.roles?.includes(role.toLowerCase())
    );
    console.log(`${role} champions:`, filtered.length, filtered.map(c => c.name));
    return filtered.slice(0, 6);
  };

  if (!summoner) {
    return (
      <div className="dashboard loading">
        <div className="loading-spinner"></div>
        <p>Loading summoner data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="summoner-card">
          <img 
            src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${summoner.profileIconId}.png`}
            alt="Summoner Icon"
            className="summoner-avatar"
          />
          <div className="summoner-info">
            <h2>{summoner.displayName}</h2>
            <p>Level {summoner.summonerLevel}</p>
            <div className="level-progress">
              <div 
                className="level-progress-bar"
                style={{ width: `${summoner.percentCompleteForNextLevel}%` }}
              />
            </div>
            <span className="xp-text">
              {summoner.xpSinceLastLevel} / {summoner.xpSinceLastLevel + summoner.xpUntilNextLevel} XP
            </span>
          </div>
        </div>

        <div className="game-status">
          <h3>Current Status</h3>
          <div className="status-badge">
            <div 
              className="status-indicator"
              style={{ backgroundColor: getPhaseColor(gamePhase) }}
            />
            {getGamePhaseDisplay(gamePhase)}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <section className="champion-section">
          <h3>Recently Purchased Champions</h3>
          <div className="champion-grid">
            {getRecentChampions().map(champion => (
              <div key={champion.id} className="champion-card">
                <img 
                  src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/${champion.alias}.png`}
                  alt={champion.name}
                  className="champion-image"
                />
                <div className="champion-info">
                  <h4>{champion.name}</h4>
                  <p>{champion.title}</p>
                  <div className="champion-roles">
                    {champion.roles.slice(0, 2).map(role => (
                      <span key={role} className={`role-tag role-${role.toLowerCase()}`}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="role-sections">
          {['Assassin', 'Fighter', 'Mage', 'Marksman', 'Support', 'Tank'].map(role => (
            <section key={role} className="role-section">
              <h3>{role} Champions</h3>
              <div className="champion-row">
                {getChampionsByRole(role).map(champion => (
                  <div key={champion.id} className="champion-mini-card">
                    <img 
                      src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/${champion.alias}.png`}
                      alt={champion.name}
                      className="champion-mini-image"
                    />
                    <span className="champion-name">{champion.name}</span>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="stats-section">
          <h3>Account Stats</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Champions Owned</h4>
              <p className="stat-value">{ownedChampions.length > 0 ? ownedChampions.filter(c => c.ownership?.owned).length : getMockChampions().length}</p>
            </div>
            <div className="stat-card">
              <h4>Reroll Points</h4>
              <p className="stat-value">{summoner.rerollPoints?.currentPoints || 210}</p>
            </div>
            <div className="stat-card">
              <h4>Free Champions</h4>
              <p className="stat-value">{ownedChampions.length > 0 ? ownedChampions.filter(c => c.freeToPlay && !c.ownership?.owned).length : 14}</p>
            </div>
            <div className="stat-card">
              <h4>Next Level</h4>
              <p className="stat-value">{summoner.xpUntilNextLevel || 2880} XP</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};