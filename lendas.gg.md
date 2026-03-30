# Lendas.GG — Prompt Mestre de Desenvolvimento

> Guia definitivo para construir ou dar continuidade ao projeto com 99% de acerto.
> Leia do início ao fim antes de qualquer implementação.

---

## IDENTIDADE DO PROJETO

**Lendas.GG** é uma plataforma de estatísticas para jogos da Riot Games (LoL, TFT, Valorant), similar ao op.gg.
- Todo texto de UI, variáveis visíveis ao usuário, mensagens de erro e comentários → **Português Brasil**
- Todo código, nomes de variáveis, funções, classes → **Inglês**

---

## REGRAS ABSOLUTAS — NUNCA VIOLE

1. **NUNCA valide dados no frontend** — toda validação de input, formato e regra de negócio fica exclusivamente no backend via Joi. O frontend apenas envia e exibe. Zero regex de validação, zero `if (!email.includes('@'))` no cliente.
2. **NUNCA use `as any` sem criar uma interface TypeScript** para o dado.
3. **NUNCA coloque a Riot API Key no código** — sempre `process.env['RIOT_API_KEY']!`.
4. **NUNCA faça requests paralelos ao enriquecer ranking** — respeite rate limit com batches sequenciais + delay.
5. **NUNCA sobrescreva o cache com lista incompleta** — ao atualizar enrichment, o array sempre tem os 200 jogadores.
6. **NUNCA use `localStorage` para tokens** — sempre cookie httpOnly.
7. **NUNCA crie arquivo novo quando puder editar um existente.**
8. **NUNCA adicione features além do que foi pedido.**
9. **NUNCA quebre a cadeia de propagação de região:** `URL param → useParams → hook → service → ?region=`
10. **SEMPRE use `encodeURIComponent`** em gameName e tagLine nas URLs do frontend.
11. **SEMPRE use `Promise.allSettled`** (nunca `Promise.all`) em batches de enrichment — um erro não derruba o lote.
12. **NUNCA exponha stack trace, mensagem de erro interna ou dados de debug em produção.**
13. **NUNCA comite o arquivo `.env`** — deve existir apenas `.env.example` no repositório.
14. **NUNCA confunda `platform()` com `regional()`** na Riot API — são bases de URL diferentes.

---

## STACK EXATA

```
Backend
  Node.js + Express 5.2.1
  TypeScript 6.0.2  (strict: true, target: ES2020, module: CommonJS, outDir: ./dist)
  Prisma 6.0.0 + PostgreSQL
  NodeCache 5.1.2  (cache in-memory)
  Winston 3.17.0   (logger)
  Axios 1.13.6     (HTTP client para Riot API)
  jsonwebtoken 9.0.2 + bcrypt 5.1.1  (auth)
  Joi              (validação de body — ÚNICA camada de validação)
  helmet           (headers de segurança)
  cors             (origem restrita)
  compression      (gzip)
  hpp              (HTTP Parameter Pollution protection)
  express-rate-limit + express-slow-down
  morgan           (request logging)
  cookie-parser
  nodemailer       (email — instalado, não ativo)
  stripe + mercadopago (pagamentos — instalados, não ativos)

Frontend
  React 19.2.4 + Vite 8.0.1
  TypeScript 6.0.2  (strict: true, target: ES2020, module: ESNext, jsx: react-jsx, noEmit: true)
  React Router DOM 7.13.2
  TanStack React Query 5.95.2
  Axios 1.13.6
  Lucide React    (ícones — ÚNICA biblioteca de ícones)
  CSS Modules     (ZERO Tailwind, ZERO styled-components, ZERO emotion)
```

---

## ESTRUTURA DE PASTAS — EXATA

```
base/
├── backend/
│   └── src/
│       ├── index.ts
│       ├── config/
│       │   ├── database.ts
│       │   └── logger.ts
│       ├── controllers/
│       │   ├── lol.ts
│       │   ├── tft.ts
│       │   └── valorant.ts
│       ├── middlewares/
│       │   ├── auth.ts
│       │   ├── errorHandler.ts
│       │   ├── roles.ts
│       │   └── validate.ts
│       ├── routes/
│       │   ├── index.ts
│       │   ├── lol.ts
│       │   ├── tft.ts
│       │   └── valorant.ts
│       ├── services/
│       │   └── riotApi.ts        ← TODA integração com a Riot API fica aqui
│       └── validators/
│           ├── auth.ts
│           ├── championship.ts
│           └── payment.ts
└── frontend/
    └── src/
        ├── index.css             ← reset global + CSS variables
        ├── App.tsx
        ├── main.tsx
        ├── public/               ← emblemas de tier (PNG locais)
        │   Iron.png, Bronze.png, Silver.png, Gold.png, Platinum.png,
        │   Emerald.png, Diamond.png, Master.png, GrandMaster.png,
        │   Challenger.png, Provisional.png
        ├── components/
        │   ├── shared/
        │   │   ├── Navbar.tsx + .module.css
        │   │   ├── SearchBar.tsx + .module.css
        │   │   ├── RegionSelect.tsx + .module.css
        │   │   └── ServerStatus.tsx + .module.css
        │   ├── lol/
        │   │   ├── MatchCard.tsx + .module.css
        │   │   ├── RankCard.tsx + .module.css
        │   │   ├── MasteryCard.tsx + .module.css
        │   │   └── RankingTable.tsx + .module.css
        │   ├── tft/
        │   │   └── TFTMatchCard.tsx + .module.css
        │   └── valorant/
        │       └── ValorantMatchCard.tsx + .module.css
        ├── hooks/
        │   ├── useLol.ts
        │   ├── useTft.ts
        │   └── useValorant.ts
        ├── pages/
        │   ├── Home.tsx + .module.css
        │   ├── lol/
        │   │   ├── LolProfile.tsx + .module.css
        │   │   ├── LolMatch.tsx + .module.css
        │   │   ├── LolLive.tsx + .module.css
        │   │   ├── LolRanking.tsx + .module.css
        │   │   ├── LolServer.tsx + .module.css
        │   │   └── LolClash.tsx + .module.css
        │   ├── tft/
        │   │   ├── TftProfile.tsx + .module.css
        │   │   ├── TftMatch.tsx + .module.css
        │   │   ├── TftRanking.tsx + .module.css
        │   │   └── TftServer.tsx + .module.css
        │   └── valorant/
        │       ├── ValorantProfile.tsx + .module.css
        │       ├── ValorantMatch.tsx + .module.css
        │       └── ValorantServer.tsx + .module.css
        └── services/
            ├── api.ts
            ├── lol.ts
            ├── tft.ts
            └── valorant.ts
```

