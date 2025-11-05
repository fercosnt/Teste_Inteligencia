import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Clock, ArrowRight, CheckCircle } from 'lucide-react';
import { Questao } from '../types/quiz';
import { ImageWithFallback } from './figma/ImageWithFallback';
import logomarca from 'figma:asset/9ea65fbe2d4130d94e362e7393ea60ff516a6752.png';
import backgroundGradient from 'figma:asset/66cb9b03bae695eeb47bed32217dfbc83b0f1903.png';

interface QuizScreenProps {
  questao: Questao;
  questaoAtual: number;
  totalQuestoes: number;
  respostaSelecionada: number | null;
  tempoDecorrido: number;
  onSelectResposta: (opcao: number) => void;
  onProxima: () => void;
}

export function QuizScreen({
  questao,
  questaoAtual,
  totalQuestoes,
  respostaSelecionada,
  tempoDecorrido,
  onSelectResposta,
  onProxima
}: QuizScreenProps) {
  const [tempoFormatado, setTempoFormatado] = useState('00:00:00');

  useEffect(() => {
    const horas = Math.floor(tempoDecorrido / 3600);
    const minutos = Math.floor((tempoDecorrido % 3600) / 60);
    const segundos = tempoDecorrido % 60;

    setTempoFormatado(
      `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`
    );
  }, [tempoDecorrido]);

  const progresso = (questaoAtual / totalQuestoes) * 100;

  return (
    <div 
      className="min-h-screen p-4 py-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundGradient})` }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header fixo */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <img src={logomarca} alt="Beauty Smile" className="h-8 w-auto" />
                <Badge variant="secondary" className="text-lg px-4 py-1">
                  Série {questao.serie}
                </Badge>
                <span className="text-gray-600">
                  Questão {questaoAtual} de {totalQuestoes}
                </span>
              </div>
              
              <div className="flex items-center gap-2 bg-cyan-50 px-4 py-2 rounded-lg">
                <Clock className="w-5 h-5 text-cyan-600" />
                <span className="tabular-nums">{tempoFormatado}</span>
              </div>
            </div>

            <div className="mt-4">
              <Progress value={progresso} className="h-2" />
              <p className="text-sm text-gray-500 mt-1 text-center">
                {Math.round(progresso)}% concluído
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Questão */}
        <Card className="shadow-xl">
          <CardContent className="p-6 sm:p-8">
            {/* Imagem da Matriz */}
            <div className="mb-8">
              <div className="bg-white border-2 border-gray-200 rounded-lg p-6 flex items-center justify-center">
                <div className="w-full max-w-2xl aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                  <div className="relative w-full h-full overflow-hidden">
                    <ImageWithFallback
                      src={questao.imagemUrl}
                      alt={`Questão ${questao.numeroGlobal} - Série ${questao.serie}`}
                      className="w-full h-full object-cover"
                      style={{ transform: 'scale(1.4)' }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-center text-gray-600 mt-4">
                Selecione a opção que melhor completa a matriz acima
              </p>
            </div>

            {/* Opções de Resposta */}
            <div>
              <h3 className="mb-4 text-center text-gray-700">Opções de Resposta</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {questao.opcoes.map((opcao) => (
                  <button
                    key={opcao}
                    onClick={() => onSelectResposta(opcao)}
                    className={`
                      relative rounded-lg border-2 transition-all
                      hover:scale-105 hover:shadow-lg aspect-square
                      flex items-center justify-center overflow-hidden
                      ${
                        respostaSelecionada === opcao
                          ? 'border-cyan-600 bg-cyan-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-cyan-300'
                      }
                    `}
                  >
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
                      <ImageWithFallback
                        src={`/images/Mascara/A${questao.numeroGlobal}.${opcao}.webp`}
                        alt={`Opção ${opcao}`}
                        className="w-full h-full object-cover"
                        style={{ transform: 'scale(3.0)' }}
                      />
                      {respostaSelecionada === opcao && (
                        <CheckCircle className="w-5 h-5 text-cyan-600 absolute top-1 right-1 bg-white rounded-full z-10" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Botão Próxima */}
            <div className="mt-8 flex flex-col items-center gap-4">
              <Button
                onClick={onProxima}
                disabled={respostaSelecionada === null}
                size="lg"
                className="w-full sm:w-auto px-12"
                style={{ 
                  backgroundColor: respostaSelecionada === null ? undefined : '#00109e',
                  color: respostaSelecionada === null ? undefined : 'white'
                }}
              >
                {questaoAtual === totalQuestoes ? 'Finalizar Teste' : 'Próxima Questão'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              {respostaSelecionada === null && (
                <p className="text-sm text-amber-600">
                  Selecione uma opção para continuar
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Aviso */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white bg-black/30 backdrop-blur-sm inline-block px-4 py-2 rounded-lg">
            ⚠️ Atenção: Não será possível voltar após avançar para a próxima questão
          </p>
        </div>
      </div>
    </div>
  );
}
