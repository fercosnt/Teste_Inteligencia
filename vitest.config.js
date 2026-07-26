import { defineConfig } from 'vitest/config'
import { loadEnv, transformWithOxc } from 'vite'
import path from 'node:path'

// Os componentes do App Router são `.js` com JSX dentro — convenção do Next,
// que compila esses arquivos sabendo disso. O Vite decide como ler cada arquivo
// pela extensão, então para ele `.js` é JavaScript puro e o primeiro `<div>` é
// erro de sintaxe: o teste falha ao importar, antes de rodar um caso sequer.
//
// Não dá para resolver com uma opção global (`oxc.lang`), porque ela valeria
// também para os `.tsx` de components/ui e quebraria a sintaxe de tipos. Daí o
// plugin: só os `.js` de app/ são relidos como JSX, e antes do resto do
// pipeline, para que o import-analysis já receba JavaScript válido.
const jsxNosJsDoApp = {
  name: 'jsx-nos-js-do-app',
  enforce: 'pre',
  async transform(codigo, id) {
    if (!/\/app\/.*\.js(\?.*)?$/.test(id)) return null

    const { code, map } = await transformWithOxc(codigo, id, {
      lang: 'jsx',
      jsx: { runtime: 'automatic' },
    })
    return { code, map }
  },
}

// Os testes de banco (tests/db) falam com o Supabase de verdade, então precisam
// das mesmas variáveis que o app usa em dev. O Next carrega .env.local sozinho;
// o Vitest não, então carregamos aqui — sem prefixo, para pegar as de servidor.
const env = loadEnv('', process.cwd(), '')

export default defineConfig({
  plugins: [jsxNosJsDoApp],
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
    // Os testes de tests/db tratam o domínio @teste-automatizado.invalid como
    // sandbox exclusiva: cada um apaga o domínio inteiro ao começar e ao
    // terminar, para que uma execução interrompida não deixe candidato falso no
    // dashboard do RH. Em paralelo, dois arquivos assim apagam as linhas um do
    // outro e falham sem nada estar quebrado.
    //
    // Serializar os arquivos custa alguns segundos e preserva a limpeza total,
    // que é a propriedade que impede sobra de dado pessoal falso no banco.
    fileParallelism: false,
    // Os testes de tests/db falam com o Supabase pela rede. O padrão de 5s
    // basta num dia bom e falha por timeout quando o projeto está frio — o que
    // vira ruído: o teste "quebra" sem nada ter quebrado.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
