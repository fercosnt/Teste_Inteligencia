# Tasks — Persistência e Dashboard de Resultados do Teste de Raven

**Parent**: [PRD/PRD.md](PRD.md)
**Gerado em**: 2026-07-24
**Slicing**: vertical
**Total slices**: 11 — 11 concluídas · 0 no backlog

> **Estado**: a v1 está em produção em https://ti.bslabs.com.br desde 2026-07-24.
> A Parte A registra o que foi entregue na v1; a Parte B, a v2.
>
> **Atualização 2026-07-24**: as três fatias bloqueantes foram resolvidas. O limite de 40% e a
> retenção foram decididos e implementados (viraram A5 e A6); o email foi descartado desta fase.
>
> **Atualização 2026-07-25**: o backlog inteiro foi executado na branch
> `feature/raven-dashboard-v2` — testes, busca, ordenação e export CSV. Ainda não está em
> produção: falta merge e deploy.

---

# Parte A — v1 (concluída)

Fatias entregues. Mantidas aqui para rastreabilidade PRD → commit.

- [x] **Slice A0: Estrutura no banco** [Direto]

  **Demo**: inserir respostas cruas e ver pontuação, acertos por série e classificação calculados pelo banco.

  **Camadas**: schema

  **Entregue por**: migrations `create_raven_gabarito_functions`, `create_raven_resultados`, `create_raven_views` no projeto `qyrkyvoilfaxppbvtkpi`

  **Verificado**: gabarito perfeito → 60/60 e 100,00%; série A zerada → 48/60 e 80,00%; 2520s → 42,00 min

- [x] **Slice A1: Gravar um resultado real no banco** [Direto]

  **Demo**: concluir o teste e ver a linha aparecer em `raven_resultados` com a pontuação correta.

  **Camadas**: schema + API + UI

  **Entregue por**: `d669e8e` — [app/api/resultados/route.js](../app/api/resultados/route.js), [lib/supabase-server.js](../lib/supabase-server.js), [app/resultado/page.js](../app/resultado/page.js)

  **Verificado em produção**: `POST` com 10 primeiras erradas → `201 {pontuacao: 50, percentual: 83.33}`

- [x] **Slice A2: Remover o N8N e corrigir a promessa de email** [Direto]

  **Demo**: nenhuma referência ao webhook no código; nenhuma tela promete email.

  **Camadas**: UI + config + docs

  **Entregue por**: `d669e8e` e `0787064` — [app/page.js](../app/page.js), [app/instrucoes/page.js](../app/instrucoes/page.js), [app/resultado/page.js](../app/resultado/page.js), `.env.example`, `README.md`

  **Verificado**: `grep -rn -i "n8n\|webhook" app lib components` não retorna nada

- [x] **Slice A3: Trancar o dashboard com senha** [Direto]

  **Demo**: `/relatorios` sem senha redireciona ao login; com a senha certa, entra.

  **Camadas**: middleware + API + UI

  **Entregue por**: `d669e8e` — [middleware.js](../middleware.js), [app/api/login/route.js](../app/api/login/route.js), [app/login/page.js](../app/login/page.js)

  **Verificado em produção**: sem cookie → 307; senha errada → 401; senha certa → 200

- [x] **Slice A4: Dashboard com lista de candidatos, agregados e detalhe por série** [Direto]

  **Demo**: RH abre `/relatorios`, vê os agregados e abre um candidato para o detalhe questão a questão.

  **Camadas**: API + UI

  **Entregue por**: `d669e8e` — [app/relatorios/page.js](../app/relatorios/page.js), [app/relatorios/sair-button.js](../app/relatorios/sair-button.js)

  **Verificado**: números da tela idênticos a `raven_dashboard_resumo`; conferido visualmente por screenshot

- [x] **Slice A5: Corrigir o limite de 40% na classificação** [era Bloqueante — decidido em 2026-07-24]

  **Demo**: um candidato com exatamente 24/60 é classificado de forma coerente com o rótulo exibido.

  **Camadas**: schema

  **Decisão tomada**: `> 40` virou `>= 40`, e o rótulo de Regular virou "40-59%". Agora toda faixa
  fecha com a anterior sem buraco — antes, 40,00% exato caía em "menor que 40%".

  **Entregue por**: migration `fix_classificacao_limite_40`

  **Verificado**: 24 acertos (40,00%) → "🟠 Regular (40-59%)"; 23 acertos (38,33%) → "🔴 Abaixo da Média (<40%)"

