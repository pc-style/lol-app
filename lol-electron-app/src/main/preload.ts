import { contextBridge, ipcRenderer } from 'electron';

export interface IElectronAPI {
  getConnectionStatus: () => Promise<string>;
  getCurrentSummoner: () => Promise<any>;
  getChampSelectSession: () => Promise<any>;
  getOwnedChampions: () => Promise<any[]>;
  createRunePage: (runePageData: any) => Promise<any>;
  pickChampion: (actionId: number, championId: number) => Promise<any>;
  lockInChampion: (actionId: number) => Promise<any>;
  banChampion: (actionId: number, championId: number) => Promise<any>;
  
  onLcuStatusChanged: (callback: (status: string) => void) => void;
  onLcuConnected: (callback: (data: any) => void) => void;
  onLcuDisconnected: (callback: () => void) => void;
  onChampSelectUpdate: (callback: (data: any) => void) => void;
  onGameflowUpdate: (callback: (phase: string) => void) => void;
}

const electronAPI: IElectronAPI = {
  getConnectionStatus: () => ipcRenderer.invoke('get-connection-status'),
  getCurrentSummoner: () => ipcRenderer.invoke('get-current-summoner'),
  getChampSelectSession: () => ipcRenderer.invoke('get-champ-select-session'),
  getOwnedChampions: () => ipcRenderer.invoke('get-owned-champions'),
  createRunePage: (runePageData) => ipcRenderer.invoke('create-rune-page', runePageData),
  pickChampion: (actionId, championId) => ipcRenderer.invoke('pick-champion', actionId, championId),
  lockInChampion: (actionId) => ipcRenderer.invoke('lock-in-champion', actionId),
  banChampion: (actionId, championId) => ipcRenderer.invoke('ban-champion', actionId, championId),

  onLcuStatusChanged: (callback) => ipcRenderer.on('lcu-status-changed', (_, status) => callback(status)),
  onLcuConnected: (callback) => ipcRenderer.on('lcu-connected', (_, data) => callback(data)),
  onLcuDisconnected: (callback) => ipcRenderer.on('lcu-disconnected', () => callback()),
  onChampSelectUpdate: (callback) => ipcRenderer.on('champ-select-update', (_, data) => callback(data)),
  onGameflowUpdate: (callback) => ipcRenderer.on('gameflow-update', (_, phase) => callback(phase)),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}