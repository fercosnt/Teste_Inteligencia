'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, FileText, BarChart3, TrendingUp } from 'lucide-react'
import Image from 'next/image'

export default function Relatorios() {
  const router = useRouter()

  const relatorios = [
    {
      nome: 'Perfil',
      url: 'https://airtable.com/apptmxHCtibAO97pb/shrE1fnl42bCkGDjN',
      icone: FileText,
      descricao: 'Visualizar perfil detalhado'
    },
    {
      nome: 'Dashboard Analítico',
      url: 'https://airtable.com/apptmxHCtibAO97pb/shrAsMHZ3DSX5nJYw',
      icone: BarChart3,
      descricao: 'Análises e métricas detalhadas'
    },
    {
      nome: 'Dashboard Executivo',
      url: 'https://airtable.com/apptmxHCtibAO97pb/shrqHu3t9iMj6HL8q',
      icone: TrendingUp,
      descricao: 'Visão executiva consolidada'
    }
  ]

  const handleAbrirRelatorio = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/assets/background-gradient.png)' }}
    >
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center space-y-6 pt-8">
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
            <CardTitle className="text-2xl">Relatórios</CardTitle>
            <CardDescription className="mt-2">
              Acesse os dashboards e relatórios disponíveis
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pb-8">
          {relatorios.map((relatorio, index) => {
            const Icone = relatorio.icone
            return (
              <Button
                key={index}
                onClick={() => handleAbrirRelatorio(relatorio.url)}
                className="w-full justify-start h-auto py-4 px-6 text-left"
                variant="outline"
                size="lg"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className="flex-shrink-0">
                    <Icone className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base">{relatorio.nome}</div>
                    <div className="text-sm text-gray-500 mt-1">{relatorio.descricao}</div>
                  </div>
                </div>
              </Button>
            )
          })}

          <div className="pt-6">
            <Button
              onClick={() => router.push('/')}
              variant="ghost"
              className="w-full"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para página inicial
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

