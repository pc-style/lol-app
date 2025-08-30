# Twisted Documentation

**Repository:** https://github.com/sansossio/twisted
**Author:** sansossio
**NPM Package:** https://www.npmjs.com/package/twisted
**License:** MIT

## Overview

Twisted is a modern League of Legends API wrapper for Node.js that provides a comprehensive interface to the Riot Games API. It supports automatic rate limiting, retry mechanisms, and includes support for League of Legends, Teamfight Tactics, and Riot Account APIs.

## Features

- **Automatic Rate Limit Handling**: Built-in 429 response handling with configurable retry attempts
- **Multiple Game Support**: League of Legends, Teamfight Tactics, and Riot Account APIs
- **Modern JavaScript**: Full ES6+ support with async/await
- **Configurable Concurrency**: Control concurrent API calls per method
- **Debug Logging**: Comprehensive logging for development and debugging
- **TypeScript Support**: Full TypeScript definitions included

## Installation

```bash
npm install twisted
```

## Quick Start Examples

### Getting Account by Riot ID

```javascript
import { RiotApi, Constants } from 'twisted'

const api = new RiotApi()

export async function getAccount () {
  // Recommended to use the nearest routing value to your server: americas, asia, europe
  return (await api.Account.getByRiotId("Hide on bush", "KR1", Constants.RegionGroups.AMERICAS)).response
}
```

### Getting Summoner Information

```javascript
import { LolApi, Constants } from 'twisted'

const api = new LolApi()

export async function getSummoner () {
  const user = await getAccount()
  return await api.Summoner.getByPUUID(user.puuid, Constants.Regions.KOREA)
}
```

### TFT Match History

```javascript
import { TftApi, Constants } from 'twisted'

const api = new TftApi()

export async function matchListTft () {
  const user = await getAccount()
  return api.Match.list(user.puuid, Constants.RegionGroups.KOREA)
}
```

## Advanced Configuration

```javascript
import { LolApi } from 'twisted'

const api = new LolApi({
  /**
   * If api response is 429 (rate limits) try reattempt after needed time (default true)
   */
  rateLimitRetry: true,
  /**
   * Number of time to retry after rate limit response (default 1)
   */
  rateLimitRetryAttempts: 1,
  /**
   * Concurrency calls to riot (default infinity)
   * Concurrency per method (example: summoner api, match api, etc)
   */
  concurrency: undefined,
  /**
   * Riot games api key
   */
  key: process.env.RIOT_API_KEY,
  /**
   * BaseURL for a rate limiting proxy (default: "https://$(region).api.riotgames.com/:game")
   * Using this field is for a very advanced use case and in most cases not necessary
   * ${region} and :game are expected but not required variables
   */
  baseURL: "http://localhost:8080/${region}/:game",
  /**
   * Debug methods
   */
  debug: {
    /**
     * Log methods execution time (default false)
     */
    logTime: false,
    /**
     * Log urls (default false)
     */
    logUrls: false,
    /**
     * Log when is waiting for rate limits (default false)
     */
    logRatelimit: false
  }
})
```

## API Endpoints

### Riot Account API (RiotApi)
- **Account.getByRiotId(gameName, tagLine, region)** - Get account by Riot ID
- **Account.getByPUUID(puuid, region)** - Get account by PUUID
- **Account.getActiveShard(puuid, game, region)** - Get active shard for player

### League of Legends API (LolApi)

#### Champion Mastery
- **ChampionMastery.getAll(summonerId, region)** - Get all champion mastery entries
- **ChampionMastery.get(summonerId, championId, region)** - Get specific champion mastery
- **ChampionMastery.getTotalScore(summonerId, region)** - Get total mastery score

#### Champions
- **Champion.getAll(region)** - Get all champions
- **Champion.get(championId, region)** - Get champion by ID

#### Clash
- **Clash.getPlayersBySummonerId(summonerId, region)** - Get clash players by summoner
- **Clash.getTeam(teamId, region)** - Get clash team
- **Clash.getTournaments(region)** - Get tournaments
- **Clash.getTournamentsByTeam(teamId, region)** - Get tournaments by team
- **Clash.getTournament(tournamentId, region)** - Get tournament by ID

