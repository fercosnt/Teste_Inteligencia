'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Instrucoes() {
  const router = useRouter()
  const [candidato, setCandidato] = useState(null)

  useEffect(() => {
    // Verificar se há dados do candidato
    const dadosCandidato = localStorage.getItem('candidato')
    if (!dadosCandidato) {
      // Se não há dados, redirecionar para a página inicial
      router.push('/')
      return
    }
    setCandidato(JSON.parse(dadosCandidato))
  }, [router])

  const handleIniciar = () => {
    // Iniciar cronômetro
    const dataInicio = new Date().toISOString()
    localStorage.setItem('dataInicio', dataInicio)

    // Inicializar array de respostas
    localStorage.setItem('respostas', JSON.stringify([]))

    // Ir para primeira questão
    router.push('/quiz/1')
  }

  if (!candidato) {
    return (
      <div className="quiz-container">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="quiz-container bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="quiz-card max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Bem-vindo ao Teste de Raciocínio Lógico
        </h1>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-800">
            <strong>Olá, {candidato.nome}!</strong> Você está prestes a iniciar o teste.
          </p>
        </div>

        <div className="prose max-w-none mb-8 space-y-4 text-gray-700">
          <p>
            Você está prestes a iniciar o <strong>Teste de Matrizes Progressivas de Raven</strong>,
            uma avaliação de raciocínio abstrato e inteligência fluida.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Como funciona o teste:
          </h2>

          <ol className="space-y-3 list-decimal list-inside">
            <li>
              <strong>O que você verá:</strong> Em cada tela, haverá uma figura com um padrão
              visual incompleto - uma parte estará faltando.
            </li>
            <li>
              <strong>Sua tarefa:</strong> Abaixo da figura incompleta, você verá opções de
              resposta numeradas (de 6 a 8 opções, dependendo da série). Apenas uma delas
              completa corretamente o padrão. Sua tarefa é identificar qual opção se encaixa
              logicamente.
            </li>
            <li>
              <strong>Exemplos:</strong>
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li><strong>Exemplo A1:</strong> A figura tem um padrão de linhas. Analisando o padrão, a <strong>opção 4</strong> é a resposta correta.</li>
                <li><strong>Exemplo B4:</strong> Observe como as formas se repetem e se transformam. A <strong>opção 2</strong> completa o padrão corretamente.</li>
                <li><strong>Exemplo C1:</strong> Um padrão mais complexo. A <strong>opção 8</strong> é a que continua a sequência lógica.</li>
              </ul>
            </li>
          </ol>

          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            Regras importantes:
          </h2>

          <ul className="space-y-2">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✅</span>
              <span><strong>Responda na ordem:</strong> Você deve responder cada questão sequencialmente, da 1 até a 60.</span>
            </li>
            <li className="flex items-start">
              <span className="text-red-600 mr-2">❌</span>
              <span><strong>Não é possível voltar:</strong> Uma vez que você avança para a próxima questão, não poderá retornar à anterior.</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">⏱️</span>
              <span><strong>Tempo:</strong> Não há limite de tempo rigoroso. O sistema apenas registrará quanto tempo você levou para completar o teste. Trabalhe com calma e atenção.</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 mr-2">📊</span>
              <span><strong>Estrutura do teste:</strong> O teste possui 60 questões divididas em 5 séries (A, B, C, D, E), com níveis progressivos de dificuldade.</span>
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-3">
            O que acontece depois:
          </h2>

          <p>
            Ao concluir todas as 60 questões, você receberá imediatamente seu resultado na tela,
            mostrando sua pontuação e percentual de acertos. Um email com os resultados também
            será enviado para <strong>{candidato.email}</strong>.
          </p>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mt-6">
            <p className="text-yellow-800">
              <strong>💡 Dica:</strong> Analise cuidadosamente cada figura antes de escolher sua resposta.
              Procure por padrões, sequências, simetrias e transformações visuais.
            </p>
          </div>
        </div>

        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
          <p className="text-orange-800 text-sm">
            <strong>⚠️ Lembre-se:</strong> Uma vez iniciado, não será possível pausar ou retornar
            a questões anteriores. Certifique-se de estar em um ambiente tranquilo e sem
            interrupções.
          </p>
        </div>

        <button
          onClick={handleIniciar}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition duration-200 transform hover:scale-105 shadow-lg text-lg"
        >
          🚀 Iniciar Teste
        </button>

        <p className="text-center text-gray-500 text-sm mt-4">
          Boa sorte!
        </p>
      </div>
    </div>
  )
}
