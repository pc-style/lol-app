import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { Connection, Hexgate as HttpsClient } from 'hexgate';
import type { LcuConnectionStatus } from './types';

class LolElectronApp {
  private mainWindow: BrowserWindow | null = null;
  private lcuConnection: any = null;
  private httpClient: any = null;
  private connectionStatus: LcuConnectionStatus = 'disconnected';

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
    this.lcuConnection = new Connection({
      createRecipe({ build, unwrap }) {
        return {
          getCurrentSummoner: unwrap(
            build('/lol-summoner/v1/current-summoner').method('get').create()
          ),
          getChampSelectSession: unwrap(
            build('/lol-champ-select/v1/session').method('get').create()
          ),
          getOwnedChampions: unwrap(
            build('/lol-champions/v1/owned-champions-minimal').method('get').create()
          ),
          getCurrentGameData: unwrap(
            build('/lol-gameflow/v1/gameflow-phase').method('get').create()
          ),
          getRunePages: unwrap(
            build('/lol-perks/v1/pages').method('get').create()
          ),
          createRunePage: build('/lol-perks/v1/pages').method('post').create()
        };
      },
      onStatusChange: (status) => {
        console.log('LCU Connection Status:', status);
        this.connectionStatus = status as LcuConnectionStatus;
        this.sendToRenderer('lcu-status-changed', status);
      },
      onConnect: async (connection) => {
        console.log('Connected to League Client');
        try {
          // Create HTTP client for champion select actions
          this.httpClient = new HttpsClient(connection.credentials);
          
          const summoner = await connection.recipe.getCurrentSummoner();
          console.log(`Welcome, ${summoner.displayName}!`);
          console.log('Summoner data:', JSON.stringify(summoner, null, 2));
          
          // Get owned champions immediately on connect
          const champions = await connection.recipe.getOwnedChampions();
          console.log(`Found ${champions.length} owned champions`);
          console.log('Sample champion data:', JSON.stringify(champions[0], null, 2));
          
          // Check ownership status
          const actuallyOwned = champions.filter(c => c.ownership?.owned);
          const freeToPlay = champions.filter(c => c.freeToPlay && !c.ownership?.owned);
          console.log(`Actually owned: ${actuallyOwned.length}, Free to play: ${freeToPlay.length}`);
          
          this.sendToRenderer('lcu-connected', { summoner, champions });
          
          connection.ws.subscribe(
            'OnJsonApiEvent_lol-champ-select_v1_session',
            (event) => {
              console.log('Champ Select Event:', event.eventType);
              this.sendToRenderer('champ-select-update', event.data);
            }
          );

          connection.ws.subscribe(
            'OnJsonApiEvent_lol-gameflow_v1_gameflow-phase',
            (event) => {
              console.log('Game Flow Event:', event.data);
              this.sendToRenderer('gameflow-update', event.data);
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
      if (!this.lcuConnection || this.connectionStatus !== 'connected') {
        throw new Error('Not connected to League Client');
      }
      return await this.lcuConnection?.recipe?.getCurrentSummoner();
    });

    ipcMain.handle('get-champ-select-session', async () => {
      if (!this.lcuConnection || this.connectionStatus !== 'connected') {
        return null;
      }
      try {
        return await this.lcuConnection?.recipe?.getChampSelectSession();
      } catch (error) {
        return null;
      }
    });

    ipcMain.handle('get-owned-champions', async () => {
      if (!this.lcuConnection || this.connectionStatus !== 'connected') {
        return [];
      }
      return await this.lcuConnection?.recipe?.getOwnedChampions();
    });

    ipcMain.handle('create-rune-page', async (_, runePageData) => {
      if (!this.lcuConnection || this.connectionStatus !== 'connected') {
        throw new Error('Not connected to League Client');
      }
      return await this.lcuConnection?.recipe?.createRunePage(runePageData);
    });

    ipcMain.handle('pick-champion', async (_, actionId: number, championId: number) => {
      if (!this.httpClient || this.connectionStatus !== 'connected') {
        throw new Error('Not connected to League Client');
      }
      console.log(`Picking champion ${championId} for action ${actionId}`);
      
      try {
        // Create the pick champion function using httpClient builder
        const pickChampion = this.httpClient
          .build(`/lol-champ-select/v1/session/actions/${actionId}`)
          .method('patch')
          .create();
        
        const result = await pickChampion({
          championId: championId,
          completed: false,
          type: "pick"
        });
        
        console.log('Champion picked successfully:', result);
        return { 
          success: true, 
          championId,
          actionId,
          status: result.status,
          statusText: result.statusText
        };
      } catch (error) {
        console.error('Error picking champion:', error);
        throw error;
      }
    });

    ipcMain.handle('lock-in-champion', async (_, actionId: number) => {
      if (!this.httpClient || this.connectionStatus !== 'connected') {
        throw new Error('Not connected to League Client');
      }
      console.log(`Locking in champion for action ${actionId}`);
      
      try {
        // Create the lock in function using httpClient builder
        const lockInAction = this.httpClient
          .build(`/lol-champ-select/v1/session/actions/${actionId}/complete`)
          .method('post')
          .create();
        
        const result = await lockInAction({});
        
        console.log('Champion locked in successfully:', result);
        return { 
          success: true, 
          actionId,
          status: result.status,
          statusText: result.statusText
        };
      } catch (error) {
        console.error('Error locking in champion:', error);
        throw error;
      }
    });

    ipcMain.handle('ban-champion', async (_, actionId: number, championId: number) => {
      if (!this.httpClient || this.connectionStatus !== 'connected') {
        throw new Error('Not connected to League Client');
      }
      console.log(`Banning champion ${championId} for action ${actionId}`);
      
      try {
        // Create the ban champion function using httpClient builder
        const banChampion = this.httpClient
          .build(`/lol-champ-select/v1/session/actions/${actionId}`)
          .method('patch')
          .create();
        
        const result = await banChampion({
          championId: championId,
          completed: false,
          type: "ban"
        });
        
        console.log('Champion banned successfully:', result);
        return { 
          success: true, 
          championId,
          actionId,
          status: result.status,
          statusText: result.statusText
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
}

new LolElectronApp();