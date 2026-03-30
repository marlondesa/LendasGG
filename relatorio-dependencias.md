# Prompt — Construção do Projeto LoL Stats + Campeonato

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

## Passo 1 — Estrutura de pastas

Crie exatamente esta estrutura. Máximo 2 níveis dentro de `src/`. Cada pasta tem um `index.js`.

```
base/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── index.js              # entry point
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

Crie os arquivos na ordem abaixo. Cada arquivo deve ter apenas a responsabilidade descrita.

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
- Verifica e decodifica o token
- Injeta `req.user` com os dados do usuário
- Retorna 401 se token inválido ou ausente

### `src/middlewares/roles.js`
- Recebe um array de roles permitidas: `roles(['ADMIN', 'ORGANIZER'])`
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
- Schema joi para criar campeonato: name, maxPlayers, prizePool, entryFee, startDate, endDate
- Schema joi para atualizar: mesmos campos, todos opcionais

### `src/validators/payment.js`
- Schema joi para criar intenção de pagamento: championshipId (uuid)

### `src/validators/index.js`
- Exporta todos os validators

### `src/services/riotApi.js`
- Wrapper do axios para a Riot API
- Base URL configurada por região (americas, europe, asia)
- Header `X-Riot-Token` com `RIOT_API_KEY` do `.env`
- Cache com `node-cache` — TTL 300s para perfil, 60s para partidas
- Funções: `getAccountByRiotId`, `getSummonerByPuuid`, `getLeagueByPuuid`, `getMatchIds`, `getMatch`, `getTopMastery`, `getLiveGame`

### `src/services/email.js`
- Configura nodemailer com variáveis do `.env`
- Funções: `sendVerificationEmail`, `sendPasswordReset`, `sendChampionshipConfirmation`

### `src/services/payment.js`
- Configura Stripe e MercadoPago com chaves do `.env`
- Funções: `createPaymentIntent`, `validateWebhookSignature`
- Nunca recebe `amount` do frontend — sempre busca do banco

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
- `getPlayer`: busca conta Riot → busca summoner → busca rank → busca top maestria → retorna tudo junto
- `getMatches`: busca lista de match IDs → busca detalhes de cada um
- `getLiveGame`: busca partida ao vivo pelo puuid

### `src/controllers/championship.js`
- `list`: lista campeonatos com paginação
- `getById`: retorna detalhes + inscrições confirmadas
- `create`: só ADMIN/ORGANIZER — cria campeonato
- `update`: só dono ou ADMIN — atualiza
- `remove`: só ADMIN — remove
- `register`: cria Registration com status PENDING → cria PaymentIntent → retorna dados do pagamento

### `src/controllers/payment.js`
- `createIntent`: busca campeonato no banco → pega o preço do banco (nunca do frontend) → cria intent
- `webhook`: valida assinatura → verifica se `externalId` já existe → atualiza Payment e Registration → loga transação
- `history`: retorna pagamentos do usuário autenticado

### `src/controllers/admin.js`
- `listUsers`: lista usuários com paginação
- `listChampionships`: lista todos os campeonatos
- `listPayments`: lista todos os pagamentos com filtros

### `src/controllers/index.js`
- Exporta todos os controllers

### `src/routes/auth.js`
- `POST /register` → validate(authValidator.register) → authController.register
- `POST /login` → validate(authValidator.login) → authController.login
- `POST /logout` → auth → authController.logout
- `POST /verify-email` → authController.verifyEmail
- `POST /forgot-password` → authController.forgotPassword
- `POST /reset-password` → authController.resetPassword

### `src/routes/player.js`
- Rate limit específico: 10 req/min por usuário (protege a RIOT_API_KEY)
- `GET /:gameName/:tagLine` → playerController.getPlayer
- `GET /:puuid/matches` → playerController.getMatches
- `GET /:puuid/live` → playerController.getLiveGame

### `src/routes/championship.js`
- `GET /` → championshipController.list
- `GET /:id` → championshipController.getById
- `POST /` → auth → roles(['ADMIN','ORGANIZER']) → validate → championshipController.create
- `PUT /:id` → auth → roles(['ADMIN','ORGANIZER']) → validate → championshipController.update
- `DELETE /:id` → auth → roles(['ADMIN']) → championshipController.remove
- `POST /:id/register` → auth → championshipController.register

### `src/routes/payment.js`
- `POST /create-intent` → auth → validate → paymentController.createIntent
- `POST /webhook` → paymentController.webhook (sem auth — validado pela assinatura)
- `GET /history` → auth → paymentController.history

### `src/routes/admin.js`
- Todas as rotas: auth → roles(['ADMIN'])
- `GET /users` → adminController.listUsers
- `GET /championships` → adminController.listChampionships
- `GET /payments` → adminController.listPayments

### `src/routes/index.js`
- Importa todas as rotas
- Registra com prefixo `/api/`

### `src/index.js`
Middlewares na ordem exata:
```
1. helmet
2. compression
3. cors (só FRONTEND_URL)
4. morgan
5. express.json()
6. express.urlencoded()
7. cookie-parser
8. hpp
9. xss-clean
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

### Páginas — cada uma só exibe dados, nunca valida

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

## Passo 8 — Riot API — Rate Limits

| Tipo de chave | Limite |
|---|---|
| Desenvolvimento | 20 req/s — 100 req/2min |
| Produção | 500 req/10s — 30.000 req/10min |

- Cache TTL: 300s para perfil, 60s para partidas
- Rate limit na rota `/api/player`: 10 req/min por IP

---

## Passo 9 — Checklist de segurança antes de subir

