'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getNumeroOpcoes, getSerie, getImagemPath, TOTAL_QUESTOES } from '@/lib/quiz-data'

export default function Questao() {
  const router = useRouter()
  const params = useParams()
  const numeroQuestao = parseInt(params.numero)

  const [respostaSelecionada, setRespostaSelecionada] = useState(null)
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [candidato, setCandidato] = useState(null)

  // Verificar dados e redirecionar se necessário
  useEffect(() => {
    const dadosCandidato = localStorage.getItem('candidato')
    const dataInicio = localStorage.getItem('dataInicio')

    if (!dadosCandidato || !dataInicio) {
      router.push('/')
      return
    }

    setCandidato(JSON.parse(dadosCandidato))
  }, [router])

  // Cronômetro
  useEffect(() => {
    const dataInicio = localStorage.getItem('dataInicio')
    if (!dataInicio) return

    const interval = setInterval(() => {
      const inicio = new Date(dataInicio)
      const agora = new Date()
      const diff = Math.floor((agora - inicio) / 1000) // diferença em segundos
      setTempoDecorrido(diff)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`
  }

  const handleProxima = () => {
    if (respostaSelecionada === null) {
      alert('Por favor, selecione uma resposta antes de continuar.')
      return
    }

    // Salvar resposta
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
  }

  const numeroOpcoes = getNumeroOpcoes(numeroQuestao)
  const serie = getSerie(numeroQuestao)
  const imagemPath = getImagemPath(numeroQuestao)
  const progresso = (numeroQuestao / TOTAL_QUESTOES) * 100

  if (!candidato) {
    return (
      <div className="quiz-container">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      {/* Header com cronômetro e progresso */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-sm text-gray-600">Candidato</p>
              <p className="font-semibold text-gray-800">{candidato.nome}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Tempo Decorrido</p>
              <p className="font-mono text-xl font-bold text-blue-600">
                {formatarTempo(tempoDecorrido)}
              </p>
            </div>
          </div>

          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-medium text-gray-700">
                Questão {numeroQuestao} de {TOTAL_QUESTOES} - {serie}
              </p>
              <p className="text-sm font-medium text-gray-700">
                {Math.round(progresso)}%
              </p>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progresso}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Card da questão */}
      <div className="max-w-4xl mx-auto">
        <div className="quiz-card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Série {serie} - Questão {numeroQuestao}
          </h2>

          {/* Imagem da matriz */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 flex justify-center items-center">
            <div className="relative w-full max-w-2xl" style={{ aspectRatio: '1/1' }}>
              <Image
                src={imagemPath}
                alt={`Questão ${numeroQuestao}`}
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Opções de resposta */}
          <div className="mb-8">
            <p className="text-sm font-medium text-gray-700 mb-4">
              Selecione a opção que completa corretamente o padrão:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: numeroOpcoes }, (_, i) => i + 1).map((opcao) => (
                <button
                  key={opcao}
                  onClick={() => setRespostaSelecionada(opcao)}
                  className={`option-button py-4 px-6 border-2 rounded-lg font-semibold text-lg transition-all ${
                    respostaSelecionada === opcao
                      ? 'selected'
                      : 'border-gray-300 bg-white hover:border-blue-400 text-gray-700'
                  }`}
                >
                  {opcao}
                </button>
              ))}
            </div>
          </div>

          {/* Botão Próxima */}
          <button
            onClick={handleProxima}
            disabled={respostaSelecionada === null}
            className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all ${
              respostaSelecionada === null
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white transform hover:scale-105 shadow-lg'
            }`}
          >
            {numeroQuestao < TOTAL_QUESTOES ? 'Próxima Questão →' : 'Finalizar Teste ✓'}
          </button>

          <p className="text-center text-sm text-gray-500 mt-4">
            ⚠️ Lembre-se: não será possível voltar após avançar
          </p>
        </div>
      </div>
    </div>
  )
}
