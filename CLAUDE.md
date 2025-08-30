# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a League of Legends companion application built with Electron, featuring both a documentation collection and a fully functional desktop app that integrates with the official League Client API (LCU).

### Main Application (`lol-electron-app/`)
A desktop companion app that provides real-time interaction with the League of Legends client through the official LCU API. Features include champion select assistance, summoner profile management, and live game tracking.

### Documentation Collection (`docs/`)
Comprehensive API documentation for League of Legends development, including official Riot Games APIs and LCU specifications.

## Key Technologies & Architecture

### Core Stack
- **Frontend**: React 18 with TypeScript
- **Backend**: Electron main process with Node.js
- **LCU Integration**: Official League Client API (direct HTTPS/WebSocket communication)
- **Build System**: Webpack 5 + TypeScript compiler
- **Styling**: Custom CSS with League-themed dark UI

### Architecture Pattern
- **Main Process**: Handles LCU connection, IPC communication, and system integration
- **Renderer Process**: React-based UI with real-time updates via IPC
- **LCU Communication**: Direct HTTPS requests to `127.0.0.1:2999` with self-signed certificate handling
- **WebSocket Subscriptions**: Real-time event listening for game state changes

## Development Commands

### Core Development Workflow
```bash
# Install dependencies
cd lol-electron-app && npm install

# Start development mode (builds and runs app)
npm run dev

# Build for production
npm run build

# Package distributable app
npm run electron:pack

# Clean build artifacts
npm run clean
```

### Build System Details
- **Main Process**: `npm run build:main` - Compiles TypeScript to `dist/main/`
- **Renderer Process**: `npm run build:renderer` - Webpack bundle to `dist/renderer/`
- **Development Server**: `npm run dev` - Concurrent main/renderer builds with hot reload
- **Electron Launch**: `npm run electron:dev` - Runs app with dev tools open

### Testing & Quality
```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## LCU Integration (Official League Client API)

### Connection Management
- **Auto-Detection**: Scans for League client on port 2999
- **Authentication**: Uses client-provided credentials (no API key required)
- **Reconnection**: Automatic retry with exponential backoff
- **Status Monitoring**: Real-time connection status via IPC

### Key LCU Endpoints Used
```typescript
// Core endpoints implemented:
GET /lol-summoner/v1/current-summoner          // Summoner profile
GET /lol-champ-select/v1/session               // Champion select state
GET /lol-champions/v1/owned-champions-minimal  // Owned champions
GET /lol-gameflow/v1/gameflow-phase           // Game phase tracking
GET /lol-perks/v1/pages                       // Rune pages
POST /lol-perks/v1/pages                      // Create rune page
PATCH /lol-champ-select/v1/session/actions/{id} // Champion actions
POST /lol-champ-select/v1/session/actions/{id}/complete // Lock-in
```

### WebSocket Subscriptions
- `OnJsonApiEvent_lol-champ-select_v1_session` - Champion select updates
- `OnJsonApiEvent_lol-gameflow_v1_gameflow-phase` - Game phase changes

### Security & Authentication
- **SSL Handling**: Ignores self-signed certificate for local communication
- **Local Only**: All communication restricted to 127.0.0.1
- **No External APIs**: Pure local client integration
- **IPC Isolation**: Secure communication between Electron processes

## Project Structure

### Application Architecture
```
lol-electron-app/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── main.ts             # App lifecycle, LCU connection
│   │   ├── preload.ts          # IPC bridge security
│   │   └── types.ts            # Shared type definitions
│   └── renderer/               # React frontend
│       ├── App.tsx             # Root component
│       ├── components/         # React components
│       │   ├── ChampionSelect.tsx
│       │   ├── ConnectionStatus.tsx
│       │   └── Dashboard.tsx
│       ├── hooks/              # Custom React hooks
│       │   └── useLCUConnection.ts
│       ├── index.tsx           # React entry point
│       └── types/              # Frontend types
├── package.json                # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── webpack.config.js          # Build configuration
└── start.bat                  # Windows launcher
```

### Documentation Structure
```
docs/
├── README.md                   # Documentation index
├── lcu/
│   └── official.md            # Official LCU API documentation
└── twisted/
    └── README.md              # External Riot API documentation
```

## Development Best Practices

### Code Organization
- **Separation of Concerns**: Main process handles LCU, renderer handles UI
- **Type Safety**: Full TypeScript coverage with strict mode
- **Error Handling**: Comprehensive try/catch blocks with user feedback
- **IPC Security**: Context isolation enabled, no node integration in renderer

### LCU Integration Patterns
- **Connection Resilience**: Auto-reconnect with status monitoring
- **Event-Driven Updates**: WebSocket subscriptions for real-time data
- **Request Building**: Direct HTTPS requests with proper error handling
- **Certificate Handling**: Self-signed certificate acceptance for local API

### Performance Considerations
- **Lazy Loading**: Components loaded on demand
- **Memory Management**: Proper cleanup of subscriptions and timers
- **Bundle Optimization**: Webpack code splitting for faster startup
- **IPC Efficiency**: Batched updates to minimize cross-process communication

## Common Development Tasks

### Adding New LCU Endpoints
1. Define endpoint in main process LCU connection setup
2. Add IPC handler for renderer communication
3. Update preload script for type-safe IPC
4. Implement React hook for data fetching
5. Add error handling and loading states

### Component Development
1. Create component in `src/renderer/components/`
2. Add TypeScript interfaces in `src/renderer/types/`
3. Implement with React hooks for state management
4. Style with CSS modules or styled-components
5. Test IPC integration if LCU data required

### Build & Deployment
1. Run `npm run build` for production build
2. Test built app: `npm run electron:dev`
3. Package with `npm run electron:pack`
4. Distribute generated executables from `release/` directory

## Dependencies & Environment

### Runtime Requirements
- **Node.js**: v18+ required
- **League Client**: Must be running for LCU integration
- **Operating System**: Windows (primary), macOS/Linux (planned)

### Key Dependencies
- **Electron**: Cross-platform desktop app framework
- **React**: UI framework with hooks
- **TypeScript**: Type safety and developer experience
- **Webpack**: Module bundling and asset optimization

## Troubleshooting

### Common Issues
- **LCU Connection Failed**: Ensure League client is running
- **Certificate Errors**: App handles self-signed certificates automatically
- **Build Failures**: Check Node.js version and dependency installation
- **IPC Errors**: Verify preload script matches main process handlers

### Debug Mode
- Development builds include React DevTools
- Console logging available in Electron dev tools
- LCU connection status visible in app UI
- Network requests logged in main process console

## Future Enhancements

### Planned Features
- Match history analysis and statistics
- Rune page automation and management
- Advanced champion select tools
- Cross-platform builds (macOS, Linux)
- Plugin system for extensibility
- Settings persistence and customization

### Technical Improvements
- Performance optimizations for large champion lists
- Enhanced error handling and recovery
- Offline mode capabilities
- Automated testing suite
- Code modularization and plugin architecture