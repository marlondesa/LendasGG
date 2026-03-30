# Plano de Implementação — Backend Auth + Perfil + Riot Verification

> Guia completo com código exato de cada arquivo, na ordem certa de execução.
> Padrões do projeto: TypeScript, imports com `from`, exports nomeados, prisma via `../../config/database`, erros sempre via `next(err)`.

---

## REGRAS DO PROJETO (nunca quebrar)

- NUNCA validar no frontend — joi no backend
- NUNCA expor RIOT_API_KEY, JWT_SECRET, chaves Cloudinary no frontend
- NUNCA salvar senha em texto puro — bcrypt salt >= 12
- NUNCA aceitar `role` vindo do frontend
- JWT sempre em cookie HTTP-only — nunca localStorage
- NUNCA retornar stack trace — errorHandler já trata
- NUNCA logar req.body inteiro (pode ter senha)
- Imagens: NUNCA salvar em disco — sempre direto no Cloudinary via multer-storage-cloudinary

---

## PASSO 1 — Instalar pacotes

```bash
cd base/backend

npm install passport passport-google-oauth20 cloudinary multer multer-storage-cloudinary
npm install -D @types/passport @types/passport-google-oauth20 @types/multer
```

---

## PASSO 2 — Atualizar `.env`

Adicionar ao final do `.env` existente:

```env
# Google OAuth (pegar no console.cloud.google.com)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Cloudinary (pegar em cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=meu_cloud
CLOUDINARY_API_KEY=123456789
CLOUDINARY_API_SECRET=abc_secret
```

---

## PASSO 3 — Schema Prisma

**Arquivo:** `prisma/schema.prisma`
**Ação:** Criar do zero (ainda não existe)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── ENUMS ────────────────────────────────────────────────────────────────────

enum Role {
  PLAYER
  ORGANIZER
  ADMIN
}

enum AuthProvider {
  EMAIL
  GOOGLE
}

enum ChampStatus {
  OPEN
  CLOSED
  ONGOING
  FINISHED
}

enum RegStatus {
  PENDING
  CONFIRMED
  CANCELLED
  DISQUALIFIED
}

enum PayStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

// ─── USER ─────────────────────────────────────────────────────────────────────

model User {
  id            String       @id @default(uuid())
  email         String       @unique
  password      String?                          // null para usuários Google
  username      String       @unique
  googleId      String?      @unique             // ID do Google OAuth (sub)
  authProvider  AuthProvider @default(EMAIL)
  emailVerified Boolean      @default(false)
  role          Role         @default(PLAYER)
  createdAt     DateTime     @default(now())

  // perfil
  avatarUrl     String?                          // URL Cloudinary
  bannerUrl     String?                          // URL Cloudinary

  // redes sociais (só links — sem OAuth)
  twitterUrl    String?
  discordTag    String?
  twitchUrl     String?
  youtubeUrl    String?

  // riot — conta vinculada e verificada
  riotPuuid     String?      @unique
  riotGameName  String?
  riotTagLine   String?
  riotRegion    String?                          // ex: "br1"
  riotVerified  Boolean      @default(false)

  // riot — verificação pendente (campos temporários durante o fluxo)
  riotPendingPuuid    String?
  riotPendingGameName String?
  riotPendingTagLine  String?
  riotPendingRegion   String?
  riotVerifyIcon1     Int?                       // ID do ícone passo 1
  riotVerifyIcon2     Int?                       // ID do ícone passo 2
  riotVerifyStep      Int?                       // 1 ou 2
  riotVerifyExpiresAt DateTime?                  // expira em 3 min
  riotVerifyAttempts  Int      @default(0)       // tentativas nesta sessão

  registrations Registration[]
  payments      Payment[]
  sessions      Session[]
}

// ─── RIOT CLAIM BLOCK ─────────────────────────────────────────────────────────
// Protege um Riot ID de ser reivindicado por força bruta

model RiotClaimBlock {
  id           String    @id @default(uuid())
  puuid        String    @unique               // qual Riot ID está sendo protegido
  attempts     Int       @default(0)           // total de tentativas falhas
  blockedUntil DateTime?                       // null = não bloqueado ou bloqueio permanente
  blockCount   Int       @default(0)           // quantas vezes bloqueou (max 3 = permanente)
  updatedAt    DateTime  @updatedAt
}

