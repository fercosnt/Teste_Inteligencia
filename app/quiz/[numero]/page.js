'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, ArrowRight, CheckCircle } from 'lucide-react'
import { getNumeroOpcoes, getSerie, getImagemPath, getOpcaoImagemPath, TOTAL_QUESTOES } from '@/lib/quiz-data'

export default function Questao() {
  const router = useRouter()
  const params = useParams()
  const numeroQuestao = parseInt(params.numero)

  const [respostaSelecionada, setRespostaSelecionada] = useState(null)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [candidato, setCandidato] = useState(null)
  const [tempoFormatado, setTempoFormatado] = useState('00:00:00')

  // Verificar dados e redirecionar se necessário
  useEffect(() => {
    try {
      const dadosCandidato = localStorage.getItem('candidato')
      const dataInicio = localStorage.getItem('dataInicio')

      if (!dadosCandidato || !dataInicio) {
        router.push('/')
        return
      }

      setCandidato(JSON.parse(dadosCandidato))
    } catch (error) {
      console.error('Erro ao acessar localStorage:', error)
      router.push('/')
    }
  }, [router])

  // Cronômetro
  useEffect(() => {
    try {
      const dataInicio = localStorage.getItem('dataInicio')
      if (!dataInicio) return

      const interval = setInterval(() => {
        const inicio = new Date(dataInicio)
        const agora = new Date()
        const diff = Math.floor((agora - inicio) / 1000)
        setTempoDecorrido(diff)
      }, 1000)

      return () => clearInterval(interval)
    } catch (error) {
      console.error('Erro ao iniciar cronômetro:', error)
    }
  }, [])

  useEffect(() => {
    const horas = Math.floor(tempoDecorrido / 3600)
    const minutos = Math.floor((tempoDecorrido % 3600) / 60)
    const segundos = tempoDecorrido % 60

    setTempoFormatado(
      `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
    )
  }, [tempoDecorrido])

  const handleProxima = () => {
    if (respostaSelecionada === null) {
      alert('Por favor, selecione uma resposta antes de continuar.')
      return
    }

    try {
      // Salvar resposta com tratamento de erro
      const respostasStr = localStorage.getItem('respostas')
      const respostas = respostasStr ? JSON.parse(respostasStr) : []
      respostas[numeroQuestao - 1] = respostaSelecionada
      localStorage.setItem('respostas', JSON.stringify(respostas))

      // Ir para próxima questão ou resultado
      if (numeroQuestao < TOTAL_QUESTOES) {
        router.push(`/quiz/${numeroQuestao + 1}`)
      } else {
        // Última questão - salvar data fim e ir para resultado
        const dataFim = new Date().toISOString()
        localStorage.setItem('dataFim', dataFim)
        router.push('/resultado')
      }
    } catch (error) {
      console.error('Erro ao salvar resposta:', error)
      alert('Erro ao salvar resposta. Por favor, tente novamente.')
    }
  }

  const numeroOpcoes = getNumeroOpcoes(numeroQuestao)
  const serie = getSerie(numeroQuestao)
  const imagemPath = getImagemPath(numeroQuestao)
  const progresso = (numeroQuestao / TOTAL_QUESTOES) * 100

  if (!candidato) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    // A partir de sm a tela vira uma coluna de altura fixa: tudo que tem tamanho
    // próprio (cabeçalho, opções, botão) fica com o seu, e a matriz absorve o
    // que sobrar. É o que faz a questão caber sem rolagem em qualquer altura de
    // janela, sem depender de vh chutado. No celular volta ao fluxo normal, com
    // rolagem, porque lá não cabe mesmo.
    <div
      className="min-h-screen sm:h-screen sm:overflow-hidden flex flex-col p-3 sm:p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/assets/background-gradient.webp)' }}
    >
      <div className="max-w-5xl mx-auto w-full flex flex-col sm:flex-1 sm:min-h-0">
        {/* Header fixo */}
        <Card className="shadow-lg mb-3 shrink-0">
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/assets/tochinha.png"
                  alt="Beauty Smile"
                  width={36}
                  height={36}
                  className="h-9 w-auto"
                />
                <Badge variant="secondary" className="px-3 py-0.5">
                  Série {serie}
                </Badge>
                <span className="text-gray-600 text-sm">
                  Questão {numeroQuestao} de {TOTAL_QUESTOES}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-cyan-50 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4 text-cyan-600" />
                <span className="tabular-nums font-mono text-sm">{tempoFormatado}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <Progress value={progresso} className="h-1.5 grow" />
              <span className="text-xs text-gray-500 tabular-nums shrink-0">
                {Math.round(progresso)}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Questão */}
        <Card className="shadow-xl sm:flex-1 sm:min-h-0 sm:flex sm:flex-col">
          <CardContent className="p-4 sm:p-5 sm:flex-1 sm:min-h-0 sm:flex sm:flex-col">
            {/* Imagem da Matriz.
                As imagens são recortadas no conteúdo (scripts/recortar-imagens.js),
                então `object-contain` basta — sem escala e sem caso especial por
                questão. No celular vale o aspecto natural; no desktop ela estica
                para preencher a sobra da coluna. */}
            <div className="mb-4 sm:flex-1 sm:min-h-0 sm:flex sm:flex-col">
              <div className="relative mx-auto w-full max-w-2xl aspect-[3/2] sm:aspect-auto sm:flex-1 sm:min-h-0">
                <Image
                  src={imagemPath}
                  alt={`Questão ${numeroQuestao} - Série ${serie}`}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 92vw, 672px"
                  priority
                />
              </div>
              <p className="text-center text-gray-600 mt-3 text-sm shrink-0">
                Selecione a opção que melhor completa a matriz acima
              </p>
            </div>

            {/* Opções de Resposta.
                As colunas seguem o número de opções da questão, para tudo caber
                numa linha só no desktop em vez de quebrar em duas. */}
            <div className="shrink-0">
              <h3 className="mb-3 text-center text-gray-700 font-medium text-sm">
                Opções de Resposta
              </h3>
              <div
                className={`grid grid-cols-3 gap-2 sm:gap-3 ${
                  numeroOpcoes === 6 ? 'sm:grid-cols-6' : 'sm:grid-cols-4 lg:grid-cols-8'
                }`}
              >
                {Array.from({ length: numeroOpcoes }, (_, i) => i + 1).map((opcao) => {
                  const selecionada = respostaSelecionada === opcao

                  return (
                    <button
                      key={opcao}
                      onClick={() => setRespostaSelecionada(opcao)}
                      aria-pressed={selecionada}
                      aria-label={`Opção ${opcao}`}
                      className={`
                        relative rounded-lg aspect-[3/2] p-1.5 transition-all
                        flex items-center justify-center
                        ${
                          selecionada
                            ? // Selecionado: anel grosso, fundo ciano e leve destaque.
                              'border-[3px] border-cyan-600 bg-cyan-50 ring-2 ring-cyan-600/30 shadow-md scale-[1.03]'
                            : // Hover: só levanta um pouco. Nada de cor de seleção,
                              // para ninguém achar que marcou sem ter marcado.
                              'border border-gray-300 bg-white hover:border-gray-400 hover:shadow-md'
                        }
                      `}
                    >
                      <div className="relative w-full h-full">
                        <Image
                          src={getOpcaoImagemPath(numeroQuestao, opcao)}
                          alt=""
                          fill
                          className="object-contain"
                          sizes="(max-width: 640px) 30vw, 12vw"
                        />
                      </div>

                      <span className="absolute bottom-0.5 left-1 text-[10px] font-medium text-gray-400 tabular-nums">
                        {opcao}
                      </span>

                      {selecionada && (
                        <CheckCircle className="w-5 h-5 text-white fill-cyan-600 absolute -top-2 -right-2 z-10" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Botão Próxima */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <Button
                onClick={handleProxima}
                disabled={respostaSelecionada === null}
                className="w-full sm:w-auto px-12"
                style={{
                  backgroundColor: respostaSelecionada === null ? undefined : '#00109e',
                  color: respostaSelecionada === null ? undefined : 'white'
                }}
              >
                {numeroQuestao === TOTAL_QUESTOES ? 'Finalizar Teste' : 'Próxima Questão'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Altura reservada: sem isso, a página pula ao selecionar. */}
              <p className="text-xs text-amber-600 h-4">
                {respostaSelecionada === null && 'Selecione uma opção para continuar'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Aviso */}
        <div className="mt-3 text-center shrink-0">
          <p className="text-xs text-white bg-black/30 backdrop-blur-sm inline-block px-3 py-1.5 rounded-lg">
            ⚠️ Atenção: Não será possível voltar após avançar para a próxima questão
          </p>
        </div>
      </div>
    </div>
  )
}
