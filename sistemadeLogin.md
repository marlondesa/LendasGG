# Sistema de Login com Google OAuth + Vinculação ao Perfil Riot

> Explicação completa de como adicionar "Logar com Google" ao projeto e permitir que cada usuário vincule sua conta ao jogador da Riot API.

---

## É possível? Sim — e é mais simples do que parece

O fluxo tem duas etapas independentes:

1. **Autenticação via Google** — o usuário se autentica usando a conta Gmail dele (OAuth 2.0)
2. **Vinculação ao Riot** — após logado, o usuário informa o Riot ID dele (`gameName#tagLine`) e o backend busca e salva o PUUID na conta

As duas etapas são separadas propositalmente. O Google cuida de quem é o usuário. A Riot cuida de qual jogador ele é.

---

## Visão Geral do Fluxo

```
[Frontend]                [Backend]                  [Google]           [Riot API]
    |                         |                          |                   |
    |-- clica "Login Google" ->|                          |                   |
    |                         |-- redireciona para ------>|                   |
    |                         |   Google OAuth            |                   |
    |                         |                          |                   |
    |<-- redirect do Google --|<-- callback com code -----|                   |
    |   (para o backend)      |                          |                   |
    |                         |-- troca code por token -->|                   |
    |                         |<-- profile do usuário ----|                   |
    |                         |                          |                   |
    |                         |-- cria/acha User no DB    |                   |
    |                         |-- gera JWT HTTP-only      |                   |
    |<-- redirect para /dashboard (logado)                |                   |
    |                         |                          |                   |
    |                         |                          |                   |
    |-- informa gameName#tag ->|                          |                   |
    |                         |-- GET /account/by-riot-id ------------------>|
    |                         |<-- { puuid, gameName, tagLine } --------------|
    |                         |-- salva no User (DB)      |                   |
    |<-- perfil vinculado -----|                          |                   |
```

---

## 1. Mudanças no Banco de Dados (Prisma)

O modelo `User` atual assume que todo usuário tem `email` + `password`. Com Google OAuth, o usuário **não tem senha** — o Google autentica por ele.

### Schema atualizado

```prisma
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  password      String?   // <- agora opcional (null para usuários Google)
  username      String    @unique
  googleId      String?   @unique  // <- ID único do Google (sub do token)
  avatarUrl     String?            // <- foto de perfil do Google
  riotPuuid     String?   @unique
  riotGameName  String?
  riotTagLine   String?
  emailVerified Boolean   @default(false)
  authProvider  AuthProvider @default(EMAIL) // <- rastreia como o usuário criou a conta
  role          Role      @default(PLAYER)
  createdAt     DateTime  @default(now())

  registrations Registration[]
  payments      Payment[]
  sessions      Session[]
}

enum AuthProvider {
  EMAIL   // cadastro tradicional com email/senha
  GOOGLE  // cadastro via Google OAuth
}
```

**Por que `password` vira opcional?**
Usuário que entra pelo Google nunca cria senha — seria campo vazio sem sentido. O `?` no Prisma significa `NULL` no banco.

**Por que guardar o `googleId`?**
Quando o Google faz callback, você recebe o campo `sub` (subject) — é o ID único e imutável do usuário no Google. É por ele que você identifica o usuário, não pelo email (email pode mudar).

---

## 2. Dependências Novas

```bash
cd base/backend
npm install passport passport-google-oauth20
```

| Pacote | Função |
|---|---|
| `passport` | Framework de autenticação modular para Express |
| `passport-google-oauth20` | Estratégia OAuth 2.0 do Google para o Passport |

E no `.env`:

```env
GOOGLE_CLIENT_ID=seu_client_id_aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
```

---

## 3. Configurando o Google Cloud Console

Antes de qualquer código, você precisa registrar o app no Google:

1. Acesse **console.cloud.google.com**
2. Crie um projeto (ou use um existente)
3. Vá em **APIs & Services → Credentials**
4. Clique em **Create Credentials → OAuth 2.0 Client IDs**
5. Tipo: **Web application**
6. Em **Authorized redirect URIs**, adicione:
   - Desenvolvimento: `http://localhost:3000/api/auth/google/callback`
   - Produção: `https://seudominio.com/api/auth/google/callback`
7. Copie o **Client ID** e **Client Secret** para o `.env`

> **Atenção:** O URI de callback cadastrado no Google Cloud Console precisa ser **idêntico** ao que o backend vai usar. Um caractere diferente e o OAuth quebra.

---

## 4. Backend — Configurando o Passport

### `src/config/passport.js`

