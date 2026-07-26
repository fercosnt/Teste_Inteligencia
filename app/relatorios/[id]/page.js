import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { normalizarBusca, normalizarOrdem, construirHref } from '@/lib/relatorios-query'
import {
  ehUuid,
  formatarDataHora,
  formatarDuracao,
  formatarNumero,
  montarSeries,
  compararTempo,
  compararPontuacao,
  TOTAL_QUESTOES,
} from '@/lib/relatorios-candidato'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ArrowLeft, Clock, Target, TrendingUp } from 'lucide-react'
import CardMetrica from '../componentes/card-metrica'
import BarraSerie from '../componentes/barra-serie'
import DetalheQuestoes from '../componentes/detalhe-questoes'
import ReguaClassificacao from '../componentes/regua-classificacao'
import Tentativas from '../componentes/tentativas'
import Excluir from '../componentes/excluir'

export const dynamic = 'force-dynamic'

// Tela dedicada de um candidato.
//
// É Server Component de ponta a ponta, e precisa continuar sendo: a grade
// questão a questão compara com lib/gabarito-servidor.js, que está atrás de
// `server-only`. Nada aqui pode virar 'use client'.
//
// O que a tela NÃO promete: tempo por questão e tempo por série. O banco guarda
// só data_inicio, data_fim e o array de respostas, então esse dado não existe —
// nem para os testes já aplicados. Ver PRD/proximos-passos.md.

