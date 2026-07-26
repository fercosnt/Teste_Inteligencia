// O gabarito e tudo que o consome. NUNCA importar de um componente 'use client'.
//
// Este arquivo existe porque o gabarito vazou: ele morava em lib/quiz-data.js,
// que a tela de resultado importava para calcular a pontuação no navegador. O
// bundler leva o módulo inteiro, então as 60 respostas iam para o JS público —
// verificado em produção, extraídas de um chunk com uma linha de código.
//
// `server-only` é a trava: se algum dia um componente de cliente importar isto,
// o build FALHA em vez de publicar o gabarito de novo. É a única garantia que
// não depende de alguém lembrar.
import 'server-only'

export const gabarito = [
  // Série A (questões 1-12) - 6 opções
  4, 5, 1, 2, 6, 3, 6, 2, 1, 3, 4, 5,
  // Série B (questões 13-24) - 6 opções
  2, 6, 1, 2, 1, 3, 5, 6, 4, 3, 4, 5,
  // Série C (questões 25-36) - 8 opções
  8, 2, 3, 8, 7, 4, 5, 1, 7, 6, 1, 2,
  // Série D (questões 37-48) - 8 opções
  3, 4, 3, 7, 8, 6, 5, 4, 1, 2, 5, 6,
  // Série E (questões 49-60) - 8 opções
  7, 6, 8, 2, 1, 5, 1, 6, 3, 2, 4, 5,
]

export function validarResposta(numeroQuestao, respostaUsuario) {
  return gabarito[numeroQuestao - 1] === respostaUsuario
}

// A pontuação de verdade é a do banco (raven_acertos). Esta função serve para
// o dashboard montar o detalhe questão a questão e para os testes — não para
// pontuar candidato.
export function calcularPontuacao(respostas) {
  return respostas.reduce((total, resposta, i) => total + (resposta === gabarito[i] ? 1 : 0), 0)
}
