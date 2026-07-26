import { describe, it, expect, beforeEach } from 'vitest'
import {
  identificar,
  registrarFalha,
  limpar,
  bloqueadoPor,
  LIMITE_TENTATIVAS,
} from '@/lib/rate-limit'

// O freio existe porque, sem ele, 25 tentativas de senha passavam em 5s sem
// bloqueio nenhum — medido em produção.

const req = (headers = {}) => new Request('http://x/api/login', { headers })
let n = 0
const chaveNova = () => `ip-${++n}`

beforeEach(() => {
  n += 1000 // cada teste com IPs próprios, sem herdar contagem
})

describe('identificar', () => {
  it('usa o primeiro IP do x-forwarded-for, que é o do cliente', () => {
    expect(identificar(req({ 'x-forwarded-for': '203.0.113.9, 70.41.3.18' }))).toBe('203.0.113.9')
  })

  it('cai no x-real-ip quando não há forwarded', () => {
    expect(identificar(req({ 'x-real-ip': '198.51.100.7' }))).toBe('198.51.100.7')
  })

  it('não explode quando não há cabeçalho nenhum', () => {
    expect(identificar(req())).toBe('desconhecido')
  })
})

describe('bloqueio por tentativas', () => {
  it('deixa passar quem nunca errou', () => {
    expect(bloqueadoPor(chaveNova())).toBeNull()
  })

  it('deixa errar até o limite e bloqueia na seguinte', () => {
    const ip = chaveNova()
    for (let i = 0; i < LIMITE_TENTATIVAS - 1; i++) {
      registrarFalha(ip)
      expect(bloqueadoPor(ip), `falha ${i + 1}`).toBeNull()
    }
    registrarFalha(ip)
    expect(bloqueadoPor(ip)).toBeGreaterThan(0)
  })

  it('o bloqueio devolve quantos segundos faltam, dentro da janela de 15 min', () => {
    const ip = chaveNova()
    for (let i = 0; i < LIMITE_TENTATIVAS; i++) registrarFalha(ip)

    const espera = bloqueadoPor(ip)
    expect(espera).toBeGreaterThan(0)
    expect(espera).toBeLessThanOrEqual(15 * 60)
  })

  it('bloqueia um IP sem afetar os outros', () => {
    const atacante = chaveNova()
    const inocente = chaveNova()
    for (let i = 0; i < LIMITE_TENTATIVAS; i++) registrarFalha(atacante)

    expect(bloqueadoPor(atacante)).toBeGreaterThan(0)
    expect(bloqueadoPor(inocente)).toBeNull()
  })

  it('acerto de senha zera o contador', () => {
    const ip = chaveNova()
    for (let i = 0; i < LIMITE_TENTATIVAS; i++) registrarFalha(ip)
    expect(bloqueadoPor(ip)).toBeGreaterThan(0)

    limpar(ip)
    expect(bloqueadoPor(ip)).toBeNull()
  })

  it('a janela expira: falhas velhas não contam contra quem volta depois', () => {
    const ip = chaveNova()
    const antes = Date.now() - 16 * 60 * 1000 // 16 min atrás, janela é de 15
    for (let i = 0; i < LIMITE_TENTATIVAS; i++) registrarFalha(ip, antes)

    expect(bloqueadoPor(ip)).toBeNull()
  })
})
