export type LcuConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface Summoner {
  accountId: number;
  displayName: string;
  internalName: string;
  nameChangeFlag: boolean;
  percentCompleteForNextLevel: number;
  privacy: string;
  profileIconId: number;
  puuid: string;
  rerollPoints: {
    currentPoints: number;
    maxRolls: number;
    numberOfRolls: number;
    pointsCostToRoll: number;
    pointsToReroll: number;
  };
  summonerId: number;
  summonerLevel: number;
  unnamed: boolean;
  xpSinceLastLevel: number;
  xpUntilNextLevel: number;
}

export interface Champion {
  active: boolean;
  alias: string;
  banVoPath: string;
  baseLoadScreenPath: string;
  baseSplashPath: string;
  botEnabled: boolean;
  chooseVoPath: string;
  disabledQueues: any[];
  freeToPlay: boolean;
  id: number;
  name: string;
  ownership: {
    loyaltyReward: boolean;
    owned: boolean;
    rental: {
      endDate: number;
      purchaseDate: number;
      rented: boolean;
      winCountRemaining: number;
    };
    xboxGPReward: boolean;
  };
  purchased: number;
  rankedPlayEnabled: boolean;
  roles: string[];
  squarePortraitPath: string;
  stingerSfxPath: string;
  title: string;
}

export interface ChampSelectSession {
  actions: any[];
  allowBattleBoost: boolean;
  allowDuplicatePicks: boolean;
  allowLockedEvents: boolean;
  allowRerolling: boolean;
  allowSkinSelection: boolean;
  bans: {
    myTeamBans: any[];
    numBans: number;
    theirTeamBans: any[];
  };
  benchChampions: any[];
  benchEnabled: boolean;
  boostableSkinCount: number;
  chatDetails: {
    chatRoomName: string;
    chatRoomPassword: string;
  };
  counter: number;
  entitledFeatureState: {
    additionalRerolls: number;
    unlockedSkinIds: number[];
  };
  gameId: number;
  hasSimultaneousBans: boolean;
  hasSimultaneousPicks: boolean;
  isCustomGame: boolean;
  isSpectating: boolean;
  localPlayerCellId: number;
  lockedEventIndex: number;
  myTeam: any[];
  pickOrderSwaps: any[];
  recoveryCounter: number;
  rerollsRemaining: number;
  skipChampionSelect: boolean;
  theirTeam: any[];
  timer: {
    adjustedTimeLeftInPhase: number;
    internalNowInEpochMs: number;
    isInfinite: boolean;
    phase: string;
    totalTimeInPhase: number;
  };
  trades: any[];
}

export interface RunePage {
  autoModifiedSelections: any[];
  current: boolean;
  id: number;
  isActive: boolean;
  isDeletable: boolean;
  isEditable: boolean;
  isValid: boolean;
  lastModified: number;
  name: string;
  order: number;
  primaryStyleId: number;
  selectedPerkIds: number[];
  subStyleId: number;
}

// Native LCU client types
export interface LcuCredentials {
  port: number;
  password: string;
  protocol: string;
  pid: number;
  name: string;
}

export interface LcuConnectionConfig {
  interval?: number;
  onStatusChange?: (status: LcuConnectionStatus) => void;
  onConnect?: (connection: { credentials: LcuCredentials }) => void;
  onDisconnect?: (disconnection: { connect: () => void }) => void;
}

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