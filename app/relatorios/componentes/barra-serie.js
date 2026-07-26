import { QUESTOES_POR_SERIE, NOMES_SERIES, formatarNumero } from '@/lib/relatorios-candidato'

// Barra de acertos de uma série.
//
// Serve os dois lados do dashboard: a lista usa a versão simples para a média
// da base, e a tela do candidato passa `media` para ganhar a marca de
// comparação. Manter um componente só evita que as duas telas desenhem a mesma
// série com escalas diferentes.

function Diferenca({ valor }) {
  // Menos de meio acerto de diferença é empate; escrever "+0,2" ali daria a
  // impressão de vantagem onde não há. O corte é o mesmo de compararPontuacao.
  if (Math.abs(valor) < 0.5) {
    return <span className="text-gray-500">na média</span>
  }

  const acima = valor > 0
  return (
    <span className={acima ? 'text-emerald-700' : 'text-amber-700'}>
      {acima ? '+' : '−'}
      {formatarNumero(Math.abs(valor))} vs. média
    </span>
  )
}

export default function BarraSerie({ letra, acertos, percentual, media = null, diferenca = null }) {
  const posicaoMedia = media === null ? null : (media / QUESTOES_POR_SERIE) * 100

  return (
    <div>
      <div className="flex justify-between items-baseline text-sm mb-1 gap-2">
        <span className="font-medium">
          Série {letra}
          <span className="text-gray-500 font-normal ml-2">{NOMES_SERIES[letra]}</span>
        </span>
        <span className="tabular-nums text-gray-600 whitespace-nowrap">
          {formatarNumero(acertos)}/{QUESTOES_POR_SERIE} ({formatarNumero(percentual)}%)
        </span>
      </div>

      <div className="relative h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
          style={{ width: `${percentual}%` }}
        />
        {posicaoMedia !== null && (
          // Risco vertical na posição da média da base: dá a comparação no
          // próprio desenho, sem obrigar a ler o número ao lado.
          <div
            className="absolute inset-y-0 w-0.5 bg-gray-700/70"
            style={{ left: `${posicaoMedia}%` }}
            aria-hidden="true"
          />
        )}
      </div>

      {media !== null && (
        <div className="flex justify-between items-baseline text-xs mt-1 gap-2">
          <span className="text-gray-500 tabular-nums">
            média da base {formatarNumero(media)}/{QUESTOES_POR_SERIE}
          </span>
          <span className="tabular-nums font-medium whitespace-nowrap">
            <Diferenca valor={diferenca} />
          </span>
        </div>
      )}
    </div>
  )
}
