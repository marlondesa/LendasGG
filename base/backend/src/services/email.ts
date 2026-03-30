import { Resend } from 'resend'

const resend = new Resend(process.env['RESEND_API_KEY']!)
const FROM = process.env['MAIL_FROM']!

// Envia email de verificação de conta
export async function sendVerificationEmail(to: string, username: string, token: string) {
  const link = `${process.env['FRONTEND_URL']}/verify-email?token=${token}`

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Verifique seu email — Lendas.GG',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Olá, ${username}!</h2>
        <p>Clique no botão abaixo para verificar seu email e ativar sua conta no Lendas.GG.</p>
        <a href="${link}" style="
          display: inline-block;
          background: #c89b3c;
          color: #0e0f1a;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin: 16px 0;
        ">Verificar email</a>
        <p style="color: #888; font-size: 13px;">Este link expira em 24 horas. Se você não criou uma conta, ignore este email.</p>
      </div>
    `,
  })
}

// Envia email de redefinição de senha
export async function sendPasswordReset(to: string, username: string, token: string) {
  const link = `${process.env['FRONTEND_URL']}/reset-password?token=${token}`

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Redefinir senha — Lendas.GG',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Olá, ${username}!</h2>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
        <a href="${link}" style="
          display: inline-block;
          background: #c89b3c;
          color: #0e0f1a;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin: 16px 0;
        ">Redefinir senha</a>
        <p style="color: #888; font-size: 13px;">Este link expira em 1 hora. Se você não solicitou, ignore este email.</p>
      </div>
    `,
  })
}

// Envia confirmação de inscrição em campeonato
export async function sendChampionshipConfirmation(to: string, username: string, championshipName: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Inscrição confirmada — ${championshipName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Inscrição confirmada!</h2>
        <p>Olá, ${username}! Sua inscrição no campeonato <strong>${championshipName}</strong> foi confirmada com sucesso.</p>
        <p>Acompanhe os detalhes e o progresso do campeonato no seu dashboard.</p>
        <a href="${process.env['FRONTEND_URL']}/dashboard" style="
          display: inline-block;
          background: #c89b3c;
          color: #0e0f1a;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          margin: 16px 0;
        ">Ver dashboard</a>
      </div>
    `,
  })
}
