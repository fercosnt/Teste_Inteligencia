export interface CandidatoData {
  nome: string;
  email: string;
  telefone: string;
}

export interface QuizState {
  candidato: CandidatoData | null;
  dataInicio: Date | null;
  dataFim: Date | null;
  respostas: (number | null)[];
  questaoAtual: number;
}

export interface Questao {
  id: number;
  serie: string;
  numero: number;
  numeroGlobal: number;
  imagemUrl: string;
  opcoes: number[];
  respostaCorreta: number;
}

export interface ResultadoData {
  nome: string;
  email: string;
  telefone: string;
  dataInicio: string;
  dataFim: string;
  tempoTotalMinutos: number;
  pontuacao: number;
  percentualAcertos: number;
  respostas: number[];
}
