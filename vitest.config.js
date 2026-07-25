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
  },
})
