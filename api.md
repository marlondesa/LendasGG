# Riot Games API — Referência de Endpoints

> Roteamento regional: **AMERICAS** (NA, BR, LAN, LAS) | **ASIA** (KR, JP) | **EUROPE** (EUNE, EUW, ME1, TR, RU) | **SEA** (OCE, SG2, TW2, VN2)
> Para conta-v1: américas, ásia e europa. Consulte qualquer conta em qualquer região.

---

## League of Legends

### conta-v1
```
GET /riot/account/v1/accounts/by-puuid/{puuid}
GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}
GET /riot/account/v1/active-shards/by-game/{game}/by-puuid/{puuid}
GET /riot/account/v1/region/by-game/{game}/by-puuid/{puuid}
GET /riot/account/v1/accounts/me
```

### invocador-v4
```
GET /lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}
GET /lol/summoner/v4/summoners/me
```

### campeão-maestria-v4
```
GET /lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}
GET /lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}/by-champion/{championId}
GET /lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}/top
GET /lol/champion-mastery/v4/scores/by-puuid/{encryptedPUUID}
```

### campeão-v3
```
GET /lol/platform/v3/champion-rotations
```

### partida-v5
```
GET /lol/match/v5/matches/by-puuid/{puuid}/ids
GET /lol/match/v5/matches/by-puuid/{puuid}/replays
GET /lol/match/v5/matches/{matchId}
GET /lol/match/v5/matches/{matchId}/timeline
```

### liga-v4
```
GET /lol/league/v4/entries/by-puuid/{encryptedPUUID}
GET /lol/league/v4/entries/{queue}/{tier}/{division}
GET /lol/league/v4/challengerleagues/by-queue/{queue}
GET /lol/league/v4/grandmasterleagues/by-queue/{queue}
GET /lol/league/v4/masterleagues/by-queue/{queue}
GET /lol/league/v4/leagues/{leagueId}
```

### liga-exp-v4
```
GET /lol/league-exp/v4/entries/{queue}/{tier}/{division}
```

### lol-desafios-v1
```
GET /lol/challenges/v1/challenges/config
GET /lol/challenges/v1/challenges/percentiles
GET /lol/challenges/v1/challenges/{challengeId}/config
GET /lol/challenges/v1/challenges/{challengeId}/leaderboards/by-level/{level}
GET /lol/challenges/v1/challenges/{challengeId}/percentiles
GET /lol/challenges/v1/player-data/{puuid}
```

### lol-status-v4
```
GET /lol/status/v4/platform-data
```

### clash-v1
```
GET /lol/clash/v1/players/by-puuid/{puuid}
GET /lol/clash/v1/teams/{teamId}
GET /lol/clash/v1/tournaments
GET /lol/clash/v1/tournaments/by-team/{teamId}
GET /lol/clash/v1/tournaments/{tournamentId}
```

### espectador-v5
```
GET /lol/spectator/v5/active-games/by-summoner/{encryptedPUUID}
```

### lol-rso-match-v1
```
GET /lol/rso-match/v1/matches/ids
GET /lol/rso-match/v1/matches/{matchId}
GET /lol/rso-match/v1/matches/{matchId}/timeline
```

### torneio-v5
```
POST /lol/tournament/v5/codes
GET  /lol/tournament/v5/codes/{tournamentCode}
PUT  /lol/tournament/v5/codes/{tournamentCode}
GET  /lol/tournament/v5/games/by-code/{tournamentCode}
GET  /lol/tournament/v5/lobby-events/by-code/{tournamentCode}
POST /lol/tournament/v5/providers
POST /lol/tournament/v5/tournaments
```

### torneio-stub-v5 (ambiente de teste)
```
POST /lol/tournament-stub/v5/codes
GET  /lol/tournament-stub/v5/codes/{tournamentCode}
GET  /lol/tournament-stub/v5/lobby-events/by-code/{tournamentCode}
POST /lol/tournament-stub/v5/providers
POST /lol/tournament-stub/v5/tournaments
```

### riftbound-conteúdo-v1
```
GET /riftbound/content/v1/content
```

---

## Teamfight Tactics (TFT)

### tft-match-v1
```
GET /tft/match/v1/matches/by-puuid/{puuid}/ids
GET /tft/match/v1/matches/{matchId}
```

### tft-liga-v1
```
GET /tft/league/v1/by-puuid/{puuid}
GET /tft/league/v1/challenger
GET /tft/league/v1/grandmaster
GET /tft/league/v1/master
GET /tft/league/v1/entries/{tier}/{division}
GET /tft/league/v1/rated-ladders/{queue}/top
GET /tft/league/v1/leagues/{leagueId}
```

### tft-status-v1
```
GET /tft/status/v1/platform-data
```

### invocador-tft-v1
```
GET /tft/summoner/v1/summoners/by-puuid/{encryptedPUUID}
GET /tft/summoner/v1/summoners/me
```

### espetador-tft-v5
```
GET /lol/spectator/tft/v5/active-games/by-puuid/{encryptedPUUID}
```

---

## Legends of Runeterra (LoR)

### lor-deck-v1
```
GET  /lor/deck/v1/decks/me
POST /lor/deck/v1/decks/me
```

### lor-inventário-v1
```
GET /lor/inventory/v1/cards/me
```

### lor-match-v1
```
GET /lor/match/v1/matches/by-puuid/{puuid}/ids
GET /lor/match/v1/matches/{matchId}
```

### lor-classificado-v1
```
GET /lor/ranked/v1/leaderboards
```

### lor-status-v1
```
GET /lor/status/v1/platform-data
```

---

## VALORANT

### val-match-v1
```
GET /val/match/v1/matches/{matchId}
GET /val/match/v1/matchlists/by-puuid/{puuid}
GET /val/match/v1/recent-matches/by-queue/{queue}
```

### val-console-match-v1
```
GET /val/match/console/v1/matches/{matchId}
GET /val/match/console/v1/matchlists/by-puuid/{puuid}
GET /val/match/console/v1/recent-matches/by-queue/{queue}
```

### val-classificado-v1
```
GET /val/ranked/v1/leaderboards/by-act/{actId}
```

### val-console-classificado-v1
```
GET /val/console/ranked/v1/leaderboards/by-act/{actId}
```

### val-content-v1
```
GET /val/content/v1/contents
```

### val-status-v1
```
GET /val/status/v1/platform-data
```
