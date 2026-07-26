import { NextResponse } from 'next/server'
import { COOKIE_DASHBOARD, hashSenha } from '@/middleware'
import { identificar, registrarFalha, limpar, bloqueadoPor, LIMITE_TENTATIVAS } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Comparação de tempo constante: `a !== b` sai no primeiro byte diferente, e
// essa diferença de tempo é mensurável pela rede. Com o rate limit já não é o
// caminho mais fácil de ataque, mas custa três linhas fechar.
function senhaConfere(recebida, esperada) {
  const a = new TextEncoder().encode(recebida)
  const b = new TextEncoder().encode(esperada)
  let diferenca = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diferenca |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return diferenca === 0
}

export async function POST(request) {
  const senhaConfigurada = process.env.DASHBOARD_PASSWORD

  if (!senhaConfigurada) {
    return NextResponse.json(
      { erro: 'Dashboard não configurado no servidor' },
      { status: 503 }
    )
  }

  // Antes de olhar a senha: quem errou demais espera. É uma senha única
  // protegendo dados pessoais de candidatos — sem freio, é só tempo de CPU.
  const quem = identificar(request)
  const espera = bloqueadoPor(quem)
  if (espera !== null) {
    return NextResponse.json(
      { erro: `Muitas tentativas. Tente de novo em ${Math.ceil(espera / 60)} min.` },
      { status: 429, headers: { 'Retry-After': String(espera) } }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'JSON inválido' }, { status: 400 })
  }

  if (typeof body?.senha !== 'string' || !senhaConfere(body.senha, senhaConfigurada)) {
    registrarFalha(quem)
    return NextResponse.json({ erro: 'Senha incorreta' }, { status: 401 })
  }

  limpar(quem)
  const response = NextResponse.json({ ok: true })

  response.cookies.set(COOKIE_DASHBOARD, await hashSenha(senhaConfigurada), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12, // 12h
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.delete(COOKIE_DASHBOARD)
  return response
}
