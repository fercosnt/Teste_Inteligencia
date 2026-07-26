// Dados do Quiz de Matrizes de Raven.
//
// ATENÇÃO: este módulo vai para o navegador do candidato — a tela da questão o
// importa. Só pode conter o que é seguro publicar: quantas opções cada questão
// tem, onde estão as imagens, quais são as séries.
//
// O gabarito NÃO mora aqui. Ele está em lib/gabarito-servidor.js, atrás de
// `server-only`, porque já vazou uma vez exatamente por estar neste arquivo.

// Informações sobre as séries
export const series = {
  A: { inicio: 1, fim: 12, opcoes: 6, nome: 'Série A' },
  B: { inicio: 13, fim: 24, opcoes: 6, nome: 'Série B' },
  C: { inicio: 25, fim: 36, opcoes: 8, nome: 'Série C' },
  D: { inicio: 37, fim: 48, opcoes: 8, nome: 'Série D' },
  E: { inicio: 49, fim: 60, opcoes: 8, nome: 'Série E' }
};

// Função para obter o número de opções de uma questão
export function getNumeroOpcoes(numeroQuestao) {
  if (numeroQuestao >= 1 && numeroQuestao <= 12) return 6;  // Série A
  if (numeroQuestao >= 13 && numeroQuestao <= 24) return 6; // Série B
  if (numeroQuestao >= 25 && numeroQuestao <= 60) return 8; // Séries C, D, E
  return 6; // default
}

// Função para obter a letra da série baseada no número da questão
export function getSerie(numeroQuestao) {
  if (numeroQuestao >= 1 && numeroQuestao <= 12) return 'A';
  if (numeroQuestao >= 13 && numeroQuestao <= 24) return 'B';
  if (numeroQuestao >= 25 && numeroQuestao <= 36) return 'C';
  if (numeroQuestao >= 37 && numeroQuestao <= 48) return 'D';
  if (numeroQuestao >= 49 && numeroQuestao <= 60) return 'E';
  return 'A';
}

// Função para obter o caminho da imagem da questão
export function getImagemPath(numeroQuestao) {
  // Mapeamento direto: questão 1 → A1.webp, questão 13 → A13.webp (Série B), etc.
  return `/images/Mascara/A${numeroQuestao}.webp`;
}

// Função para obter o caminho da imagem de uma opção
export function getOpcaoImagemPath(numeroQuestao, numeroOpcao) {
  // Retorna o caminho da imagem da opção: questão 1, opção 3 → /images/Mascara/A1.3.webp
  return `/images/Mascara/A${numeroQuestao}.${numeroOpcao}.webp`;
}

// validarResposta e calcularPontuacao mudaram para lib/gabarito-servidor.js:
// dependem do gabarito e, estando aqui, o arrastavam para o bundle do cliente.

// Total de questões
export const TOTAL_QUESTOES = 60;

// Chave onde a tela de resultado guarda o comprovante do teste já gravado.
//
// Mora aqui, e não na tela de resultado, porque duas telas precisam concordar
// sobre ela: /resultado a escreve ao gravar, e /instrucoes a apaga ao começar
// um teste novo. Se as duas divergirem, ou o mesmo teste é gravado de novo, ou
// quem refaz o teste vê a nota antiga e nunca envia o novo.
export const CHAVE_COMPROVANTE = 'resultadoRegistrado';
