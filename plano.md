# Plano — Site de Stats Riot Games (LoL + TFT + Valorant)

## O que vamos construir

Site estilo op.gg: busca jogador pelo Riot ID e exibe tudo que a Riot API oferece com chave de desenvolvedor. Cobre League of Legends, TFT e Valorant.

---

## Páginas — League of Legends

### 1. Home
- SearchBar central com seletor de jogo (LoL / TFT / Valorant)
- gameName + tagLine
- Redireciona para o perfil do jogo selecionado

### 2. Perfil LoL (`/lol/:gameName/:tagLine`)
- Ícone + nome + nível do invocador
- Rank solo/duo e flex (emblema + LP + W/L + winrate)
- Top 5 campeões por maestria (ícone + nível + pontos + score total)
- Últimas 20 partidas (campeão, KDA, resultado, duração, modo de jogo)
- Badge "AO VIVO" se estiver em partida

### 3. Partida LoL (`/lol/partida/:matchId`)
- Times completos (10 jogadores)
- Stats de cada jogador (KDA, dano total, dano a campeões, ouro, CS, visão, itens)
- Gráfico de timeline (kills e torres por minuto)

### 4. Ao Vivo LoL (`/lol/:gameName/:tagLine/aovivo`)
- Composição dos dois times com ícones de campeão
- Rank de cada jogador na partida
- Tempo de partida em andamento

### 5. Ranking LoL (`/lol/ranking`)
- Tabs: Challenger / Grandmaster / Master
- Tabs de fila: Solo/Duo | Flex
- Lista com posição, nome, LP, W/L, winrate

### 6. Clash (`/lol/clash/:gameName/:tagLine`)
- Time do jogador no Clash
- Torneios ativos e futuros

### 7. Servidor LoL + Rotação (`/lol/servidor`)
- Status atual do servidor BR
- Campeões gratuitos da semana (ícone + nome)

---

## Páginas — TFT

### 8. Perfil TFT (`/tft/:gameName/:tagLine`)
- Ícone + nome do invocador
- Rank TFT (emblema + LP + W/L + winrate)
- Últimas 20 partidas TFT (augments, placement, duração, traits ativos)
- Partida ao vivo TFT se estiver jogando

### 9. Partida TFT (`/tft/partida/:matchId`)
- Todos os participantes com placement final
- Units de cada jogador (campeão + estrelas + itens)
- Traits ativos por jogador
- Augments escolhidos

### 10. Ranking TFT (`/tft/ranking`)
- Tabs: Challenger / Grandmaster / Master
- Rated Ladders (Hyper Roll)
- Lista com posição, nome, LP, W/L, winrate

### 11. Servidor TFT (`/tft/servidor`)
- Status do servidor TFT

---

## Páginas — Valorant

### 12. Perfil Valorant (`/valorant/:gameName/:tagLine`)
- Nome + tagLine do jogador
- Últimas 20 partidas (agente, KDA, resultado, mapa, modo)
- Partidas recentes por fila

### 13. Partida Valorant (`/valorant/partida/:matchId`)
- Times completos (10 jogadores)
- Stats por jogador (KDA, dano por round, HS%, economy)
- Placar por rounds
- Agentes + skins usadas

### 14. Ranking Valorant (`/valorant/ranking`)
- Leaderboard por ato
- Posição, nome, ranking rating

### 15. Servidor Valorant (`/valorant/servidor`)
- Status do servidor Valorant
- Conteúdo disponível (agentes, mapas, modos ativos)

---

## Backend — Rotas

```
# LoL
GET /api/lol/player/:gameName/:tagLine          → perfil + rank + maestria
GET /api/lol/player/:gameName/:tagLine/live     → partida ao vivo
GET /api/lol/matches/:puuid                     → lista de partidas
GET /api/lol/matches/:matchId/detail            → detalhes de uma partida
GET /api/lol/ranking/:queue/:tier/:division     → ranking por fila
GET /api/lol/ranking/apex/:queue                → challenger/grandmaster/master
GET /api/lol/server/status                      → status do servidor
GET /api/lol/server/rotations                   → campeões gratuitos
GET /api/lol/clash/:puuid                       → dados de Clash

# TFT
GET /api/tft/player/:gameName/:tagLine          → perfil + rank TFT
GET /api/tft/player/:gameName/:tagLine/live     → partida ao vivo TFT
GET /api/tft/matches/:puuid                     → lista de partidas TFT
GET /api/tft/matches/:matchId/detail            → detalhes de partida TFT
GET /api/tft/ranking/:tier/:division            → ranking TFT
GET /api/tft/ranking/apex/:queue                → challenger/grandmaster/master TFT
GET /api/tft/server/status                      → status servidor TFT

# Valorant
GET /api/valorant/player/:gameName/:tagLine     → histórico de partidas
GET /api/valorant/matches/:matchId/detail       → detalhes de partida Valorant
GET /api/valorant/ranking/:actId                → leaderboard por ato
GET /api/valorant/server/status                 → status servidor Valorant
GET /api/valorant/content                       → conteúdo (agentes, mapas)
```

---

## Frontend — Componentes

### Compartilhados
- `SearchBar` — input com seletor de jogo
- `ServerStatus` — badge verde/vermelho
- `GameTabs` — tabs LoL / TFT / Valorant

### LoL
- `PlayerCard` — ícone + nome + nível
- `RankCard` — emblema + fila + LP + winrate
- `MasteryCard` — campeão + nível + pontos
- `MatchCard` — linha de partida no histórico
- `MatchDetail` — tabela completa dos 10 jogadores
- `LiveGame` — composição ao vivo
- `RankingTable` — tabela do ranking
- `ChampionRotation` — grade de campeões gratuitos
- `ClashCard` — time + torneio

### TFT
- `TFTRankCard` — rank TFT
- `TFTMatchCard` — placement + traits + duração
- `TFTMatchDetail` — todos participantes com units e augments
- `TFTLiveGame` — partida ao vivo TFT
- `TFTRankingTable` — ranking TFT

### Valorant
- `ValorantMatchCard` — agente + KDA + resultado + mapa
- `ValorantMatchDetail` — tabela completa com economy e HS%
- `ValorantRankingTable` — leaderboard por ato
- `ValorantContent` — agentes e mapas disponíveis

---

## Ordem de construção

1. Backend: riotApi.ts — todas as funções (LoL + TFT + Valorant)
2. Backend: rotas e controllers separados por jogo
3. Frontend: SearchBar + seletor de jogo (Home)
4. Frontend: Perfil LoL (core do site)
5. Frontend: Detalhes de Partida LoL
6. Frontend: Ao Vivo LoL
7. Frontend: Ranking LoL + Rotação + Servidor
8. Frontend: Clash
9. Frontend: Perfil TFT + Partidas TFT
10. Frontend: Ranking TFT
11. Frontend: Perfil Valorant + Partidas Valorant
12. Frontend: Ranking Valorant + Servidor + Conteúdo
