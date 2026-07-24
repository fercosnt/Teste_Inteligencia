import { getSupabaseAdmin } from '@/lib/supabase-server'
import { gabarito, series } from '@/lib/quiz-data'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Users, Clock, Target, TrendingUp, Inbox } from 'lucide-react'
import Image from 'next/image'
import SairButton from './sair-button'

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

async function carregarDados() {
  const supabase = getSupabaseAdmin()

  const [resumo, classificacao, candidatos] = await Promise.all([
    supabase.from('raven_dashboard_resumo').select('*').single(),
    supabase.from('raven_dashboard_classificacao').select('*'),
    supabase.from('raven_resultados_detalhe').select('*').order('created_at', { ascending: false }),
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
            <span className="text-gray-600">{c.classificacao}</span>
          </div>
        </div>
      </summary>

      <div className="px-4 pb-5 pt-1 bg-gray-50/60 space-y-5">
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

export default async function Relatorios() {
  let dados
  let erroCarregamento = null

  try {
    dados = await carregarDados()
  } catch (error) {
    erroCarregamento = error.message
  }

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

            {!erroCarregamento && dados.candidatos.length === 0 && (
              <div className="text-center py-12">
                <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Nenhum candidato ainda</p>
                <p className="text-gray-500 text-sm mt-1">
                  Os resultados aparecem aqui assim que o primeiro teste for concluído.
                </p>
              </div>
            )}

            {!erroCarregamento && dados.candidatos.length > 0 && (
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
                      <CardTitle className="text-base">Distribuição por classificação</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {dados.classificacao.map((faixa) => (
                        <div key={faixa.classificacao}>
                          <div className="flex justify-between items-baseline text-sm mb-1">
                            <span>{faixa.classificacao}</span>
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
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Candidatos
                      <span className="text-gray-500 font-normal text-sm ml-2">
                        clique para ver o detalhe por série
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border-t">
                      {dados.candidatos.map((c) => (
                        <LinhaCandidato key={c.id} c={c} />
                      ))}
                    </div>
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
