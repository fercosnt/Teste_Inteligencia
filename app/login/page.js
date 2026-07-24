'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Lock } from 'lucide-react'
import Image from 'next/image'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const destino = searchParams.get('redirect') || '/relatorios'

  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setEnviando(true)
    setErro(null)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      })

      if (!response.ok) {
        const { erro } = await response.json().catch(() => ({}))
        throw new Error(erro || 'Não foi possível entrar')
      }

      router.replace(destino)
      router.refresh()
    } catch (error) {
      setErro(error.message)
      setSenha('')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-2xl">
      <CardHeader className="text-center space-y-4 pt-8">
        <div className="flex justify-center">
          <Image
            src="/assets/tochinha.png"
            alt="Beauty Smile"
            width={64}
            height={64}
            className="h-16 w-auto"
          />
        </div>
        <div>
          <CardTitle className="flex items-center justify-center gap-2 text-xl">
            <Lock className="h-5 w-5" />
            Área restrita
          </CardTitle>
          <CardDescription className="mt-2">
            Informe a senha para acessar os resultados
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
            />
          </div>

          {erro && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-gray-700">{erro}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={enviando || !senha}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function Login() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/assets/background-gradient.webp)' }}
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
