import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { formatarDataHora, formatarNumero } from '@/lib/relatorios-candidato'
import Excluir from './excluir'

// Histórico de tentativas de um candidato.
//
// Só aparece para quem fez o teste mais de uma vez — que é raro e, quando
// acontece, muda como o número principal deve ser lido.
//
// A primeira tentativa é a que vale. As seguintes não são medidas melhores:
// são a mesma pessoa respondendo as mesmas matrizes, que ela já viu. No
// histórico do sistema antigo isso apareceu em três candidatos, e nos três a
// nota subiu — um deles ganhou 10 acertos em 24 horas.

export default function Tentativas({ tentativas, idAtual, voltar }) {
  if (tentativas.length < 2) return null

  return (
    <div className="space-y-2">
      {tentativas.map((t) => {
        const eAtual = t.id === idAtual
        const ordinal = `${t.tentativa}ª`

        return (
          <div
            key={t.id}
            className={`rounded-md border p-3 ${
              t.vale ? 'border-blue-300 bg-blue-50/60' : 'border-gray-200'
            } ${eAtual ? 'ring-1 ring-gray-400' : ''}`}
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-sm font-medium tabular-nums">{ordinal}</span>
                <span className="text-xs text-gray-600">{formatarDataHora(t.data_inicio)}</span>
                <span className="text-sm tabular-nums font-semibold">{t.pontuacao_total}/60</span>
                <span className="text-xs text-gray-600">{t.classificacao}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {eAtual ? (
                  <span className="text-xs text-gray-500">nesta tela</span>
                ) : (
                  <Link
                    href={`/relatorios/${t.id}${voltar}`}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                  >
                    abrir <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
                <Excluir
                  id={t.id}
                  nome={t.nome}
                  email={t.email}
                  escopo="tentativa"
                  totalTentativas={tentativas.length}
                  rotuloTentativa={`a ${ordinal} tentativa`}
                  aoConcluir={eAtual ? '/relatorios' : `/relatorios/${idAtual}${voltar}`}
                />
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-1">
              {t.vale ? (
                <span className="inline-flex items-center gap-1 text-blue-800">
                  <Check className="w-3 h-3" />É esta que vale — a única sem efeito de prática.
                </span>
              ) : (
                <>
                  {(() => {
                    const primeira = tentativas.find((x) => x.vale)
                    const diferenca = t.pontuacao_total - primeira.pontuacao_total
                    if (diferenca === 0) return 'Mesma pontuação da 1ª. Não entra na nota nem nas médias.'
                    return `${diferenca > 0 ? '+' : '−'}${formatarNumero(Math.abs(diferenca))} ${
                      Math.abs(diferenca) === 1 ? 'acerto' : 'acertos'
                    } em relação à 1ª, com as matrizes já vistas. Não entra na nota nem nas médias.`
                  })()}
                </>
              )}
            </p>
          </div>
        )
      })}
    </div>
  )
}