---

## COMO RODAR O PROJETO

```bash
# Terminal 1 — Backend
cd base/backend
npm install
npm run dev          # nodemon + ts-node, porta 3000

# Terminal 2 — Frontend
cd base/frontend
npm install
npm run dev          # Vite dev server, porta 5173
```

**Frontend chama o backend diretamente em `http://localhost:3000`.**
Não há proxy no Vite — `vite.config.js` tem apenas o plugin React.

---

## VARIÁVEIS DE AMBIENTE

**`base/backend/.env`** (NUNCA comitar):
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://user:senha@localhost:5432/lendasgg
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
JWT_SECRET=string-longa-e-aleatoria-minimo-32-chars
JWT_EXPIRES_IN=7d
SESSION_SECRET=outro-segredo-longo
CSRF_SECRET=mais-um-segredo-longo
FRONTEND_URL=http://localhost:5173

# Quando implementar pagamentos:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MP_ACCESS_TOKEN=TEST-...

# Quando implementar email:
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=email@gmail.com
MAIL_PASS=senha-de-app
```

**Frontend não tem `.env`** — a baseURL do axios é hardcoded em `services/api.ts`.

---

## SEGURANÇA — IMPLEMENTAÇÃO COMPLETA

### Camadas obrigatórias (já implementadas)

```
Requisição HTTP
  │
  ├─ helmet()           → CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
  │                        Referrer-Policy, Permissions-Policy
  │
  ├─ compression()      → gzip (não expõe info de versão)
  │
  ├─ cors({ origin: process.env['FRONTEND_URL'], credentials: true })
  │                     → bloqueia qualquer origem que não seja o frontend
  │
  ├─ morgan('dev')      → log de requests (sem logar bodies ou headers sensíveis)
  │
  ├─ express.json()     → parse body JSON
  │
  ├─ cookieParser()     → lê cookies httpOnly
  │
  ├─ hpp()              → bloqueia HTTP Parameter Pollution
  │                        (ex: ?region=br1&region=euw1 — só aceita o primeiro)
  │
  ├─ rateLimit({ windowMs: 15*60_000, max: 500 })
  │                     → máx 500 req/15min por IP (global)
  │
  ├─ slowDown({ windowMs: 15*60_000, delayAfter: 200, delayMs: () => 500 })
  │                     → throttle progressivo após 200 req
  │
  ├─ [por rota de game] rateLimit({ windowMs: 60_000, max: 10 })
  │                     → máx 10 req/min por IP por game
  │
  ├─ routes → controllers → services
  │
  └─ errorHandler       → NUNCA expõe stack/mensagem em produção
```

### errorHandler — implementação exata

```typescript
export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error(err.message, { stack: err.stack })
  if (process.env['NODE_ENV'] === 'production') {
    res.status(500).json({ error: 'Erro interno' })  // mensagem genérica em prod
    return
  }
  res.status(500).json({ error: err.message })  // detalhes só em dev
}
```

**Consequências:**
- Em produção: atacante nunca vê stack trace, caminho de arquivo, versão de lib
- Em dev: mensagem completa para debug
- Winston loga tudo internamente — nunca para o response

### JWT — implementação exata

```typescript
// auth middleware — lê do cookie (nunca Authorization header)
const token = req.cookies?.token
if (!token) return res.status(401).json({ error: 'Não autenticado' })
const payload = jwt.verify(token, process.env['JWT_SECRET']!) as JwtPayload
(req as any).user = payload
next()

// Cookie deve ser setado com:
res.cookie('token', token, {
  httpOnly: true,    // inacessível ao JavaScript — previne XSS
  secure: true,      // apenas HTTPS em produção
  sameSite: 'strict',// previne CSRF
  maxAge: 7 * 24 * 60 * 60 * 1000  // 7 dias em ms
})
```

### RBAC — roles middleware

```typescript
export function roles(allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowed.includes((req as any).user?.role))
      return res.status(403).json({ error: 'Acesso negado' })
    next()
  }
}
// Uso: router.delete('/rota', authMiddleware, roles(['admin']), handler)
```

### Validação Joi — único ponto de validação

```typescript
export function validate(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false })
    if (error) return res.status(400).json({
      errors: error.details.map(d => d.message)
    })
    next()
  }
}
```

### Proteções contra ataques específicos

| Ataque | Proteção implementada |
|--------|----------------------|
| XSS | helmet CSP + cookies httpOnly (token nunca no JS) |
| CSRF | cookie sameSite: strict + hpp() |
| SQL Injection | Prisma ORM (queries parametrizadas — nunca string concatenation) |
| NoSQL Injection | Joi valida tipos antes de qualquer uso |
| Rate limit / DDoS | express-rate-limit + slowDown em duas camadas |
| Path Traversal | Express route params (nunca `fs.readFile` com input do usuário) |
| Information Disclosure | errorHandler genérico em prod + Winston loga internamente |
| HTTP Parameter Pollution | hpp() middleware |
| Clickjacking | helmet X-Frame-Options: DENY |
| MIME sniffing | helmet X-Content-Type-Options: nosniff |
| Mass Assignment | Controllers extraem apenas campos esperados dos params |
| Enumeração de usuários | Mesmo response para "usuário não existe" e "senha errada" |

### O que NÃO fazer em controllers (evita vulnerabilidades)

```typescript
// ❌ NUNCA — mass assignment
const user = await prisma.user.create({ data: req.body })

// ✅ CORRETO — extrai apenas os campos esperados
const { email, password, username } = req.body
const user = await prisma.user.create({ data: { email, password, username } })

// ❌ NUNCA — query com string concatenation
const result = await db.query(`SELECT * FROM users WHERE id = ${req.params.id}`)

// ✅ CORRETO — Prisma parametrizado
const result = await prisma.user.findUnique({ where: { id: req.params.id } })

// ❌ NUNCA — expor erro de terceiro
catch (err) { res.status(500).json({ error: err.message, stack: err.stack }) }

