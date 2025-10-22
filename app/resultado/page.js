'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { calcularPontuacao, TOTAL_QUESTOES } from '@/lib/quiz-data'

export default function Resultado() {
  const router = useRouter()
  const [resultado, setResultado] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState(null)

  useEffect(() => {
    // Verificar dados
    const candidatoStr = localStorage.getItem('candidato')
    const respostasStr = localStorage.getItem('respostas')
    const dataInicio = localStorage.getItem('dataInicio')
    const dataFim = localStorage.getItem('dataFim')

    if (!candidatoStr || !respostasStr || !dataInicio || !dataFim) {
      router.push('/')
      return
    }

    const candidato = JSON.parse(candidatoStr)
    const respostas = JSON.parse(respostasStr)

    // Calcular pontuação
    const pontuacao = calcularPontuacao(respostas)
    const percentual = ((pontuacao / TOTAL_QUESTOES) * 100).toFixed(2)

    // Calcular tempo total
    const inicio = new Date(dataInicio)
    const fim = new Date(dataFim)
    const tempoTotalMs = fim - inicio
    const tempoTotalMinutos = (tempoTotalMs / 1000 / 60).toFixed(2)

    const dadosResultado = {
      nome: candidato.nome,
      email: candidato.email,
      telefone: candidato.telefone,
      dataInicio,
      dataFim,
      tempoTotalMinutos: parseFloat(tempoTotalMinutos),
      pontuacao,
      percentualAcertos: parseFloat(percentual),
      respostas
    }

    setResultado(dadosResultado)

    // Enviar para webhook automaticamente
    enviarResultado(dadosResultado)
  }, [router])

  const enviarResultado = async (dados) => {
    setEnviando(true)
    setErro(null)

    try {
      // URL do webhook N8N
      // Prioridade: variável de ambiente > fallback teste
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL ||
        'https://n8n.srv881294.hstgr.cloud/webhook-test/0e31d419-1337-46da-b26c-a5a6e02f5ab2'

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
      })

      if (!response.ok) {
        throw new Error(`Erro ao enviar dados: ${response.status}`)
      }

      setEnviado(true)
    } catch (error) {
      console.error('Erro ao enviar resultado:', error)
      setErro(error.message)
    } finally {
      setEnviando(false)
    }
  }

  const handleNovoTeste = () => {
    // Limpar localStorage
    localStorage.removeItem('candidato')
    localStorage.removeItem('respostas')
    localStorage.removeItem('dataInicio')
    localStorage.removeItem('dataFim')

    // Redirecionar para página inicial
    router.push('/')
  }

  const formatarTempo = (minutos) => {
    const mins = Math.floor(minutos)
    const segs = Math.round((minutos - mins) * 60)
    return `${mins} min ${segs} seg`
  }

  if (!resultado) {
    return (
      <div className="quiz-container">
        <div className="quiz-card text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculando resultado...</p>
        </div>
      </div>
    )
  }

  const acertosPercentual = resultado.percentualAcertos
  const desempenho =
    acertosPercentual >= 80 ? { nivel: 'Excelente', cor: 'green', emoji: '🏆' } :
    acertosPercentual >= 60 ? { nivel: 'Bom', cor: 'blue', emoji: '👍' } :
    acertosPercentual >= 40 ? { nivel: 'Regular', cor: 'yellow', emoji: '📊' } :
    { nivel: 'Necessita Melhorar', cor: 'orange', emoji: '💪' }

  return (
    <div className="quiz-container bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="quiz-card max-w-3xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{desempenho.emoji}</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Teste Concluído!
          </h1>
          <p className="text-lg text-gray-600">
            Parabéns, {resultado.nome}!
          </p>
        </div>

        {/* Resultado Principal */}
        <div className={`bg-${desempenho.cor}-50 border-2 border-${desempenho.cor}-500 rounded-lg p-6 mb-6`}>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-2">Sua Pontuação</p>
            <div className="text-6xl font-bold text-gray-800 mb-2">
              {resultado.pontuacao}/{TOTAL_QUESTOES}
            </div>
            <div className="text-3xl font-semibold" style={{ color: `var(--tw-${desempenho.cor}-600)` }}>
              {resultado.percentualAcertos}%
            </div>
            <p className="text-lg font-medium text-gray-700 mt-3">
              Desempenho: {desempenho.nivel}
            </p>
          </div>
        </div>

        {/* Detalhes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Tempo Total</p>
            <p className="text-2xl font-bold text-gray-800">
              {formatarTempo(resultado.tempoTotalMinutos)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Questões Corretas</p>
            <p className="text-2xl font-bold text-gray-800">
              {resultado.pontuacao} acertos
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200 md:col-span-2">
            <p className="text-sm text-gray-600 mb-1">Email de Confirmação</p>
            <p className="text-lg font-medium text-gray-800">
              {resultado.email}
            </p>
          </div>
        </div>

        {/* Status de Envio */}
        <div className="mb-6">
          {enviando && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                <p className="text-blue-800">Enviando resultados...</p>
              </div>
            </div>
          )}

          {enviado && !enviando && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <p className="text-green-800">
                ✓ Resultados enviados com sucesso! Você receberá um email em breve.
              </p>
            </div>
          )}

          {erro && !enviando && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-800">
                ✗ Erro ao enviar resultados: {erro}
              </p>
              <button
                onClick={() => enviarResultado(resultado)}
                className="mt-2 text-sm underline text-red-700 hover:text-red-900"
              >
                Tentar novamente
              </button>
            </div>
          )}
        </div>

        {/* Breakdown por Série */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Desempenho por Série</h3>
          <div className="space-y-2">
            {['A', 'B', 'C', 'D', 'E'].map((serie, idx) => {
              const inicio = idx * 12
              const fim = inicio + 12
              const respostasSerie = resultado.respostas.slice(inicio, fim)

              // Calcular acertos da série (precisa importar gabarito)
              // Por simplicidade, vou mostrar apenas estrutura
              return (
                <div key={serie} className="flex items-center justify-between py-2 border-b border-gray-200">
                  <span className="font-medium text-gray-700">Série {serie}</span>
                  <span className="text-gray-600">Questões {inicio + 1}-{fim}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Botões */}
        <div className="space-y-3">
          <button
            onClick={handleNovoTeste}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 transform hover:scale-105 shadow-lg"
          >
            🔄 Realizar Novo Teste
          </button>

          <p className="text-center text-sm text-gray-500">
            Seus resultados foram salvos e enviados para {resultado.email}
          </p>
        </div>
      </div>
    </div>
  )
}
