import React from 'react';
import type { Summoner } from '../types';

interface ConnectionStatusProps {
  status: string;
  summoner: Summoner | null;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ status, summoner }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#1e9f39';
      case 'connecting':
        return '#f0d040';
      case 'error':
        return '#d63031';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

  return (
    <div className="connection-status">
      <div className="status-indicator">
        <div 
          className="status-dot" 
          style={{ backgroundColor: getStatusColor() }}
        />
        <span className="status-text">{getStatusText()}</span>
      </div>
      
      {summoner && (
        <div className="summoner-info">
          <img 
            src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${summoner.profileIconId}.png`}
            alt="Summoner Icon"
            className="summoner-icon"
          />
          <div className="summoner-details">
            <span className="summoner-name">{summoner.displayName}</span>
            <span className="summoner-level">Level {summoner.summonerLevel}</span>
          </div>
        </div>
      )}
    </div>
  );
};