// ✅ CORRETO — sempre usar next(err) para passar ao errorHandler
catch (err) { next(err) }
```

### Headers de segurança via Helmet (automáticos)

```
Content-Security-Policy
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000 (em prod)
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## BACKEND — IMPLEMENTAÇÕES EXATAS

### index.ts — ordem obrigatória do middleware stack

```typescript
import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import compression from 'compression'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import hpp from 'hpp'
import rateLimit from 'express-rate-limit'
import slowDown from 'express-slow-down'
import { registerRoutes } from './routes'
import { errorHandler } from './middlewares'
import logger from './config/logger'
import { warmupCache } from './services/riotApi'

const app = express()

app.use(helmet())
app.use(compression())
app.use(cors({ origin: process.env['FRONTEND_URL'], credentials: true }))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(hpp())
app.use(rateLimit({ windowMs: 15 * 60_000, max: 500, message: { error: 'Muitas requisições' } }))
app.use(slowDown({ windowMs: 15 * 60_000, delayAfter: 200, delayMs: () => 500 }))

registerRoutes(app)
app.use(errorHandler)

const PORT = process.env['PORT'] ?? 3000
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  warmupCache()
})
```

### routes/index.ts

```typescript
import { Express } from 'express'
import lolRoutes from './lol'
import tftRoutes from './tft'
import valorantRoutes from './valorant'

export function registerRoutes(app: Express): void {
  app.use('/api/lol', lolRoutes)
  app.use('/api/tft', tftRoutes)
  app.use('/api/valorant', valorantRoutes)
}
```

### routes/lol.ts

```typescript
const limiter = rateLimit({ windowMs: 60_000, max: 10, message: { error: 'Muitas requisições' } })
router.use(limiter)

router.get('/player/:gameName/:tagLine',        lolController.getPlayer)
router.get('/player/:gameName/:tagLine/live',   lolController.getLiveGame)
router.get('/matches/:puuid',                   lolController.getMatches)
router.get('/matches/:matchId/detail',          lolController.getMatchDetail)
router.get('/ranking/apex/:queue/:tier',        lolController.getRankingApex)
router.get('/ranking/:queue/:tier/:division',   lolController.getRankingEntries)
router.get('/server',                           lolController.getServerStatus)
router.get('/clash/:gameName/:tagLine',         lolController.getClash)
// ⚠️ REMOVER EM PRODUÇÃO:
router.get('/debug/raw-challenger',             lolController.debugRawChallenger)
```

### routes/tft.ts

```typescript
router.get('/player/:gameName/:tagLine',       tftController.getPlayer)
router.get('/player/:gameName/:tagLine/live',  tftController.getLiveGame)
router.get('/matches/:puuid',                  tftController.getMatches)
router.get('/matches/:matchId/detail',         tftController.getMatchDetail)
router.get('/ranking/apex/:tier',              tftController.getRankingApex)  // ← sem :queue
router.get('/server',                          tftController.getServerStatus)
```

### routes/valorant.ts

```typescript
router.get('/player/:gameName/:tagLine',      valorantController.getPlayer)
router.get('/matches/:matchId/detail',        valorantController.getMatchDetail)
router.get('/ranking/:actId',                 valorantController.getRanking)
router.get('/server',                         valorantController.getServerStatus)
```

### controllers/lol.ts — implementação exata

```typescript
function region(req: Request): string {
  return (req.query['region'] as string) ?? 'br1'
}

// getPlayer: account primeiro, depois paralelo (depende do puuid)
export async function getPlayer(req, res, next) {
  try {
    const r = region(req)
    const { gameName, tagLine } = req.params
    const account = await riot.getAccountByRiotId(r, gameName.trim(), tagLine.trim())
    const [summoner, league, mastery] = await Promise.all([
      riot.getSummonerByPuuid(r, account.puuid),
      riot.getLeagueByPuuid(r, account.puuid),
      riot.getTopMastery(r, account.puuid),
    ])
    res.json({ account, summoner, league, mastery })
  } catch (err) { next(err) }
}

// getMatches: busca IDs, depois todos os detalhes em paralelo
export async function getMatches(req, res, next) {
  try {
    const r = region(req)
    const { puuid } = req.params
    const ids = await riot.getMatchIds(r, puuid) as string[]
    const matches = await Promise.all(ids.map(id => riot.getMatch(r, id)))
    res.json(matches)
  } catch (err) { next(err) }
}

// getMatchDetail: match + timeline em paralelo
export async function getMatchDetail(req, res, next) {
  try {
    const r = region(req)
    const { matchId } = req.params
    const [match, timeline] = await Promise.all([
      riot.getMatch(r, matchId),
      riot.getMatchTimeline(r, matchId),
    ])
    res.json({ match, timeline })
  } catch (err) { next(err) }
}

// getServerStatus: status + rotações em paralelo
export async function getServerStatus(req, res, next) {
  try {
    const r = region(req)
    const [status, rotations] = await Promise.all([
      riot.getLolStatus(r),
      riot.getChampionRotations(r),
    ])
    res.json({ status, rotations })
  } catch (err) { next(err) }
}

// getClash: account → paralelo clash+tournaments → busca times
export async function getClash(req, res, next) {
  try {
    const r = region(req)
    const { gameName, tagLine } = req.params
    const account = await riot.getAccountByRiotId(r, gameName, tagLine)
    const [players, tournaments] = await Promise.all([
      riot.getClashByPuuid(r, account.puuid),
      riot.getClashTournaments(r),
    ])
    const teams = await Promise.all(
      (players as { teamId: string }[]).map(p => riot.getClashTeam(r, p.teamId))
    )
    res.json({ players, teams, tournaments })
  } catch (err) { next(err) }
}
```

### controllers/tft.ts — diferença crítica: sem queue

