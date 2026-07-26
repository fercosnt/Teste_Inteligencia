import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { UserX } from 'lucide-react'

// 404 da tela do candidato.
//
// Chega aqui quem digitou um id fora do formato ou abriu o link de um candidato
// que já foi apagado. Fica atrás do middleware, como todo /relatorios/*, então
// não expõe nada — mas também não pode parecer uma falha do sistema.

export default function NaoEncontrado() {
  return (
    <div
      className="min-h-screen p-4 py-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url(/assets/background-gradient.webp)' }}
    >
      <div className="max-w-lg mx-auto">
        <Card className="shadow-2xl">
          <CardContent className="text-center py-12 px-6">
            <UserX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">Candidato não encontrado</p>
            <p className="text-gray-500 text-sm mt-1">
              Este resultado não existe ou foi removido da base.
            </p>
            <Link
              href="/relatorios"
              className="inline-block mt-5 text-sm text-blue-600 hover:underline"
            >
              Voltar para a lista de candidatos
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
