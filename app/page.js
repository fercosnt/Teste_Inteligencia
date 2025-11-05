'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { FileText } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [telefone, setTelefone] = useState('')
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const newErrors = {}

    if (!nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    }

    if (!email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido'
    }

    if (!telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      try {
        // Armazenar dados no localStorage com tratamento de erro
        localStorage.setItem('candidato', JSON.stringify({ nome, email, telefone }))
        // Redirecionar para instruções
        router.push('/instrucoes')
      } catch (error) {
        console.error('Erro ao salvar dados no localStorage:', error)
        alert('Erro ao salvar dados. Por favor, verifique as configurações do navegador.')
      }
    }
  }

  const formatTelefone = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')

    // Formata (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/assets/background-gradient.png)' }}
    >
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-6 pt-8 relative">
          <Button
            onClick={() => router.push('/relatorios')}
            variant="outline"
            className="absolute top-4 right-4 flex items-center gap-2 border-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
            size="sm"
          >
            <FileText className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-700">Relatórios</span>
          </Button>
          <div className="flex justify-center flex-col items-center">
            <Image
              src="/assets/tochinha.png"
              alt="Beauty Smile"
              width={80}
              height={80}
              className="h-20 w-auto"
            />
            <p className="mt-2 text-sm font-medium text-gray-700">Ferramentas da Inteligência</p>
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
                style={{ backgroundColor: '#00109e', color: 'white' }}
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
  )
}
