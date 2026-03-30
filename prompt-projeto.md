# Prompt Completo — LoL Stats + Campeonato

Você é um assistente de desenvolvimento. Siga este documento passo a passo, na ordem exata. Não pule etapas. Não crie arquivos fora da estrutura definida. Não valide nada no frontend.

---

## Visão geral do projeto

App web de estatísticas do League of Legends com sistema de campeonatos pagos.

- Usuário busca jogador pelo Riot ID e vê stats, rank, maestria e histórico
- Usuário pode se cadastrar, fazer login e se inscrever em campeonatos
- Campeonatos têm taxa de inscrição e prize pool em dinheiro real
- Admin gerencia usuários, campeonatos e pagamentos

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + Vite |
| Backend | Node.js + Express |
| Banco | PostgreSQL + Prisma |
| Pagamentos | MercadoPago (PIX/boleto/cartão) + Stripe (internacional) |
| Cache | node-cache |
| Logs | Winston (produção) + Morgan (desenvolvimento) |
| Autenticação | JWT em cookie HTTP-only |

---

## Regras absolutas — nunca quebre estas regras

- NUNCA validar input no frontend — toda validação é feita no backend com `joi`
- NUNCA expor `RIOT_API_KEY`, `JWT_SECRET` ou chaves de pagamento no frontend
- NUNCA processar pagamento no frontend — frontend só recebe confirmação
- NUNCA salvar senha em texto puro — sempre `bcrypt` com salt rounds >= 12
- NUNCA aceitar o campo `role` vindo do frontend — role só muda via banco
- NUNCA usar `$queryRaw` do Prisma com input do usuário
- NUNCA retornar stack trace em produção — middleware de erro retorna só `"erro interno"`
- NUNCA logar `req.body` inteiro — pode conter senhas
- NUNCA confiar no `amount` vindo do frontend — buscar preço do banco pelo ID
- Token JWT **sempre em cookie HTTP-only** — nunca em localStorage
- `.env` sempre no `.gitignore`
- HTTPS obrigatório em produção

---

## Riot Games API — Referência completa de endpoints

> Roteamento regional: **AMERICAS** (NA, BR, LAN, LAS) | **ASIA** (KR, JP) | **EUROPE** (EUNE, EUW, ME1, TR, RU) | **SEA** (OCE, SG2, TW2, VN2)
> Para conta-v1: américas, ásia e europa. Consulte qualquer conta em qualquer região.

### League of Legends

#### conta-v1
```
GET /riot/account/v1/accounts/by-puuid/{puuid}
GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}
GET /riot/account/v1/active-shards/by-game/{game}/by-puuid/{puuid}
GET /riot/account/v1/region/by-game/{game}/by-puuid/{puuid}
GET /riot/account/v1/accounts/me
```

#### invocador-v4
```
GET /lol/summoner/v4/summoners/by-puuid/{encryptedPUUID}
GET /lol/summoner/v4/summoners/me
```

#### campeão-maestria-v4
```
GET /lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}
GET /lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}/by-champion/{championId}
GET /lol/champion-mastery/v4/champion-masteries/by-puuid/{encryptedPUUID}/top
GET /lol/champion-mastery/v4/scores/by-puuid/{encryptedPUUID}
```

#### campeão-v3
```
GET /lol/platform/v3/champion-rotations
```

#### partida-v5
```
GET /lol/match/v5/matches/by-puuid/{puuid}/ids
GET /lol/match/v5/matches/by-puuid/{puuid}/replays
GET /lol/match/v5/matches/{matchId}
GET /lol/match/v5/matches/{matchId}/timeline
```

#### liga-v4
```
GET /lol/league/v4/entries/by-puuid/{encryptedPUUID}
GET /lol/league/v4/entries/{queue}/{tier}/{division}
GET /lol/league/v4/challengerleagues/by-queue/{queue}
GET /lol/league/v4/grandmasterleagues/by-queue/{queue}
GET /lol/league/v4/masterleagues/by-queue/{queue}
GET /lol/league/v4/leagues/{leagueId}
```

#### liga-exp-v4
```
GET /lol/league-exp/v4/entries/{queue}/{tier}/{division}
```

