import { EventEmitter } from 'events';
import { IncomingMessage } from 'http';
import WebSocket from 'ws';
import type { LcuCredentials } from './lcu-connection';

export interface LcuRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

export interface LcuHttpResponse {
  status: number;
  statusText: string;
  data: any;
}

export class LcuError extends Error {
  public code?: string;
  public status?: number;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'LcuError';
    this.code = code;
    this.status = status;
  }
}

export class LcuClient extends EventEmitter {
  private credentials: LcuCredentials;
  private ws: WebSocket | null = null;
  private eventSubscriptions = new Map<string, Function[]>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(credentials: LcuCredentials) {
    super();
    this.credentials = credentials;
    this.initializeWebSocket();
  }

  private async initializeWebSocket(): Promise<void> {
    try {
      const wsUrl = `wss://riot:${this.credentials.password}@127.0.0.1:${this.credentials.port}/`;
      
      this.ws = new WebSocket(wsUrl, {
        rejectUnauthorized: false,
        headers: {
          'Authorization': `Basic ${Buffer.from(`riot:${this.credentials.password}`).toString('base64')}`
        }
      });

      this.ws.on('open', () => {
        console.log('LCU WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('wsConnected');
        
        // Subscribe to [5, "OnJsonApiEvent"]
        this.ws?.send(JSON.stringify([5, 'OnJsonApiEvent']));
      });

      this.ws.on('message', (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          // LCU WebSocket messages come as arrays: [opcode, eventType, data]
          if (Array.isArray(message) && message.length >= 3) {
            const [opcode, eventType, eventData] = message;
            
            if (opcode === 8 && eventType === 'OnJsonApiEvent') {
              // Handle API events: [8, "OnJsonApiEvent", eventDetails]
              this.handleApiEvent(eventData);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        console.log(`LCU WebSocket disconnected: ${code} ${reason.toString()}`);
        this.emit('wsDisconnected', code, reason);
        this.scheduleReconnect();
      });

      this.ws.on('error', (error: Error) => {
        console.error('LCU WebSocket error:', error);
        this.emit('wsError', error);
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private handleApiEvent(eventData: any): void {
    if (!eventData || !eventData.uri) {
      return;
    }

    // Extract event type from URI
    // e.g., "/lol-champ-select/v1/session" -> "OnJsonApiEvent_lol-champ-select_v1_session"
    const eventType = `OnJsonApiEvent${eventData.uri.replace(/\//g, '_')}`;
    
    const callbacks = this.eventSubscriptions.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback({
            eventType: eventData.eventType,
            data: eventData.data
          });
        } catch (error) {
          console.error(`Error in WebSocket event callback for ${eventType}:`, error);
        }
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max WebSocket reconnect attempts reached');
      return;
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000;
    this.reconnectAttempts++;

    console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.initializeWebSocket();
    }, delay);
  }

  public async request<T = any>(endpoint: string, options: LcuRequestOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;
    
    const url = `${this.credentials.protocol}://127.0.0.1:${this.credentials.port}${endpoint}`;
    const auth = Buffer.from(`riot:${this.credentials.password}`).toString('base64');

    // Dynamic import to avoid loading https module at startup
    const { default: https } = await import('https');

    const requestOptions = {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...headers
      },
      agent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 10000
    };

    return new Promise((resolve, reject) => {
      const req = https.request(url, requestOptions, (res: IncomingMessage) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            let parsedData: any;
            
            if (responseData) {
              try {
                parsedData = JSON.parse(responseData);
              } catch {
                parsedData = responseData;
              }
            }

            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve(parsedData);
            } else {
              reject(new LcuError(
                `HTTP ${res.statusCode}: ${res.statusMessage}`,
                'HTTP_ERROR',
                res.statusCode
              ));
            }
          } catch (error) {
            reject(new LcuError(
              `Failed to parse response: ${error}`,
              'PARSE_ERROR'
            ));
          }
        });
      });

      req.on('error', (error) => {
        reject(new LcuError(
          `Request failed: ${error.message}`,
          'REQUEST_ERROR'
        ));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new LcuError(
          'Request timeout',
          'TIMEOUT_ERROR'
        ));
      });

      if (body) {
        const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
        req.write(bodyString);
      }

      req.end();
    });
  }

  // WebSocket event subscription methods
  public subscribe(eventName: string, callback: Function): void {
    if (!this.eventSubscriptions.has(eventName)) {
      this.eventSubscriptions.set(eventName, []);
    }
    this.eventSubscriptions.get(eventName)!.push(callback);
  }

  public unsubscribe(eventName: string, callback?: Function): void {
    if (!this.eventSubscriptions.has(eventName)) {
      return;
    }

    if (callback) {
      const callbacks = this.eventSubscriptions.get(eventName)!;
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
      
      if (callbacks.length === 0) {
        this.eventSubscriptions.delete(eventName);
      }
    } else {
      this.eventSubscriptions.delete(eventName);
    }
  }


  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.eventSubscriptions.clear();
  }

  public isWebSocketConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}