```typescript
// TFT NÃO tem parâmetro de queue no ranking
export async function getRankingApex(req, res, next) {
  try {
    const r = region(req)
    const { tier } = req.params  // ← só tier, sem queue
    const data = await riot.getEnrichedTftRankingApex(r, tier)
    res.json(data)
  } catch (err) { next(err) }
}

// TFT getPlayer: sem mastery (não existe em TFT)
export async function getPlayer(req, res, next) {
  try {
    const r = region(req)
    const { gameName, tagLine } = req.params
    const account = await riot.getAccountByRiotId(r, gameName, tagLine)
    const [summoner, league] = await Promise.all([
      riot.getTftSummonerByPuuid(r, account.puuid),
      riot.getTftLeagueByPuuid(r, account.puuid),
    ])
    res.json({ account, summoner, league })
  } catch (err) { next(err) }
}

// TFT getMatchDetail: sem timeline (não existe em TFT)
export async function getMatchDetail(req, res, next) {
  try {
    const r = region(req)
    const { matchId } = req.params
    const match = await riot.getTftMatch(r, matchId)
    res.json(match)  // ← só match, sem { match, timeline }
  } catch (err) { next(err) }
}
```

### controllers/valorant.ts — só account + matchList

```typescript
// Valorant getPlayer: só account e lista de partidas
export async function getPlayer(req, res, next) {
  try {
    const r = region(req)
    const { gameName, tagLine } = req.params
    const account = await riot.getAccountByRiotId(r, gameName, tagLine)
    const matchList = await riot.getValMatchList(r, account.puuid)
    res.json({ account, matchList })
  } catch (err) { next(err) }
}

// Valorant getServerStatus: status + content (agentes) em paralelo
export async function getServerStatus(req, res, next) {
  try {
    const r = region(req)
    const [status, content] = await Promise.all([
      riot.getValStatus(r),
      riot.getValContent(r),
    ])
    res.json({ status, content })
  } catch (err) { next(err) }
}
```

### config/logger.ts

```typescript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports:
    process.env['NODE_ENV'] === 'production'
      ? [new winston.transports.File({ filename: 'logs/app.log' })]
      : [new winston.transports.Console({ format: winston.format.simple() })],
})
// Em produção: logs em arquivo JSON com timestamp
// Em dev: logs simples no console
```

---

## RIOT API — REGRAS CRÍTICAS

### Os dois tipos de cliente (NUNCA confunda)

```typescript
// PLATFORM — summoner, league, mastery, clash, espectador, status
// URL: https://{region}.api.riotgames.com  (ex: br1, euw1, kr)
function platform(region: string) {
  return axios.create({ baseURL: `https://${region}.api.riotgames.com` })
}

// REGIONAL — contas Riot ID, partidas LoL e TFT
// URL: https://{routing}.api.riotgames.com  (ex: americas, europe, asia, sea)
function regional(region: string) {
  const routing = REGION_TO_ROUTING[region] ?? 'americas'
  return axios.create({ baseURL: `https://${routing}.api.riotgames.com` })
}

const headers = () => ({ 'X-Riot-Token': process.env['RIOT_API_KEY']! })
```

### Mapeamento região → routing

```typescript
const REGION_TO_ROUTING: Record<string, string> = {
  br1: 'americas', na1: 'americas', la1: 'americas', la2: 'americas',
  euw1: 'europe',  eun1: 'europe',  tr1: 'europe',   ru: 'europe',   me1: 'europe',
  kr:   'asia',    jp1:  'asia',
  oc1:  'sea',     sg2:  'sea',     tw2: 'sea',       vn2: 'sea',
}
```

### Mapeamento Valorant (cliente separado)

```typescript
const VAL_REGION_MAP: Record<string, string> = {
  br1: 'br', na1: 'na', euw1: 'eu', eun1: 'eu', kr: 'ap', jp1: 'ap',
  oc1: 'ap', sg2: 'ap', tw2: 'ap',  vn2: 'ap',  tr1: 'eu', ru: 'eu',
  la1: 'latam', la2: 'latam', me1: 'eu',
}
function valClient(region: string) {
  const valRegion = VAL_REGION_MAP[region] ?? 'br'
  return axios.create({ baseURL: `https://${valRegion}.api.riotgames.com` })
}
```

### Todos os endpoints por categoria

```
── CONTA (regional) ──────────────────────────────────────────────────────────
GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}
    → { puuid, gameName, tagLine }

GET /riot/account/v1/accounts/by-puuid/{puuid}
    → { puuid, gameName, tagLine }

── SUMMONER LoL (platform) ───────────────────────────────────────────────────
GET /lol/summoner/v4/summoners/{summonerId}
    → { puuid, id, profileIconId, summonerLevel, revisionDate }

GET /lol/summoner/v4/summoners/by-puuid/{puuid}
    → { puuid, id, profileIconId, summonerLevel, revisionDate }

── LEAGUE LoL (platform) ─────────────────────────────────────────────────────
GET /lol/league/v4/entries/by-puuid/{puuid}
    → [{ queueType, tier, rank, leaguePoints, wins, losses, hotStreak, ... }]

GET /lol/league/v4/challengerleagues/by-queue/{queue}
GET /lol/league/v4/grandmasterleagues/by-queue/{queue}
GET /lol/league/v4/masterleagues/by-queue/{queue}
    → { tier, leagueId, queue, name, entries: [{ summonerId, leaguePoints, wins, losses }] }
    ⚠️ entries NÃO têm gameName/tagLine/profileIconId — precisam de enrichment

GET /lol/league/v4/entries/{queue}/{tier}/{division}
    → [{ summonerId, summonerName, leaguePoints, wins, losses, ... }]

── MASTERY LoL (platform) ────────────────────────────────────────────────────
GET /lol/champion-mastery/v4/champion-masteries/by-puuid/{puuid}/top
    → [{ championId, championName?, championLevel, championPoints }]

── MATCHES LoL (regional) ────────────────────────────────────────────────────
GET /lol/match/v5/matches/by-puuid/{puuid}/ids?count=10
    → ["BR1_xxxxxxxx", ...]

GET /lol/match/v5/matches/{matchId}
    → { metadata: { matchId, participants[] }, info: { gameMode, gameDuration, queueId, participants[], teams[] } }

GET /lol/match/v5/matches/{matchId}/timeline
    → { metadata, info: { frames[] } }

── LIVE GAME LoL (platform) ──────────────────────────────────────────────────
GET /lol/spectator/v5/active-games/by-summoner/{puuid}
    → { gameId, gameMode, gameLength, participants: [{ summonerId, summonerName, championName, teamId }] }
    ⚠️ NÃO usa cache — dado em tempo real