- [x] **Slice A6: Retenção de dados de candidatos** [era Bloqueante — decidido em 2026-07-24]

  **Demo**: registros com mais de 1 ano perdem os dados pessoais automaticamente, sem intervenção.

  **Camadas**: schema + job

  **Decisão tomada**: 1 ano, por **anonimização** em vez de exclusão — remove nome, email e
  telefone, preserva respostas, pontuação e tempos, para que as médias históricas do dashboard
  não mudem retroativamente.

  **Entregue por**: migrations `add_retencao_1_ano` e `schedule_retencao_raven`

  **Verificado**: linha de 13 meses anonimizada mantendo `pontuacao_total = 60`; linha de 1 mês
  intacta; segunda execução retornou 0 (idempotente); job ativo em `cron.job` às `0 6 * * *`

---

# Parte B — v2 (concluída na branch `feature/raven-dashboard-v2`)

- [x] **Slice 0: Criar feature branch** [Direto]
  - Branch: `feature/raven-dashboard-v2` — criada a partir de `main` atualizado

---

- [x] **Slice 1: Suíte de testes cobre o cálculo de pontuação e a validação da rota** [Direto]

  **Demo**: `npm test` roda e falha se alguém quebrar o gabarito ou afrouxar a validação do payload.

  **Camadas**: teste + config

  > **Por que foi a primeira**: o PRD (seção 7b) definiu esses testes como o mínimo aceitável
  > para a v1, e a v1 foi ao ar sem eles — a verificação foi toda manual.

  **Subtarefas**:
  - [x] Vitest instalado e configurado (alias `@/` + carga do `.env.local` para os testes de banco)
  - [x] Teste de `raven_acertos`: respostas conhecidas → acertos esperados por série e total
  - [x] Teste da validação de `POST /api/resultados`: 59 e 61 respostas → 400; opção 7 na série A → 400 (e válida na série C, que tem 8 opções); `dataFim` < `dataInicio` → 400
  - [x] Teste anti-fraude: payload com `pontuacao: 60` e respostas erradas grava a pontuação real
  - [x] `"test": "vitest run"` e `"test:watch": "vitest"` no `package.json`

  **Entregue por**: `a38ad95` — [vitest.config.js](../vitest.config.js), [tests/db/pontuacao.test.js](../tests/db/pontuacao.test.js), [tests/api/resultados.test.js](../tests/api/resultados.test.js)

  **Verificação**:
  - [x] `npm test` passa — 17 testes nesta fatia
  - [x] Divergência no gabarito faz 4 testes falharem (verificado alterando `lib/quiz-data.js` e restaurando)
  - [x] `npm run build` continua passando

  > **Decisões de teste**: `tests/db` chama `raven_gabarito`/`raven_acertos` via RPC contra o
  > Supabase real — as funções são `IMMUTABLE` e nada é inserido, então rodar contra produção
  > é seguro. O teste mais valioso compara o gabarito do banco com o de `lib/quiz-data.js`:
  > se divergirem, a tela mostra um número e a base guarda outro.
  >
  > `tests/api` dubla o Supabase. O que a rota promete é *o que ela manda gravar*; o que o
  > Postgres devolve já é coberto pelo teste de banco. Dublar também evita inserir candidatos
  > falsos na tabela que o RH lê.

---

- [x] **Slice 2: RH busca um candidato por nome ou email** [Direto]

  **Demo**: RH digita "maria" no campo de busca e a lista filtra para os candidatos correspondentes.

  **Camadas**: API + UI + teste

  **Subtarefas**:
  - [x] `/relatorios` aceita `?q=` e filtra por `nome` ou `email` (`ilike`)
  - [x] Campo de busca acima da tabela, preservando o valor na URL
  - [x] Estado vazio específico de busca ("nenhum candidato encontrado para X")
  - [x] Teste: busca por termo existente retorna subconjunto; termo inexistente retorna vazio

  **Entregue por**: `3e9d066` — [lib/relatorios-query.js](../lib/relatorios-query.js), [app/relatorios/busca.js](../app/relatorios/busca.js), [app/relatorios/page.js](../app/relatorios/page.js)

  **Verificação**:
  - [x] Buscar por nome parcial filtra a lista
  - [x] Recarregar a página mantém o filtro (está na URL)
  - [x] Limpar a busca volta a listar todos

  > **Escapamento em duas camadas**, na ordem: `%` e `_` para que o termo seja literal
  > (procurar "50%" não pode casar com todo mundo), e aspas/barras porque o valor vai entre
  > aspas no filtro `or` — o que também neutraliza a vírgula, que senão viraria separador.
  > Coberto contra o Postgres real em [tests/db/busca.test.js](../tests/db/busca.test.js).
  >
  > Os agregados continuam olhando a base inteira mesmo com busca ativa: são o retrato do
  > processo, não do filtro. O contador ao lado do campo diz quantos ficaram de fora.