#### lol-desafios-v1
```
GET /lol/challenges/v1/challenges/config
GET /lol/challenges/v1/challenges/percentiles
GET /lol/challenges/v1/challenges/{challengeId}/config
GET /lol/challenges/v1/challenges/{challengeId}/leaderboards/by-level/{level}
GET /lol/challenges/v1/challenges/{challengeId}/percentiles
GET /lol/challenges/v1/player-data/{puuid}
```

#### lol-status-v4
```
GET /lol/status/v4/platform-data
```

#### clash-v1
```
GET /lol/clash/v1/players/by-puuid/{puuid}
GET /lol/clash/v1/teams/{teamId}
GET /lol/clash/v1/tournaments
GET /lol/clash/v1/tournaments/by-team/{teamId}
GET /lol/clash/v1/tournaments/{tournamentId}
```

#### espectador-v5
```
GET /lol/spectator/v5/active-games/by-summoner/{encryptedPUUID}
```

#### lol-rso-match-v1
```
GET /lol/rso-match/v1/matches/ids
GET /lol/rso-match/v1/matches/{matchId}
GET /lol/rso-match/v1/matches/{matchId}/timeline
```

#### torneio-v5
```
POST /lol/tournament/v5/codes
GET  /lol/tournament/v5/codes/{tournamentCode}
PUT  /lol/tournament/v5/codes/{tournamentCode}
GET  /lol/tournament/v5/games/by-code/{tournamentCode}
GET  /lol/tournament/v5/lobby-events/by-code/{tournamentCode}
POST /lol/tournament/v5/providers
POST /lol/tournament/v5/tournaments
```

#### torneio-stub-v5 (ambiente de teste)
```
POST /lol/tournament-stub/v5/codes
GET  /lol/tournament-stub/v5/codes/{tournamentCode}
GET  /lol/tournament-stub/v5/lobby-events/by-code/{tournamentCode}
POST /lol/tournament-stub/v5/providers
POST /lol/tournament-stub/v5/tournaments
```

#### riftbound-conteúdo-v1
```
GET /riftbound/content/v1/content
```

---

### Teamfight Tactics (TFT)

#### tft-match-v1
```
GET /tft/match/v1/matches/by-puuid/{puuid}/ids
GET /tft/match/v1/matches/{matchId}
```

#### tft-liga-v1
```
GET /tft/league/v1/by-puuid/{puuid}
GET /tft/league/v1/challenger
GET /tft/league/v1/grandmaster
GET /tft/league/v1/master
GET /tft/league/v1/entries/{tier}/{division}
GET /tft/league/v1/rated-ladders/{queue}/top
GET /tft/league/v1/leagues/{leagueId}
```

#### tft-status-v1
```
GET /tft/status/v1/platform-data
```

#### invocador-tft-v1
```
GET /tft/summoner/v1/summoners/by-puuid/{encryptedPUUID}
GET /tft/summoner/v1/summoners/me
```

#### espetador-tft-v5
```
GET /lol/spectator/tft/v5/active-games/by-puuid/{encryptedPUUID}
```

---

### Legends of Runeterra (LoR)

#### lor-deck-v1
```
GET  /lor/deck/v1/decks/me
POST /lor/deck/v1/decks/me
```

#### lor-inventário-v1
```
GET /lor/inventory/v1/cards/me
```

#### lor-match-v1
```
GET /lor/match/v1/matches/by-puuid/{puuid}/ids
GET /lor/match/v1/matches/{matchId}
```

#### lor-classificado-v1
```
GET /lor/ranked/v1/leaderboards
```

#### lor-status-v1
```
GET /lor/status/v1/platform-data
```

---

### VALORANT

#### val-match-v1
```
GET /val/match/v1/matches/{matchId}
GET /val/match/v1/matchlists/by-puuid/{puuid}
GET /val/match/v1/recent-matches/by-queue/{queue}
```

#### val-console-match-v1
```
GET /val/match/console/v1/matches/{matchId}
GET /val/match/console/v1/matchlists/by-puuid/{puuid}
GET /val/match/console/v1/recent-matches/by-queue/{queue}
```

