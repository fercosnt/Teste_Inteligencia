import { Card, CardContent } from '@/components/ui/card'

// Cartão de um número em destaque. `detalhe` é a linha de contexto embaixo —
// na tela do candidato é onde entra a comparação com a média da base, para o
// número não ficar solto sem referência.

export default function CardMetrica({ icone: Icone, rotulo, valor, sufixo, cor, detalhe }) {
  return (
    <Card className={`${cor.bg} ${cor.border}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Icone className={`w-6 h-6 mt-1 shrink-0 ${cor.texto}`} />
          <div className="min-w-0">
            <p className="text-sm text-gray-600">{rotulo}</p>
            <p className="text-2xl font-semibold tabular-nums">
              {valor}
              {sufixo && <span className="text-base font-normal text-gray-500 ml-1">{sufixo}</span>}
            </p>
            {detalhe && <p className="text-xs text-gray-600 mt-1">{detalhe}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