// ─── CHAMPIONSHIP ─────────────────────────────────────────────────────────────

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
npx prisma migrate dev --name add_auth_profile_riot
npx prisma generate
```

---

## PASSO 4 — `src/config/passport.ts`

**Ação:** Criar
**Dependências:** prisma, passport, passport-google-oauth20

```typescript
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import prisma from './database'

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env['GOOGLE_CLIENT_ID']!,
      clientSecret: process.env['GOOGLE_CLIENT_SECRET']!,
      callbackURL: process.env['GOOGLE_CALLBACK_URL']!,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const googleId = profile.id
        const email = profile.emails?.[0]?.value
        const avatarUrl = profile.photos?.[0]?.value ?? null

        if (!email) return done(new Error('Email não fornecido pelo Google'), false as any)

        // 1. Já tem conta vinculada ao googleId → retorna
        let user = await prisma.user.findUnique({ where: { googleId } })
        if (user) return done(null, user)

        // 2. Tem conta com mesmo email → vincula googleId à conta existente
        user = await prisma.user.findUnique({ where: { email } })
        if (user) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId, avatarUrl: user.avatarUrl ?? avatarUrl },
          })
          return done(null, user)
        }

        // 3. Conta nova → cria com authProvider GOOGLE
        const username = `${email.split('@')[0]}_${googleId.slice(0, 6)}`
        user = await prisma.user.create({
          data: {
            email,
            googleId,
            avatarUrl,
            username,
            emailVerified: true,    // Google já verificou
            authProvider: 'GOOGLE',
            password: null,
          },
        })
        return done(null, user)
      } catch (err) {
        return done(err as Error, false as any)
      }
    }
  )
)

export default passport
```

---

## PASSO 5 — `src/config/cloudinary.ts`

**Ação:** Criar
**Dependências:** cloudinary, multer, multer-storage-cloudinary

```typescript
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import multer from 'multer'

cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME']!,
  api_key: process.env['CLOUDINARY_API_KEY']!,
  api_secret: process.env['CLOUDINARY_API_SECRET']!,
})

// Storage para avatar — pasta separada, formato webp, 400x400
export const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lendas/avatars',
    format: 'webp',
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  } as any,
})

// Storage para banner — pasta separada, formato webp, 1200x300
export const bannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'lendas/banners',
    format: 'webp',
    transformation: [{ width: 1200, height: 300, crop: 'fill' }],
  } as any,
})

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são permitidas'))
    }
    cb(null, true)
  },
})

export const uploadBanner = multer({
  storage: bannerStorage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Apenas imagens são permitidas'))
    }
    cb(null, true)
  },
})

export default cloudinary
```

---

## PASSO 6 — `src/config/index.ts`

**Ação:** Modificar — adicionar exports de passport e cloudinary

```typescript
export { default as logger } from './logger'
export { default as prisma } from './database'
export { default as passport } from './passport'
export { default as cloudinary, uploadAvatar, uploadBanner } from './cloudinary'
```

---

## PASSO 7 — `src/middlewares/upload.ts`

**Ação:** Criar
**O que faz:** Expõe os middlewares multer prontos para usar nas rotas

```typescript
import { uploadAvatar, uploadBanner } from '../config/cloudinary'

// uso nas rotas:
// router.post('/avatar', authMiddleware, avatarUpload, userController.updateAvatar)
export const avatarUpload = uploadAvatar.single('avatar')
export const bannerUpload = uploadBanner.single('banner')
```

---

## PASSO 8 — `src/middlewares/index.ts`

**Ação:** Modificar — adicionar export de upload

```typescript
export { errorHandler } from './errorHandler'
export { authMiddleware } from './auth'
export { roles } from './roles'
export { validate } from './validate'
export { avatarUpload, bannerUpload } from './upload'
```

---

## PASSO 9 — `src/validators/user.ts`

**Ação:** Criar
**O que valida:** update de perfil, init riot, verify riot

```typescript
import Joi from 'joi'

// PUT /api/user/profile
export const updateProfile = Joi.object({
  username: Joi.string().min(3).max(30),
  twitterUrl: Joi.string().uri().allow('', null),
  discordTag: Joi.string().max(50).allow('', null),
  twitchUrl: Joi.string().uri().allow('', null),
  youtubeUrl: Joi.string().uri().allow('', null),
})

