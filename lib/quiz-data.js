// Dados do Quiz de Matrizes de Raven

// Gabarito completo (60 questões)
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
  7, 6, 8, 2, 1, 5, 1, 6, 3, 2, 4, 5
];

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

// Função para obter o caminho da imagem
export function getImagemPath(numeroQuestao) {
  return `/images/Prancheta ${numeroQuestao}.webp`;
}

// Validar resposta
export function validarResposta(numeroQuestao, respostaUsuario) {
  const index = numeroQuestao - 1;
  return gabarito[index] === respostaUsuario;
}

// Calcular pontuação total
export function calcularPontuacao(respostas) {
  let acertos = 0;
  respostas.forEach((resposta, index) => {
    if (resposta === gabarito[index]) {
      acertos++;
    }
  });
  return acertos;
}

// Total de questões
export const TOTAL_QUESTOES = 60;
