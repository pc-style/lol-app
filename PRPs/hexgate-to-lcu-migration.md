name: "Hexgate to Official League Client API Migration v1.0.0"
description: |

## Purpose

Migrate the League of Legends companion application from using the Hexgate wrapper library to direct communication with the Official League Client API (LCU). This will provide better control, reduce dependencies, improve security, and align with official Riot Games development practices.

## Core Principles

1. **Context is King**: Include ALL necessary LCU API documentation, authentication patterns, and WebSocket handling
2. **Validation Loops**: Provide executable tests to validate LCU connection and API calls
3. **Information Dense**: Use existing codebase patterns and LCU endpoint specifications
4. **Progressive Success**: Start with basic connection, validate, then add advanced features
5. **Framework Agnostic**: Direct Node.js implementation without external wrappers
6. **Global rules**: Follow all rules in CLAUDE.md

---

## Discovery Summary

### Initial Task Analysis

User requested migration from Hexgate library to direct Official League Client API integration. Current implementation uses Hexgate v0.14.8 as an abstraction layer over the LCU API, providing connection management, HTTP requests, and WebSocket subscriptions.

### User Clarifications Received

- **Question**: Should we maintain the same API contracts for the renderer process?
- **Answer**: Yes, keep existing IPC handlers and data structures to avoid breaking changes
- **Impact**: Focus migration on main process while preserving renderer interface

### Missing Requirements Identified

- LCU process detection and lockfile parsing
- Self-signed certificate handling
- WebSocket connection management
- Proper authentication with LCU credentials

## Goal

Replace Hexgate dependency with native Node.js implementation that directly communicates with the League Client API, maintaining all existing functionality while improving control and reducing external dependencies.

## Why

- **Reduced Bundle Size**: Remove external wrapper library and its dependencies
- **Better Security**: Direct control over authentication and certificate handling
- **Improved Debugging**: Clear visibility into LCU communication without abstraction layers
- **Riot Games Alignment**: Follow official development practices for LCU integration
- **Future Flexibility**: Easier to extend with new LCU endpoints and features

## What

Direct LCU API integration with native Node.js modules, maintaining existing feature set:
- Summoner profile management
- Champion select automation (pick/ban/lock-in)
- Real-time WebSocket updates
- Owned champions retrieval
- Rune page management
- Game flow phase tracking

### Success Criteria

- [ ] LCU connection established using native authentication
- [ ] All existing API endpoints functional without Hexgate
- [ ] WebSocket subscriptions working for real-time updates
- [ ] Champion select actions (pick/ban/lock) operational
- [ ] No breaking changes to renderer process interface
- [ ] Application passes all existing functionality tests

## All Needed Context

### Research Phase Summary

- **Codebase patterns found**: Existing LCU endpoint usage, IPC communication patterns, TypeScript interfaces
- **External research needed**: Yes - Official LCU API documentation and authentication methods
- **Knowledge gaps identified**: LCU lockfile format, process detection, WebSocket event formats

### Documentation & References

```yaml
# MUST READ - Include these in your context window
- url: https://developer.riotgames.com/docs/lol#league-client-api
  why: Official LCU API endpoints, authentication, and SSL certificate handling

- file: /Users/pcstyle/lol-app-1/lol-electron-app/src/main/main.ts
  why: Current Hexgate implementation patterns, endpoint usage, WebSocket subscriptions

- file: /Users/pcstyle/lol-app-1/lol-electron-app/src/main/types.ts
  why: Existing TypeScript interfaces for LCU data structures

- file: /Users/pcstyle/lol-app-1/docs/lcu/official.md
  why: LCU API documentation and security considerations

- doc: https://nodejs.org/api/https.html
  section: HTTPS client implementation
  critical: Self-signed certificate handling with rejectUnauthorized: false

- doc: https://www.npmjs.com/package/ws
  why: WebSocket client implementation for real-time LCU events
```

### Current Codebase tree

```bash
lol-electron-app/
├── src/
│   ├── main/
│   │   ├── main.ts              # Hexgate integration (TO REPLACE)
│   │   ├── types.ts             # LCU data interfaces
│   │   └── preload.ts           # IPC bridge
│   └── renderer/
│       ├── components/          # React components
│       ├── hooks/               # Custom hooks
│       └── types/               # Frontend types
├── package.json                 # Dependencies (hexgate to remove)
└── docs/lcu/official.md         # LCU API documentation
```

### Desired Codebase tree with files to be added

