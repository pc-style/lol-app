# League of Legends API Documentation Collection

This directory contains comprehensive documentation for two popular League of Legends API libraries, collected and organized for easy reference.

## 📚 Libraries Included

### 1. lol-js
**Location:** [`./lol-js/README.md`](./lol-js/README.md)

- **Purpose:** Node.js bindings for the Riot Games API for League of Legends
- **Author:** jwalton
- **GitHub:** https://github.com/jwalton/lol-js
- **Stars:** 27
- **License:** MIT

**Key Features:**
- Support for multiple Riot API endpoints (game-v1.3, match-v2.2, summoner-v1.4, etc.)
- Native promise support
- Built-in rate limiting
- Flexible caching (Redis, in-memory, custom)
- Well-documented API functions

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

### lol-js
- Requires a Riot Games API key
- Supports both callback and promise-based usage
- Extensive caching options available
- Rate limiting built-in to prevent API abuse

### Hexgate
- Works with the League Client Update (LCU) API
- Requires League of Legends client to be running
- TypeScript recommended for best developer experience
- Supports both HTTP and WebSocket connections

## 🏗️ API Types

- **lol-js:** External Riot Games API (requires API key)
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
