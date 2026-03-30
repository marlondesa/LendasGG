import { Request, Response, NextFunction } from 'express'
import argon2 from 'argon2'
import prisma from '../config/database'
import * as riotApi from '../services/riotApi'

// ─── ÍCONES GRATUITOS (IDs 0-28, clássicos de 2009) ──────────────────────────
// Fonte: Community Dragon pt_BR v16.6.1
const FREE_ICONS: Record<number, string> = {
  0: 'Tropa Azul Combatente',     1: 'Tropa Azul e Seu Martelo',
  2: 'Tropa de Canhão Azul',      3: 'Tropa Conjuradora Azul',
  4: 'Montanha Azul',             5: 'Super Tropa Azul',
  6: 'Garra do Tibbers',          7: 'Rosa Galante',
  8: 'Golem Ancião',              9: 'Adagas',
  10: 'Espada Alada',             11: 'Lagarto Ancião',
  12: 'Mejai Totalmente Acumulada', 13: 'Tropa de Canhão Vermelha',
  14: 'Tropa de Cerco Vermelha',  15: 'Tropa Combatente Vermelha',
  16: 'Tropa Conjuradora Vermelha', 17: 'Super Tropa Vermelha',
  18: 'Mix Mix',                  19: 'Targon',
  20: 'Shurima',                  21: 'Árvore da Vida',
  22: 'Reviver',                  23: 'Brotinho',
  24: 'Escudo de Espinhos',       25: 'Bicho Nível Um',
  26: 'Bicho Nível Dois',         27: 'Espectro',
  28: 'Tibbers',
}

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

  if (block.blockCount >= 3 && !block.blockedUntil) {
    return { blocked: true, message: 'Este Riot ID está bloqueado permanentemente para vinculação' }
  }

  if (block.blockedUntil && block.blockedUntil > new Date()) {
    const minutesLeft = Math.ceil((block.blockedUntil.getTime() - Date.now()) / 60000)
    return { blocked: true, message: `Muitas tentativas. Tente novamente em ${minutesLeft} minutos` }
  }

  return { blocked: false }
}

async function registerFailedAttempt(
  puuid: string,
  userId: string
): Promise<{ attemptsLeft: number; blocked: boolean }> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { riotVerifyAttempts: { increment: 1 } },
    select: { riotVerifyAttempts: true },
  })

  const attemptsLeft = Math.max(0, 5 - user.riotVerifyAttempts)

  if (user.riotVerifyAttempts >= 5) {
    const existing = await prisma.riotClaimBlock.findUnique({ where: { puuid } })
    const newBlockCount = (existing?.blockCount ?? 0) + 1
    const isPermanent = newBlockCount >= 3

    await prisma.riotClaimBlock.upsert({
      where: { puuid },
      create: {
        puuid,
        attempts: 1,
        blockCount: 1,
        blockedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      update: {
        attempts: { increment: 1 },
        blockCount: { increment: 1 },
        blockedUntil: isPermanent ? null : new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    // Limpa os campos pendentes do usuário
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

// ─── PUT /api/user/password ──────────────────────────────────────────────────

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user || !user.password) {
      res.status(400).json({ error: 'Esta conta não usa senha' })
      return
    }

    const valid = await argon2.verify(user.password, currentPassword)
    if (!valid) {
      res.status(401).json({ error: 'Senha atual incorreta' })
      return
    }

    const hash = await argon2.hash(newPassword)
    await prisma.user.update({ where: { id: user.id }, data: { password: hash } })

    res.json({ message: 'Senha alterada com sucesso' })
  } catch (err) {
    next(err)
  }
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
        id: true, username: true,
        twitterUrl: true, discordTag: true, twitchUrl: true, youtubeUrl: true,
      },
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
}

// ─── POST /api/user/avatar ────────────────────────────────────────────────────

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

    // 1. Busca conta na Riot API
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

    // 2. Verifica bloqueio
    const blockStatus = await checkBlock(riotAccount.puuid)
    if (blockStatus.blocked) {
      res.status(429).json({ error: blockStatus.message })
      return
    }

    // 3. Verifica se PUUID já está vinculado a outro usuário
    const existing = await prisma.user.findUnique({ where: { riotPuuid: riotAccount.puuid } })
    if (existing && existing.id !== req.user!.id) {
      res.status(409).json({ error: 'Este jogador já está vinculado a outra conta' })
      return
    }

    // 4. Busca summoner para pegar ícone atual
    const summoner = await riotApi.getSummonerByPuuid(region, riotAccount.puuid)
    const currentIconId: number = summoner.profileIconId

    // 5. Sorteia os 2 ícones de verificação
    const [icon1, icon2] = drawIcons(currentIconId)
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000)

    // 6. Salva estado pendente
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

    if (!user.riotPendingPuuid || !user.riotVerifyStep) {
      res.status(400).json({ error: 'Nenhuma verificação em andamento. Inicie o processo novamente.' })
      return
    }

    if (user.riotVerifyStep !== step) {
      res.status(400).json({ error: `Passo inválido. Passo atual: ${user.riotVerifyStep}` })
      return
    }

    if (!user.riotVerifyExpiresAt || user.riotVerifyExpiresAt < new Date()) {
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

    // Busca ícone atual sem cache — precisa do valor real-time
    const summoner = await riotApi.getSummonerByPuuid(user.riotPendingRegion!, user.riotPendingPuuid!, true)
    const currentIconId: number = summoner.profileIconId
    const expectedIcon = step === 1 ? user.riotVerifyIcon1 : user.riotVerifyIcon2

    // Ícone não bate
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

    // Step 1 correto → avança para step 2
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

    // Step 2 correto → VINCULA A CONTA
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          riotPuuid: user.riotPendingPuuid,
          riotGameName: user.riotPendingGameName,
          riotTagLine: user.riotPendingTagLine,
          riotRegion: user.riotPendingRegion,
          riotVerified: true,
          riotPendingPuuid: null, riotPendingGameName: null,
          riotPendingTagLine: null, riotPendingRegion: null,
          riotVerifyIcon1: null, riotVerifyIcon2: null,
          riotVerifyStep: null, riotVerifyExpiresAt: null,
          riotVerifyAttempts: 0,
        },
      })
    } catch (err: any) {
      // P2002 = unique constraint — outro usuário vinculou o mesmo PUUID durante a verificação
      if (err?.code === 'P2002') {
        res.status(409).json({ error: 'Este jogador já foi vinculado por outro usuário durante sua verificação.' })
        return
      }
      throw err
    }

    // Remove bloqueios anteriores — verificação legítima
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
