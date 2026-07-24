import { NextResponse } from 'next/server'
import { COOKIE_DASHBOARD, hashSenha } from '@/middleware'

export const dynamic = 'force-dynamic'

export async function POST(request) {
  const senhaConfigurada = process.env.DASHBOARD_PASSWORD

  if (!senhaConfigurada) {
    return NextResponse.json(
      { erro: 'Dashboard não configurado no servidor' },
      { status: 503 }
    )
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ erro: 'JSON inválido' }, { status: 400 })
  }

  if (typeof body?.senha !== 'string' || body.senha !== senhaConfigurada) {
    return NextResponse.json({ erro: 'Senha incorreta' }, { status: 401 })
  }

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