── STATUS LoL (platform) ─────────────────────────────────────────────────────
GET /lol/status/v4/platform-data
    → { name, maintenances[], incidents[] }

GET /lol/platform/v3/champion-rotations
    → { freeChampionIds[], freeChampionIdsForNewPlayers[] }

── CLASH LoL (platform) ──────────────────────────────────────────────────────
GET /lol/clash/v1/players/by-puuid/{puuid}    → [{ teamId, ... }]
GET /lol/clash/v1/teams/{teamId}              → { name, tag, tier, ... }
GET /lol/clash/v1/tournaments                 → [{ nameKey, schedule, ... }]

── TFT SUMMONER (platform) ───────────────────────────────────────────────────
GET /tft/summoner/v1/summoners/by-puuid/{puuid}
    → { puuid, id, profileIconId, summonerLevel }

── TFT LEAGUE (platform) ─────────────────────────────────────────────────────
GET /tft/league/v1/by-puuid/{puuid}           → [{ tier, rank, leaguePoints, wins, losses }]
GET /tft/league/v1/challenger                 → { tier, entries: [...] }
GET /tft/league/v1/grandmaster               → { tier, entries: [...] }
GET /tft/league/v1/master                    → { tier, entries: [...] }

── TFT MATCHES (regional) ────────────────────────────────────────────────────
GET /tft/match/v1/matches/by-puuid/{puuid}/ids?count=20  → ["BR1_xxx", ...]
GET /tft/match/v1/matches/{matchId}
    → { metadata: { match_id }, info: { game_datetime, game_length, participants[] } }
    ⚠️ TFT NÃO tem timeline

── TFT LIVE (platform) ───────────────────────────────────────────────────────
GET /lol/spectator/tft/v5/active-games/by-puuid/{puuid}

── TFT STATUS (platform) ─────────────────────────────────────────────────────
GET /tft/status/v1/platform-data

── VALORANT (valClient) ──────────────────────────────────────────────────────
GET /val/match/v1/matchlists/by-puuid/{puuid}
    → { puuid, history: [{ matchId, ... }] }

GET /val/match/v1/matches/{matchId}
GET /val/ranked/v1/leaderboards/by-act/{actId}
GET /val/status/v1/platform-data
GET /val/content/v1/contents   → { agents[], maps[], ... }
```

---

## CACHE — REGRAS EXATAS

```typescript
const PROFILE_TTL  = 300    // 5 min
const MATCH_TTL    = 60     // 1 min
const ENRICHED_TTL = 3600   // 1 hora

// Helper genérico (SEMPRE usar, nunca chamar axios direto sem cache)
async function cached<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const hit = cache.get<T>(key)
  if (hit !== undefined) return hit
  const data = await fn()
  cache.set(key, data, ttl)
  return data
}
```

**Padrão de chaves:**
```
account:{region}:{gameName}:{tagLine}
accountPuuid:{region}:{puuid}
summoner:{region}:{puuid}
summonerById:{region}:{summonerId}
league:{region}:{puuid}
mastery:{region}:{puuid}
matchIds:{region}:{puuid}:{count}
match:{region}:{matchId}
timeline:{region}:{matchId}
challenger:{region}:{queue}
grandmaster:{region}:{queue}
master:{region}:{queue}
rankingEnriched:{region}:{queue}:{tier}
tftRankingEnriched:{region}:{tier}
tftChallenger:{region}
tftGrandmaster:{region}
tftMaster:{region}
entries:{region}:{queue}:{tier}:{division}
```

**Live game NUNCA usa `cached()`** — dado em tempo real.

---

## ENRICHMENT DE RANKING — LÓGICA COMPLETA

### Por que é necessário

`challengerleagues/by-queue` retorna `entries[]` com `summonerId`, `leaguePoints`, `wins`, `losses`.
**NÃO retorna** `gameName`, `tagLine`, `profileIconId` — precisam de chamadas extras por jogador.

### enrichOne

```typescript
async function enrichOne(region: string, entry: any): Promise<any> {
  const puuid: string = entry.puuid
    ?? (await getSummonerById(region, entry.summonerId)).puuid
  const [account, summoner] = await Promise.all([
    getAccountByPuuid(region, puuid),    // → gameName, tagLine
    getSummonerByPuuid(region, puuid),   // → profileIconId
  ])
  return { ...entry, gameName: account.gameName, tagLine: account.tagLine, profileIconId: summoner.profileIconId }
}
```

### getEnrichedRankingApex — fluxo completo

```
1. Verifica cache com key rankingEnriched:{region}:{queue}:{tier}
2. Cache HIT → retorna imediatamente (caso normal após warmup)
3. Cache MISS:
   a. Busca league data (1 request)
   b. Ordena entries por LP desc
   c. Slice para top 200 (MAX_PLAYERS = 200) ← REGRA OBRIGATÓRIA
   d. Enriquece top 50 SINCRONAMENTE → resposta imediata com página 1 completa
      (batch=5, delay=150ms entre batches)
   e. Jogadores 51-200: fallback { ...entry, gameName: entry.summonerName || null, tagLine: null }
   f. Monta allWithFallback = [...top50, ...rest150]  ← sempre 200 itens
   g. Salva no cache
   h. Dispara enrichAllBackground() sem await
   i. Retorna allWithFallback
```

### enrichAllBackground — implementação correta (nunca trunca)

```typescript
async function enrichAllBackground(
  region: string,
  allEntries: any[],   // array completo de 200 (com fallbacks)
  cacheKey: string,
  raw: any
): Promise<void> {
  const working = [...allEntries]  // ← cópia dos 200 completos
  const BATCH = 5

  for (let i = 0; i < working.length; i += BATCH) {
    const batch = working.slice(i, i + BATCH)
    const results = await Promise.allSettled(
      batch.map(e => enrichOne(region, e))
    )
    for (let j = 0; j < batch.length; j++) {
      const r = results[j]
      working[i + j] = r.status === 'fulfilled'
        ? r.value
        : { ...batch[j], gameName: batch[j].summonerName || null, tagLine: null }
    }
    // ✅ SEMPRE salva os 200 — nunca slice parcial
    cache.set(cacheKey, { ...raw, entries: working }, ENRICHED_TTL)
    if (i + BATCH < working.length) await delay(3000)
  }
}
```

### warmupCache

```typescript
export function warmupCache(): void {
  setTimeout(async () => {
    try {
      await getEnrichedRankingApex('br1', 'RANKED_SOLO_5x5', 'challenger')
      console.log('[warmup] BR1 Challenger carregado')
    } catch { /* silencioso */ }
  }, 5000)
}
// Chamado em index.ts dentro do app.listen callback
```

---

## PROPAGAÇÃO DE REGIÃO — CADEIA OBRIGATÓRIA

```
SearchBar (estado local: region = 'br1')
  ↓ navigate
