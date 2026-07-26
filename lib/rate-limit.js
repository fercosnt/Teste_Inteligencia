// Freio de tentativas por IP, para a senha única do dashboard.
//
// Sem isto, 25 tentativas passavam em 5 segundos sem nenhum bloqueio —
// verificado em produção. Com senha única e sem limite, força bruta contra os
// dados pessoais dos candidatos é só questão de tempo.
//
// LIMITE HONESTO: o contador é de memória do processo. Em serverless podem
// existir várias instâncias, então o teto real é (limite x instâncias). Isso
// não é um limite exato — é um freio que transforma "milhares de tentativas por
// minuto" em "algumas dezenas". Para um dashboard interno com senha longa,
// basta; se um dia precisar de garantia dura, o contador tem que sair daqui
// para um armazenamento compartilhado.

const JANELA_MS = 15 * 60 * 1000 // 15 min
const LIMITE = 8 // tentativas erradas por janela
const LIMPEZA_A_CADA = 500

const tentativas = new Map()
let desdeALimpeza = 0

// Sem isso, um atacante mantém um Map crescendo até derrubar a instância.
function limparVencidos(agora) {
  if (++desdeALimpeza < LIMPEZA_A_CADA) return
  desdeALimpeza = 0
  for (const [chave, registro] of tentativas)
    if (agora - registro.primeira > JANELA_MS) tentativas.delete(chave)
}

export function identificar(request) {
  // Na Vercel o IP real vem no x-forwarded-for; o primeiro da lista é o cliente.
  const encaminhado = request.headers.get('x-forwarded-for')
  return encaminhado?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'desconhecido'
}

export function registrarFalha(chave, agora = Date.now()) {
  const registro = tentativas.get(chave)
  if (!registro || agora - registro.primeira > JANELA_MS) {
    tentativas.set(chave, { falhas: 1, primeira: agora })
    return
  }
  registro.falhas++
}

export function limpar(chave) {
  tentativas.delete(chave)
}

// Retorna null quando pode tentar, ou os segundos que faltam para liberar.
export function bloqueadoPor(chave, agora = Date.now()) {
  limparVencidos(agora)

  const registro = tentativas.get(chave)
  if (!registro) return null
  if (agora - registro.primeira > JANELA_MS) {
    tentativas.delete(chave)
    return null
  }
  if (registro.falhas < LIMITE) return null

  return Math.ceil((JANELA_MS - (agora - registro.primeira)) / 1000)
}

export const LIMITE_TENTATIVAS = LIMITE