```javascript
const passport = require('passport')
const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
const { prisma } = require('./database')

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id
        const email = profile.emails[0].value
        const avatarUrl = profile.photos?.[0]?.value ?? null

        // 1. Tenta achar pelo googleId (usuário já cadastrou antes via Google)
        let user = await prisma.user.findUnique({ where: { googleId } })

        if (user) {
          return done(null, user)
        }

        // 2. Tenta achar pelo email (usuário tem conta EMAIL e está "conectando" o Google)
        user = await prisma.user.findUnique({ where: { email } })

        if (user) {
          // Vincula o Google à conta existente
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId, avatarUrl },
          })
          return done(null, user)
        }

        // 3. Cria conta nova via Google
        const username = email.split('@')[0] + '_' + googleId.slice(0, 6)
        user = await prisma.user.create({
          data: {
            email,
            googleId,
            avatarUrl,
            username,
            emailVerified: true, // Google já verificou o email
            authProvider: 'GOOGLE',
            password: null,
          },
        })

        return done(null, user)
      } catch (err) {
        return done(err, null)
      }
    }
  )
)

module.exports = passport
```

**O que essa função faz:**
- Se o `googleId` já existe no banco → usuário voltando → retorna ele
- Se o `email` existe mas sem `googleId` → usuário com conta antiga → vincula o Google
- Se não existe nada → cria conta nova (email já verificado, porque o Google garantiu)

---

## 5. Backend — Rotas de Auth Google

### Adicionar em `src/routes/auth.js`

```javascript
const passport = require('../config/passport')
const jwt = require('jsonwebtoken')

// Rota 1: inicia o fluxo OAuth — redireciona para o Google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false, // não usar session do Passport, usamos JWT
  })
)

// Rota 2: Google chama aqui após o usuário aceitar
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  (req, res) => {
    const user = req.user

    // Gera JWT igual ao login tradicional
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    // Seta o cookie HTTP-only (mesmo padrão do login tradicional)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
    })

    // Redireciona para o frontend já logado
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`)
  }
)
```

> **Por que `session: false` no Passport?**
> O projeto usa JWT em cookie HTTP-only, não sessions do servidor. O Passport por padrão quer usar `req.session` — desativamos isso para manter consistência com o resto do sistema.

---

## 6. Backend — Vinculação ao Riot

Essa parte é **separada** do login. Depois de logado, o usuário vai no perfil dele e informa o Riot ID.

### Nova rota: `PUT /api/auth/link-riot`

```javascript
// src/routes/auth.js
router.put('/link-riot', authMiddleware, async (req, res, next) => {
  try {
    const { gameName, tagLine } = req.body // ex: "Faker" e "T1"
    const userId = req.user.id

    // Busca o PUUID na Riot API
    const riotAccount = await riotApiService.getAccountByRiotId(gameName, tagLine)
    // riotAccount = { puuid: "abc123...", gameName: "Faker", tagLine: "T1" }

    // Checa se esse PUUID já está vinculado a outro usuário
    const existingLink = await prisma.user.findUnique({
      where: { riotPuuid: riotAccount.puuid },
    })

    if (existingLink && existingLink.id !== userId) {
      return res.status(409).json({ error: 'Este jogador já está vinculado a outra conta' })
    }

    // Salva no usuário atual
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        riotPuuid: riotAccount.puuid,
        riotGameName: riotAccount.gameName,
        riotTagLine: riotAccount.tagLine,
      },
    })

    res.json({
      riotGameName: updated.riotGameName,
      riotTagLine: updated.riotTagLine,
      riotPuuid: updated.riotPuuid,
    })
  } catch (err) {
    next(err)
  }
})
```

### E para desvincular: `DELETE /api/auth/link-riot`

```javascript
router.delete('/link-riot', authMiddleware, async (req, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        riotPuuid: null,
        riotGameName: null,
        riotTagLine: null,
      },
    })
    res.json({ message: 'Conta Riot desvinculada' })
  } catch (err) {
    next(err)
  }
})
```

---

## 7. Registrar o Passport no `src/index.js`

```javascript
const passport = require('./config/passport')