```bash
lol-electron-app/
├── src/
│   ├── main/
│   │   ├── main.ts              # Updated with native LCU client
│   │   ├── types.ts             # Enhanced with LCU client types
│   │   ├── lcu-client.ts        # NEW: Native LCU client implementation
│   │   ├── lcu-connection.ts    # NEW: Connection management and discovery
│   │   └── preload.ts           # Unchanged IPC bridge
│   └── renderer/                # Unchanged - no breaking changes
├── package.json                 # Remove hexgate, add ws
└── package-lock.json            # Updated dependencies
```

### Known Gotchas of our codebase & Library Quirks

```typescript
// CRITICAL: LCU uses self-signed certificates requiring rejectUnauthorized: false
// Example: HTTPS requests must ignore SSL certificate errors
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// CRITICAL: LCU authentication uses Basic Auth with riot:password format
// Example: Authorization: Basic <base64(riot:password)>
const auth = Buffer.from(`riot:${password}`).toString('base64');

// CRITICAL: LCU lockfile contains connection credentials and port
// Example: LeagueClient.exe --app-port=58626 --install-directory=... --auth-token=abc123
// Location: Windows: %LOCALAPPDATA%\Riot Games\League of Legends\lockfile

// CRITICAL: WebSocket events use specific subscription format
// Example: OnJsonApiEvent_lol-champ-select_v1_session for champion select updates

// CRITICAL: Champion select actions require specific payload format
// Example: { championId: number, completed: boolean, type: "pick" | "ban" }

// CRITICAL: IPC handlers must maintain exact same signatures to avoid renderer changes
// Example: ipcMain.handle('get-current-summoner') must return same data structure
```

## Implementation Blueprint

### Data models and structure

Enhance existing TypeScript interfaces and add new LCU client types:

```typescript
// Backend Examples:
- LcuCredentials interface (port, password, protocol)
- LcuClient class with HTTPS and WebSocket methods
- LcuConnection class for discovery and authentication
- Enhanced error types for LCU-specific errors

// Frontend Examples:
- Existing interfaces remain unchanged (Summoner, Champion, ChampSelectSession, etc.)
- No new frontend types needed - maintain compatibility
```

### List of tasks to be completed to fulfill the PRP in the order they should be completed

```yaml
Task 1:
CREATE src/main/lcu-connection.ts:
   - IMPLEMENT LCU process detection and lockfile parsing
   - ADD credential extraction and validation
   - INCLUDE automatic reconnection logic with exponential backoff
   - PRESERVE existing connection status event patterns

Task 2:
CREATE src/main/lcu-client.ts:
   - IMPLEMENT native HTTPS client with self-signed certificate handling
   - ADD WebSocket client with event subscription management
   - MIRROR existing Hexgate API pattern for compatibility
   - KEEP same method signatures and return types

Task 3:
MODIFY src/main/types.ts:
   - ADD LcuCredentials, LcuClientConfig interfaces
   - INJECT new error types after existing types
   - PRESERVE all existing data interfaces

Task 4:
MODIFY src/main/main.ts:
   - REPLACE Hexgate imports with native LCU client
   - UPDATE initializeLCU() method implementation
   - PRESERVE all existing IPC handlers and their signatures
   - KEEP same event emission patterns for renderer

Task 5:
UPDATE package.json:
   - REMOVE hexgate dependency
   - ADD ws dependency for WebSocket support
   - PRESERVE all other dependencies

Task 6:
INSTALL dependencies:
   - RUN npm install ws @types/ws
   - CONFIGURE TypeScript to include new WebSocket types

Task 7:
UPDATE configuration and build:
   - TEST build process with npm run build
   - VALIDATE all existing functionality works
   - RUN linting and type checking
```

### Per task pseudocode

