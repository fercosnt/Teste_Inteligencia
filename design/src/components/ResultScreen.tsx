import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Trophy, Clock, Target, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import logomarca from 'figma:asset/9ea65fbe2d4130d94e362e7393ea60ff516a6752.png';
import backgroundGradient from 'figma:asset/66cb9b03bae695eeb47bed32217dfbc83b0f1903.png';

interface ResultScreenProps {
  nome: string;
  pontuacao: number;
  totalQuestoes: number;
  tempoTotalSegundos: number;
  onReiniciar?: () => void;
}

export function ResultScreen({
  nome,
  pontuacao,
  totalQuestoes,
  tempoTotalSegundos,
  onReiniciar
}: ResultScreenProps) {
  const [enviando, setEnviando] = useState(true);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState(false);

  const percentual = ((pontuacao / totalQuestoes) * 100).toFixed(1);
  
  const horas = Math.floor(tempoTotalSegundos / 3600);
  const minutos = Math.floor((tempoTotalSegundos % 3600) / 60);
  const segundos = tempoTotalSegundos % 60;
  const tempoFormatado = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

  // Simular envio de dados
  useEffect(() => {
    const timer = setTimeout(() => {
      // Aqui seria a chamada real ao webhook N8N
      // Por enquanto, simulamos sucesso
      setEnviando(false);
      setEnviado(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const getNivelDesempenho = () => {
    const perc = parseFloat(percentual);
    if (perc >= 90) return { texto: 'Excelente', cor: 'text-green-600', bg: 'bg-green-50' };
    if (perc >= 75) return { texto: 'Muito Bom', cor: 'text-cyan-600', bg: 'bg-cyan-50' };
    if (perc >= 60) return { texto: 'Bom', cor: 'text-purple-600', bg: 'bg-purple-50' };
    if (perc >= 50) return { texto: 'Regular', cor: 'text-amber-600', bg: 'bg-amber-50' };
    return { texto: 'Precisa Melhorar', cor: 'text-red-600', bg: 'bg-red-50' };
  };

  const nivel = getNivelDesempenho();

  return (
    <div 
      className="min-h-screen p-4 py-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundGradient})` }}
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
                    Parabéns, {nome}!
                  </p>
                </div>
              </div>
              <img src={logomarca} alt="Beauty Smile" className="h-10 w-auto" />
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
                  <strong className="text-green-700">Sucesso!</strong> Seus resultados foram enviados por email.
                </AlertDescription>
              </Alert>
            )}

            {erro && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-gray-700">
                  <strong className="text-red-700">Erro ao enviar.</strong> Por favor, entre em contato com o suporte.
                </AlertDescription>
              </Alert>
            )}

            {/* Resultado Principal */}
            <div className="text-center py-6">
              <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full ${nivel.bg} mb-4`}>
                <Trophy className={`w-6 h-6 ${nivel.cor}`} />
                <span className={`${nivel.cor}`}>{nivel.texto}</span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <div className="text-6xl mb-2">{pontuacao}</div>
                  <div className="text-gray-600">de {totalQuestoes} questões corretas</div>
                </div>
                
                <div className="mt-4">
                  <Progress value={parseFloat(percentual)} className="h-3 max-w-md mx-auto" />
                  <p className="text-2xl text-cyan-600 mt-2">{percentual}%</p>
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-cyan-50 border-cyan-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-6 h-6 text-cyan-600 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Tempo Total</p>
                      <p className="text-xl tabular-nums">{tempoFormatado}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {Math.round(tempoTotalSegundos / 60)} minutos
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
                      <p className="text-xl">{percentual}%</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {pontuacao} de {totalQuestoes} corretas
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
                    <li>Você receberá um email com os resultados detalhados</li>
                    <li>O relatório completo será enviado para a equipe de RH</li>
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
  );
}
