import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import path from 'node:path'

// Os testes de banco (tests/db) falam com o Supabase de verdade, então precisam
// das mesmas variáveis que o app usa em dev. O Next carrega .env.local sozinho;
// o Vitest não, então carregamos aqui — sem prefixo, para pegar as de servidor.
const env = loadEnv('', process.cwd(), '')

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(process.cwd()),
      // `server-only` lança ao ser importado fora de um Server Component — é
      // essa explosão que impede o gabarito de voltar para o bundle. O Next
      // resolve o pacote pela condição "react-server", que aponta para um
      // módulo vazio; o Vitest não, então apontamos na mão. Os testes rodam no
      // servidor, então importar gabarito-servidor.js aqui é legítimo.
      'server-only': path.resolve(process.cwd(), 'node_modules/server-only/empty.js'),
    },
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
