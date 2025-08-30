# League of Legends API Documentation Collection

This directory contains comprehensive documentation for two popular League of Legends API libraries, collected and organized for easy reference.

## 📚 Libraries Included

### 1. Twisted
**Location:** [`./twisted/README.md`](./twisted/README.md)

- **Purpose:** Modern League of Legends API wrapper for Node.js
- **Author:** sansossio
- **GitHub:** https://github.com/sansossio/twisted
- **NPM:** https://www.npmjs.com/package/twisted
- **License:** MIT

**Key Features:**
- Automatic rate limit handling with configurable retry attempts
- Support for League of Legends, Teamfight Tactics, and Riot Account APIs
- Modern JavaScript with full async/await support
- TypeScript definitions included
- Configurable concurrency and debug logging
- Comprehensive endpoint coverage

### 2. Hexgate
**Location:** [`./hexgate/README.md`](./hexgate/README.md)

- **Purpose:** LCU API wrapper for League of Legends
- **Author:** cuppachino
- **GitHub:** https://github.com/cuppachino/hexgate
- **Website:** https://hexgate.app/
- **Stars:** 23
- **License:** GPL-3.0

**Key Features:**
- LCU (League Client Update) API wrapper
- TypeScript-first design
- Builder API for request construction
- WebSocket event subscriptions
- Recipe API for transforming requests/responses
- Connection management with auto-reconnect
- ESM and CJS support

## 🔗 Related Resources

- **Riot Games Developer Portal:** https://developer.riotgames.com/
- **League of Legends:** https://na.leagueoflegends.com/
- **Riot API Libraries Community:** https://riot-api-libraries.readthedocs.io/
- **Hexgate Discord:** https://discord.gg/HEd72YnzVq

## 📖 Usage Notes

### Twisted
- Requires a Riot Games API key
- Modern async/await API design
- Automatic rate limiting with retry mechanisms
- Support for multiple Riot game APIs (LoL, TFT, Account)
- Built-in TypeScript support

### Hexgate
- Works with the League Client Update (LCU) API
- Requires League of Legends client to be running
- TypeScript recommended for best developer experience
- Supports both HTTP and WebSocket connections

## 🏗️ API Types

- **Twisted:** External Riot Games API (requires API key)
- **Hexgate:** Internal LCU API (local client communication)

## 📝 Documentation Structure

Each library has its own subdirectory containing:
- `README.md` - Complete documentation with examples
- Installation instructions
- API reference
- Usage examples
- Development setup (where applicable)

## 🤝 Contributing

This documentation collection was created using Context7 and web crawling tools. For updates or corrections, please check the original repositories for the latest information.

---

*Last updated: August 30, 2025*
*Documentation collected using automated tools*