### Crítico
- [ ] Ownership verificado em toda rota que acessa recurso por ID
- [ ] Preço sempre buscado do banco, nunca do frontend
- [ ] Webhook valida assinatura antes de processar
- [ ] Login retorna sempre `"credenciais inválidas"` — nunca especifica o que errou
- [ ] `role` nunca aceita do frontend

### Alto
- [ ] `joi` em todos os inputs sem exceção
- [ ] Rate limit por IP e por usuário
- [ ] Stack trace nunca exposto em produção
- [ ] JWT em cookie HTTP-only com `Secure` e `SameSite=strict`

### Médio
- [ ] CSRF em todas as mutações
- [ ] Paginação em todas as listagens
- [ ] Logs sem dados sensíveis (`req.body` nunca logado inteiro)
- [ ] Cache da Riot API configurado

---

## Mapa de Vulnerabilidades — Referência

### Autenticação
| Ataque | Proteção |
|---|---|
| Brute force | `express-rate-limit` + `express-slow-down` por IP e por email |
| Credential stuffing | `bcrypt` rounds >= 12 |
| Account enumeration | Sempre retornar `"credenciais inválidas"` |
| JWT fraco | Secret longo, algoritmo `HS256`, expiração curta |
| Session fixation | Regenerar sessão após login |

### Injeção
| Ataque | Proteção |
|---|---|
| SQL Injection | Prisma parametrizado — nunca `$queryRaw` com input do usuário |
| XSS Stored | `xss-clean` + `helmet` CSP |
| XSS Reflected | Sanitizar parâmetros de rota |
| Path Traversal | Nunca usar input do usuário em caminhos de arquivo |

### Autorização
| Ataque | Proteção |
|---|---|
| IDOR | Verificar `userId` do token contra dono do recurso |
| Privilege escalation | `role` nunca aceita do frontend |
| Mass assignment | `joi` define exatamente os campos aceitos |
| BOLA | Verificar ownership em toda rota de escrita |

### Pagamento
| Ataque | Proteção |
|---|---|
| Price tampering | Preço sempre buscado do banco pelo ID |
| Double registration | `@@unique([userId, championshipId])` no schema |
| Webhook replay | Validar assinatura + checar `externalId` já existente |
| Inscrição sem pagamento | Status `PENDING` até webhook confirmar |
| Refund fraud | Log imutável de todas as transações |

### Infraestrutura
| Ataque | Proteção |
|---|---|
| CSRF | `csrf-csrf` em todas as mutações |
| Clickjacking | `helmet` com `X-Frame-Options: DENY` |
| SSRF | Nunca usar input do usuário para montar URLs externas |
| DDoS | Rate limit por IP + Cloudflare em produção |
| Stack trace exposto | `errorHandler` retorna só `"erro interno"` em produção |

### Dados sensíveis
| Ataque | Proteção |
|---|---|
| Senha em log | Nunca logar `req.body` inteiro |
| Dados em URL | Dados sensíveis sempre no `body` via POST |
| Resposta excessiva | Definir exatamente quais campos retornar |
| Sem paginação | Paginação obrigatória em todas as listagens |

---

## Lógica de Premiação — `src/services/premiacao.ts`

Criar o arquivo `src/services/premiacao.ts` com TypeScript. Seguir exatamente as regras abaixo.

### Regras de negócio

- Times têm exatamente 5 jogadores
- Plataforma retém **10%** do total arrecadado como lucro
- Os **90%** restantes formam o prize pool
- Distribuição do prize pool:
  - 1º lugar: **60%**
  - 2º lugar: **30%**
  - 3º lugar: **10%**
- O valor de cada posição é dividido igualmente entre os 5 jogadores do time

### Tipos esperados

```typescript
interface PosicaoPremiacao {
  total: number
  porJogador: number
}

interface Premiacao {
  primeiroLugar: PosicaoPremiacao
  segundoLugar:  PosicaoPremiacao
  terceiroLugar: PosicaoPremiacao
}

export interface ResultadoPremiacao {
  totalArrecadado: number
  lucroPlataforma: number
  premioTotal:     number
  premiacao:       Premiacao
}
```

### Saída esperada da função

```json
{
  "totalArrecadado": 1000,
  "lucroPlataforma": 100,
  "premioTotal": 900,
  "premiacao": {
    "primeiroLugar": { "total": 540, "porJogador": 108 },
    "segundoLugar":  { "total": 270, "porJogador": 54  },
    "terceiroLugar": { "total": 90,  "porJogador": 18  }
  }
}
```

### Requisitos técnicos obrigatórios

- Usar **TypeScript** com tipagem completa
- Trabalhar internamente em **centavos** (inteiros) para evitar erros de ponto flutuante
- Usar `Math.round` para lucro e totais de cada posição
- Usar `Math.floor` para divisão por jogador (evita pagar mais do que tem)
- Exportar a função `calcularPremiacao(totalArrecadado: number): ResultadoPremiacao`
- Validar que `totalArrecadado` é número positivo — lançar `Error` se inválido

### Constantes do arquivo (não hardcode nos cálculos)

```typescript
const TAXA_PLATAFORMA    = 0.10
const JOGADORES_POR_TIME = 5

const DISTRIBUICAO = {
  primeiro: 0.60,
  segundo:  0.30,
  terceiro: 0.10,
} as const
```

### Estrutura interna da função

```
1. validar(totalArrecadado)
2. converter para centavos
3. calcular lucro da plataforma em centavos
4. calcular premioTotal em centavos = total - lucro
5. para cada posição: calcular total e porJogador em centavos
6. converter tudo de volta para currency
7. retornar ResultadoPremiacao
```

### Função auxiliar de posição

Criar função privada `calcularPosicao(premioTotalCentavos, percentual)` que retorna `PosicaoPremiacao` — mantém o código limpo e sem repetição.