// POST /api/user/riot/init
export const riotInit = Joi.object({
  gameName: Joi.string().min(1).max(50).required(),
  tagLine: Joi.string().min(1).max(10).required(),
  region: Joi.string().valid(
    'br1','na1','la1','la2','euw1','eun1','tr1','ru','me1','kr','jp1','oc1','sg2','tw2','vn2'
  ).required(),
})

// POST /api/user/riot/verify — só recebe o step atual
export const riotVerify = Joi.object({
  step: Joi.number().valid(1, 2).required(),
})
```

---

## PASSO 10 — `src/validators/index.ts`

**Ação:** Modificar — adicionar export de userValidator

```typescript
export * as authValidator from './auth'
export * as championshipValidator from './championship'
export * as paymentValidator from './payment'
export * as userValidator from './user'
```

---

## PASSO 11 — `src/controllers/auth.ts`

**Ação:** Criar
**Funções:** register, login, logout, googleCallback, me

```typescript
import { Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../config/database'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
}

// Campos seguros para retornar — nunca retornar password, googleId
const SAFE_USER_SELECT = {
  id: true, email: true, username: true, avatarUrl: true, bannerUrl: true,
  role: true, authProvider: true, emailVerified: true,
  twitterUrl: true, discordTag: true, twitchUrl: true, youtubeUrl: true,
  riotPuuid: true, riotGameName: true, riotTagLine: true,
  riotRegion: true, riotVerified: true,
  createdAt: true,
}

function signToken(user: { id: string; role: string; email: string }) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env['JWT_SECRET']!,
    { expiresIn: process.env['JWT_EXPIRES_IN'] ?? '7d' }
  )
}

// POST /api/auth/register
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, username } = req.body

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    })
    if (exists) {
      res.status(409).json({ error: 'Email ou username já cadastrado' })
      return
    }

    const hash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { email, password: hash, username },
      select: SAFE_USER_SELECT,
    })

    const token = signToken(user as any)
    res.cookie('token', token, COOKIE_OPTS)
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    // Mensagem genérica — nunca especificar se foi email ou senha errado
    if (!user || !user.password) {
      res.status(401).json({ error: 'Credenciais inválidas' })
      return
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      res.status(401).json({ error: 'Credenciais inválidas' })
      return
    }

    const token = signToken(user)
    res.cookie('token', token, COOKIE_OPTS)

    // Retorna sem password e googleId
    const { password: _p, googleId: _g, ...safeUser } = user
    res.json(safeUser)
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/logout
export async function logout(_req: Request, res: Response) {
  res.clearCookie('token')
  res.json({ message: 'Logout realizado' })
}

// GET /api/auth/google/callback — chamado pelo passport após OAuth
export async function googleCallback(req: Request, res: Response) {
  const user = req.user as any
  const token = signToken(user)
  res.cookie('token', token, COOKIE_OPTS)
  res.redirect(`${process.env['FRONTEND_URL']}/dashboard`)
}

// GET /api/auth/me
export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: SAFE_USER_SELECT,
    })
    if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return }
    res.json({ user })
  } catch (err) {
    next(err)
  }
}
```

---

## PASSO 12 — `src/controllers/user.ts`

**Ação:** Criar
**Funções:** updateProfile, updateAvatar, updateBanner, riotInit, riotVerify, riotUnlink

```typescript
import { Request, Response, NextFunction } from 'express'
import prisma from '../config/database'
import * as riotApi from '../services/riotApi'

// ─── ÍCONES GRATUITOS (IDs 0-28, clássicos de 2009) ──────────────────────────
// Fonte: Community Dragon pt_BR v16.6.1
const FREE_ICONS: Record<number, string> = {
  0: 'Tropa Azul Combatente',   1: 'Tropa Azul e Seu Martelo',
  2: 'Tropa de Canhão Azul',    3: 'Tropa Conjuradora Azul',
  4: 'Montanha Azul',           5: 'Super Tropa Azul',
  6: 'Garra do Tibbers',        7: 'Rosa Galante',
  8: 'Golem Ancião',            9: 'Adagas',
  10: 'Espada Alada',           11: 'Lagarto Ancião',
  12: 'Mejai Totalmente Acumulada', 13: 'Tropa de Canhão Vermelha',
  14: 'Tropa de Cerco Vermelha', 15: 'Tropa Combatente Vermelha',
  16: 'Tropa Conjuradora Vermelha', 17: 'Super Tropa Vermelha',
  18: 'Mix Mix',                19: 'Targon',
  20: 'Shurima',                21: 'Árvore da Vida',
  22: 'Reviver',                23: 'Brotinho',
  24: 'Escudo de Espinhos',     25: 'Bicho Nível Um',
  26: 'Bicho Nível Dois',       27: 'Espectro',
  28: 'Tibbers',
}

