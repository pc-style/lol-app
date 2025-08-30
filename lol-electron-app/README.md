# LoL Companion - Electron App

A League of Legends companion app built with Electron and hexgate for real-time interaction with the League Client.

## Features

- **Real-time LCU Connection**: Automatically connects to League of Legends client
- **Champion Select Assistant**: 
  - Live champion select detection
  - Champion filtering and search
  - Counter-pick suggestions
  - Team composition analysis
- **Dashboard**: 
  - Summoner profile information
  - Champion collection overview
  - Game status tracking
  - XP and level progress

## Prerequisites

- Node.js (v18 or higher)
- League of Legends client installed
- Windows (for initial version)

## Installation

1. Clone or download the project
2. Navigate to the project directory:
   ```bash
   cd lol-electron-app
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development Mode

1. Start the development server:
   ```bash
   npm run dev
   ```

2. The app will automatically open and connect to League of Legends if it's running

### Building for Production

1. Build the application:
   ```bash
   npm run build
   ```

2. Package the app:
   ```bash
   npm run electron:pack
   ```

## How It Works

The app uses the [hexgate](https://github.com/cuppachino/hexgate) library to communicate with the League Client Update (LCU) API. This allows real-time access to:

- Current summoner information
- Champion select sessions
- Game flow states
- Champion ownership data
- Rune page management

## Features Overview

### Dashboard
- Displays current summoner information
- Shows owned champions organized by role
- Tracks game status and XP progress
- Recent champion purchases

### Champion Select
- Real-time champion select phase detection
- Champion filtering by role and search
- Counter-pick suggestions with win rates
- Team composition visualization
- Timer and turn indicators

## Technical Stack

- **Frontend**: React with TypeScript
- **Backend**: Electron main process
- **LCU Integration**: hexgate library
- **Styling**: Custom CSS with League of Legends theme
- **Build System**: Webpack + TypeScript

## Development Notes

- The app automatically reconnects to League if the connection is lost
- All LCU communication happens through IPC between main and renderer processes
- Champion data is fetched from Riot's Data Dragon API for images
- Real-time updates are handled through WebSocket subscriptions

## Known Limitations

- Currently only supports champion select features
- Counter-pick data is mock data (in production would integrate with stats API)
- Windows-focused build configuration
- Requires League of Legends to be running

## Future Enhancements

- Match history analysis
- Ranked climbing tools
- Build path recommendations
- Rune page automation
- Multi-account support
- Cross-platform builds

## Contributing

This is a demonstration project. For production use, consider:
- Implementing real counter-pick data from stats APIs
- Adding error handling and retry logic
- Implementing proper logging
- Adding unit tests
- Cross-platform testing

## License

MIT License