---

- [x] **Slice 3: RH ordena a lista por pontuação, data ou tempo** [Direto]

  **Demo**: RH clica no cabeçalho "Pontos" e a lista reordena do maior para o menor.

  **Camadas**: API + UI

  **Subtarefas**:
  - [x] `/relatorios` aceita `?ordem=` e `?dir=` com validação de campos permitidos
  - [x] Cabeçalhos clicáveis com indicador visual da ordenação ativa
  - [x] Ordenação padrão continua sendo data decrescente

  **Entregue por**: `3e9d066` — mesmo commit da Slice 2: a própria tasklist marca esta fatia
  como bloqueada pela anterior porque compartilham o estado de query na URL, e separá-las
  depois exigiria desmontar o mesmo mecanismo em dois pedaços artificiais.

  **Verificação**:
  - [x] Ordenar por pontuação decrescente coloca a maior nota no topo
  - [x] Ordenação combina com a busca da Slice 2 sem se anular
  - [x] Campo inválido em `?ordem=` cai no padrão em vez de quebrar

  > Ordena por `data_fim`, a data que a tela mostra — e não por `created_at`, como antes.
  > Clicar na coluna ativa inverte; clicar em outra começa pela direção que faz sentido
  > para o dado (nota alta primeiro, nome de A a Z, mais rápido primeiro).

---

- [x] **Slice 4: RH exporta os resultados em CSV** [Direto]

  **Demo**: RH clica "Exportar CSV" e baixa um arquivo com os candidatos atualmente filtrados.

  **Camadas**: API + UI + teste

  **Subtarefas**:
  - [x] `GET /api/resultados/export` protegido pelo mesmo middleware, aceitando os mesmos filtros
  - [x] CSV com cabeçalho: nome, email, telefone, início, conclusão, tempo, acertos por série, total, percentual, classificação
  - [x] Escapar separador, aspas e quebras de linha nos campos de texto
  - [x] Botão de exportar no dashboard, levando busca e ordenação junto
  - [x] Teste: export sem cookie redireciona; com cookie retorna `text/csv`

  **Entregue por**: `a8018c5` — [lib/csv.js](../lib/csv.js), [app/api/resultados/export/route.js](../app/api/resultados/export/route.js), [middleware.js](../middleware.js), [app/relatorios/busca.js](../app/relatorios/busca.js)

  **Verificação**:
  - [x] Arquivo baixado abre no Excel com as colunas corretas
  - [x] Um nome contendo vírgula não quebra as colunas
  - [x] Export sem autenticação não entrega dados

  > **Formato mira o Excel em português**, que é onde o RH abre o arquivo, e não um parser
  > genérico: separador `;` (com `,` o Excel pt-BR joga a linha inteira numa coluna só),
  > vírgula decimal e BOM (sem ele "João" vira "JoÃ£o"). Se um dia isso precisar alimentar
  > um script, o lugar de mudar é `lib/csv.js` — o route handler não sabe nada de formato.
  >
  > **Injeção de fórmula**: campo começando com `=`, `+`, `-` ou `@` sai prefixado com
  > apóstrofo. Nome e email vêm de quem faz o teste; sem isso, um candidato escolheria qual
  > fórmula roda quando o RH abre a planilha.
  >
  > **A gravação do candidato ficou de fora do matcher** de propósito. Um matcher amplo
  > (`/api/resultados/:path*`) fecharia `POST /api/resultados` e ninguém concluiria o teste.
  > Há teste travando essa distinção.

---

## O que falta para chegar em produção

- [ ] Merge de `feature/raven-dashboard-v2` em `main`
- [ ] Deploy na Vercel e conferência de `/relatorios` com dados reais

---

## Fora do escopo desta fase

| Item | Por quê |
|---|---|
| **Envio de email ao candidato e ao RH** | Decidido em 2026-07-24: não haverá email nesta fase. As telas já não prometem. Reabrir exige escolher provedor e verificar domínio remetente com SPF/DKIM |

## Questões ainda sem slice

Não viraram tarefa porque dependem de uma definição de produto anterior:

| Questão | Por quê |
|---|---|
| Deduplicar tentativas do mesmo email | Hoje cada tentativa vira uma linha. Antes de deduplicar é preciso decidir o que é a verdade: a primeira tentativa, a última, ou a melhor |
| Ranking entre candidatos | Muda a hierarquia visual do dashboard. Depende de o RH avaliar comparativamente ou um por vez |
| Autenticação individual (Supabase Auth) | Só se paga quando houver mais de um perfil de acesso ou necessidade de auditar quem viu o quê. Ver PRD, Fora do Escopo |