// Sorteia 2 ícones distintos excluindo o ícone atual do jogador
function drawIcons(currentIconId: number): [number, number] {
  const pool = Object.keys(FREE_ICONS)
    .map(Number)
    .filter(id => id !== currentIconId)
    .sort(() => Math.random() - 0.5)
  return [pool[0], pool[1]]
}

// ─── VERIFICAÇÃO DE BLOQUEIO ──────────────────────────────────────────────────

async function checkBlock(puuid: string): Promise<{ blocked: boolean; message?: string }> {
  const block = await prisma.riotClaimBlock.findUnique({ where: { puuid } })
  if (!block) return { blocked: false }

  // Lock permanente (blockCount >= 3 e blockedUntil = null indica permanente)
  if (block.blockCount >= 3 && !block.blockedUntil) {
    return { blocked: true, message: 'Este Riot ID está bloqueado permanentemente para vinculação' }
  }

  // Bloqueio temporário ainda ativo
  if (block.blockedUntil && block.blockedUntil > new Date()) {
    const minutesLeft = Math.ceil((block.blockedUntil.getTime() - Date.now()) / 60000)
    return { blocked: true, message: `Muitas tentativas. Tente novamente em ${minutesLeft} minutos` }
  }

  return { blocked: false }
}

async function registerFailedAttempt(puuid: string, userId: string): Promise<{ attemptsLeft: number; blocked: boolean }> {
  // Incrementa tentativas no User
  const user = await prisma.user.update({
    where: { id: userId },
    data: { riotVerifyAttempts: { increment: 1 } },
    select: { riotVerifyAttempts: true },
  })

  const attemptsLeft = Math.max(0, 5 - user.riotVerifyAttempts)

  if (user.riotVerifyAttempts >= 5) {
    // Incrementa blockCount e seta bloqueio
    const block = await prisma.riotClaimBlock.upsert({
      where: { puuid },
      create: { puuid, attempts: 1, blockCount: 1, blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      update: {
        attempts: { increment: 1 },
        blockCount: { increment: 1 },
        // blockCount >= 3 → permanente (blockedUntil = null)
        blockedUntil: block => block.blockCount >= 2
          ? null
          : new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    // Reseta tentativas do usuário para a próxima sessão (se não for permanente)
    await prisma.user.update({
      where: { id: userId },
      data: {
        riotVerifyAttempts: 0,
        riotPendingPuuid: null, riotPendingGameName: null,
        riotPendingTagLine: null, riotPendingRegion: null,
        riotVerifyIcon1: null, riotVerifyIcon2: null,
        riotVerifyStep: null, riotVerifyExpiresAt: null,
      },
    })

    return { attemptsLeft: 0, blocked: true }
  }

  return { attemptsLeft, blocked: false }
}

// ─── PUT /api/user/profile ────────────────────────────────────────────────────

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, twitterUrl, discordTag, twitchUrl, youtubeUrl } = req.body

    if (username) {
      const taken = await prisma.user.findFirst({
        where: { username, NOT: { id: req.user!.id } },
      })
      if (taken) { res.status(409).json({ error: 'Username já em uso' }); return }
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { username, twitterUrl, discordTag, twitchUrl, youtubeUrl },
      select: {
        id: true, username: true, twitterUrl: true,
        discordTag: true, twitchUrl: true, youtubeUrl: true,
      },
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/user/avatar ────────────────────────────────────────────────────
// multer já fez upload para Cloudinary — req.file.path é a URL pública

export async function updateAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { res.status(400).json({ error: 'Nenhuma imagem enviada' }); return }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { avatarUrl: (req.file as any).path },
      select: { id: true, avatarUrl: true },
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/user/banner ────────────────────────────────────────────────────

export async function updateBanner(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) { res.status(400).json({ error: 'Nenhuma imagem enviada' }); return }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { bannerUrl: (req.file as any).path },
      select: { id: true, bannerUrl: true },
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/user/riot/init ─────────────────────────────────────────────────

export async function riotInit(req: Request, res: Response, next: NextFunction) {
  try {
    const { gameName, tagLine, region } = req.body

    // 1. Busca conta na Riot API → pega PUUID
    let riotAccount: any
    try {
      riotAccount = await riotApi.getAccountByRiotId(region, gameName, tagLine)
    } catch (err: any) {
      if (err?.response?.status === 404) {
        res.status(404).json({ error: 'Jogador não encontrado na Riot API' })
        return
      }
      throw err
    }

    // 2. Verifica se este PUUID já está bloqueado
    const blockStatus = await checkBlock(riotAccount.puuid)
    if (blockStatus.blocked) {
      res.status(429).json({ error: blockStatus.message })
      return
    }

    // 3. Verifica se PUUID já está vinculado a outro usuário
    const existing = await prisma.user.findUnique({
      where: { riotPuuid: riotAccount.puuid },
    })
    if (existing && existing.id !== req.user!.id) {
      res.status(409).json({ error: 'Este jogador já está vinculado a outra conta' })
      return
    }

    // 4. Busca summoner para pegar profileIconId atual
    const summoner = await riotApi.getSummonerByPuuid(region, riotAccount.puuid)
    const currentIconId: number = summoner.profileIconId

    // 5. Sorteia os 2 ícones de verificação
    const [icon1, icon2] = drawIcons(currentIconId)
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000) // 3 minutos

    // 6. Salva estado pendente no User
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        riotPendingPuuid: riotAccount.puuid,
        riotPendingGameName: riotAccount.gameName,
        riotPendingTagLine: riotAccount.tagLine,
        riotPendingRegion: region,
        riotVerifyIcon1: icon1,
        riotVerifyIcon2: icon2,
        riotVerifyStep: 1,
        riotVerifyExpiresAt: expiresAt,
        riotVerifyAttempts: 0,
      },
    })

    res.json({
      step: 1,
      iconId: icon1,
      iconName: FREE_ICONS[icon1],
      expiresAt,
      message: `Troque seu ícone de perfil para "${FREE_ICONS[icon1]}" no cliente do LoL e clique em Verificar. Você tem 3 minutos.`,
    })
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/user/riot/verify ───────────────────────────────────────────────

export async function riotVerify(req: Request, res: Response, next: NextFunction) {
  try {
    const { step } = req.body

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return }

    // 1. Verifica se há verificação pendente
    if (!user.riotPendingPuuid || !user.riotVerifyStep) {
      res.status(400).json({ error: 'Nenhuma verificação em andamento. Inicie o processo novamente.' })
      return
    }

    // 2. Verifica se o step bate com o atual
    if (user.riotVerifyStep !== step) {
      res.status(400).json({ error: `Passo inválido. Passo atual: ${user.riotVerifyStep}` })
      return
    }

    // 3. Verifica expiração
    if (!user.riotVerifyExpiresAt || user.riotVerifyExpiresAt < new Date()) {
      // Limpa tudo — precisa reiniciar
      await prisma.user.update({
        where: { id: user.id },
        data: {
          riotPendingPuuid: null, riotPendingGameName: null,
          riotPendingTagLine: null, riotPendingRegion: null,
          riotVerifyIcon1: null, riotVerifyIcon2: null,
          riotVerifyStep: null, riotVerifyExpiresAt: null,
          riotVerifyAttempts: 0,
        },
      })
      res.status(408).json({ error: 'Tempo esgotado. Inicie o processo novamente.' })
      return
    }

    // 4. Busca ícone ATUAL do summoner na Riot API (sem cache — precisa do valor real-time)
    const summoner = await riotApi.getSummonerByPuuid(user.riotPendingRegion!, user.riotPendingPuuid!)
    const currentIconId: number = summoner.profileIconId

    const expectedIcon = step === 1 ? user.riotVerifyIcon1 : user.riotVerifyIcon2

    // 5. Ícone não bate → falha
    if (currentIconId !== expectedIcon) {
      const { attemptsLeft, blocked } = await registerFailedAttempt(user.riotPendingPuuid!, user.id)

      if (blocked) {
        res.status(429).json({ error: 'Muitas tentativas. Este Riot ID foi bloqueado por 24 horas.' })
        return
      }

      res.status(400).json({
        error: `Ícone incorreto. Certifique-se de ter equipado "${FREE_ICONS[expectedIcon!]}" e salvo no cliente.`,
        attemptsLeft,
      })
      return
    }

    // 6. Ícone bate — step 1 → avança para step 2
    if (step === 1) {
      const newExpires = new Date(Date.now() + 3 * 60 * 1000)
      await prisma.user.update({
        where: { id: user.id },
        data: { riotVerifyStep: 2, riotVerifyExpiresAt: newExpires },
      })

      res.json({
        step: 2,
        iconId: user.riotVerifyIcon2,
        iconName: FREE_ICONS[user.riotVerifyIcon2!],
        expiresAt: newExpires,
        message: `Ótimo! Agora troque para "${FREE_ICONS[user.riotVerifyIcon2!]}" e clique em Verificar novamente.`,
      })
      return
    }

    // 7. Ícone bate — step 2 → VINCULA A CONTA
    await prisma.user.update({
      where: { id: user.id },
      data: {
        riotPuuid: user.riotPendingPuuid,
        riotGameName: user.riotPendingGameName,
        riotTagLine: user.riotPendingTagLine,
        riotRegion: user.riotPendingRegion,
        riotVerified: true,
        // Limpa todos os campos pendentes
        riotPendingPuuid: null, riotPendingGameName: null,
        riotPendingTagLine: null, riotPendingRegion: null,
        riotVerifyIcon1: null, riotVerifyIcon2: null,
        riotVerifyStep: null, riotVerifyExpiresAt: null,
        riotVerifyAttempts: 0,
      },
    })

    // Remove bloqueio se existia (verificação legítima bem-sucedida)
    await prisma.riotClaimBlock.deleteMany({ where: { puuid: user.riotPendingPuuid! } })

    res.json({
      message: 'Conta Riot vinculada com sucesso!',
      riotGameName: user.riotPendingGameName,
      riotTagLine: user.riotPendingTagLine,
      riotVerified: true,
    })
  } catch (err) {
    next(err)
  }
}

// ─── DELETE /api/user/riot ────────────────────────────────────────────────────

export async function riotUnlink(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        riotPuuid: null, riotGameName: null,
        riotTagLine: null, riotRegion: null,
        riotVerified: false,
      },
    })
    res.json({ message: 'Conta Riot desvinculada' })
  } catch (err) {
    next(err)
  }
}
```

---

## PASSO 13 — `src/controllers/index.ts`

**Ação:** Modificar

```typescript
export * as lolController from './lol'
export * as tftController from './tft'
export * as valorantController from './valorant'
export * as authController from './auth'
export * as userController from './user'
```

---

## PASSO 14 — `src/routes/auth.ts`

**Ação:** Criar

```typescript
import { Router } from 'express'
import passport from '../config/passport'
import { authMiddleware, validate } from '../middlewares'
import { authValidator } from '../validators'
import * as authController from '../controllers/auth'