#### val-classificado-v1
```
GET /val/ranked/v1/leaderboards/by-act/{actId}
```

#### val-console-classificado-v1
```
GET /val/console/ranked/v1/leaderboards/by-act/{actId}
```

#### val-content-v1
```
GET /val/content/v1/contents
```

#### val-status-v1
```
GET /val/status/v1/platform-data
```

---

### Rate Limits da Riot API

| Tipo de chave | Limite |
|---|---|
| Desenvolvimento | 20 req/s — 100 req/2min |
| Produção | 500 req/10s — 30.000 req/10min |

- Cache TTL: 300s para perfil, 60s para partidas
- Rate limit na rota `/api/player`: 10 req/min por IP
- Cache com `node-cache` obrigatório — protege a chave de API

---

## Passo 1 — Estrutura de pastas

Crie exatamente esta estrutura. Máximo 2 níveis dentro de `src/`. Cada pasta tem um `index.js`.

```
base/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── index.js
│   │   ├── config/
│   │   │   ├── index.js
│   │   │   ├── database.js
│   │   │   └── logger.js
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   ├── auth.js
│   │   │   ├── player.js
│   │   │   ├── championship.js
│   │   │   ├── payment.js
│   │   │   └── admin.js
│   │   ├── controllers/
│   │   │   ├── index.js
│   │   │   ├── auth.js
│   │   │   ├── player.js
│   │   │   ├── championship.js
│   │   │   ├── payment.js
│   │   │   └── admin.js
│   │   ├── middlewares/
│   │   │   ├── index.js
│   │   │   ├── auth.js
│   │   │   ├── roles.js
│   │   │   ├── validate.js
│   │   │   └── errorHandler.js
│   │   ├── validators/
│   │   │   ├── index.js
│   │   │   ├── auth.js
│   │   │   ├── championship.js
│   │   │   └── payment.js
│   │   └── services/
│   │       ├── index.js
│   │       ├── riotApi.js
│   │       ├── email.js
│   │       └── payment.js
│   ├── .env
│   ├── .gitignore
│   └── package.json
│
└── frontend/
    └── client/
        ├── src/
        │   ├── main.jsx
        │   ├── App.jsx
        │   ├── pages/
        │   │   ├── index.jsx
        │   │   ├── Home.jsx
        │   │   ├── Profile.jsx
        │   │   ├── Championships.jsx
        │   │   ├── ChampionshipDetail.jsx
        │   │   ├── Login.jsx
        │   │   ├── Register.jsx
        │   │   ├── Dashboard.jsx
        │   │   └── Admin.jsx
        │   ├── components/
        │   │   ├── index.jsx
        │   │   ├── Navbar.jsx
        │   │   ├── SearchBar.jsx
        │   │   ├── PlayerCard.jsx
        │   │   ├── MatchCard.jsx
        │   │   ├── ChampionMastery.jsx
        │   │   └── ChampionshipCard.jsx
        │   ├── services/
        │   │   ├── index.js
        │   │   ├── api.js
        │   │   ├── player.js
        │   │   ├── championship.js
        │   │   └── auth.js
        │   └── hooks/
        │       ├── index.js
        │       ├── usePlayer.js
        │       └── useChampionship.js
        └── package.json
```

---

## Passo 2 — Instalar dependências do frontend

```bash
cd base/frontend/client
npm install axios react-router-dom @tanstack/react-query
```

| Pacote | Função |
|---|---|
| `axios` | Chamadas HTTP ao backend |
| `react-router-dom` | Navegação entre páginas |
| `@tanstack/react-query` | Cache + loading/error states automáticos |

---

## Passo 3 — Instalar dependências do backend

```bash
cd base/backend
npm install express axios dotenv cors helmet morgan compression \
  express-rate-limit express-slow-down \
  hpp xss-clean joi \
  bcrypt jsonwebtoken cookie-parser \
  nodemailer \
  prisma @prisma/client pg \
  stripe mercadopago \
  csrf-csrf express-session connect-pg-simple \
  winston \
  node-cache uuid

npm install -D nodemon
```

