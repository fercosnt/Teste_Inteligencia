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
    <div
      className="min-h-screen p-4 py-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/assets/background-gradient.png)' }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header fixo */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <Image
                  src="/assets/tochinha.png"
                  alt="Beauty Smile"
                  width={48}
                  height={48}
                  className="h-12 w-auto"
                />
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  Série {serie}
                </Badge>
                <span className="text-gray-600">
                  Questão {numeroQuestao} de {TOTAL_QUESTOES}
                </span>
              </div>

              <div className="flex items-center gap-2 bg-cyan-50 px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-cyan-600" />
                <span className="tabular-nums font-mono">{tempoFormatado}</span>
              </div>
            </div>

            <div className="mt-4">
              <Progress value={progresso} className="h-2" />
              <p className="text-sm text-gray-500 mt-1 text-center">
                {Math.round(progresso)}% concluído
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Questão */}
        <Card className="shadow-xl">
          <CardContent className="p-6 sm:p-8">
            {/* Imagem da Matriz */}
            <div className="mb-8">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 flex items-center justify-center">
                <div className="w-full max-w-2xl aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="relative w-full h-full overflow-hidden">
                    <Image
                      src={imagemPath}
                      alt={`Questão ${numeroQuestao} - Série ${serie}`}
                      fill
                      className="object-cover scale-[1.4]"
                      priority
                    />
                  </div>
                </div>
              </div>
              <p className="text-center text-gray-600 mt-4">
                Selecione a opção que melhor completa a matriz acima
              </p>
            </div>

            {/* Opções de Resposta */}
            <div>
              <h3 className="mb-4 text-center text-gray-700 font-medium">Opções de Resposta</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {Array.from({ length: numeroOpcoes }, (_, i) => i + 1).map((opcao) => (
                  <button
                    key={opcao}
                    onClick={() => setRespostaSelecionada(opcao)}
                    className={`
                      relative rounded-lg border-2 transition-all
                      hover:scale-105 hover:shadow-lg aspect-square
                      flex items-center justify-center overflow-hidden
                      ${
                        respostaSelecionada === opcao
                          ? 'border-cyan-600 bg-cyan-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-cyan-300'
                      }
                    `}
                  >
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      <Image
                        src={getOpcaoImagemPath(numeroQuestao, opcao)}
                        alt={`Opção ${opcao}`}
                        fill
                        className="object-cover scale-[3.0]"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      />
                      {respostaSelecionada === opcao && (
                        <CheckCircle className="w-5 h-5 text-cyan-600 absolute top-1 right-1 bg-white rounded-full z-10" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Botão Próxima */}
            <div className="mt-8 flex flex-col items-center gap-4">
              <Button
                onClick={handleProxima}
                disabled={respostaSelecionada === null}
                size="lg"
                className="w-full sm:w-auto px-12"
                style={{
                  backgroundColor: respostaSelecionada === null ? undefined : '#00109e',
                  color: respostaSelecionada === null ? undefined : 'white'
                }}
              >
                {numeroQuestao === TOTAL_QUESTOES ? 'Finalizar Teste' : 'Próxima Questão'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {respostaSelecionada === null && (
                <p className="text-sm text-amber-600">
                  Selecione uma opção para continuar
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Aviso */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white bg-black/30 backdrop-blur-sm inline-block px-4 py-2 rounded-lg">
            ⚠️ Atenção: Não será possível voltar após avançar para a próxima questão
          </p>
        </div>
      </div>
    </div>
  )
}
