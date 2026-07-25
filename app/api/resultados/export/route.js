import { getSupabaseAdmin } from '@/lib/supabase-server'
import { normalizarBusca, normalizarOrdem, aplicarFiltros } from '@/lib/relatorios-query'
import { gerarCsv, nomeArquivoCsv } from '@/lib/csv'

export const dynamic = 'force-dynamic'

// Export do que está na tela: mesma busca, mesma ordenação, mesmas colunas
// derivadas. Reaproveita aplicarFiltros justamente para não existir uma segunda
// interpretação de `?q=` capaz de divergir da lista que o RH está vendo.
//
// A proteção é o mesmo middleware do dashboard — o matcher inclui esta rota
// explicitamente, e só ela: /api/resultados (a gravação do candidato) fica de
// fora, senão ninguém conseguiria concluir o teste.
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const busca = normalizarBusca(searchParams.get('q'))
  const ordenacao = normalizarOrdem(searchParams.get('ordem'), searchParams.get('dir'))

  let supabase
  try {
    supabase = getSupabaseAdmin()
  } catch (error) {
    console.error('[export] Supabase não configurado:', error.message)
    return Response.json({ erro: 'Servidor não configurado' }, { status: 500 })
  }

  const { data, error } = await aplicarFiltros(
    supabase.from('raven_resultados_detalhe').select('*'),
    { busca, ordenacao }
  )

  if (error) {
    console.error('[export] Falha ao ler os resultados:', error)
    return Response.json({ erro: 'Falha ao gerar o arquivo' }, { status: 500 })
  }

  return new Response(gerarCsv(data ?? []), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nomeArquivoCsv(new Date())}"`,
      // Dado pessoal de candidato não fica em cache de proxy nem do navegador.
      'Cache-Control': 'no-store',
    },
  })
}