URL: /lol/br1/GodZin/BR1
  ↓ React Router
useParams() → { region: 'br1', gameName: 'GodZin', tagLine: 'BR1' }
  ↓ passado como 1º argumento
usePlayer('br1', 'GodZin', 'BR1')
  ↓ queryKey inclui region
['lol', 'player', 'br1', 'GodZin', 'BR1']
  ↓ queryFn
lol.getPlayer('br1', 'GodZin', 'BR1')
  ↓ axios
GET /api/lol/player/GodZin/BR1?region=br1
  ↓ Express
req.query['region'] → 'br1'
  ↓ riotApi
platform('br1') ou regional('br1')
```

**Páginas com region no estado local** (Ranking, Server — sem region na URL):
```typescript
const [region, setRegion] = useState('br1')
function handleRegion(r: string) { setRegion(r); setPage(1) }  // sempre reseta página
```

---

## FRONTEND — CONFIGURAÇÕES EXATAS

### vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
// Sem proxy — frontend chama http://localhost:3000 diretamente
```

### App.tsx — QueryClient e rotas

```typescript
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } }
})
// retry: 1 → tenta 1x (não spam à API em caso de erro)
// staleTime: 60s → não refaz request se dado tem menos de 1 min
```

**Rotas exatas:**
```typescript
<Route path="/"                                          element={<Home />} />
<Route path="/lol/:region/:gameName/:tagLine"            element={<LolProfile />} />
<Route path="/lol/:region/partida/:matchId"              element={<LolMatch />} />
<Route path="/lol/:region/:gameName/:tagLine/aovivo"     element={<LolLive />} />
<Route path="/lol/ranking"                               element={<LolRanking />} />
<Route path="/lol/servidor"                              element={<LolServer />} />
<Route path="/lol/clash/:region/:gameName/:tagLine"      element={<LolClash />} />
<Route path="/tft/:region/:gameName/:tagLine"            element={<TftProfile />} />
<Route path="/tft/:region/partida/:matchId"              element={<TftMatch />} />
<Route path="/tft/ranking"                               element={<TftRanking />} />
<Route path="/tft/servidor"                              element={<TftServer />} />
<Route path="/valorant/:region/:gameName/:tagLine"       element={<ValorantProfile />} />
<Route path="/valorant/:region/partida/:matchId"         element={<ValorantMatch />} />
<Route path="/valorant/servidor"                         element={<ValorantServer />} />
```

### index.css — reset global completo

```css
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --bg:           #0e0f1a;
  --bg-secondary: #161724;
  --bg-card:      #1e2033;
  --bg-input:     #252740;
  --border:       #2e3154;
  --text:         #cdd6f4;
  --text-muted:   #7c83a8;
  --gold:         #c89b3c;
  --gold-hover:   #e0b455;
  --blue:         #5b8dd9;
  --red:          #e05252;
  --green:        #4caf72;
  --font:         'Segoe UI', system-ui, sans-serif;
}

html, body { height: 100%; width: 100%; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font);
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
}

#root { display: flex; flex-direction: column; min-height: 100vh; width: 100%; }

h1, h2, h3 { font-weight: 700; color: var(--text); }
a { color: inherit; text-decoration: none; }
button { cursor: pointer; font-family: var(--font); }
input, select { font-family: var(--font); font-size: 14px; outline: none; }
```

---

## HOOKS — PADRÃO EXATO

```typescript
// useLol.ts — todos os hooks seguem este padrão
export const usePlayer = (region: string, gameName?: string, tagLine?: string) =>
  useQuery({
    queryKey: ['lol', 'player', region, gameName, tagLine],  // região na key
    queryFn:  () => lol.getPlayer(region, gameName!, tagLine!),
    enabled:  !!gameName && !!tagLine,  // guard obrigatório
  })

// Exceção — live game nunca retenta (jogador pode não estar em partida)
export const useLiveGame = (region: string, gameName?: string, tagLine?: string) =>
  useQuery({
    queryKey: ['lol', 'live', region, gameName, tagLine],
    queryFn:  () => lol.getLiveGame(region, gameName!, tagLine!),
    enabled:  !!gameName && !!tagLine,
    retry:    false,
  })
```

---

## SERVICES — PADRÃO EXATO

```typescript
// services/api.ts
const api = axios.create({ baseURL: 'http://localhost:3000' })
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) window.location.href = '/login'
  return Promise.reject(err)
})

// services/lol.ts
export const getPlayer = (region: string, gameName: string, tagLine: string) =>
  api.get(`/api/lol/player/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    { params: { region } }).then(r => r.data)

export const getRankingApex = (region: string, queue: string, tier: string) =>
  api.get(`/api/lol/ranking/apex/${queue}/${tier}`,
    { params: { region } }).then(r => r.data)

// services/tft.ts — sem queue no ranking
export const getRankingApex = (region: string, tier: string) =>
  api.get(`/api/tft/ranking/apex/${tier}`,
    { params: { region } }).then(r => r.data)
```

---

## NAVBAR — LINKS EXATOS

```typescript
// Lucide icons: Trophy, Server, BarChart2
<Link to="/">Lendas.GG</Link>
<Link to="/lol/ranking"><Trophy /> LoL Ranking</Link>
<Link to="/lol/servidor"><Server /> LoL Servidor</Link>
<Link to="/tft/ranking"><BarChart2 /> TFT Ranking</Link>
<Link to="/tft/servidor"><Server /> TFT Servidor</Link>
<Link to="/valorant/servidor"><Server /> Valorant Servidor</Link>
```

---

## REGIÕES — DIFERENÇA ENTRE COMPONENTES

**SearchBar: 15 regiões** (tem `me1`, não tem `ph2`):
`br1 na1 euw1 eun1 kr jp1 oc1 tr1 ru la1 la2 me1 sg2 tw2 vn2`

**RegionSelect: 16 regiões** (tem `ph2`, não tem `me1`):
`br1 na1 euw1 eune1 kr jp1 la1 la2 oc1 tr1 ru ph2 sg2 th2 tw2 vn2`

---

## IMAGENS — REGRAS EXATAS

### DDragon (CDN Riot)
```typescript
const DDR = 'https://ddragon.leagueoflegends.com/cdn/14.24.1'
// Ícone de perfil    → ${DDR}/img/profileicon/{id}.png
// Campeão por nome   → ${DDR}/img/champion/{championName}.png
// Item               → ${DDR}/img/item/{itemId}.png

