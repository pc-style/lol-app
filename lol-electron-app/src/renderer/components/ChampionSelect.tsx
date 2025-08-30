import React, { useState, useEffect } from 'react';
import type { ChampSelectSession, Champion, ChampionCounterData } from '../types';

interface ChampionSelectProps {
  session: ChampSelectSession;
  ownedChampions: Champion[];
}

export const ChampionSelect: React.FC<ChampionSelectProps> = ({ session, ownedChampions }) => {
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [counterSuggestions, setCounterSuggestions] = useState<ChampionCounterData[]>([]);

  const localPlayer = session.myTeam.find(player => player.cellId === session.localPlayerCellId);
  const currentPhase = session.timer.phase;
  const timeLeft = Math.ceil(session.timer.adjustedTimeLeftInPhase / 1000);

  useEffect(() => {
    if (localPlayer?.championId) {
      const champion = ownedChampions.find(c => c.id === localPlayer.championId);
      setSelectedChampion(champion || null);
      loadCounterSuggestions(localPlayer.championId);
    }
  }, [localPlayer?.championId, ownedChampions]);

  const loadCounterSuggestions = async (championId: number) => {
    const mockCounters: ChampionCounterData[] = [
      { championId: 1, name: 'Annie', winRate: 52.3, difficulty: 'Easy', tips: ['Build MR early', 'Avoid extended trades'] },
      { championId: 238, name: 'Zed', winRate: 48.7, difficulty: 'Hard', tips: ['Rush Seeker\'s Armguard', 'Stay near minions'] },
      { championId: 157, name: 'Yasuo', winRate: 49.2, difficulty: 'Medium', tips: ['Play around his windwall', 'Wait for power spike'] }
    ];
    setCounterSuggestions(mockCounters);
  };

  const getCurrentAction = () => {
    const currentActions = session.actions.flat().filter(action => 
      action.actorCellId === session.localPlayerCellId && 
      action.isInProgress && 
      !action.completed
    );
    return currentActions[0];
  };

  const handleChampionPick = async (champion: Champion) => {
    const action = getCurrentAction();
    if (!action) {
      console.log('No active action available');
      return;
    }

    try {
      console.log(`Picking champion: ${champion.name} (ID: ${champion.id}) for action: ${action.id}`);
      await window.electronAPI.pickChampion(action.id, champion.id);
      setSelectedChampion(champion);
    } catch (error) {
      console.error('Error picking champion:', error);
    }
  };

  const handleLockIn = async () => {
    const action = getCurrentAction();
    if (!action || !selectedChampion) {
      console.log('No action or champion selected for lock in');
      return;
    }

    try {
      console.log(`Locking in champion: ${selectedChampion.name} for action: ${action.id}`);
      await window.electronAPI.lockInChampion(action.id);
    } catch (error) {
      console.error('Error locking in champion:', error);
    }
  };

  const handleBanChampion = async (champion: Champion) => {
    const action = getCurrentAction();
    if (!action) {
      console.log('No active action available for ban');
      return;
    }

    try {
      console.log(`Banning champion: ${champion.name} (ID: ${champion.id}) for action: ${action.id}`);
      await window.electronAPI.banChampion(action.id, champion.id);
    } catch (error) {
      console.error('Error banning champion:', error);
    }
  };

  const getFilteredChampions = () => {
    return ownedChampions
      .filter(champ => champ.ownership.owned)
      .filter(champ => {
        if (searchTerm) {
          return champ.name.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (selectedRole !== 'All') {
          return champ.roles.includes(selectedRole);
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const getPhaseColor = () => {
    switch (currentPhase) {
      case 'PLANNING':
        return '#74b9ff';
      case 'BAN_PICK':
        return '#f0d040';
      case 'FINALIZATION':
        return '#1e9f39';
      default:
        return '#6c757d';
    }
  };

  const isMyTurn = () => {
    const action = getCurrentAction();
    return !!action;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="champion-select">
      <div className="champion-select-header">
        <div className="phase-info">
          <h2 className="phase-title">{currentPhase.replace('_', ' ')}</h2>
          <div className="timer" style={{ color: getPhaseColor() }}>
            {formatTime(timeLeft)}
          </div>
        </div>
        
        {isMyTurn() && (
          <div className="turn-indicator">
            <div className="turn-pulse" />
            <span>Your {getCurrentAction()?.type.toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="champion-select-content">
        <div className="champion-picker">
          <div className="picker-controls">
            <input
              type="text"
              placeholder="Search champions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="champion-search"
            />
            
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="role-filter"
            >
              <option value="All">All Roles</option>
              <option value="Assassin">Assassin</option>
              <option value="Fighter">Fighter</option>
              <option value="Mage">Mage</option>
              <option value="Marksman">Marksman</option>
              <option value="Support">Support</option>
              <option value="Tank">Tank</option>
            </select>
          </div>

          <div className="champion-grid">
            {getFilteredChampions().map(champion => (
              <div
                key={champion.id}
                className={`champion-pick-card ${selectedChampion?.id === champion.id ? 'selected' : ''}`}
                onClick={() => handleChampionPick(champion)}
              >
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/${champion.alias}.png`}
                  alt={champion.name}
                  className="champion-pick-image"
                />
                <div className="champion-pick-info">
                  <span className="champion-pick-name">{champion.name}</span>
                  <div className="champion-pick-roles">
                    {champion.roles.slice(0, 2).map(role => (
                      <span key={role} className={`role-tag-mini role-${role.toLowerCase()}`}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="champion-details">
          {selectedChampion ? (
            <>
              <div className="selected-champion">
                <img
                  src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${selectedChampion.alias}_0.jpg`}
                  alt={selectedChampion.name}
                  className="champion-splash"
                />
                <div className="champion-info-overlay">
                  <h3>{selectedChampion.name}</h3>
                  <p>{selectedChampion.title}</p>
                  <div className="champion-roles">
                    {selectedChampion.roles.map(role => (
                      <span key={role} className={`role-tag role-${role.toLowerCase()}`}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="champion-suggestions">
                <h4>Counter Picks Against Enemy Team</h4>
                <div className="counter-list">
                  {counterSuggestions.map(counter => (
                    <div key={counter.championId} className="counter-suggestion">
                      <div className="counter-info">
                        <span className="counter-name">{counter.name}</span>
                        <span className={`counter-difficulty difficulty-${counter.difficulty.toLowerCase()}`}>
                          {counter.difficulty}
                        </span>
                      </div>
                      <div className="counter-winrate">
                        <span>{counter.winRate}% WR</span>
                      </div>
                      <div className="counter-tips">
                        {counter.tips.slice(0, 2).map((tip, index) => (
                          <div key={index} className="tip">{tip}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="quick-actions">
                  <button 
                    className="action-button primary"
                    onClick={() => {
                      const action = getCurrentAction();
                      if (action?.type === 'ban') {
                        handleBanChampion(selectedChampion);
                      } else {
                        handleLockIn();
                      }
                    }}
                    disabled={!getCurrentAction()}
                  >
                    {getCurrentAction()?.type === 'ban' ? `Ban ${selectedChampion.name}` : `Lock In ${selectedChampion.name}`}
                  </button>
                  <button className="action-button secondary">
                    Create Rune Page
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <h3>Select a Champion</h3>
              <p>Choose a champion from the list to see detailed information and suggestions.</p>
            </div>
          )}
        </div>
      </div>

      <div className="team-composition">
        <div className="team ally-team">
          <h4>Your Team</h4>
          <div className="team-players">
            {session.myTeam.map(player => (
              <div key={player.cellId} className={`player ${player.cellId === session.localPlayerCellId ? 'local-player' : ''}`}>
                <div className="player-champion">
                  {player.championId > 0 ? (
                    <img
                      src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/${ownedChampions.find(c => c.id === player.championId)?.alias || 'Aatrox'}.png`}
                      alt="Champion"
                      className="player-champion-image"
                    />
                  ) : (
                    <div className="player-champion-placeholder" />
                  )}
                </div>
                <div className="player-position">{player.assignedPosition || 'FILL'}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="team enemy-team">
          <h4>Enemy Team</h4>
          <div className="team-players">
            {session.theirTeam.map(player => (
              <div key={player.cellId} className="player">
                <div className="player-champion">
                  {player.championId > 0 ? (
                    <img
                      src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/${ownedChampions.find(c => c.id === player.championId)?.alias || 'Aatrox'}.png`}
                      alt="Champion"
                      className="player-champion-image"
                    />
                  ) : (
                    <div className="player-champion-placeholder" />
                  )}
                </div>
                <div className="player-position">{player.assignedPosition || 'FILL'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};