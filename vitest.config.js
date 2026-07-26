import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import path from 'node:path'

// Os testes de banco (tests/db) falam com o Supabase de verdade, então precisam
// das mesmas variáveis que o app usa em dev. O Next carrega .env.local sozinho;
// o Vitest não, então carregamos aqui — sem prefixo, para pegar as de servidor.
const env = loadEnv('', process.cwd(), '')

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(process.cwd()) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    env,
    // Os testes de tests/db falam com o Supabase pela rede. O padrão de 5s
    // basta num dia bom e falha por timeout quando o projeto está frio — o que
    // vira ruído: o teste "quebra" sem nada ter quebrado.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
