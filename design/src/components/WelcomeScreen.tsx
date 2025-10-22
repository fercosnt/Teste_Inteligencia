import image_6ef5268fe71d97c21912d3ac4768f81c42642e39 from 'figma:asset/6ef5268fe71d97c21912d3ac4768f81c42642e39.png';
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CandidatoData } from '../types/quiz';
import logoCompleta from 'figma:asset/eef337f191dc3daf3ebe31ea46ad233d347f46d2.png';
import backgroundGradient from 'figma:asset/66cb9b03bae695eeb47bed32217dfbc83b0f1903.png';

interface WelcomeScreenProps {
  onStart: (candidato: CandidatoData) => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (!telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onStart({ nome, email, telefone });
    }
  };

  const formatTelefone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Formata (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${backgroundGradient})` }}
    >
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-6 pt-8">
          <div className="flex justify-center">
            <img 
              src={image_6ef5268fe71d97c21912d3ac4768f81c42642e39} 
              alt="Beauty Smile" 
              className="h-20 w-auto"
            />
          </div>
          <div>
            <CardTitle className="text-2xl">Teste de Matrizes Progressivas</CardTitle>
            <CardDescription className="mt-2">
              Avaliação de Raciocínio Lógico
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                type="text"
                placeholder="Digite seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={errors.nome ? 'border-red-500' : ''}
              />
              {errors.nome && (
                <p className="text-red-500 text-sm">{errors.nome}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                type="tel"
                placeholder="(11) 98765-4321"
                value={telefone}
                onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                className={errors.telefone ? 'border-red-500' : ''}
                maxLength={15}
              />
              {errors.telefone && (
                <p className="text-red-500 text-sm">{errors.telefone}</p>
              )}
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                style={{ backgroundColor: '#00109e' }}
              >
                Próximo
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
            <p className="text-sm text-gray-700">
              <strong>Informações:</strong>
              <br />
              • Total: 60 questões divididas em 5 séries
              <br />
              • Tempo: Cronometrado (sem limite)
              <br />
              • Navegação: Não é possível voltar
              <br />• Resultado enviado por email
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
