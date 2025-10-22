'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Trophy, Clock, Target, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Image from 'next/image'
import { calcularPontuacao, TOTAL_QUESTOES } from '@/lib/quiz-data'

export default function Resultado() {
  const router = useRouter()
  const [resultado, setResultado] = useState(null)
  const [enviando, setEnviando] = useState(true)
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
    const tempoTotalSegundos = Math.floor(tempoTotalMs / 1000)
    const tempoTotalMinutos = (tempoTotalMs / 1000 / 60).toFixed(2)

    const dadosResultado = {
      nome: candidato.nome,
      email: candidato.email,
      telefone: candidato.telefone,
      dataInicio,
      dataFim,
      tempoTotalMinutos: parseFloat(tempoTotalMinutos),
      tempoTotalSegundos,
      pontuacao,
      percentualAcertos: parseFloat(percentual),
      respostas
    }

    setResultado(dadosResultado)
  }, [router])

  // Enviar automaticamente para produção quando resultado estiver pronto
  useEffect(() => {
    if (resultado && !enviado && !erro) {
      enviarResultado(resultado)
    }
  }, [resultado])

  const enviarResultado = async (dados) => {
    setEnviando(true)
    setErro(null)

    try {
      // URL do webhook N8N - Produção
      const webhookUrl = 'https://n8n.srv881294.hstgr.cloud/webhook/0e31d419-1337-46da-b26c-a5a6e02f5ab2'

      console.log('🔗 Enviando para webhook:', webhookUrl)
      console.log('📦 Dados:', JSON.stringify(dados, null, 2))

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dados),
        mode: 'cors',
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        console.error('❌ Erro do servidor:', errorText)

        if (response.status === 404) {
          throw new Error(`❌ Webhook não encontrado (404)\n\n✅ Verifique no N8N:\n1. Workflow está ATIVO?\n2. URL está correta?\n3. Endpoint correto?`)
        }

        throw new Error(`Erro ${response.status}: ${errorText || 'Verifique se o webhook está ativo no N8N'}`)
      }

      const responseData = await response.json().catch(() => ({}))
      console.log('✅ Resposta:', responseData)

      setEnviado(true)
    } catch (error) {
      console.error('❌ Erro completo:', error)
      setErro(error.message)
    } finally {
      setEnviando(false)
    }
  }

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`
  }

  const getNivelDesempenho = (percentual) => {
    const perc = parseFloat(percentual)
    if (perc >= 90) return { texto: 'Excelente', cor: 'text-green-600', bg: 'bg-green-50' }
    if (perc >= 75) return { texto: 'Muito Bom', cor: 'text-cyan-600', bg: 'bg-cyan-50' }
    if (perc >= 60) return { texto: 'Bom', cor: 'text-purple-600', bg: 'bg-purple-50' }
    if (perc >= 50) return { texto: 'Regular', cor: 'text-amber-600', bg: 'bg-amber-50' }
    return { texto: 'Precisa Melhorar', cor: 'text-red-600', bg: 'bg-red-50' }
  }

  if (!resultado) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculando resultado...</p>
        </div>
      </div>
    )
  }

  const nivel = getNivelDesempenho(resultado.percentualAcertos)

  return (
    <div
      className="min-h-screen p-4 py-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/assets/background-gradient.png)' }}
    >
      <div className="max-w-3xl mx-auto">
        <Card className="bg-white shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-700 via-purple-600 to-cyan-500 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="w-10 h-10" />
                <div>
                  <CardTitle className="text-2xl">Teste Finalizado!</CardTitle>
                  <p className="text-white/90 mt-1">
                    Parabéns, {resultado.nome}!
                  </p>
                </div>
              </div>
              <Image
                src="/assets/logo-marca.png"
                alt="Beauty Smile"
                width={40}
                height={40}
                className="h-10 w-auto"
              />
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Status de Envio */}
            {enviando && (
              <Alert className="border-cyan-200 bg-cyan-50">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-600"></div>
                  <AlertDescription className="text-gray-700">
                    Processando seus resultados...
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {enviado && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-gray-700">
                  <strong className="text-green-700">Sucesso!</strong> Seus resultados foram enviados por email.
                </AlertDescription>
              </Alert>
            )}

            {erro && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-gray-700">
                  <strong className="text-red-700">Erro ao enviar.</strong> {erro}
                  <button
                    onClick={() => enviarResultado(resultado)}
                    className="mt-2 text-sm underline text-red-700 hover:text-red-900 block"
                  >
                    Tentar novamente
                  </button>
                </AlertDescription>
              </Alert>
            )}

            {/* Resultado Principal */}
            <div className="text-center py-6">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${nivel.bg} mb-4`}>
                <Trophy className={`w-6 h-6 ${nivel.cor}`} />
                <span className={`${nivel.cor} font-semibold`}>{nivel.texto}</span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="text-6xl font-bold mb-2">{resultado.pontuacao}</div>
                  <div className="text-gray-600">de {TOTAL_QUESTOES} questões corretas</div>
                </div>

                <div className="mt-4">
                  <Progress value={parseFloat(resultado.percentualAcertos)} className="h-3 max-w-md mx-auto" />
                  <p className="text-2xl text-cyan-600 mt-2 font-semibold">{resultado.percentualAcertos}%</p>
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-cyan-50 border-cyan-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-6 h-6 text-cyan-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Tempo Total</p>
                      <p className="text-xl font-semibold tabular-nums">{formatarTempo(resultado.tempoTotalSegundos)}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {Math.round(resultado.tempoTotalMinutos)} minutos
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Target className="w-6 h-6 text-purple-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Taxa de Acerto</p>
                      <p className="text-xl font-semibold">{resultado.percentualAcertos}%</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {resultado.pontuacao} de {TOTAL_QUESTOES} corretas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Informações Adicionais */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="mb-2">
                    <strong>Próximos Passos:</strong>
                  </p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Você receberá um email com os resultados detalhados</li>
                    <li>O relatório completo será enviado para a equipe de RH</li>
                    <li>Aguarde o contato da equipe de recrutamento</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-white bg-black/30 backdrop-blur-sm inline-block px-4 py-2 rounded-lg mx-auto block w-fit">
          <p>Obrigado por participar do processo seletivo!</p>
        </div>
      </div>
    </div>
  )
}
