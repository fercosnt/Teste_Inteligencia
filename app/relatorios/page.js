import { getSupabaseAdmin } from '@/lib/supabase-server'
import { gabarito, series } from '@/lib/quiz-data'
import {
  ORDENS,
  normalizarBusca,
  normalizarOrdem,
  aplicarFiltros,
  construirHref,
  proximaDirecao,
} from '@/lib/relatorios-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,
  Users,
  Clock,
  Target,
  TrendingUp,
  Inbox,
  SearchX,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import SairButton from './sair-button'
import Busca from './busca'

export const dynamic = 'force-dynamic'

const NOMES_SERIES = {
  A: 'Percepção Visual',
  B: 'Raciocínio Analógico',
  C: 'Raciocínio de Padrões',
  D: 'Raciocínio Quantitativo',
  E: 'Raciocínio Abstrato',
}

const formatarDataHora = (iso) =>
  new Date(iso).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const formatarDuracao = (segundos) => {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function carregarDados({ busca, ordenacao }) {
  const supabase = getSupabaseAdmin()

  // Os agregados continuam olhando a base inteira mesmo com busca ativa: são o
  // retrato do processo, não do filtro. Quem é filtrado é a lista, e o contador
  // ao lado da busca deixa claro quantos ficaram de fora.
  const [resumo, classificacao, candidatos] = await Promise.all([
    supabase.from('raven_dashboard_resumo').select('*').single(),
    supabase.from('raven_dashboard_classificacao').select('*'),
    aplicarFiltros(supabase.from('raven_resultados_detalhe').select('*'), { busca, ordenacao }),
  ])

  const erro = resumo.error || classificacao.error || candidatos.error
  if (erro) throw new Error(erro.message)

  return {
    resumo: resumo.data,
    classificacao: classificacao.data ?? [],
    candidatos: candidatos.data ?? [],
  }
}

function CardMetrica({ icone: Icone, rotulo, valor, sufixo, cor }) {
  return (
    <Card className={`${cor.bg} ${cor.border}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icone className={`w-6 h-6 mt-1 ${cor.texto}`} />
          <div>
            <p className="text-sm text-gray-600">{rotulo}</p>
            <p className="text-2xl font-semibold tabular-nums">
              {valor}
              {sufixo && <span className="text-base font-normal text-gray-500 ml-1">{sufixo}</span>}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BarraSerie({ letra, acertos, percentual }) {
  return (
    <div>
      <div className="flex justify-between items-baseline text-sm mb-1">
        <span className="font-medium">
          Série {letra}
          <span className="text-gray-500 font-normal ml-2">{NOMES_SERIES[letra]}</span>
        </span>
        <span className="tabular-nums text-gray-600">
          {acertos}/12 ({percentual}%)
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  )
}

function DetalheQuestoes({ letra, respostas }) {
  const { inicio, fim } = series[letra]
  const questoes = []

  for (let numero = inicio; numero <= fim; numero++) {
    const indice = numero - 1
    const resposta = respostas[indice]
    const correta = gabarito[indice]
    questoes.push({ numero, resposta, correta, acertou: resposta === correta })
  }

  return (
    <div className="grid grid-cols-6 gap-2">
      {questoes.map((q) => (
        <div
          key={q.numero}
          className={`rounded-md border p-2 text-center text-xs ${
            q.acertou ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}
          title={`Questão ${q.numero}: respondeu ${q.resposta}, correta ${q.correta}`}
        >
          <div className="text-gray-500">Q{q.numero}</div>
          <div className={`font-semibold ${q.acertou ? 'text-green-700' : 'text-red-700'}`}>
            {q.acertou ? '✓' : '✗'}
          </div>
          <div className="text-gray-600 tabular-nums">
            {q.resposta}
            {!q.acertou && <span className="text-gray-400"> / {q.correta}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}

function CabecalhoOrdenavel({ chave, className, busca, ordenacao }) {
  const ativa = ordenacao.ordem === chave
  const Seta = !ativa ? ChevronsUpDown : ordenacao.ascendente ? ArrowUp : ArrowDown

  return (
    <div className={className}>
      <Link
        href={construirHref({
          busca,
          ordem: chave,
          direcao: proximaDirecao(chave, ordenacao.ordem, ordenacao.direcao),
        })}
        aria-sort={ativa ? (ordenacao.ascendente ? 'ascending' : 'descending') : 'none'}
        className={`inline-flex items-center gap-1 whitespace-nowrap hover:text-gray-900 transition-colors ${
          ativa ? 'text-gray-900 font-semibold' : 'text-gray-500'
        }`}
      >
        {ORDENS[chave].rotulo}
        <Seta className={`w-3.5 h-3.5 ${ativa ? 'text-blue-600' : 'text-gray-300'}`} />
      </Link>
    </div>
  )
}

function CabecalhoTabela({ busca, ordenacao }) {
  const props = { busca, ordenacao }

  return (
    <div className="hidden sm:grid grid-cols-12 gap-3 items-center px-4 py-2 border-b bg-gray-50 text-xs uppercase tracking-wide">
      <CabecalhoOrdenavel chave="nome" className="col-span-4" {...props} />
      <CabecalhoOrdenavel chave="data" className="col-span-2" {...props} />
      <CabecalhoOrdenavel chave="tempo" className="col-span-2" {...props} />
      <CabecalhoOrdenavel chave="pontuacao" className="col-span-1" {...props} />
      <div className="col-span-3 text-gray-500">Classificação</div>
    </div>
  )
}

function LinhaCandidato({ c }) {
  const seriesDoCandidato = [
    { letra: 'A', acertos: c.acertos_serie_a, percentual: c.percentual_serie_a },
    { letra: 'B', acertos: c.acertos_serie_b, percentual: c.percentual_serie_b },
    { letra: 'C', acertos: c.acertos_serie_c, percentual: c.percentual_serie_c },
    { letra: 'D', acertos: c.acertos_serie_d, percentual: c.percentual_serie_d },
    { letra: 'E', acertos: c.acertos_serie_e, percentual: c.percentual_serie_e },
  ]

  return (
    <details className="group border-b last:border-b-0">
      <summary className="cursor-pointer list-none px-4 py-3 hover:bg-gray-50 transition-colors">
        <div className="grid grid-cols-12 gap-3 items-center text-sm">
          <div className="col-span-12 sm:col-span-4">
            <div className="font-medium">{c.nome}</div>
            <div className="text-gray-500 text-xs">{c.email}</div>
          </div>
          <div className="col-span-4 sm:col-span-2 text-gray-600 text-xs">
            {formatarDataHora(c.data_fim)}
          </div>
          <div className="col-span-3 sm:col-span-2 tabular-nums text-gray-600">
            {formatarDuracao(c.tempo_total_segundos)}
          </div>
          <div className="col-span-2 sm:col-span-1 tabular-nums font-semibold">
            {c.pontuacao_total}/60
          </div>
          <div className="col-span-3 sm:col-span-3 text-xs">
            <span className="tabular-nums font-medium mr-2">{c.percentual_acertos}%</span>
            <span className="text-gray-600" title={c.classificacao_descricao}>
              {c.classificacao}
            </span>
          </div>
        </div>
      </summary>

      <div className="px-4 pb-5 pt-1 bg-gray-50/60 space-y-5">
        <p className="text-xs text-gray-600 border-l-2 border-gray-300 pl-3">
          <span className="font-medium">{c.classificacao}</span> — {c.classificacao_descricao}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {seriesDoCandidato.map((s) => (
            <BarraSerie key={s.letra} {...s} />
          ))}
        </div>

        <div className="space-y-4">
          {seriesDoCandidato.map((s) => (
            <div key={s.letra}>
              <p className="text-xs font-medium text-gray-700 mb-2">
                Série {s.letra} — {NOMES_SERIES[s.letra]}
                <span className="text-gray-500 font-normal"> · resposta / gabarito</span>
              </p>
              <DetalheQuestoes letra={s.letra} respostas={c.respostas} />
            </div>
          ))}
        </div>

        {c.telefone && (
          <p className="text-xs text-gray-500">
            Telefone: <span className="tabular-nums">{c.telefone}</span> · Iniciado em{' '}
            {formatarDataHora(c.data_inicio)}
          </p>
        )}
      </div>
    </details>
  )
}

export default async function Relatorios({ searchParams }) {
  const params = (await searchParams) ?? {}
  const busca = normalizarBusca(params.q)
  const ordenacao = normalizarOrdem(params.ordem, params.dir)

  let dados
  let erroCarregamento = null

  try {
    dados = await carregarDados({ busca, ordenacao })
  } catch (error) {
    erroCarregamento = error.message
  }

  // Base vazia e busca sem resultado são situações diferentes: a primeira não
  // tem o que filtrar, a segunda precisa oferecer o caminho de volta.
  const baseVazia = !erroCarregamento && Number(dados.resumo?.total_candidatos ?? 0) === 0
  const buscaSemResultado = !erroCarregamento && !baseVazia && dados.candidatos.length === 0

  return (
    <div
      className="min-h-screen p-4 py-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/assets/background-gradient.webp)' }}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-700 via-purple-600 to-cyan-500 text-white rounded-t-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Resultados do Teste</CardTitle>
                <p className="text-white/90 mt-1 text-sm">Matrizes de Raven — 60 questões</p>
              </div>
              <div className="flex items-center gap-4">
                <SairButton />
                <Image
                  src="/assets/tochinha p fundo escuro.png"
                  alt="Beauty Smile"
                  width={56}
                  height={56}
                  className="h-14 w-auto hidden sm:block"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {erroCarregamento && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-gray-700">
                  <strong className="text-red-700">Não foi possível carregar os resultados.</strong>{' '}
                  {erroCarregamento}
                </AlertDescription>
              </Alert>
            )}

            {baseVazia && (
              <div className="text-center py-12">
                <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Nenhum candidato ainda</p>
                <p className="text-gray-500 text-sm mt-1">
                  Os resultados aparecem aqui assim que o primeiro teste for concluído.
                </p>
              </div>
            )}

            {!erroCarregamento && !baseVazia && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <CardMetrica
                    icone={Users}
                    rotulo="Candidatos"
                    valor={dados.resumo.total_candidatos}
                    cor={{ bg: 'bg-cyan-50', border: 'border-cyan-200', texto: 'text-cyan-600' }}
                  />
                  <CardMetrica
                    icone={Clock}
                    rotulo="Tempo médio"
                    valor={dados.resumo.tempo_medio_minutos}
                    sufixo="min"
                    cor={{ bg: 'bg-purple-50', border: 'border-purple-200', texto: 'text-purple-600' }}
                  />
                  <CardMetrica
                    icone={Target}
                    rotulo="Pontuação média"
                    valor={dados.resumo.pontuacao_media}
                    sufixo="/60"
                    cor={{ bg: 'bg-blue-50', border: 'border-blue-200', texto: 'text-blue-600' }}
                  />
                  <CardMetrica
                    icone={TrendingUp}
                    rotulo="Acerto médio"
                    valor={dados.resumo.percentual_medio}
                    sufixo="%"
                    cor={{ bg: 'bg-amber-50', border: 'border-amber-200', texto: 'text-amber-600' }}
                  />
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Média de acertos por série</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {['a', 'b', 'c', 'd', 'e'].map((s) => {
                        const media = Number(dados.resumo[`media_serie_${s}`] ?? 0)
                        return (
                          <BarraSerie
                            key={s}
                            letra={s.toUpperCase()}
                            acertos={media}
                            percentual={Math.round((media / 12) * 1000) / 10}
                          />
                        )
                      })}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                      Distribuição por classificação
                      <span className="block text-xs font-normal text-gray-500 mt-1">
                        Escala normativa do SPM, por acertos
                      </span>
                    </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dados.classificacao.map((faixa) => (
                        <div key={faixa.classificacao}>
                          <div className="flex justify-between items-baseline text-sm mb-1">
                            <span title={faixa.classificacao_descricao}>{faixa.classificacao}</span>
                            <span className="tabular-nums text-gray-600">
                              {faixa.total} ({faixa.percentual_do_total}%)
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-600 to-cyan-500"
                              style={{ width: `${faixa.percentual_do_total}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                <Card className="overflow-hidden">
                  <CardHeader className="pb-3 space-y-4">
                    <CardTitle className="text-base">
                      Candidatos
                      <span className="text-gray-500 font-normal text-sm ml-2">
                        clique para ver o detalhe por série
                      </span>
                    </CardTitle>
                    <Busca
                      busca={busca}
                      ordem={ordenacao.ordem}
                      direcao={ordenacao.direcao}
                      total={dados.candidatos.length}
                    />
                  </CardHeader>
                  <CardContent className="p-0">
                    {buscaSemResultado ? (
                      <div className="text-center py-12 border-t">
                        <SearchX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-600 font-medium">
                          Nenhum candidato encontrado para “{busca}”
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                          A busca olha nome e email.{' '}
                          <Link
                            href={construirHref({
                              busca: '',
                              ordem: ordenacao.ordem,
                              direcao: ordenacao.direcao,
                            })}
                            className="text-blue-600 hover:underline"
                          >
                            Ver todos os {dados.resumo.total_candidatos} candidatos
                          </Link>
                          .
                        </p>
                      </div>
                    ) : (
                      <>
                        <CabecalhoTabela busca={busca} ordenacao={ordenacao} />
                        {dados.candidatos.map((c) => (
                          <LinhaCandidato key={c.id} c={c} />
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