// SEMPRE com fallback (onError obrigatório):
onError={e => { (e.target as HTMLImageElement).src = `${DDR}/img/profileicon/29.png` }}
onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
```

### Emblemas de tier (LOCAIS — nunca CDN)
```typescript
// Arquivos em src/public/ — resolvidos pelo Vite
const TIER_FILE: Record<string, string> = {
  IRON: 'Iron', BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold',
  PLATINUM: 'Platinum', EMERALD: 'Emerald', DIAMOND: 'Diamond',
  MASTER: 'Master', GRANDMASTER: 'GrandMaster',  // ← M maiúsculo no arquivo
  CHALLENGER: 'Challenger',
}
function tierImage(tier: string): string {
  const file = TIER_FILE[tier.toUpperCase()] ?? tier
  return new URL(`../../public/${file}.png`, import.meta.url).href
}
```

### Edge cases de nomes de campeão (podem quebrar URL)
```
"Bel'Veth"   → arquivo: "Belveth"
"Kai'Sa"     → arquivo: "Kaisa"
"Cho'Gath"   → arquivo: "Chogath"
"Kog'Maw"    → arquivo: "KogMaw"
"Dr. Mundo"  → arquivo: "DrMundo"
"MonkeyKing" → arquivo: "MonkeyKing" (Wukong na UI, arquivo diferente)
```
Defesa obrigatória: `onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}`

---

## TIER COLORS E APEX

```typescript
const TIER_COLORS: Record<string, string> = {
  IRON: '#8c8c8c', BRONZE: '#cd7f32', SILVER: '#c0c0c0',
  GOLD: '#ffd700', PLATINUM: '#4dd6c4', EMERALD: '#50c878',
  DIAMOND: '#9dd6ff', MASTER: '#c44aff', GRANDMASTER: '#ff4444',
  CHALLENGER: '#f2d44e',
}
// Tiers APEX não têm divisão (I, II, III, IV)
const APEX = new Set(['MASTER', 'GRANDMASTER', 'CHALLENGER'])
const showRank = !APEX.has(tier.toUpperCase())
// showRank=false → exibe "CHALLENGER", não "CHALLENGER I"
```

---

## MATCHCARD — CÁLCULOS INTERNOS

```typescript
// Queue IDs
const QUEUE_NAMES: Record<number, string> = {
  420: 'Ranqueada Solo/Duo', 440: 'Ranqueada Flex',
  450: 'ARAM', 400: 'Normal Draft', 430: 'Normal Cego',
  900: 'URF', 1900: 'URF', 720: 'ARAM Clash', 0: 'Custom',
}
const queueName = QUEUE_NAMES[match.info.queueId] ?? 'Partida'

// KDA ratio
const kda = p.deaths === 0
  ? 'Perfect'
  : ((p.kills + p.assists) / p.deaths).toFixed(2)

// Kill Participation
const teamKills = team.reduce((s, x) => s + x.kills, 0)
const kp = teamKills > 0 ? Math.round((p.kills + p.assists) / teamKills * 100) : 0

// CS por minuto
const cs = p.totalMinionsKilled + p.neutralMinionsKilled
const csMin = (cs / (match.info.gameDuration / 60)).toFixed(1)

// Duração
const mins = Math.floor(match.info.gameDuration / 60)
const secs = match.info.gameDuration % 60   // "32m 14s"

// Times
const blueTeam = match.info.participants.filter(p => p.teamId === 100)
const redTeam  = match.info.participants.filter(p => p.teamId === 200)

// timeAgo
function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m atrás`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h atrás`
  return `${Math.floor(h / 24)}d atrás`
}
```

---

## LOLMATCH — COLUNAS EXATAS

```
Campeão | Jogador | KDA | Dano | Ouro | CS | Visão
```
- Time Azul (teamId 100) e Time Vermelho (teamId 200)
- Título do time: verde se `info.teams[0].win`, vermelho se derrota
- Imagem de campeão: 32×32px com `onError` que esconde

---

## LOLLIVE — RENDERING EXATO

```
[Radio ícone] Partida Ao Vivo
{gameMode} — {Math.floor(gameLength / 60)}m em andamento

[Time Azul]              [Time Vermelho]
[icon 40px] summonerName   [icon 40px] summonerName
            championName               championName
```
- isError → "Jogador não está em partida no momento."
- Filtra `participants` por `teamId === 100` (azul) e `200` (vermelho)

---

## TFTPROFILE — RENDERING EXATO

```
[avatar 80px] gameName#tagLine
              TFT Nível {summonerLevel}

[TIER] [RANK] [LP]
[W]W [L]L — [WR%]%

Últimas Partidas TFT
[TFTMatchCard × N]
```
- `league?.[0]` → pega a primeira entrada de league (TFT só tem uma)
- `match.metadata.match_id` → chave do map

---

## VALORANTPROFILE — RENDERING EXATO (implementação parcial)

```
gameName#tagLine
Valorant

Histórico de Partidas
Clique em uma partida para ver os detalhes completos.

[ID: matchId]  [Ver detalhes →]
```
- Lê `matchList.history` → array de `{ matchId }`
- Sem rank, sem stats — apenas lista de partidas com link
- Link usa `<a href>` (não `<Link>`) — comportamento correto pois inclui region no path

---

## TFTMATCHCARD — PLACEMENT COLORS

```typescript
const placementColor =
  placement === 1 ? '#f59e0b' :   // ouro
  placement <= 4  ? '#22c55e' :   // verde (top 4)
                    '#ef4444'      // vermelho (bottom 4)