const router = Router()

// Email/senha
router.post('/register', validate(authValidator.register), authController.register)
router.post('/login',    validate(authValidator.login),    authController.login)
router.post('/logout',   authMiddleware,                   authController.logout)
router.get('/me',        authMiddleware,                   authController.me)

// Google OAuth — inicia fluxo (redireciona para Google)
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
)

// Google OAuth — callback (Google redireciona aqui após autorização)
router.get('/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env['FRONTEND_URL']}/login?error=oauth_failed`,
  }),
  authController.googleCallback
)

export default router
```

---

## PASSO 15 — `src/routes/user.ts`

**Ação:** Criar

```typescript
import { Router } from 'express'
import { authMiddleware, validate, avatarUpload, bannerUpload } from '../middlewares'
import { userValidator } from '../validators'
import * as userController from '../controllers/user'

const router = Router()

// Todas as rotas exigem autenticação
router.use(authMiddleware)

router.put('/profile',     validate(userValidator.updateProfile), userController.updateProfile)
router.post('/avatar',     avatarUpload,                          userController.updateAvatar)
router.post('/banner',     bannerUpload,                          userController.updateBanner)
router.post('/riot/init',  validate(userValidator.riotInit),      userController.riotInit)
router.post('/riot/verify',validate(userValidator.riotVerify),    userController.riotVerify)
router.delete('/riot',                                            userController.riotUnlink)

