'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, Clock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react'
import Image from 'next/image'

export default function Instrucoes() {
  const router = useRouter()
  const [candidato, setCandidato] = useState(null)

  useEffect(() => {
    try {
      // Verificar se há dados do candidato com tratamento de erro
      const dadosCandidato = localStorage.getItem('candidato')
      if (!dadosCandidato) {
        router.push('/')
        return
      }
      setCandidato(JSON.parse(dadosCandidato))
    } catch (error) {
      console.error('Erro ao acessar localStorage:', error)
      router.push('/')
    }
  }, [router])

  const handleIniciar = () => {
    try {
      // Iniciar cronômetro
      const dataInicio = new Date().toISOString()
      localStorage.setItem('dataInicio', dataInicio)

      // Inicializar array de respostas
      localStorage.setItem('respostas', JSON.stringify([]))

      // Ir para primeira questão
      router.push('/quiz/1')
    } catch (error) {
      console.error('Erro ao inicializar teste:', error)
      alert('Erro ao iniciar o teste. Por favor, verifique as configurações do navegador.')
    }
  }

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
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-2xl">
          <CardHeader className="bg-gradient-to-r from-blue-700 via-purple-600 to-cyan-500 text-white rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8" />
                <div>
                  <CardTitle className="text-2xl">Instruções do Teste</CardTitle>
                  <p className="text-white/90 mt-1">
                    Olá, {candidato.nome}! Leia com atenção antes de iniciar.
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
            {/* Sobre o Teste */}
            <div>
              <h3 className="flex items-center gap-2 mb-3 font-semibold text-gray-800">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Sobre o Teste</span>
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Este teste avalia sua capacidade de raciocínio lógico e percepção de padrões.
                Você verá 60 matrizes incompletas organizadas em 5 séries (A, B, C, D e E),
                cada uma com 12 questões.
              </p>
            </div>

            {/* Como Funciona */}
            <div>
              <h3 className="flex items-center gap-2 mb-3 font-semibold text-gray-800">
                <Brain className="w-5 h-5 text-cyan-600" />
                <span>Como Funciona</span>
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-gray-700">
                  <strong>1.</strong> Em cada questão, você verá uma matriz com uma parte faltando.
                </p>
                <p className="text-gray-700">
                  <strong>2.</strong> Abaixo da matriz, haverá opções numeradas de resposta.
                </p>
                <p className="text-gray-700">
                  <strong>3.</strong> Selecione a opção que melhor completa a matriz.
                </p>
                <p className="text-gray-700">
                  <strong>4.</strong> Após selecionar, clique em "Próxima" para avançar.
                </p>
              </div>
            </div>

            {/* Exemplos */}
            <div>
              <h3 className="flex items-center gap-2 mb-3 font-semibold text-gray-800">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>Exemplo de Questão</span>
              </h3>
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p className="text-gray-700 mb-2">
                  Imagine uma sequência de formas que seguem um padrão lógico.
                  Sua tarefa é identificar qual das opções dadas completa corretamente esse padrão.
                </p>
                <p className="text-gray-700">
                  <strong>Dica:</strong> Observe atentamente as relações entre as formas,
                  considerando direção, tamanho, quantidade e posicionamento.
                </p>
              </div>
            </div>

            {/* Regras Importantes */}
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-gray-700">
                <strong className="text-red-700">Atenção - Regras Importantes:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>Você <strong>NÃO</strong> pode voltar para questões anteriores</li>
                  <li>Todas as questões são <strong>obrigatórias</strong></li>
                  <li>O tempo será cronometrado, mas <strong>não há limite</strong></li>
                  <li>Trabalhe no seu próprio ritmo, com atenção e calma</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Informações Adicionais */}
            <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-cyan-600 mt-0.5" />
                <div>
                  <p className="text-gray-700">
                    <strong>Tempo:</strong> Ao clicar em "Iniciar Teste", o cronômetro começará automaticamente.
                  </p>
                  <p className="text-gray-700 mt-2">
                    <strong>Resultado:</strong> Após finalizar, você verá sua pontuação e receberá
                    os resultados detalhados por email.
                  </p>
                </div>
              </div>
            </div>

            {/* Estrutura do Teste */}
            <div>
              <h3 className="mb-3 font-semibold text-gray-800">Estrutura do Teste</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {['A', 'B', 'C', 'D', 'E'].map((serie) => (
                  <div key={serie} className="bg-gradient-to-br from-cyan-100 to-purple-100 p-3 rounded text-center">
                    <div className="text-purple-700 font-semibold">Série {serie}</div>
                    <div className="text-sm text-gray-600">12 questões</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botão Iniciar */}
            <div className="pt-4">
              <Button
                onClick={handleIniciar}
                size="lg"
                className="w-full"
                style={{ backgroundColor: '#00109e', color: 'white' }}
              >
                Iniciar Teste
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
