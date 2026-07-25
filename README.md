# 🧠 Quiz de Matrizes de Raven

Aplicação web para aplicação digital do **Teste de Matrizes Progressivas de Raven**, utilizado para avaliação de inteligência em processos de recrutamento.

## 📋 Sobre o Projeto

O Teste de Matrizes Progressivas de Raven é uma avaliação de raciocínio abstrato e inteligência fluida, amplamente utilizado em processos seletivos e avaliações psicológicas.

### Características:
- **60 questões** divididas em 5 séries (A, B, C, D, E)
- **Progressão de dificuldade** crescente
- **Séries A e B:** 6 opções de resposta
- **Séries C, D e E:** 8 opções de resposta
- **Cronômetro** para registro do tempo total
- **Navegação unidirecional** (não permite voltar)
- **Persistência no Supabase** com pontuação calculada pelo banco
- **Dashboard protegido por senha** para o RH

## 🚀 Tecnologias Utilizadas

- **Next.js 15** - Framework React (App Router)
- **Tailwind CSS 4** - Estilização
- **Supabase / Postgres** - Persistência dos resultados
- **LocalStorage** - Armazenamento temporário durante o teste

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Exportar arquivos estáticos
npm run build
```

## 🏗️ Estrutura do Projeto

```
/
├── app/
│   ├── page.js              # Tela de cadastro
│   ├── instrucoes/          # Tela de instruções
│   ├── quiz/[numero]/       # Tela de questões (dinâmica)
│   ├── resultado/           # Tela de resultado
│   ├── login/               # Senha de acesso ao dashboard
│   ├── relatorios/          # Dashboard do RH (protegido)
│   ├── api/resultados/      # Gravação no Supabase (server-side)
│   ├── api/login/           # Autenticação do dashboard
│   ├── layout.js            # Layout global
│   └── globals.css          # Estilos globais
├── lib/
│   ├── quiz-data.js         # Dados do quiz e gabarito
│   └── supabase-server.js   # Cliente Supabase (somente servidor)
├── middleware.js            # Guarda de senha do dashboard
├── PRD/                     # PRD e plano de execução
├── public/
│   └── images/              # Imagens das 60 questões
└── components/              # Componentes reutilizáveis
```

## 🔄 Fluxo da Aplicação

1. **Cadastro** → Usuário informa nome, email e telefone
2. **Instruções** → Explicação sobre o teste
3. **Questões** → 60 questões sequenciais (Q1 → Q60)
4. **Resultado** → Exibição da pontuação + gravação no Supabase
5. **Dashboard** → RH acessa `/relatorios` com senha

## 🗄️ Persistência

Os resultados são gravados no Supabase (projeto `qyrkyvoilfaxppbvtkpi` — Beauty Smile Hub).

### Payload enviado a `POST /api/resultados`
```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "telefone": "(11) 98765-4321",
  "dataInicio": "2026-07-24T14:30:00.000Z",
  "dataFim": "2026-07-24T15:12:35.000Z",
  "respostas": [4, 5, 1, 2, "... 60 posições"]
}
```

**A pontuação não é enviada.** O gabarito vive apenas no banco (`raven_gabarito()`), e
`pontuacao_total`, os acertos por série e o percentual são colunas geradas a partir das
respostas cruas. Um cliente adulterado não consegue forjar uma nota.

### Objetos no banco

| Objeto | Função |
|---|---|
| `raven_resultados` | Tabela. Respostas cruas + derivados. RLS nega tudo por padrão |
| `raven_resultados_detalhe` | View. Percentuais por série, classificação e blocos de texto por série |
| `raven_dashboard_resumo` | View. Agregados: total, tempo médio, pontuação média, média por série |
| `raven_dashboard_classificacao` | View. Distribuição por faixa de desempenho |

### 🔒 Retenção de dados (LGPD)

Dados pessoais de candidatos são mantidos por **1 ano**. Depois disso, `nome`, `email` e
`telefone` são substituídos automaticamente e a coluna `anonimizado_em` é marcada.

Respostas, pontuação e tempos são **preservados** — a anonimização remove quem a pessoa era,
não o que ela respondeu, para que as médias históricas do dashboard não mudem retroativamente.

| Item | Valor |
|---|---|
| Prazo | 1 ano a partir de `created_at` |
| Modalidade | Anonimização (não exclusão) |
| Função | `raven_anonimizar_antigos()` — idempotente |
| Agendamento | `pg_cron`, diariamente às `0 6 * * *` UTC (03:00 de Brasília) |

Para rodar manualmente: `select public.raven_anonimizar_antigos();` — retorna quantas linhas foram afetadas.

## 🎨 Responsividade

A aplicação é totalmente responsiva e funciona em:
- 💻 **Desktop** (1920x1080, 1366x768)
- 📱 **Tablet** (iPad, Android)
- 📱 **Mobile** (iPhone, Android)

## 📝 Regras do Teste

- ✅ **Resposta obrigatória** - Não pode pular questões
- ❌ **Sem retorno** - Não pode voltar para questões anteriores
- ⏱️ **Sem limite de tempo** - Apenas cronometra
- 🔒 **Sessão única** - Se fechar o navegador, perde o progresso

## 🔧 Configuração de Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto (veja `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://qyrkyvoilfaxppbvtkpi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<Supabase → Project Settings → API Keys → service_role>
DASHBOARD_PASSWORD=<senha de acesso ao /relatorios>
```

| Variável | Escopo | Se faltar |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | público | Gravação e dashboard falham |
| `SUPABASE_SERVICE_ROLE_KEY` | **servidor** | Gravação e dashboard falham |
| `DASHBOARD_PASSWORD` | **servidor** | `/relatorios` responde 503 |

⚠️ `SUPABASE_SERVICE_ROLE_KEY` e `DASHBOARD_PASSWORD` **nunca** podem receber o prefixo
`NEXT_PUBLIC_` — isso as embutiria no bundle enviado ao navegador.

## 🚀 Deploy

O deploy é na Vercel (ver `vercel.json`). As três variáveis acima precisam estar
configuradas em **Project Settings → Environment Variables** antes do deploy.

## 📄 Licença

Este projeto foi desenvolvido para uso interno em processos de recrutamento.

---

**Desenvolvido com** ❤️ **usando Next.js e Tailwind CSS**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