#### Match
- **Match.get(matchId, region)** - Get match by ID
- **Match.list(puuid, region, options)** - Get match list by PUUID
- **Match.getTimeline(matchId, region)** - Get match timeline

#### League
- **League.getChallengerLeague(queue, region)** - Get challenger league
- **League.getEntriesByPUUID(puuid, region)** - Get league entries by PUUID
- **League.getEntriesBySummonerId(summonerId, region)** - Get league entries by summoner ID
- **League.getEntries(queue, tier, division, region, options)** - Get all league entries
- **League.getGrandmasterLeague(queue, region)** - Get grandmaster league
- **League.get(leagueId, region)** - Get league by ID
- **League.getMasterLeague(queue, region)** - Get master league

#### Summoner
- **Summoner.getByAccountId(accountId, region)** - Get summoner by account ID
- **Summoner.getByName(summonerName, region)** - Get summoner by name (deprecated)
- **Summoner.getByPUUID(puuid, region)** - Get summoner by PUUID
- **Summoner.get(summonerId, region)** - Get summoner by summoner ID

#### Spectator
- **Spectator.getCurrentGame(summonerId, region)** - Get current game
- **Spectator.getFeaturedGames(region)** - Get featured games

#### Status
- **Status.get(region)** - Get League of Legends status

### Teamfight Tactics API (TftApi)
- **Match.get(matchId, region)** - Get TFT match by ID
- **Match.list(puuid, region, options)** - Get TFT match list
- **League.getChallengerLeague(region)** - Get TFT challenger league
- **League.getGrandmasterLeague(region)** - Get TFT grandmaster league
- **League.getMasterLeague(region)** - Get TFT master league
- **League.getEntriesBySummonerId(summonerId, region)** - Get TFT league entries
- **League.getEntries(tier, division, region, options)** - Get all TFT league entries
- **Summoner.getByAccountId(accountId, region)** - Get TFT summoner by account ID
- **Summoner.getByName(summonerName, region)** - Get TFT summoner by name
- **Summoner.getByPUUID(puuid, region)** - Get TFT summoner by PUUID
- **Summoner.get(summonerId, region)** - Get TFT summoner by ID

## Constants

The library provides constants for regions and region groups:

```javascript
import { Constants } from 'twisted'

// Region Groups (for Account API)
Constants.RegionGroups.AMERICAS
Constants.RegionGroups.ASIA
Constants.RegionGroups.EUROPE

// Regions (for game-specific APIs)
Constants.Regions.NORTH_AMERICA
Constants.Regions.EUROPE_WEST
Constants.Regions.EUROPE_NORDIC_EAST
Constants.Regions.KOREA
Constants.Regions.BRAZIL
// ... and more
```

## Running Examples

### Run all examples:
```bash
RIOT_API_KEY={YOUR_KEY} yarn example
```

### Run specific example:
```bash
RIOT_API_KEY={YOUR_KEY} yarn example {exampleFunctionName}
```

### Using Docker:
```bash
docker-compose up
```

## Error Handling

Twisted automatically handles rate limiting (429 responses) and will retry requests based on the configuration. You can customize this behavior:

```javascript
const api = new LolApi({
  rateLimitRetry: true,
  rateLimitRetryAttempts: 3,
  debug: {
    logRatelimit: true // Log when waiting for rate limits
  }
})
```

## Best Practices

1. **Use Environment Variables**: Store your API key in environment variables
2. **Choose Appropriate Regions**: Use the nearest region group for better performance
3. **Handle Errors**: Always wrap API calls in try-catch blocks
4. **Rate Limiting**: Let the library handle rate limiting automatically
5. **Caching**: Implement caching for frequently accessed data

## Links

- **GitHub Repository:** https://github.com/sansossio/twisted
- **NPM Package:** https://www.npmjs.com/package/twisted
- **Riot Developer Portal:** https://developer.riotgames.com/
- **League of Legends:** https://www.leagueoflegends.com/