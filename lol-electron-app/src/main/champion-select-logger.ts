import { writeFile, appendFile, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { promisify } from 'util';

const writeFileAsync = promisify(writeFile);
const appendFileAsync = promisify(appendFile);

export interface ChampionAction {
  id: number;
  actorCellId: number;
  championId: number;
  completed: boolean;
  type: 'pick' | 'ban';
  isAllyAction: boolean;
  isInProgress: boolean;
}

export interface ChampionSelectState {
  actions: ChampionAction[][];
  timer: {
    phase: string;
    timeRemaining: number;
    totalTime: number;
  };
  myTeam: Array<{
    cellId: number;
    championId: number;
    summonerId: number;
    displayName: string;
  }>;
  theirTeam: Array<{
    cellId: number;
    championId: number;
    summonerId: number;
    displayName: string;
  }>;
}

export interface LogEntry {
  timestamp: string;
  phase: string;
  action: 'pick' | 'ban';
  championId: number;
  championName?: string;
  playerName: string;
  team: 'ally' | 'enemy';
  actionId: number;
  cellId: number;
  completed: boolean;
  timeRemaining: number;
}

export class ChampionSelectLogger {
  private logDir: string;
  private logFile!: string;
  private lastState: ChampionSelectState | null = null;
  private championData: Map<number, string> = new Map();
  private sessionStarted = false;

  constructor(logDirectory = 'logs') {
    this.logDir = join(process.cwd(), logDirectory);
    this.ensureLogDirectory();
    this.generateLogFileName();
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private generateLogFileName(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const sessionTime = new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
    this.logFile = join(this.logDir, `champion-select-${timestamp}-${sessionTime}.log`);
  }

  public async setChampionData(champions: Array<{ id: number; name: string }>): Promise<void> {
    this.championData.clear();
    champions.forEach(champ => {
      this.championData.set(champ.id, champ.name);
    });
  }

  public async logChampionSelectUpdate(newState: ChampionSelectState): Promise<void> {
    if (!this.sessionStarted) {
      await this.startNewSession(newState);
      this.sessionStarted = true;
    }

    if (!this.lastState) {
      this.lastState = newState;
      return;
    }

    // Compare states to find new actions
    const newActions = this.findNewActions(this.lastState, newState);
    
    for (const action of newActions) {
      const logEntry = this.createLogEntry(action, newState);
      await this.writeLogEntry(logEntry);
    }

    this.lastState = newState;
  }

  private async startNewSession(initialState: ChampionSelectState): Promise<void> {
    const sessionHeader = [
      '='.repeat(80),
      `CHAMPION SELECT SESSION STARTED`,
      `Timestamp: ${new Date().toISOString()}`,
      `Phase: ${initialState.timer.phase}`,
      `Total Time: ${initialState.timer.totalTime}s`,
      '='.repeat(80),
      ''
    ].join('\\n');

    await writeFileAsync(this.logFile, sessionHeader);
  }

  private findNewActions(oldState: ChampionSelectState, newState: ChampionSelectState): ChampionAction[] {
    const newActions: ChampionAction[] = [];
    
    // Flatten all actions from both states for comparison
    const oldActions = oldState.actions.flat();
    const newActions_flat = newState.actions.flat();

    for (const newAction of newActions_flat) {
      const oldAction = oldActions.find(a => a.id === newAction.id);
      
      if (!oldAction) {
        // Completely new action
        newActions.push(newAction);
      } else if (oldAction.championId !== newAction.championId && newAction.championId > 0) {
        // Champion changed (pick/ban made)
        newActions.push(newAction);
      } else if (oldAction.completed !== newAction.completed && newAction.completed) {
        // Action completed (locked in)
        newActions.push(newAction);
      }
    }

    return newActions;
  }

  private createLogEntry(action: ChampionAction, state: ChampionSelectState): LogEntry {
    const championName = this.championData.get(action.championId) || `Champion_${action.championId}`;
    
    // Find player name from team data
    let playerName = 'Unknown';
    let team: 'ally' | 'enemy' = action.isAllyAction ? 'ally' : 'enemy';
    
    const allPlayers = [...state.myTeam, ...state.theirTeam];
    const player = allPlayers.find(p => p.cellId === action.actorCellId);
    if (player) {
      playerName = player.displayName || `Player_${player.summonerId}`;
    }

    return {
      timestamp: new Date().toISOString(),
      phase: state.timer.phase,
      action: action.type,
      championId: action.championId,
      championName,
      playerName,
      team,
      actionId: action.id,
      cellId: action.actorCellId,
      completed: action.completed,
      timeRemaining: state.timer.timeRemaining
    };
  }

  private async writeLogEntry(entry: LogEntry): Promise<void> {
    const statusText = entry.completed ? 'LOCKED' : 'SELECTED';
    const teamEmoji = entry.team === 'ally' ? '🟢' : '🔴';
    const actionEmoji = entry.action === 'pick' ? '⚡' : '🚫';
    
    const logLine = [
      `[${entry.timestamp}]`,
      `${teamEmoji}${actionEmoji}`,
      `${entry.action.toUpperCase()}:`,
      `${entry.championName}`,
      `by ${entry.playerName}`,
      `(${entry.team.toUpperCase()})`,
      `- ${statusText}`,
      `- Time: ${Math.floor(entry.timeRemaining)}s`,
      `- Phase: ${entry.phase}`
    ].join(' ') + '\\n';

    await appendFileAsync(this.logFile, logLine);
    
    // Also log to console for development
    console.log(`🎮 Champion Select: ${logLine.trim()}`);
  }

  public async endSession(): Promise<void> {
    if (this.sessionStarted) {
      const sessionFooter = [
        '',
        '='.repeat(80),
        `CHAMPION SELECT SESSION ENDED`,
        `Timestamp: ${new Date().toISOString()}`,
        '='.repeat(80),
        ''
      ].join('\\n');

      await appendFileAsync(this.logFile, sessionFooter);
      this.sessionStarted = false;
      this.lastState = null;
    }
  }

  public getLogFilePath(): string {
    return this.logFile;
  }

  public async logError(error: string): Promise<void> {
    const errorLine = `[${new Date().toISOString()}] ❌ ERROR: ${error}\\n`;
    await appendFileAsync(this.logFile, errorLine);
    console.error(`🎮 Champion Select Logger Error: ${error}`);
  }
}