```typescript
// Task 1 - LCU Connection Management
class LcuConnection {
    // PATTERN: Auto-discovery similar to existing connection flow
    async discoverLcu(): Promise<LcuCredentials> {
        // GOTCHA: Lockfile location varies by OS
        // Windows: %LOCALAPPDATA%\Riot Games\League of Legends\lockfile
        // macOS: ~/Library/Application Support/Riot Games/League of Legends/lockfile
        
        // CRITICAL: Parse lockfile format: name:pid:port:password:protocol
        const lockfileContent = await fs.readFile(lockfilePath, 'utf8');
        const [name, pid, port, password, protocol] = lockfileContent.split(':');
        
        return { port: parseInt(port), password, protocol };
    }
    
    // PATTERN: Status monitoring like existing Hexgate implementation
    async connect(): Promise<void> {
        // CRITICAL: Basic Auth with riot:password format
        // PATTERN: Retry logic with exponential backoff
    }
}

// Task 2 - Native LCU Client
class LcuClient {
    // PATTERN: Request builder similar to Hexgate HttpsClient
    async request<T>(endpoint: string, options?: RequestOptions): Promise<T> {
        // GOTCHA: Must use rejectUnauthorized: false for self-signed certs
        const httpsAgent = new https.Agent({ rejectUnauthorized: false });
        
        // CRITICAL: Basic Auth header format
        const auth = Buffer.from(`riot:${this.password}`).toString('base64');
        
        // PATTERN: Error handling similar to existing implementation
        try {
            // CRITICAL: Full URL format: https://127.0.0.1:port/endpoint
            const response = await https.request(url, {
                method: options.method || 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                },
                agent: httpsAgent
            });
            
            return response.json();
        } catch (error) {
            // PATTERN: Error handling (see existing main.ts error patterns)
            throw new LcuError(error.message, error.code);
        }
    }
    
    // PATTERN: WebSocket subscriptions like existing Hexgate ws
    subscribeToEvent(eventName: string, callback: Function): void {
        // CRITICAL: Event format: OnJsonApiEvent_lol-champ-select_v1_session
        // GOTCHA: WebSocket URL: wss://riot:password@127.0.0.1:port/
        
        this.ws.on('message', (data) => {
            const event = JSON.parse(data);
            if (event[2].eventType === eventName) {
                callback(event[2].data);
            }
        });
    }
}

// Task 4 - Main Process Integration
class LolElectronApp {
    private initializeLCU() {
        // REPLACE: this.lcuConnection = new Connection(hexgateConfig)
        // WITH: this.lcuConnection = new LcuConnection(nativeConfig)
        
        this.lcuConnection = new LcuConnection({
            onStatusChange: (status) => {
                // PATTERN: Same status change handling as existing
                console.log('LCU Connection Status:', status);
                this.connectionStatus = status as LcuConnectionStatus;
                this.sendToRenderer('lcu-status-changed', status);
            },
            onConnect: async (connection) => {
                // PATTERN: Same connection logic, different client
                this.lcuClient = new LcuClient(connection.credentials);
                
                // PRESERVE: Exact same API calls and data flow
                const summoner = await this.lcuClient.request('/lol-summoner/v1/current-summoner');
                const champions = await this.lcuClient.request('/lol-champions/v1/owned-champions-minimal');
                
                // KEEP: Same event subscriptions
                this.lcuClient.subscribeToEvent('OnJsonApiEvent_lol-champ-select_v1_session', (event) => {
                    this.sendToRenderer('champ-select-update', event);
                });
            }
        });
    }
}
```

### Integration Points

```yaml
# Backend Integration Points
MAIN_PROCESS:
  - replace: 'Hexgate imports with native modules'
  - pattern: 'Same class structure and method signatures'
  - preserve: 'All existing IPC handlers and event emissions'

LCU_CONNECTION:
  - add to: src/main/main.ts
  - pattern: 'Connection lifecycle management'
  - authentication: 'Basic Auth with riot:password format'

WEBSOCKET:
  - replace: 'Hexgate WebSocket with ws library'
  - pattern: 'Event subscription and callback management'
  - critical: 'Maintain exact same event data format for renderer'

# Frontend Integration Points (NO CHANGES)
RENDERER_PROCESS:
  - maintain: 'All existing component interfaces'
  - preserve: 'IPC communication patterns'
  - keep: 'Same data structures and event handlers'
```

## Validation Loop

### Level 1: Syntax & Style

```bash
# Run these FIRST - fix any errors before proceeding
npm run lint                     # ESLint checking
npm run type-check              # TypeScript type checking

# Expected: No errors. If errors, READ the error and fix.
```

## Final validation Checklist

- [ ] All tests pass: `npm test` (if tests exist)
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] Manual test successful: Launch app and verify LCU connection
- [ ] Champion select actions work (pick/ban/lock-in)
- [ ] Real-time WebSocket updates functional
- [ ] Connection resilience works (disconnect/reconnect)
- [ ] All existing IPC handlers respond correctly
- [ ] Error cases handled gracefully
- [ ] Logs are informative but not verbose
- [ ] Dependencies properly declared in package.json
- [ ] Hexgate dependency completely removed

---

## Anti-Patterns to Avoid

- ❌ Don't change renderer process interfaces - maintain compatibility
- ❌ Don't skip SSL certificate validation setup - LCU requires rejectUnauthorized: false
- ❌ Don't ignore WebSocket connection management - implement proper reconnection
- ❌ Don't hardcode LCU port - always read from lockfile
- ❌ Don't catch all exceptions - be specific about LCU vs network errors
- ❌ Don't ignore authentication header format - must be Basic riot:password
- ❌ Don't skip lockfile parsing validation - handle missing/corrupted files
- ❌ Don't forget to handle connection status changes - maintain existing event flow
- ❌ Don't ignore WebSocket event format - maintain exact subscription patterns
- ❌ Don't skip testing champion select actions - critical functionality