Adicionar no `package.json`:
```json
"scripts": {
  "dev": "nodemon src/index.js",
  "start": "node src/index.js"
}
```

---

## Passo 4 — Criar `.gitignore` e `.env`

**`.gitignore`:**
```
node_modules/
.env
logs/
```

**`.env`:**
```env
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://user:password@localhost:5432/lol_db

RIOT_API_KEY=RGAPI-xxxx-xxxx

JWT_SECRET=seu_secret_aqui
JWT_EXPIRES_IN=7d

SESSION_SECRET=seu_secret_aqui
CSRF_SECRET=seu_secret_aqui

STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx

MP_ACCESS_TOKEN=APP_USR-xxxx

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=seuemail@gmail.com
MAIL_PASS=sua_senha_app
```

---

## Passo 5 — Schema do banco (Prisma)

Criar `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String
  username      String    @unique
  riotPuuid     String?   @unique
  riotGameName  String?
  riotTagLine   String?
  emailVerified Boolean   @default(false)
  role          Role      @default(PLAYER)
  createdAt     DateTime  @default(now())

  registrations Registration[]
  payments      Payment[]
  sessions      Session[]
}

enum Role {
  PLAYER
  ORGANIZER
  ADMIN
}

model Championship {
  id          String      @id @default(uuid())
  name        String
  description String?
  game        String      @default("lol")
  maxPlayers  Int
  prizePool   Decimal     @db.Decimal(10, 2)
  entryFee    Decimal     @db.Decimal(10, 2)
  status      ChampStatus @default(OPEN)
  startDate   DateTime
  endDate     DateTime
  createdAt   DateTime    @default(now())

  registrations Registration[]
  matches       Match[]
}

enum ChampStatus {
  OPEN
  CLOSED
  ONGOING
  FINISHED
}

model Registration {
  id             String    @id @default(uuid())
  userId         String
  championshipId String
  status         RegStatus @default(PENDING)
  registeredAt   DateTime  @default(now())

  user         User         @relation(fields: [userId], references: [id])
  championship Championship @relation(fields: [championshipId], references: [id])
  payment      Payment?

  @@unique([userId, championshipId])
}

enum RegStatus {
  PENDING
  CONFIRMED
  CANCELLED
  DISQUALIFIED
}

model Payment {
  id             String    @id @default(uuid())
  userId         String
  registrationId String    @unique
  amount         Decimal   @db.Decimal(10, 2)
  currency       String    @default("BRL")
  provider       String
  externalId     String?   @unique
  status         PayStatus @default(PENDING)
  paidAt         DateTime?
  createdAt      DateTime  @default(now())

  user         User         @relation(fields: [userId], references: [id])
  registration Registration @relation(fields: [registrationId], references: [id])
}

enum PayStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

model Match {
  id             String    @id @default(uuid())
  championshipId String
  round          Int
  player1Id      String
  player2Id      String
  winnerId       String?
  riotMatchId    String?
  scheduledAt    DateTime?
  playedAt       DateTime?

  championship Championship @relation(fields: [championshipId], references: [id])
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}
```

Após criar o schema:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Passo 6 — Criar arquivos do backend

Crie os arquivos na ordem abaixo. Cada arquivo tem apenas uma responsabilidade.

### `src/config/logger.js`
- Configura Winston com níveis `info`, `warn`, `error`
- Em desenvolvimento: log no console
- Em produção: log em arquivo `logs/app.log`

### `src/config/database.js`
- Instancia e exporta o `PrismaClient`
- Conecta ao banco ao iniciar

### `src/config/index.js`
- Exporta `logger` e `database` centralizados

### `src/middlewares/errorHandler.js`
- Recebe `(err, req, res, next)`
- Em produção: retorna apenas `{ error: 'Erro interno' }` com status 500
- Em desenvolvimento: retorna a mensagem real
- Sempre loga o erro com `winston`

### `src/middlewares/auth.js`
- Lê o JWT do cookie HTTP-only
- Verifica e decodifica o token com `jsonwebtoken`
- Injeta `req.user` com os dados do usuário
- Retorna 401 se token inválido ou ausente

