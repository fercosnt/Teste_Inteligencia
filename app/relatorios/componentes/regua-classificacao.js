import { montarEscala, proximaFaixa, posicaoNaEscala } from '@/lib/relatorios-candidato'

// A escala normativa inteira, com a faixa do candidato destacada.
//
// O rótulo sozinho ("🟡 Superior") não diz se a pessoa entrou na faixa raspando
// ou com folga, nem o quanto falta para a de cima. A régua mostra isso porque
// cada segmento tem a largura do seu intervalo real: "Muito inferior" cobre 20
// dos 61 acertos possíveis e "Muito superior" cobre 3 — desenhá-los do mesmo
// tamanho mentiria sobre a distância entre as faixas.
//
// As faixas vêm de raven_escala_classificacao, que o próprio banco deriva de
// raven_classificacao(). Nenhum corte é escrito aqui.

// Rampa monocromática da pior para a melhor faixa. É uma escala, não um
// semáforo: o vermelho do emoji "🔴 Médio-inferior" já engana o suficiente sem
// a barra reforçar. Uma cor só, variando de clara a escura, faz a barra ser
// lida como progressão.
const CORES_FAIXA = {
  7: 'bg-blue-100',
  6: 'bg-blue-200',
  5: 'bg-blue-300',
  4: 'bg-blue-400',
  3: 'bg-blue-500',
  2: 'bg-blue-600',
  1: 'bg-blue-800',
}

export default function ReguaClassificacao({ faixas, pontuacao, descricao }) {
  const escala = montarEscala(faixas, pontuacao)
  const proxima = proximaFaixa(faixas, pontuacao)
  const marcador = posicaoNaEscala(pontuacao)

  // A barra corre da pior para a melhor faixa, da esquerda para a direita; a
  // view entrega na ordem inversa. O deslocamento acumulado de cada segmento é
  // o que posiciona os números dos cortes embaixo e o colchete do destaque.
  let acumulado = 0
  const segmentos = [...escala]
    .sort((a, b) => b.ordem - a.ordem)
    .map((faixa) => {
      const inicio = acumulado
      acumulado += faixa.largura
      return { ...faixa, inicio }
    })

  const atual = segmentos.find((f) => f.atual)

  return (
    <div className="space-y-3">
      <div className="relative h-6">
        <div
          className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${marcador}%` }}
        >
          <span className="text-xs font-semibold tabular-nums leading-none mb-0.5">
            {pontuacao}
          </span>
          <span
            className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[6px] border-t-gray-900"
            aria-hidden="true"
          />
        </div>
      </div>

      <div
        className="relative flex h-6 w-full"
        role="img"
        aria-label={`Escala normativa de 0 a 60 acertos. Este candidato fez ${pontuacao}, na faixa ${atual?.classificacao ?? 'não classificada'}.`}
      >
        {segmentos.map((faixa, i) => (
          <div
            key={faixa.ordem}
            style={{ width: `${faixa.largura}%` }}
            // Divisória branca entre segmentos: sem ela, duas faixas vizinhas da
            // rampa se fundem numa mancha só e a régua perde as sete divisões.
            className={`${CORES_FAIXA[faixa.ordem]} ${i === 0 ? 'rounded-l-full' : ''} ${
              i === segmentos.length - 1 ? 'rounded-r-full' : 'border-r border-white'
            }`}
            title={`${faixa.classificacao}: ${faixa.pontuacao_minima} a ${faixa.pontuacao_maxima} acertos`}
          />
        ))}

        {atual && (
          // O destaque é um colchete escuro em volta do segmento, não uma
          // diferença de opacidade: no pé da escala a faixa é clara, e clarear
          // as vizinhas não a destacaria de nada. O contorno funciona nas sete.
          <div
            className="absolute inset-y-0 rounded-[3px] ring-2 ring-gray-900 pointer-events-none"
            style={{ left: `${atual.inicio}%`, width: `${atual.largura}%` }}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="relative h-4 text-[10px] text-gray-500 tabular-nums">
        {segmentos.map((faixa, i) => (
          <span
            key={faixa.ordem}
            className={`absolute top-0 ${i === 0 ? '' : '-translate-x-1/2'}`}
            style={{ left: `${faixa.inicio}%` }}
          >
            {faixa.pontuacao_minima}
          </span>
        ))}
        <span className="absolute top-0 right-0">60</span>
      </div>

      <div className="rounded-md border-l-2 border-blue-600 bg-blue-50/60 pl-3 py-2">
        <p className="text-sm font-medium">
          {atual?.classificacao ?? 'Sem classificação'}
          {atual && (
            <span className="text-gray-500 font-normal tabular-nums ml-2 text-xs">
              {atual.pontuacao_minima} a {atual.pontuacao_maxima} acertos
            </span>
          )}
        </p>
        {descricao && <p className="text-xs text-gray-600 mt-1">{descricao}</p>}
        <p className="text-xs text-gray-600 mt-1">
          {proxima ? (
            <>
              Faltaram{' '}
              <span className="font-medium tabular-nums">
                {proxima.faltam} {proxima.faltam === 1 ? 'acerto' : 'acertos'}
              </span>{' '}
              para {proxima.classificacao}.
            </>
          ) : (
            'É a faixa mais alta da escala.'
          )}
        </p>
      </div>
    </div>
  )
}
