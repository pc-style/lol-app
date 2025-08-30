import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { LcuConnection } from './lcu-connection';
import { LcuClient } from './lcu-client';
import { ChampionSelectLogger } from './champion-select-logger';
import type { LcuConnectionStatus, LcuCredentials } from './types';

class LolElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private lcuConnection: LcuConnection | null = null;
  private lcuClient: LcuClient | null = null;
  private championSelectLogger: ChampionSelectLogger | null = null;
  private connectionStatus: LcuConnectionStatus = 'disconnected';
  private isInChampionSelect = false;

  constructor() {
    this.initializeApp();
  }

  private initializeApp() {
    app.whenReady().then(() => {
      this.createWindow();
      this.initializeLCU();
      this.setupIpcHandlers();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });
  }

  private createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
      titleBarStyle: 'hidden',
      backgroundColor: '#0f1b1c',
      show: false,
    });

    const isDev = process.env.NODE_ENV === 'development';
    
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:8080');
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });
  }

  private initializeLCU() {
    this.lcuConnection = new LcuConnection({
      onStatusChange: (status) => {
        console.log('LCU Connection Status:', status);
        this.connectionStatus = status as LcuConnectionStatus;
        this.sendToRenderer('lcu-status-changed', status);
      },
      onConnect: async (connection) => {
        console.log('Connected to League Client');
        try {
          // Create LCU client for API requests
          this.lcuClient = new LcuClient(connection.credentials);
          
          const summoner = await this.lcuClient.request('/lol-summoner/v1/current-summoner');
          console.log(`Welcome, ${summoner.displayName}!`);
          console.log('Summoner data:', JSON.stringify(summoner, null, 2));
          
          // Get owned champions immediately on connect
          const champions = await this.lcuClient.request('/lol-champions/v1/owned-champions-minimal');
          console.log(`Found ${champions.length} owned champions`);
          console.log('Sample champion data:', JSON.stringify(champions[0], null, 2));
          
          // Check ownership status
          const actuallyOwned = champions.filter((c: any) => c.ownership?.owned);
          const freeToPlay = champions.filter((c: any) => c.freeToPlay && !c.ownership?.owned);
          console.log(`Actually owned: ${actuallyOwned.length}, Free to play: ${freeToPlay.length}`);
          
          this.sendToRenderer('lcu-connected', { summoner, champions });
          
          // Initialize champion select logger
          this.championSelectLogger = new ChampionSelectLogger();
          await this.initializeChampionLogger(champions);
          
          // Set up WebSocket subscriptions
          this.lcuClient.subscribe(
            'OnJsonApiEvent_lol-champ-select_v1_session',
            (event: any) => {
              console.log('Champ Select Event:', event.eventType);
              this.sendToRenderer('champ-select-update', event.data);
              
              // Log champion select changes
              if (event.data && this.championSelectLogger) {
                this.handleChampionSelectEvent(event.data);
              }
            }
          );

          this.lcuClient.subscribe(
            'OnJsonApiEvent_lol-gameflow_v1_gameflow-phase',
            (event: any) => {
              console.log('Game Flow Event:', event.data);
              this.sendToRenderer('gameflow-update', event.data);
              
              // Handle champion select session lifecycle
              if (event.data === 'ChampSelect' && !this.isInChampionSelect) {
                this.isInChampionSelect = true;
                console.log('🎮 Champion Select started - logging enabled');
              } else if (event.data !== 'ChampSelect' && this.isInChampionSelect) {
                this.isInChampionSelect = false;
                console.log('🎮 Champion Select ended - stopping logger');
                if (this.championSelectLogger) {
                  this.championSelectLogger.endSession();
                }
              }
            }
          );

        } catch (error) {
          console.error('Error during LCU connection setup:', error);
          console.error('Stack trace:', (error as Error)?.stack);
        }
      },
      onDisconnect: async (disconnection) => {
        console.log('Disconnected from League Client');
        this.sendToRenderer('lcu-disconnected');
        
        // Clean up LCU client
        if (this.lcuClient) {
          this.lcuClient.disconnect();
          this.lcuClient = null;
        }
        
        setTimeout(() => {
          disconnection.connect();
        }, 5000);
      },
      interval: 3000,
    });

    this.lcuConnection.connect();
  }

  private setupIpcHandlers() {
    ipcMain.handle('get-connection-status', () => {
      return this.connectionStatus;
    });

    ipcMain.handle('get-current-summoner', async () => {
      if (!this.lcuClient || this.connectionStatus !== 'connected') {
        throw new Error('Not connected to League Client');
      }
      return await this.lcuClient.request('/lol-summoner/v1/current-summoner');
    });

    ipcMain.handle('get-champ-select-session', async () => {
      if (!this.lcuClient || this.connectionStatus !== 'connected') {
        return null;
      }
      try {
        return await this.lcuClient.request('/lol-champ-select/v1/session');
      } catch (error) {
        return null;
      }
    });

    ipcMain.handle('get-owned-champions', async () => {
      if (!this.lcuClient || this.connectionStatus !== 'connected') {
        return [];
      }
      return await this.lcuClient.request('/lol-champions/v1/owned-champions-minimal');
    });

    ipcMain.handle('create-rune-page', async (_, runePageData) => {
      if (!this.lcuClient || this.connectionStatus !== 'connected') {
        throw new Error('Not connected to League Client');
      }
      return await this.lcuClient.request('/lol-perks/v1/pages', {
        method: 'POST',
        body: runePageData
      });
    });

    ipcMain.handle('pick-champion', async (_, actionId: number, championId: number) => {
      if (!this.lcuClient || this.connectionStatus !== 'connected') {
        throw new Error('Not connected to League Client');
      }
      console.log(`Picking champion ${championId} for action ${actionId}`);
      
      try {
        const result = await this.lcuClient.request(`/lol-champ-select/v1/session/actions/${actionId}`, {
          method: 'PATCH',
          body: {
            championId: championId,
            completed: false,
            type: "pick"
          }
        });
        
        console.log('Champion picked successfully:', result);
        return { 
          success: true, 
          championId,
          actionId,
          result
        };
      } catch (error) {
        console.error('Error picking champion:', error);
        throw error;
      }
    });

    ipcMain.handle('lock-in-champion', async (_, actionId: number) => {
      if (!this.lcuClient || this.connectionStatus !== 'connected') {
        throw new Error('Not connected to League Client');
      }
      console.log(`Locking in champion for action ${actionId}`);
      
      try {
        const result = await this.lcuClient.request(`/lol-champ-select/v1/session/actions/${actionId}/complete`, {
          method: 'POST',
          body: {}
        });
        
        console.log('Champion locked in successfully:', result);
        return { 
          success: true, 
          actionId,
          result
        };
      } catch (error) {
        console.error('Error locking in champion:', error);
        throw error;
      }
    });

    ipcMain.handle('ban-champion', async (_, actionId: number, championId: number) => {
      if (!this.lcuClient || this.connectionStatus !== 'connected') {
        throw new Error('Not connected to League Client');
      }
      console.log(`Banning champion ${championId} for action ${actionId}`);
      
      try {
        const result = await this.lcuClient.request(`/lol-champ-select/v1/session/actions/${actionId}`, {
          method: 'PATCH',
          body: {
            championId: championId,
            completed: false,
            type: "ban"
          }
        });
        
        console.log('Champion banned successfully:', result);
        return { 
          success: true, 
          championId,
          actionId,
          result
        };
      } catch (error) {
        console.error('Error banning champion:', error);
        throw error;
      }
    });
  }

  private sendToRenderer(channel: string, data?: any) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  private async initializeChampionLogger(champions: any[]): Promise<void> {
    if (!this.championSelectLogger) return;
    
    try {
      // Get all champions data for name mapping
      const allChampions = await this.lcuClient!.request('/lol-champions/v1/champions');
      
      // Create champion name mapping
      const championData = allChampions.map((champ: any) => ({
        id: champ.id,
        name: champ.name
      }));
      
      await this.championSelectLogger.setChampionData(championData);
      console.log(`🎮 Champion Select Logger initialized with ${championData.length} champions`);
    } catch (error) {
      console.error('Failed to initialize champion logger:', error);
      if (this.championSelectLogger) {
        this.championSelectLogger.logError(`Failed to initialize: ${error}`);
      }
    }
  }

  private async handleChampionSelectEvent(championSelectData: any): Promise<void> {
    if (!this.championSelectLogger || !this.isInChampionSelect) return;
    
    try {
      // Transform the LCU data to match our logger interface
      const loggerData = {
        actions: championSelectData.actions || [],
        timer: championSelectData.timer || { phase: 'unknown', timeRemaining: 0, totalTime: 0 },
        myTeam: championSelectData.myTeam || [],
        theirTeam: championSelectData.theirTeam || []
      };
      
      await this.championSelectLogger.logChampionSelectUpdate(loggerData);
    } catch (error) {
      console.error('Error handling champion select event:', error);
      if (this.championSelectLogger) {
        this.championSelectLogger.logError(`Event handling error: ${error}`);
      }
    }
  }
}

new LolElectronApp();