### `src/middlewares/roles.js`
- Recebe array de roles permitidas: `roles(['ADMIN', 'ORGANIZER'])`
- Verifica se `req.user.role` está na lista
- Retorna 403 se não autorizado

### `src/middlewares/validate.js`
- Recebe um schema `joi`
- Valida `req.body` contra o schema
- Retorna 400 com os erros se inválido
- Passa para o controller apenas se válido

### `src/middlewares/index.js`
- Exporta: `errorHandler`, `authMiddleware`, `roles`, `validate`

### `src/validators/auth.js`
- Schema joi para `register`: email, password (min 8), username
- Schema joi para `login`: email, password
- Schema joi para `resetPassword`: password, confirmPassword

### `src/validators/championship.js`
- Schema joi para criar: name, maxPlayers, prizePool, entryFee, startDate, endDate
- Schema joi para atualizar: mesmos campos, todos opcionais

### `src/validators/payment.js`
- Schema joi para criar intenção: championshipId (uuid)

### `src/validators/index.js`
- Exporta todos os validators

### `src/services/riotApi.js`
- Wrapper do axios para a Riot API
- Base URL por região: americas, europe, asia, sea
- Header `X-Riot-Token` com `RIOT_API_KEY` do `.env`
- Cache com `node-cache` — TTL 300s perfil, 60s partidas
- Funções:
  - `getAccountByRiotId(gameName, tagLine, region)`
  - `getSummonerByPuuid(puuid, region)`
  - `getLeagueByPuuid(puuid, region)`
  - `getMatchIds(puuid, region)`
  - `getMatch(matchId, region)`
  - `getTopMastery(puuid, region)`
  - `getLiveGame(puuid, region)`

### `src/services/email.js`
- Configura nodemailer com variáveis do `.env`
- Funções: `sendVerificationEmail`, `sendPasswordReset`, `sendChampionshipConfirmation`

### `src/services/payment.js`
- Configura Stripe e MercadoPago com chaves do `.env`
- Funções: `createPaymentIntent(championshipId)`, `validateWebhookSignature(req)`
- Nunca recebe `amount` do frontend — busca sempre do banco pelo `championshipId`

### `src/services/index.js`
- Exporta `riotApi`, `emailService`, `paymentService`

### `src/controllers/auth.js`
- `register`: valida → hash senha bcrypt → cria user → envia email de verificação
- `login`: busca user → compara hash → gera JWT → seta cookie HTTP-only → retorna user sem senha
- `logout`: limpa cookie
- `verifyEmail`: valida token → atualiza `emailVerified`
- `forgotPassword`: gera token → envia email
- `resetPassword`: valida token → hash nova senha → atualiza

### `src/controllers/player.js`
- `getPlayer`: busca conta Riot → summoner → rank → top maestria → retorna tudo junto
- `getMatches`: busca IDs → busca detalhes de cada partida
- `getLiveGame`: busca partida ao vivo pelo puuid

### `src/controllers/championship.js`
- `list`: lista campeonatos com paginação
- `getById`: retorna detalhes + contagem de inscritos confirmados
- `create`: só ADMIN/ORGANIZER — cria campeonato
- `update`: só dono ou ADMIN — atualiza
- `remove`: só ADMIN — remove
- `register`: cria Registration com PENDING → cria PaymentIntent → retorna dados do pagamento

### `src/controllers/payment.js`
- `createIntent`: busca campeonato no banco → pega o preço do banco → cria intent
- `webhook`: valida assinatura → verifica se `externalId` já existe → atualiza Payment e Registration → loga transação
- `history`: retorna pagamentos do usuário autenticado com paginação

### `src/controllers/admin.js`
- `listUsers`: lista usuários com paginação
- `listChampionships`: lista todos os campeonatos
- `listPayments`: lista todos os pagamentos com filtros

### `src/controllers/index.js`
- Exporta todos os controllers

### `src/routes/auth.js`
```
POST /register        → validate(authValidator.register) → authController.register
POST /login           → validate(authValidator.login)    → authController.login
POST /logout          → auth                             → authController.logout
POST /verify-email    → authController.verifyEmail
POST /forgot-password → authController.forgotPassword
POST /reset-password  → authController.resetPassword
```

