'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Trophy, Clock, Target, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Image from 'next/image'
import { TOTAL_QUESTOES } from '@/lib/quiz-data'

// Helper para logging condicional (apenas em desenvolvimento)
const isDev = process.env.NODE_ENV === 'development'
const log = (...args) => {
  if (isDev) {
    console.log(...args)
  }
}
const logError = (...args) => {
  if (isDev) {
    console.error(...args)
  }
}

// Helper para acesso seguro ao localStorage
const getLocalStorageItem = (key) => {
  try {
    return localStorage.getItem(key)
  } catch (error) {
    logError('Erro ao acessar localStorage:', error)
    return null
  }
}

const setLocalStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    logError('Erro ao salvar no localStorage:', error)
    return false
  }
}

export default function Resultado() {
  const router = useRouter()
  const [resultado, setResultado] = useState(null)
  const [enviando, setEnviando] = useState(true)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState(null)
  // Vem da resposta de /api/resultados — o cliente não sabe calcular isto.
  const [pontuacao, setPontuacao] = useState(null)
  const enviadoRef = useRef(false)

  const enviarResultado = async (dados) => {
    setEnviando(true)
    setErro(null)

    try {
      // Enviamos apenas os dados crus e recebemos a nota de volta. O gabarito
      // vive só no banco (raven_gabarito/raven_acertos) e em
      // lib/gabarito-servidor.js — nunca no bundle. Ver PRD seção 8.2.
      const response = await fetch('/api/resultados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: dados.nome,
          email: dados.email,
          telefone: dados.telefone,
          dataInicio: dados.dataInicio,
          dataFim: dados.dataFim,
          respostas: dados.respostas,
        }),
      })

      log('📡 Response status:', response.status)

      if (!response.ok) {
        const { erro } = await response.json().catch(() => ({}))
        throw new Error(erro || `Erro ${response.status} ao gravar o resultado`)
      }

      const responseData = await response.json().catch(() => ({}))
      log('✅ Resultado gravado:', responseData)

      // A nota exibida é a que o banco calculou, não uma conta feita aqui.
      // É o que permite o gabarito não existir no bundle do cliente.
      setPontuacao({
        pontuacao: responseData.pontuacao,
        percentual: responseData.percentual,
      })
      setEnviado(true)
    } catch (error) {
      logError('❌ Erro ao gravar resultado:', error)
      setErro(error.message)
    } finally {
      setEnviando(false)
    }
  }

  useEffect(() => {
    try {
      // Verificar dados com tratamento de erro
      const candidatoStr = getLocalStorageItem('candidato')
      const respostasStr = getLocalStorageItem('respostas')
      const dataInicio = getLocalStorageItem('dataInicio')
      const dataFim = getLocalStorageItem('dataFim')

      if (!candidatoStr || !respostasStr || !dataInicio || !dataFim) {
        router.push('/')
        return
      }

      const candidato = JSON.parse(candidatoStr)
      const respostas = JSON.parse(respostasStr)

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
        respostas
      }

      setResultado(dadosResultado)
    } catch (error) {
      logError('Erro ao processar dados do resultado:', error)
      router.push('/')
    }
  }, [router])

  // Enviar automaticamente quando resultado estiver pronto (apenas uma vez)
  useEffect(() => {
    if (resultado && !enviadoRef.current) {
      enviadoRef.current = true
      enviarResultado(resultado)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado])

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600)
    const minutos = Math.floor((segundos % 3600) / 60)
    const segs = segundos % 60
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`
  }

  // A classificação de desempenho saiu daqui de propósito.
  //
  // Interpretar a pontuação é leitura do RH, com a escala normativa do teste
  // (ver raven_classificacao no banco) — e ela vive só no dashboard. Além
  // disso, o rótulo que existia aqui usava faixas próprias, diferentes das do
  // banco: um candidato com 45% lia "Precisa Melhorar" na tela enquanto o
  // dashboard o mostrava como "Regular". Duas réguas para o mesmo número.

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

  return (
    <div
      className="min-h-screen p-4 py-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/assets/background-gradient.webp)' }}
    >
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-2xl">
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
                src="/assets/tochinha p fundo escuro.png"
                alt="Beauty Smile"
                width={56}
                height={56}
                className="h-14 w-auto"
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
                  <strong className="text-green-700">Sucesso!</strong> Seus resultados foram registrados.
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

            {/* Resultado Principal — número puro, sem rótulo de desempenho.
                Só aparece quando o banco responde: é ele quem sabe a nota. */}
            {pontuacao && (
              <div className="text-center py-6">
                <div className="space-y-2">
                  <div>
                    <div className="text-6xl font-bold mb-2">{pontuacao.pontuacao}</div>
                    <div className="text-gray-600">de {TOTAL_QUESTOES} questões corretas</div>
                  </div>

                  <div className="mt-4">
                    <Progress value={Number(pontuacao.percentual)} className="h-3 max-w-md mx-auto" />
                    <p className="text-2xl text-cyan-600 mt-2 font-semibold">{pontuacao.percentual}%</p>
                  </div>
                </div>
              </div>
            )}

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
                      <p className="text-xl font-semibold">
                        {pontuacao ? `${pontuacao.percentual}%` : '—'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {pontuacao
                          ? `${pontuacao.pontuacao} de ${TOTAL_QUESTOES} corretas`
                          : 'aguardando o registro'}
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
                    <li>Seu resultado já está registrado e disponível para a equipe de RH</li>
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
