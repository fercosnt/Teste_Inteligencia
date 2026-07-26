import { series } from '@/lib/quiz-data'
import { gabarito } from '@/lib/gabarito-servidor'

// Grade questão a questão de uma série: o que o candidato marcou e o que era.
//
// ATENÇÃO: este componente compara com o gabarito, então importa
// lib/gabarito-servidor.js e **só pode ser renderizado no servidor**. Marcar
// este arquivo — ou qualquer ancestral dele — com 'use client' arrasta o
// gabarito para o bundle do navegador, que é exatamente o vazamento que a trava
// `server-only` existe para impedir. O build quebra se isso acontecer; a quebra
// é a proteção funcionando, não um obstáculo a contornar.

export default function DetalheQuestoes({ letra, respostas }) {
  const { inicio, fim } = series[letra]
  const questoes = []

  for (let numero = inicio; numero <= fim; numero++) {
    const resposta = respostas?.[numero - 1] ?? null
    const correta = gabarito[numero - 1]
    questoes.push({ numero, resposta, correta, acertou: resposta === correta })
  }

  return (
    <div className="grid grid-cols-6 gap-2">
      {questoes.map((q) => (
        <div
          key={q.numero}
          className={`rounded-md border p-2 text-center text-xs ${
            q.acertou ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}
          title={
            q.resposta === null
              ? `Questão ${q.numero}: sem resposta, correta ${q.correta}`
              : `Questão ${q.numero}: respondeu ${q.resposta}, correta ${q.correta}`
          }
        >
          <div className="text-gray-500">Q{q.numero}</div>
          <div className={`font-semibold ${q.acertou ? 'text-green-700' : 'text-red-700'}`}>
            {q.acertou ? '✓' : '✗'}
          </div>
          <div className="text-gray-600 tabular-nums">
            {q.resposta ?? '—'}
            {!q.acertou && <span className="text-gray-400"> / {q.correta}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