### `src/routes/player.js`
- Rate limit específico: 10 req/min por IP
```
GET /:gameName/:tagLine → playerController.getPlayer
GET /:puuid/matches     → playerController.getMatches
GET /:puuid/live        → playerController.getLiveGame
```

### `src/routes/championship.js`
```
GET    /          → championshipController.list
GET    /:id       → championshipController.getById
POST   /          → auth → roles(['ADMIN','ORGANIZER']) → validate → championshipController.create
PUT    /:id       → auth → roles(['ADMIN','ORGANIZER']) → validate → championshipController.update
DELETE /:id       → auth → roles(['ADMIN'])             → championshipController.remove
POST   /:id/register → auth → championshipController.register
```

### `src/routes/payment.js`
```
POST /create-intent → auth → validate → paymentController.createIntent
POST /webhook       → paymentController.webhook
GET  /history       → auth → paymentController.history
```

### `src/routes/admin.js`
- Todas as rotas: auth → roles(['ADMIN'])
```
GET /users         → adminController.listUsers
GET /championships → adminController.listChampionships
GET /payments      → adminController.listPayments
```

### `src/routes/index.js`
- Importa todas as rotas
- Registra com prefixo `/api/`

### `src/index.js`
Middlewares na ordem exata — não altere a ordem:
```
1.  helmet
2.  compression
3.  cors (só FRONTEND_URL)
4.  morgan
5.  express.json()
6.  express.urlencoded()
7.  cookie-parser
8.  hpp
9.  xss-clean
10. express-session
11. rate-limit geral
12. slow-down
13. routes(app)
14. errorHandler  ← sempre o último
```

---

## Passo 7 — Criar arquivos do frontend

### `src/services/api.js`
- Instância axios com `baseURL` apontando para o backend
- `withCredentials: true` — obrigatório para enviar cookies
- Interceptor de resposta: se 401, redireciona para `/login`

### `src/services/auth.js`
- `login(email, password)` → POST `/api/auth/login`
- `register(data)` → POST `/api/auth/register`
- `logout()` → POST `/api/auth/logout`

### `src/services/player.js`
- `getPlayer(gameName, tagLine)` → GET `/api/player/:gameName/:tagLine`
- `getMatches(puuid)` → GET `/api/player/:puuid/matches`

### `src/services/championship.js`
- `list()` → GET `/api/championships`
- `getById(id)` → GET `/api/championships/:id`
- `register(id)` → POST `/api/championships/:id/register`

### `src/services/index.js`
- Exporta todos os services

### `src/hooks/usePlayer.js`
- `usePlayer(gameName, tagLine)` → useQuery com `playerService.getPlayer`

### `src/hooks/useChampionship.js`
- `useChampionships()` → useQuery com `championshipService.list`
- `useChampionship(id)` → useQuery com `championshipService.getById`

### `src/hooks/index.js`
- Exporta todos os hooks

### Páginas — exibem dados, nunca validam

| Página | O que renderiza |
|---|---|
| `Home.jsx` | SearchBar centralizada |
| `Profile.jsx` | PlayerCard + ChampionMastery + MatchHistory |
| `Championships.jsx` | Lista de ChampionshipCard com paginação |
| `ChampionshipDetail.jsx` | Detalhes + botão de inscrição |
| `Login.jsx` | Formulário → chama `authService.login` |
| `Register.jsx` | Formulário → chama `authService.register` |
| `Dashboard.jsx` | Dados do usuário logado + campeonatos inscritos |
| `Admin.jsx` | Tabelas de usuários, campeonatos, pagamentos |

### `src/pages/index.jsx`
- Exporta todas as pages

### `src/components/index.jsx`
- Exporta todos os components

### `src/App.jsx`
- Configura `QueryClientProvider` do react-query
- Define todas as rotas com `react-router-dom`
- Rotas protegidas redirecionam para `/login` se não autenticado

---

## Passo 8 — Checklist de segurança antes de subir

