# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a documentation repository containing League of Legends API documentation for two popular libraries:

- **twisted**: Modern League of Legends API wrapper for Node.js (external API requiring API key)
- **hexgate**: LCU (League Client Update) API wrapper (local client communication)

## Project Structure

```
docs/
├── README.md           # Main documentation index
├── twisted/
│   └── README.md      # Complete twisted library documentation
└── hexgate/
    └── README.md      # Complete hexgate library documentation
```

## Key Information

### Twisted Library
- **Purpose**: Modern League of Legends API wrapper for Node.js
- **Authentication**: Requires Riot Games API key from developer.riotgames.com
- **Key Features**: Automatic rate limiting, TypeScript support, multiple game APIs (LoL/TFT/Account), async/await
- **Supported APIs**: Complete Riot Games API coverage including Match-v5, Summoner-v4, League-v4, Champion Mastery-v4
- **Installation**: `npm install twisted`

### hexgate Library
- **Purpose**: LCU API wrapper for League of Legends client communication
- **Authentication**: Works with local League client (no API key needed)
- **Key Features**: TypeScript-first, Builder API, WebSocket subscriptions, auto-reconnect
- **Installation**: `pnpm add hexgate` / `npm i hexgate` / `yarn add hexgate`
- **Package Manager**: Uses pnpm for development

## Development Notes

- This is a documentation-only repository with no build/test commands
- Content was collected using automated tools and web crawling
- Documentation reflects the state as of August 30, 2025
- No package.json or build configuration files present
- Repository focuses on providing comprehensive API reference for both libraries

## Usage Context

- **twisted**: Best for server-side applications needing access to public Riot API data with modern JavaScript features
- **hexgate**: Best for desktop applications interacting with the League of Legends client
- Both libraries serve different use cases in League of Legends application development