// Adicionar junto com os outros middlewares, após cookie-parser:
app.use(passport.initialize()) // não usa session, só inicializa o Passport
```

---

## 8. Frontend — Botão "Logar com Google"

O fluxo do frontend é simples: **apenas um link/redirect**. Não é uma chamada axios — é uma navegação real porque o OAuth precisa trocar cookies e fazer redirects do browser.

### `src/pages/Login.jsx`

```jsx
// Botão de login com Google — é um link simples, não uma chamada axios
const handleGoogleLogin = () => {
  // Redireciona para o backend que inicia o OAuth
  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/google`
}

// No JSX:
<button onClick={handleGoogleLogin}>
  Entrar com Google
</button>
```

### `src/pages/Dashboard.jsx` — Seção de vinculação Riot

```jsx
const [gameName, setGameName] = useState('')
const [tagLine, setTagLine] = useState('')

const handleLinkRiot = async () => {
  // Chama o backend com o Riot ID informado pelo usuário
  await api.put('/api/auth/link-riot', { gameName, tagLine })
  // Atualiza o perfil local
}

// No JSX (exemplo simplificado):
{user.riotGameName ? (
  <div>
    <p>Conta vinculada: {user.riotGameName}#{user.riotTagLine}</p>
    <button onClick={() => api.delete('/api/auth/link-riot')}>Desvincular</button>
  </div>
) : (
  <div>
    <input placeholder="GameName" onChange={e => setGameName(e.target.value)} />
    <input placeholder="TagLine (ex: BR1)" onChange={e => setTagLine(e.target.value)} />
    <button onClick={handleLinkRiot}>Vincular conta Riot</button>
  </div>
)}
```

---

## 9. Como Fica o Dashboard do Usuário

Depois da vinculação, o backend pode retornar os dados Riot diretamente no endpoint de perfil:

### `GET /api/auth/me`

```javascript
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        role: true,
        authProvider: true,
        emailVerified: true,
        riotGameName: true,
        riotTagLine: true,
        riotPuuid: true,
        // nunca retornar: password, googleId
      },
    })

    // Se tem PUUID vinculado, busca rank atual da Riot API
    let riotStats = null
    if (user.riotPuuid) {
      riotStats = await riotApiService.getLeagueByPuuid(user.riotPuuid)
    }

    res.json({ user, riotStats })
  } catch (err) {
    next(err)
  }
})
```

---

## 10. Considerações de Segurança

| Ponto | O que fazer |
|---|---|
| `googleId` nunca exposto no frontend | O `select` do Prisma nunca retorna este campo |
| Email já verificado pelo Google | `emailVerified: true` na criação, não precisa de email de verificação |
| Usuário com conta EMAIL pode conectar o Google | A estratégia checa email antes de criar conta nova |
| Um PUUID = uma conta | O `@unique` no schema + a checagem de conflito na rota impedem duplicatas |
| `password: null` para usuários Google | O campo é opcional — nunca gerar senha fake |
| Se usuário Google tenta trocar senha | Retornar erro explicando que a conta usa Google OAuth |
| CORS e cookies | `withCredentials: true` no axios e `sameSite: 'strict'` no cookie |

---

## 11. Resumo dos Arquivos Que Mudam

| Arquivo | O que muda |
|---|---|
| `prisma/schema.prisma` | Adiciona `googleId`, `avatarUrl`, `authProvider`; torna `password` opcional |
| `src/config/passport.js` | **Arquivo novo** — configura a estratégia Google |
| `src/routes/auth.js` | Adiciona rotas `/google`, `/google/callback`, `/link-riot`, `/me` |
| `src/index.js` | Adiciona `app.use(passport.initialize())` |
| `.env` | Adiciona `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` |
| `frontend/src/pages/Login.jsx` | Adiciona botão "Entrar com Google" |
| `frontend/src/pages/Dashboard.jsx` | Adiciona seção de vinculação/desvinculação Riot |

---

## 12. Fluxo Completo — Passo a Passo do Usuário

```
1. Usuário clica "Entrar com Google"
   └── Browser vai para /api/auth/google

2. Backend redireciona para o Google
   └── Google mostra tela de consentimento

3. Usuário aprova
   └── Google redireciona para /api/auth/google/callback?code=xxx

4. Backend troca o code pelo perfil do usuário
   └── Cria ou encontra o User no banco
   └── Gera JWT
   └── Seta cookie HTTP-only
   └── Redireciona para /dashboard

5. Usuário está logado — mas ainda sem conta Riot vinculada

6. No Dashboard, usuário informa: Faker#T1
   └── Backend chama Riot API: GET /riot/account/v1/accounts/by-riot-id/Faker/T1
   └── Recebe { puuid: "abc...", gameName: "Faker", tagLine: "T1" }
   └── Salva no banco

7. Agora o Dashboard mostra rank, maestria, histórico do Faker
```

---

> **Conclusão:** O sistema é totalmente viável com a stack atual. O Google OAuth não substitui o login tradicional — eles coexistem. Um usuário pode ter conta email+senha E conectar o Google à mesma conta. A vinculação com a Riot é um passo extra e opcional, feito após o login, usando o mesmo endpoint de busca que o projeto já tem.