### Crítico
- [ ] Ownership verificado em toda rota que acessa recurso por ID
- [ ] Preço sempre buscado do banco, nunca do frontend
- [ ] Webhook valida assinatura antes de processar
- [ ] Login retorna `"credenciais inválidas"` — nunca especifica o que errou
- [ ] `role` nunca aceita do frontend

### Alto
- [ ] `joi` em todos os inputs sem exceção
- [ ] Rate limit por IP e por usuário
- [ ] Stack trace nunca exposto em produção
- [ ] JWT em cookie HTTP-only com `Secure` e `SameSite=strict`

### Médio
- [ ] CSRF em todas as mutações
- [ ] Paginação em todas as listagens
- [ ] Logs sem dados sensíveis
- [ ] Cache da Riot API configurado

---

## Mapa de Vulnerabilidades — Referência

### Autenticação
| Ataque | Como acontece | Proteção |
|---|---|---|
| Brute force | Tentativas em massa no `/login` | `express-rate-limit` + `express-slow-down` por IP e email |
| Credential stuffing | Usa senhas vazadas de outros sites | `bcrypt` rounds >= 12 |
| Account enumeration | Mensagem diferente para email vs senha errada | Sempre retornar `"credenciais inválidas"` |
| JWT fraco | Secret previsível, algoritmo `none` | Secret longo, algoritmo `HS256`, expiração curta |
| Session fixation | Reutilizar sessão antes e depois do login | Regenerar sessão após login |

### Injeção
| Ataque | Como acontece | Proteção |
|---|---|---|
| SQL Injection | `' OR 1=1--` em campos de texto | Prisma parametrizado — nunca `$queryRaw` com input do usuário |
| XSS Stored | `<script>` salvo no banco e exibido para outros | `xss-clean` + `helmet` CSP |
| XSS Reflected | Script injetado via URL | Sanitizar parâmetros de rota |
| Path Traversal | `../../etc/passwd` em parâmetros | Nunca usar input do usuário em caminhos de arquivo |

### Autorização
| Ataque | Como acontece | Proteção |
|---|---|---|
| IDOR | Trocar ID na URL e acessar dado de outro usuário | Verificar `userId` do token contra dono do recurso |
| Privilege escalation | Enviar `role: "ADMIN"` no body | `role` nunca aceita do frontend |
| Mass assignment | Body com campos extras não permitidos | `joi` define exatamente os campos aceitos |
| BOLA | Editar campeonato de outro organizador | Verificar ownership em toda rota de escrita |

### Pagamento
| Ataque | Como acontece | Proteção |
|---|---|---|
| Price tampering | Frontend manda `amount: 0.01` | Preço sempre buscado do banco pelo ID |
| Double registration | Inscrever duas vezes no mesmo campeonato | `@@unique([userId, championshipId])` |
| Webhook replay | Reenviar webhook já processado | Validar assinatura + checar `externalId` existente |
| Inscrição sem pagamento | Chamar `/register` sem pagar | Status `PENDING` até webhook confirmar |
| Refund fraud | Pedir reembolso após ganhar | Log imutável de todas as transações |

### Infraestrutura
| Ataque | Como acontece | Proteção |
|---|---|---|
| CSRF | Site malicioso faz req autenticada em nome do usuário | `csrf-csrf` em todas as mutações |
| Clickjacking | Iframe sobre botão de pagamento | `helmet` com `X-Frame-Options: DENY` |
| SSRF | Input manipulado chama URLs internas | Nunca usar input do usuário para montar URLs externas |
| DDoS | Flood de requisições | Rate limit por IP + Cloudflare em produção |
| Stack trace exposto | Erro não tratado vaza estrutura interna | `errorHandler` retorna só `"erro interno"` em produção |

### Dados sensíveis
| Ataque | Como acontece | Proteção |
|---|---|---|
| Senha em log | `console.log(req.body)` loga senha | Nunca logar `req.body` inteiro |
| Dados em URL | `?password=123` fica no log | Dados sensíveis sempre no `body` via POST |
| Resposta excessiva | API retorna `password` e `sessionToken` | Definir exatamente quais campos retornar |
| Sem paginação | GET retorna todos os 50k registros | Paginação obrigatória em todas as listagens |
