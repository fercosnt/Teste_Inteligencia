import { Questao } from '../types/quiz';

// Gabarito baseado no arquivo fornecido
// NOTA: Séries C, D e E têm respostas 7 e 8 no gabarito original
// Implementando com 6 opções conforme especificação - ajustar se necessário
export const respostasCorretas: number[] = [
  // Série A (1-12)
  4, 5, 1, 2, 6, 3, 6, 2, 1, 3, 4, 5,
  // Série B (13-24)
  2, 6, 1, 2, 1, 3, 5, 6, 4, 3, 4, 5,
  // Série C (25-36) - ATENÇÃO: Gabarito original tem valores 7 e 8
  8, 2, 3, 8, 7, 4, 5, 1, 7, 6, 1, 2,
  // Série D (37-48) - ATENÇÃO: Gabarito original tem valores 7 e 8
  3, 4, 3, 7, 8, 6, 5, 4, 1, 2, 5, 6,
  // Série E (49-60) - ATENÇÃO: Gabarito original tem valores 7 e 8
  7, 6, 8, 2, 1, 5, 1, 6, 3, 2, 4, 5
];

// Gerar todas as 60 questões
export const questoes: Questao[] = Array.from({ length: 60 }, (_, index) => {
  const numeroGlobal = index + 1;
  let serie: string;
  let numero: number;
  
  if (numeroGlobal <= 12) {
    serie = 'A';
    numero = numeroGlobal;
  } else if (numeroGlobal <= 24) {
    serie = 'B';
    numero = numeroGlobal - 12;
  } else if (numeroGlobal <= 36) {
    serie = 'C';
    numero = numeroGlobal - 24;
  } else if (numeroGlobal <= 48) {
    serie = 'D';
    numero = numeroGlobal - 36;
  } else {
    serie = 'E';
    numero = numeroGlobal - 48;
  }

  // Determinar número de opções baseado na série
  // Séries A e B: 6 opções
  // Séries C, D, E: 8 opções (conforme gabarito)
  const numeroOpcoes = ['A', 'B'].includes(serie) ? 6 : 8;

  return {
    id: numeroGlobal,
    serie,
    numero,
    numeroGlobal,
    imagemUrl: `/images/Mascara/A${numeroGlobal}.webp`,
    opcoes: Array.from({ length: numeroOpcoes }, (_, i) => i + 1),
    respostaCorreta: respostasCorretas[index]
  };
});

export const getTotalQuestoes = () => questoes.length;

export const getQuestao = (numeroGlobal: number): Questao | undefined => {
  return questoes.find(q => q.numeroGlobal === numeroGlobal);
};

export const calcularPontuacao = (respostas: (number | null)[]): number => {
  return respostas.reduce((pontos, resposta, index) => {
    if (resposta === respostasCorretas[index]) {
      return pontos + 1;
    }
    return pontos;
  }, 0);
};