// Augments — remove prefixo
augment.replace('TFT_Augment_', '')

// Traits ativas (style > 0)
traits.filter(t => t.style > 0)

// Data
new Date(match.info.game_datetime).toLocaleDateString('pt-BR')
```

---

## PAGINAÇÃO DO RANKING

```typescript
// Regras fixas
const MAX_PLAYERS = 200  // backend: sempre top 200
const PAGE_SIZE   = 50   // frontend: 50 por página → 4 páginas

// Frontend (LolRanking.tsx)
const allEntries  = data?.entries ?? []
const totalPages  = Math.ceil(allEntries.length / PAGE_SIZE)
const entries     = allEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

// RankingTable recebe offset para numeração correta
<RankingTable entries={entries} offset={(page - 1) * PAGE_SIZE} />
// linha: offset + i + 1  → #1, #51, #101, #151

// Reset de página ao mudar filtro (obrigatório)
function handleTier(t)   { setTier(t);   setPage(1) }
function handleQueue(q)  { setQueue(q);  setPage(1) }
function handleRegion(r) { setRegion(r); setPage(1) }

// Paginação com reticências: mostra 1, final e ±2 da atual
.filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
```

---

## INTERFACES TYPESCRIPT — RIOT API

```typescript
interface RiotAccount {
  puuid: string
  gameName: string
  tagLine: string
}

interface Summoner {
  puuid: string
  id: string               // summonerId
  profileIconId: number
  summonerLevel: number
  revisionDate: number
}

interface LeagueEntry {
  queueType: string        // 'RANKED_SOLO_5x5' | 'RANKED_FLEX_SR'
  tier: string
  rank: string
  leaguePoints: number
  wins: number
  losses: number
  hotStreak: boolean
  veteran: boolean
  freshBlood: boolean
  inactive: boolean
}

interface ApexEntry {
  summonerId: string
  summonerName: string     // obsoleto
  leaguePoints: number
  wins: number
  losses: number
  puuid?: string           // nem sempre presente
  gameName?: string        // após enrichment
  tagLine?: string         // após enrichment
  profileIconId?: number   // após enrichment
}

interface ApexLeague {
  tier: string
  leagueId: string
  queue: string
  name: string
  entries: ApexEntry[]
}

interface ChampionMastery {
  championId: number
  championName?: string
  championLevel: number
  championPoints: number
}

interface RankEntry {
  queueType: string
  tier: string
  rank: string
  leaguePoints: number
  wins: number
  losses: number
}

interface MatchParticipant {
  puuid: string
  summonerName: string
  riotIdGameName: string
  riotIdTagline: string
  championName: string
  championId: number
  teamId: 100 | 200
  win: boolean
  kills: number
  deaths: number
  assists: number
  totalMinionsKilled: number
  neutralMinionsKilled: number
  visionScore: number
  totalDamageDealtToChampions: number
  goldEarned: number
  item0: number; item1: number; item2: number
  item3: number; item4: number; item5: number; item6: number
}
```

---

## LOLPROFILE — SUMMARY STATS

```typescript
// Calcula sobre todos os matches retornados (10 por padrão)
const stats = matchList.reduce((acc, match) => {
  const p = match?.info?.participants?.find((x: any) => x.puuid === puuid)
  if (!p) return acc
  return {
    total:   acc.total + 1,
    wins:    acc.wins + (p.win ? 1 : 0),
    kills:   acc.kills + p.kills,
    deaths:  acc.deaths + p.deaths,
    assists: acc.assists + p.assists,
  }
}, { total: 0, wins: 0, kills: 0, deaths: 0, assists: 0 })

const avgK   = stats.total > 0 ? (stats.kills   / stats.total).toFixed(1) : '0'
const avgD   = stats.total > 0 ? (stats.deaths  / stats.total).toFixed(1) : '0'
const avgA   = stats.total > 0 ? (stats.assists / stats.total).toFixed(1) : '0'
const winRate = stats.total > 0 ? Math.round(stats.wins / stats.total * 100) : 0
const losses  = stats.total - stats.wins
```

---

## SERVERSSTATUS COMPONENT

```typescript
// Online = sem manutenção E sem incidentes ativos
const isOnline = !status?.maintenances?.length && !status?.incidents?.length
// ● Online      → var(--green)
// ● Com problemas → var(--red)
```

---

## O QUE NÃO EXISTE (nunca invente)

- Sem banco de dados de usuários ainda (Prisma está configurado, sem models de usuário)
- Sem autenticação nas rotas públicas (stats são públicos, sem login)
- Sem Redis (cache é in-memory NodeCache — perde ao reiniciar)
- Sem WebSockets (live game é snapshot, não stream)
- Sem testes automatizados
- Sem Docker / CI/CD
- Sem i18n (apenas PT-BR)
- Sem dark/light mode toggle (tema escuro fixo)
- Sem proxy no Vite (frontend chama :3000 diretamente)
- TFT não tem maestria
- TFT não tem clash
- TFT não tem timeline de partida
- Valorant não tem rank no perfil (apenas histórico de partidas)
- Rota de debug `/debug/raw-challenger` não deve existir em produção

---

## CHECKLIST DE DIAGNÓSTICO RÁPIDO

| Sintoma | Verificar |
|---------|-----------|
| `region=[object Object]` | Hook recebe region como 1º arg? useParams() está sendo chamado? |
| Nomes "—" no ranking | `enrichAllBackground` salva os 200 completos no cache? Não usa `result` parcial? |
| Imagem de emblema não carrega | Arquivo em `src/public/` com capitalização correta? `GrandMaster.png` tem M maiúsculo |
| 404 ao buscar jogador | `encodeURIComponent` no service? `.trim()` em cada parte do Riot ID? |
| Página 2-4 vazia no ranking | Backend retorna 200 entries? Frontend faz `.slice()` correto? |
| TFT ranking dá 404 | Rota TFT não tem `:queue` — só `:tier` |
| Imagem de campeão quebrada | `onError` com `style.display = 'none'` adicionado? Nome especial? |
| Partida ao vivo "não encontrado" | Normal — `retry: false` no hook, jogador não está em partida |
| Rate limit 429 no enrichment | Delay de 3000ms entre batches? Batch size = 5? |

---

*Versão: 27/03/2026 — Lendas.GG prompt mestre completo*
