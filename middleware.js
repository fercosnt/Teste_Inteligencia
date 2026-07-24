import { NextResponse } from 'next/server'

// Guarda de acesso do dashboard.
//
// O dashboard expõe nome, email, telefone e desempenho de candidatos, então
// nenhuma rota sob /relatorios pode ser aberta sem senha. A validação da senha
// acontece em /api/login; aqui só conferimos o cookie que ela emite.

export const COOKIE_DASHBOARD = 'dashboard_auth'

export async function hashSenha(senha) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(senha))
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function middleware(request) {
  const senha = process.env.DASHBOARD_PASSWORD

  // Sem senha configurada o dashboard fica fechado, não aberto.
  if (!senha) {
    return new NextResponse(
      'Dashboard indisponível: a variável DASHBOARD_PASSWORD não foi configurada.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    )
  }

  const cookie = request.cookies.get(COOKIE_DASHBOARD)?.value
  if (cookie && cookie === (await hashSenha(senha))) {
    return NextResponse.next()
  }

  const url = new URL('/login', request.url)
  url.searchParams.set('redirect', request.nextUrl.pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/relatorios/:path*'],
}
