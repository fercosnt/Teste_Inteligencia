import { useState, useEffect, useCallback } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { InstructionsScreen } from './components/InstructionsScreen';
import { QuizScreen } from './components/QuizScreen';
import { ResultScreen } from './components/ResultScreen';
import { CandidatoData, QuizState } from './types/quiz';
import { questoes, getTotalQuestoes, calcularPontuacao } from './data/gabarito';

type Screen = 'welcome' | 'instructions' | 'quiz' | 'result';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [quizState, setQuizState] = useState<QuizState>({
    candidato: null,
    dataInicio: null,
    dataFim: null,
    respostas: Array(getTotalQuestoes()).fill(null),
    questaoAtual: 1
  });
  const [tempoDecorrido, setTempoDecorrido] = useState(0);

  // Cronômetro
  useEffect(() => {
    let interval: number | undefined;

    if (currentScreen === 'quiz' && quizState.dataInicio) {
      interval = window.setInterval(() => {
        setTempoDecorrido((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentScreen, quizState.dataInicio]);

  const handleStartCadastro = useCallback((candidato: CandidatoData) => {
    setQuizState((prev) => ({
      ...prev,
      candidato
    }));
    setCurrentScreen('instructions');
  }, []);

  const handleStartQuiz = useCallback(() => {
    setQuizState((prev) => ({
      ...prev,
      dataInicio: new Date()
    }));
    setCurrentScreen('quiz');
  }, []);

  const handleSelectResposta = useCallback((opcao: number) => {
    setQuizState((prev) => {
      const novasRespostas = [...prev.respostas];
      novasRespostas[prev.questaoAtual - 1] = opcao;
      return {
        ...prev,
        respostas: novasRespostas
      };
    });
  }, []);

  const handleProxima = useCallback(() => {
    const totalQuestoes = getTotalQuestoes();

    if (quizState.questaoAtual < totalQuestoes) {
      setQuizState((prev) => ({
        ...prev,
        questaoAtual: prev.questaoAtual + 1
      }));
    } else {
      // Finalizar teste
      const dataFim = new Date();
      setQuizState((prev) => ({
        ...prev,
        dataFim
      }));
      setCurrentScreen('result');
    }
  }, [quizState.questaoAtual]);

  const handleReiniciar = useCallback(() => {
    setQuizState({
      candidato: null,
      dataInicio: null,
      dataFim: null,
      respostas: Array(getTotalQuestoes()).fill(null),
      questaoAtual: 1
    });
    setTempoDecorrido(0);
    setCurrentScreen('welcome');
  }, []);

  // Renderizar tela atual
  const renderScreen = () => {
    if (currentScreen === 'welcome') {
      return <WelcomeScreen onStart={handleStartCadastro} />;
    }

    if (currentScreen === 'instructions' && quizState.candidato) {
      return (
        <InstructionsScreen
          candidatoNome={quizState.candidato.nome}
          onStart={handleStartQuiz}
        />
      );
    }

    if (currentScreen === 'quiz') {
      const questaoAtual = questoes[quizState.questaoAtual - 1];
      const respostaSelecionada = quizState.respostas[quizState.questaoAtual - 1];

      return (
        <QuizScreen
          questao={questaoAtual}
          questaoAtual={quizState.questaoAtual}
          totalQuestoes={getTotalQuestoes()}
          respostaSelecionada={respostaSelecionada}
          tempoDecorrido={tempoDecorrido}
          onSelectResposta={handleSelectResposta}
          onProxima={handleProxima}
        />
      );
    }

    if (currentScreen === 'result' && quizState.candidato) {
      const pontuacao = calcularPontuacao(quizState.respostas as number[]);

      return (
        <ResultScreen
          nome={quizState.candidato.nome}
          pontuacao={pontuacao}
          totalQuestoes={getTotalQuestoes()}
          tempoTotalSegundos={tempoDecorrido}
          onReiniciar={handleReiniciar}
        />
      );
    }

    return null;
  };

  return renderScreen();
}