async function carregarCandidato(id) {
  const supabase = getSupabaseAdmin()

  const [candidato, resumo, escala] = await Promise.all([
    supabase.from('raven_resultados_detalhe').select('*').eq('id', id).maybeSingle(),
    supabase.from('raven_dashboard_resumo').select('*').maybeSingle(),
    supabase.from('raven_escala_classificacao').select('*').order('ordem'),
  ])

  // Linha inexistente é 404, não erro: o id vem da URL e pode ser de um
  // candidato já apagado. Só erro de verdade vira mensagem de falha.
  if (candidato.error) throw new Error(candidato.error.message)
  if (!candidato.data) return null

  const erro = resumo.error || escala.error
  if (erro) throw new Error(erro.message)

  // As outras tentativas da mesma pessoa. Só busca quando existem — o caso
  // comum é uma tentativa só, e uma consulta a mais por ficha não se paga.
  let tentativas = [candidato.data]
  if (candidato.data.total_tentativas > 1) {
    const outras = await supabase
      .from('raven_resultados_detalhe')
      .select('id, nome, email, data_inicio, pontuacao_total, classificacao, tentativa, vale')
      .eq('email', candidato.data.email)
      .order('tentativa')

    if (outras.error) throw new Error(outras.error.message)
    tentativas = outras.data ?? tentativas
  }

  return {
    candidato: candidato.data,
    resumo: resumo.data,
    escala: escala.data ?? [],
    tentativas,
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params
  if (!ehUuid(id)) return { title: 'Candidato não encontrado' }

  const supabase = getSupabaseAdmin()
  const { data } = await supabase
    .from('raven_resultados_detalhe')
    .select('nome')
    .eq('id', id)
    .maybeSingle()

  return { title: data?.nome ? `${data.nome} — Matrizes de Raven` : 'Candidato não encontrado' }
}

function Ficha({ rotulo, valor }) {
  if (!valor) return null
  return (
    <div>
      <dt className="text-xs text-gray-500">{rotulo}</dt>
      <dd className="text-sm text-gray-800 tabular-nums">{valor}</dd>
    </div>
  )
}

export default async function Candidato({ params, searchParams }) {
  const { id } = await params
  if (!ehUuid(id)) notFound()

  const consulta = (await searchParams) ?? {}
  const busca = normalizarBusca(consulta.q)
  const ordenacao = normalizarOrdem(consulta.ordem, consulta.dir)

  // O link de volta reconstrói a lista como ela estava — mesma busca, mesma
  // ordenação. Sem isso, sair da tela do candidato desfaria o filtro que o RH
  // acabou de montar, que é o custo real de ter trocado o acordeão por uma rota.
  const voltar = construirHref({ busca, ordem: ordenacao.ordem, direcao: ordenacao.direcao })

  // Mesma query, mas para pendurar em links entre tentativas — assim o "voltar"
  // continua funcionando depois de navegar de uma tentativa para outra.
  const consultaDaLista = voltar.includes('?') ? `?${voltar.split('?')[1]}` : ''

  let dados
  let erroCarregamento = null

  try {
    dados = await carregarCandidato(id)
  } catch (error) {
    erroCarregamento = error.message
  }

  if (!erroCarregamento && !dados) notFound()

  const c = dados?.candidato
  const tentativas = dados?.tentativas ?? []
  const primeira = tentativas.find((t) => t.vale)
  const series = c ? montarSeries(c, dados.resumo) : []
  const tempo = c ? compararTempo(c.tempo_total_segundos, dados.resumo?.tempo_medio_minutos) : null
  const pontuacao = c ? compararPontuacao(c.pontuacao_total, dados.resumo?.pontuacao_media) : null

  // Um candidato sozinho na base é a própria média — comparar seria comparar
  // com ele mesmo e sugerir uma referência que não existe.
  const baseComparavel = Number(dados?.resumo?.total_candidatos ?? 0) > 1

  return (
    <div
      className="min-h-screen p-4 py-8 bg-cover bg-center bg-no-repeat print:bg-none print:p-0"
      style={{ backgroundImage: 'url(/assets/background-gradient.webp)' }}
    >
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          href={voltar}
          className="inline-flex items-center gap-2 text-sm text-white hover:text-white/80 transition-colors drop-shadow print:hidden"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a lista
        </Link>

        <Card className="shadow-2xl print:shadow-none">
          <CardHeader className="bg-gradient-to-r from-blue-700 via-purple-600 to-cyan-500 text-white rounded-t-lg">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-2xl break-words">
                  {erroCarregamento ? 'Candidato' : c.nome}
                </CardTitle>
                <p className="text-white/90 mt-1 text-sm break-all">
                  {erroCarregamento ? 'Matrizes de Raven' : c.email}
                </p>
              </div>
              <Image
                src="/assets/tochinha p fundo escuro.png"
                alt="Beauty Smile"
                width={56}
                height={56}
                className="h-14 w-auto hidden sm:block shrink-0"
              />
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {erroCarregamento ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-gray-700">
                  <strong className="text-red-700">
                    Não foi possível carregar este candidato.
                  </strong>{' '}
                  {erroCarregamento}
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {!c.vale && (
                  // Abriu uma tentativa que não é a que conta. Sem este aviso a
                  // tela mostraria uma nota com a mesma autoridade da válida,
                  // sendo que esta já teve contato com as matrizes.
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <AlertDescription className="text-gray-700">
                      <strong className="text-amber-800">
                        Esta é a {c.tentativa}ª tentativa deste candidato.
                      </strong>{' '}
                      A nota que vale é a da 1ª — nesta ele já tinha visto as matrizes, e o
                      resultado não entra nas médias da base.{' '}
                      <Link
                        href={`/relatorios/${primeira?.id ?? ''}${consultaDaLista}`}
                        className="text-blue-700 underline"
                      >
                        Abrir a 1ª tentativa
                      </Link>
                      .
                    </AlertDescription>
                  </Alert>
                )}

                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b">
                  <Ficha rotulo="Telefone" valor={c.telefone} />
                  <Ficha rotulo="Iniciado em" valor={formatarDataHora(c.data_inicio)} />
                  <Ficha rotulo="Concluído em" valor={formatarDataHora(c.data_fim)} />
                  <Ficha rotulo="Classificação" valor={c.classificacao} />
                </dl>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <CardMetrica
                    icone={Target}
                    rotulo="Pontuação"
                    valor={c.pontuacao_total}
                    sufixo={`/${TOTAL_QUESTOES}`}
                    cor={{ bg: 'bg-blue-50', border: 'border-blue-200', texto: 'text-blue-600' }}
                    detalhe={
                      baseComparavel && pontuacao ? (
                        <>
                          média da base{' '}
                          <span className="tabular-nums">{formatarNumero(pontuacao.media)}</span>
                          {pontuacao.sentido !== 'media' && (
                            <span
                              className={
                                pontuacao.sentido === 'acima'
                                  ? 'text-emerald-700 font-medium'
                                  : 'text-amber-700 font-medium'
                              }
                            >
                              {' '}
                              ({pontuacao.diferenca > 0 ? '+' : '−'}
                              {formatarNumero(Math.abs(pontuacao.diferenca))})
                            </span>
                          )}
                        </>
                      ) : null
                    }
                  />
                  <CardMetrica
                    icone={TrendingUp}
                    rotulo="Acertos"
                    valor={formatarNumero(c.percentual_acertos)}
                    sufixo="%"
                    cor={{ bg: 'bg-amber-50', border: 'border-amber-200', texto: 'text-amber-600' }}
                    detalhe={`${c.pontuacao_total} de ${TOTAL_QUESTOES} questões`}
                  />
                  <CardMetrica
                    icone={Clock}
                    rotulo="Tempo"
                    valor={formatarDuracao(c.tempo_total_segundos)}
                    cor={{
                      bg: 'bg-purple-50',
                      border: 'border-purple-200',
                      texto: 'text-purple-600',
                    }}
                    detalhe={
                      baseComparavel && tempo ? (
                        <>
                          média da base{' '}
                          <span className="tabular-nums">
                            {formatarDuracao(tempo.mediaSegundos)}
                          </span>
                          {tempo.sentido !== 'media' && (
                            <span className="font-medium">
                              {' '}
                              ({formatarNumero(tempo.percentual)}%{' '}
                              {tempo.sentido === 'rapido' ? 'mais rápido' : 'mais lento'})
                            </span>
                          )}
                        </>
                      ) : null
                    }
                  />
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Onde este candidato cai na escala
                      <span className="block text-xs font-normal text-gray-500 mt-1">
                        Escala normativa do SPM, por acertos — a largura de cada faixa é o
                        tamanho do seu intervalo
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReguaClassificacao
                      faixas={dados.escala}
                      pontuacao={c.pontuacao_total}
                      descricao={c.classificacao_descricao}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Desempenho por série
                      {baseComparavel && (
                        <span className="block text-xs font-normal text-gray-500 mt-1">
                          O risco escuro em cada barra marca a média da base
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {series.map((s) => (
                      <div key={s.letra} className="space-y-3">
                        <BarraSerie
                          letra={s.letra}
                          acertos={s.acertos}
                          percentual={s.percentual}
                          media={baseComparavel ? s.media : null}
                          diferenca={baseComparavel ? s.diferenca : null}
                        />
                        <DetalheQuestoes letra={s.letra} respostas={c.respostas} />
                      </div>
                    ))}
                    <p className="text-xs text-gray-500 border-t pt-3">
                      Cada quadro traz a questão, se acertou e a resposta marcada — quando errou,
                      o gabarito aparece depois da barra.
                    </p>
                  </CardContent>
                </Card>

                {tentativas.length > 1 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        Tentativas
                        <span className="block text-xs font-normal text-gray-500 mt-1">
                          Este candidato fez o teste {tentativas.length} vezes. Só a 1ª conta para
                          a nota e para as médias
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tentativas
                        tentativas={tentativas}
                        idAtual={c.id}
                        voltar={consultaDaLista}
                      />
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end border-t pt-4 print:hidden">
                  <Excluir
                    id={c.id}
                    nome={c.nome}
                    email={c.email}
                    escopo="candidato"
                    totalTentativas={tentativas.length}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