export default router
```

---

## PASSO 16 — `src/routes/index.ts`

**Ação:** Modificar — registrar novas rotas

```typescript
import { Express } from 'express'
import lolRoutes from './lol'
import tftRoutes from './tft'
import valorantRoutes from './valorant'
import authRoutes from './auth'
import userRoutes from './user'

export function registerRoutes(app: Express): void {
  app.use('/api/lol',      lolRoutes)
  app.use('/api/tft',      tftRoutes)
  app.use('/api/valorant', valorantRoutes)
  app.use('/api/auth',     authRoutes)
  app.use('/api/user',     userRoutes)
}
```

---

## PASSO 17 — `src/index.ts`

**Ação:** Modificar — adicionar `passport.initialize()` após cookie-parser

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
import passport from './config/passport'          // NOVO

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
app.use(passport.initialize())                     // NOVO — após cookie-parser, antes das rotas
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

---

## CHECKLIST DE EXECUÇÃO

- [ ] 1. `npm install passport passport-google-oauth20 cloudinary multer multer-storage-cloudinary`
- [ ] 2. `npm install -D @types/passport @types/passport-google-oauth20 @types/multer`
- [ ] 3. Adicionar vars no `.env`
- [ ] 4. Criar `prisma/schema.prisma`
- [ ] 5. `npx prisma migrate dev --name add_auth_profile_riot`
- [ ] 6. `npx prisma generate`
- [ ] 7. Criar `src/config/passport.ts`
- [ ] 8. Criar `src/config/cloudinary.ts`
- [ ] 9. Atualizar `src/config/index.ts`
- [ ] 10. Criar `src/middlewares/upload.ts`
- [ ] 11. Atualizar `src/middlewares/index.ts`
- [ ] 12. Criar `src/validators/user.ts`
- [ ] 13. Atualizar `src/validators/index.ts`
- [ ] 14. Criar `src/controllers/auth.ts`
- [ ] 15. Criar `src/controllers/user.ts`
- [ ] 16. Atualizar `src/controllers/index.ts`
- [ ] 17. Criar `src/routes/auth.ts`
- [ ] 18. Criar `src/routes/user.ts`
- [ ] 19. Atualizar `src/routes/index.ts`
- [ ] 20. Atualizar `src/index.ts`

---

## RESPOSTAS DE CADA ENDPOINT

### POST /api/auth/register
- `201` → usuário criado + cookie JWT setado
- `409` → email ou username já existe
- `400` → joi validation error

### POST /api/auth/login
- `200` → usuário logado + cookie JWT setado
- `401` → "Credenciais inválidas" (email ou senha — nunca especificar qual)

### GET /api/auth/me
- `200` → `{ user: { ...campos seguros } }`
- `401` → token ausente ou inválido

### GET /api/auth/google
- Redireciona para tela de consentimento do Google

### GET /api/auth/google/callback
- Sucesso → redireciona para `FRONTEND_URL/dashboard` com cookie JWT
- Falha → redireciona para `FRONTEND_URL/login?error=oauth_failed`

### PUT /api/user/profile
- `200` → campos atualizados
- `409` → username já em uso

### POST /api/user/avatar | /api/user/banner
- `200` → `{ id, avatarUrl }` ou `{ id, bannerUrl }`
- `400` → nenhuma imagem enviada ou tipo inválido

### POST /api/user/riot/init
- `200` → `{ step: 1, iconId, iconName, expiresAt, message }`
- `404` → jogador não encontrado na Riot API
- `409` → Riot ID já vinculado a outra conta
- `429` → Riot ID bloqueado (com mensagem de tempo restante)

### POST /api/user/riot/verify
- Step 1 sucesso → `{ step: 2, iconId, iconName, expiresAt, message }`
- Step 2 sucesso → `{ message, riotGameName, riotTagLine, riotVerified: true }`
- `400` → ícone incorreto + `attemptsLeft`
- `408` → tempo esgotado
- `429` → bloqueado após 5 falhas

### DELETE /api/user/riot
- `200` → conta Riot desvinculada
