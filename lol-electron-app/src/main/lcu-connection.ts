import { EventEmitter } from 'events';
import { readFileSync, existsSync, watchFile, unwatchFile } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';

export interface LcuCredentials {
  port: number;
  password: string;
  protocol: string;
  pid: number;
  name: string;
}

export interface LcuConnectionConfig {
  interval?: number;
  onStatusChange?: (status: string) => void;
  onConnect?: (connection: { credentials: LcuCredentials }) => void;
  onDisconnect?: (disconnection: { connect: () => void }) => void;
}

export class LcuConnection extends EventEmitter {
  private config: LcuConnectionConfig;
  private credentials: LcuCredentials | null = null;
  private connectionInterval: NodeJS.Timeout | null = null;
  private currentStatus: string = 'disconnected';
  private reconnectDelay = 1000;
  private maxReconnectDelay = 30000;

  constructor(config: LcuConnectionConfig) {
    super();
    this.config = config;
  }

  private getLockfilePath(): string {
    const os = platform();
    
    if (os === 'win32') {
      const localAppData = process.env.LOCALAPPDATA;
      if (!localAppData) {
        throw new Error('LOCALAPPDATA environment variable not found');
      }
      return join(localAppData, 'Riot Games', 'League of Legends', 'lockfile');
    } else if (os === 'darwin') {
      return join(homedir(), 'Library', 'Application Support', 'Riot Games', 'League of Legends', 'lockfile');
    } else {
      // Linux and other Unix-like systems
      return join(homedir(), '.local', 'share', 'Riot Games', 'League of Legends', 'lockfile');
    }
  }

  private async discoverLcu(): Promise<LcuCredentials | null> {
    try {
      const lockfilePath = this.getLockfilePath();
      
      if (!existsSync(lockfilePath)) {
        return null;
      }

      const lockfileContent = readFileSync(lockfilePath, 'utf8').trim();
      const parts = lockfileContent.split(':');
      
      if (parts.length !== 5) {
        console.warn('Invalid lockfile format:', lockfileContent);
        return null;
      }

      const [name, pid, port, password, protocol] = parts;
      
      return {
        name,
        pid: parseInt(pid, 10),
        port: parseInt(port, 10),
        password,
        protocol
      };
    } catch (error) {
      console.error('Error reading LCU lockfile:', error);
      return null;
    }
  }

  private updateStatus(status: string) {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      console.log('LCU Connection Status:', status);
      this.config.onStatusChange?.(status);
      this.emit('statusChange', status);
    }
  }

  private async attemptConnection(): Promise<void> {
    try {
      const credentials = await this.discoverLcu();
      
      if (!credentials) {
        this.updateStatus('disconnected');
        return;
      }

      // Test connection by making a simple request
      const testUrl = `${credentials.protocol}://127.0.0.1:${credentials.port}/lol-summoner/v1/current-summoner`;
      const auth = Buffer.from(`riot:${credentials.password}`).toString('base64');
      
      // Use dynamic import to avoid loading https module at startup
      const { default: https } = await import('https');
      
      const options = {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`
        },
        agent: new https.Agent({ rejectUnauthorized: false }),
        timeout: 5000
      };

      return new Promise((resolve, reject) => {
        const req = https.request(testUrl, options, (res) => {
          if (res.statusCode === 200 || res.statusCode === 404) {
            // 404 is acceptable - means LCU is running but no summoner logged in yet
            this.credentials = credentials;
            this.updateStatus('connected');
            this.resetReconnectDelay();
            
            // Emit connection event
            this.config.onConnect?.({ credentials });
            this.emit('connect', { credentials });
            resolve();
          } else {
            reject(new Error(`LCU responded with status: ${res.statusCode}`));
          }
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Connection timeout'));
        });

        req.end();
      });

    } catch (error) {
      this.updateStatus('error');
      throw error;
    }
  }

  private resetReconnectDelay() {
    this.reconnectDelay = 1000;
  }

  private increaseReconnectDelay() {
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
  }

  public connect(): void {
    if (this.connectionInterval) {
      return; // Already attempting connection
    }

    this.updateStatus('connecting');
    
    // Attempt initial connection
    this.attemptConnection()
      .catch((error) => {
        console.error('Initial LCU connection failed:', error);
        this.updateStatus('disconnected');
      });

    // Set up periodic connection attempts
    this.connectionInterval = setInterval(async () => {
      if (this.currentStatus === 'connected') {
        // Verify connection is still alive
        try {
          await this.attemptConnection();
        } catch (error) {
          console.log('LCU connection lost, attempting reconnect...');
          this.updateStatus('connecting');
          this.config.onDisconnect?.({ connect: () => this.connect() });
          this.emit('disconnect', { connect: () => this.connect() });
        }
      } else {
        // Attempt to establish connection
        try {
          await this.attemptConnection();
        } catch (error) {
          // Connection failed, will retry on next interval
          this.increaseReconnectDelay();
        }
      }
    }, this.config.interval || 3000);
  }

  public disconnect(): void {
    if (this.connectionInterval) {
      clearInterval(this.connectionInterval);
      this.connectionInterval = null;
    }
    
    this.credentials = null;
    this.updateStatus('disconnected');
  }

  public getCredentials(): LcuCredentials | null {
    return this.credentials;
  }

  public getStatus(): string {
    return this.currentStatus;
  }
}