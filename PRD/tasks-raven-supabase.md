# Tasks — Persistência e Dashboard de Resultados do Teste de Raven

**Parent**: [PRD/PRD.md](PRD.md)
**Gerado em**: 2026-07-24
**Slicing**: vertical
**Total slices**: 13 — 5 concluídas na v1 · 8 no backlog (5 Direto / 3 Bloqueante = 37%), além da Slice 0 de branch

> **Estado**: a v1 está em produção em https://ti.bslabs.com.br desde 2026-07-24.
> A Parte A registra o que já foi entregue, com os commits. A Parte B é o trabalho à frente.

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

---

# Parte B — Backlog

- [ ] **Slice 0: Criar feature branch** [Direto]
  - Branch: `feature/raven-dashboard-v2`
  - Base: `main`
  - Verificar que main está atualizado (`git pull`)

---

- [ ] **Slice 1: Suíte de testes cobre o cálculo de pontuação e a validação da rota** [Direto]

  **Demo**: `npm test` roda e falha se alguém quebrar o gabarito ou afrouxar a validação do payload.

  **Camadas**: teste + config

  **Bloqueado por**: Nenhum — pode começar imediato

  > **Por que é a primeira**: o PRD (seção 7b) definiu esses testes como o mínimo aceitável
  > para a v1, e a v1 foi ao ar sem eles — a verificação foi toda manual. Enquanto essa
  > lacuna existir, uma alteração no gabarito ou na validação passa despercebida.

  **Subtarefas**:
  - [ ] Instalar e configurar Vitest (não há runner no projeto; `package.json` não tem script `test`)
  - [ ] Teste de `raven_acertos`: respostas conhecidas → acertos esperados por série e total
  - [ ] Teste da validação de `POST /api/resultados`: 59 respostas → 400; opção 7 na série A → 400; `dataFim` < `dataInicio` → 400
  - [ ] Teste anti-fraude: payload com `pontuacao: 60` e respostas erradas grava a pontuação real
  - [ ] Adicionar `"test": "vitest"` ao `package.json`

  **Arquivos relevantes**:
  - `package.json`
  - `tests/api/resultados.test.js`
  - `tests/db/pontuacao.test.js`

  **Verificação** (slice é DEMONSTRÁVEL quando):
  - [ ] `npm test` passa com os 4 cenários acima
  - [ ] Alterar um valor em `raven_gabarito()` faz o teste de pontuação falhar
  - [ ] `npm run build` continua passando

  **Commit**: `test: cover scoring logic and results endpoint validation`

---

- [ ] **Slice 2: RH busca um candidato por nome ou email** [Direto]

  **Demo**: RH digita "maria" no campo de busca e a lista filtra para os candidatos correspondentes.

  **Camadas**: API + UI + teste

  **Bloqueado por**: Nenhum — pode começar imediato

  **Subtarefas**:
  - [ ] `/relatorios` aceita `?q=` e filtra por `nome` ou `email` (`ilike`)
  - [ ] Campo de busca acima da tabela, preservando o valor na URL
  - [ ] Estado vazio específico de busca ("nenhum candidato encontrado para X")
  - [ ] Teste: busca por termo existente retorna subconjunto; termo inexistente retorna vazio

  **Arquivos relevantes**:
  - `app/relatorios/page.js`
  - `app/relatorios/busca.js`

  **Verificação**:
  - [ ] Buscar por nome parcial filtra a lista
  - [ ] Recarregar a página mantém o filtro (está na URL)
  - [ ] Limpar a busca volta a listar todos

  **Commit**: `feat: search candidates by name or email in dashboard`

---

- [ ] **Slice 3: RH ordena a lista por pontuação, data ou tempo** [Direto]

  **Demo**: RH clica no cabeçalho "Pontuação" e a lista reordena do maior para o menor.

  **Camadas**: API + UI

  **Bloqueado por**: Slice 2 (compartilham o estado de query na URL)

  **Subtarefas**:
  - [ ] `/relatorios` aceita `?ordem=` e `?dir=` com validação de campos permitidos
  - [ ] Cabeçalhos clicáveis com indicador visual da ordenação ativa
  - [ ] Ordenação padrão continua sendo data decrescente

  **Arquivos relevantes**:
  - `app/relatorios/page.js`

  **Verificação**:
  - [ ] Ordenar por pontuação decrescente coloca a maior nota no topo
  - [ ] Ordenação combina com a busca da Slice 2 sem se anular
  - [ ] Campo inválido em `?ordem=` cai no padrão em vez de quebrar

  **Commit**: `feat: sort candidate list by score, date or duration`

---

- [ ] **Slice 4: RH exporta os resultados em CSV** [Direto]

  **Demo**: RH clica "Exportar CSV" e baixa um arquivo com os candidatos atualmente filtrados.

  **Camadas**: API + UI + teste

  **Bloqueado por**: Slices 2 e 3 (o export respeita filtro e ordenação vigentes)

  **Subtarefas**:
  - [ ] `GET /api/resultados/export` protegido pelo mesmo middleware, aceitando os mesmos filtros
  - [ ] Gerar CSV com cabeçalho: nome, email, telefone, data, tempo, acertos por série, total, percentual, classificação
  - [ ] Escapar vírgulas, aspas e quebras de linha nos campos de texto
  - [ ] Botão de exportar no dashboard
  - [ ] Teste: export sem cookie retorna redirect; com cookie retorna `text/csv`

  **Arquivos relevantes**:
  - `app/api/resultados/export/route.js`
  - `app/relatorios/page.js`
  - `middleware.js` (incluir a rota no matcher)

  **Verificação**:
  - [ ] Arquivo baixado abre no Excel com as colunas corretas
  - [ ] Um nome contendo vírgula não quebra as colunas
  - [ ] Export sem autenticação não entrega dados

  **Commit**: `feat: export filtered results as CSV`

---

- [ ] **Slice 5: Corrigir o limite de 40% na classificação** [Bloqueante]

  **Demo**: um candidato com exatamente 24/60 passa a ser classificado de forma coerente com o rótulo exibido.

  **Camadas**: schema + verificação

  **Bloqueado por**: Nenhum tecnicamente — aguarda decisão

  **Decisão pendente**: hoje `24/60 = 40,00%` cai em "🔴 Abaixo da Média (<40%)", fiel à fórmula
  original do Airtable (`> 0.40`), mas o rótulo de "Regular" diz "41-59%" — 40% não é menor que 40%.
  Trocar para `>= 40` (e ajustar o rótulo para "40-59%") ou manter como está? **Decisor: Fernando.**

  **Subtarefas**:
  - [ ] Migration recriando `raven_resultados_detalhe` com o limite decidido
  - [ ] Ajustar os rótulos das faixas para refletirem os limites reais
  - [ ] Atualizar a seção 8.4 do PRD com a decisão

  **Arquivos relevantes**:
  - migration no projeto `qyrkyvoilfaxppbvtkpi`
  - `PRD/PRD.md`

  **Verificação**:
  - [ ] Linha com exatamente 24 acertos retorna a classificação decidida
  - [ ] Linha com 23 e com 25 acertos continuam nas faixas corretas

  **Commit**: `fix: align 40% classification boundary with its label`

---

- [ ] **Slice 6: Política de retenção de dados de candidatos** [Bloqueante]

  **Demo**: registros de candidatos mais antigos que o prazo definido deixam de existir na base.

  **Camadas**: schema + job

  **Bloqueado por**: Nenhum tecnicamente — aguarda decisão

  **Decisão pendente**: por quanto tempo guardar nome, email e telefone de candidatos não
  contratados? Relevante para LGPD — hoje não há prazo definido e os dados ficam indefinidamente.
  Também decidir se é exclusão total ou anonimização (preservando as pontuações para estatística).
  **Decisor: Fernando.**

  **Subtarefas**:
  - [ ] Definir prazo e modalidade (exclusão vs anonimização)
  - [ ] Função SQL de expurgo com o critério decidido
  - [ ] Agendar via `pg_cron` no Supabase
  - [ ] Documentar a política no README

  **Arquivos relevantes**:
  - migration no projeto `qyrkyvoilfaxppbvtkpi`
  - `README.md`

  **Verificação**:
  - [ ] Linha com `created_at` além do prazo é removida/anonimizada ao rodar a função
  - [ ] Linha dentro do prazo permanece intacta
  - [ ] O job aparece agendado em `cron.job`

  **Commit**: `feat: add candidate data retention policy`

---

- [ ] **Slice 7: Candidato recebe o resultado por email** [Bloqueante]

  **Demo**: ao concluir o teste, o candidato recebe no email um resumo com pontuação e desempenho por série.

  **Camadas**: API + integração + teste

  **Bloqueado por**: Slice 1 (a suíte de testes precisa existir antes de acoplar um serviço externo)

  **Decisão pendente**: qual provedor (Resend, SES, outro) e qual domínio remetente — exige
  domínio verificado com SPF/DKIM. Também definir se o email sai de forma síncrona na conclusão
  ou por fila, para que uma falha no provedor não bloqueie a tela do candidato. **Decisor: Fernando.**

  > Removido do escopo da v1 por decisão de 2026-07-24. As telas foram ajustadas para
  > não prometerem email enquanto isso não existir — ver PRD seção 9b.

  **Subtarefas**:
  - [ ] Configurar provedor e verificar domínio remetente
  - [ ] Template do email com pontuação, percentual e desempenho por série
  - [ ] Disparo após a gravação bem-sucedida, sem bloquear a resposta ao candidato
  - [ ] Restaurar a copy de "você receberá um email" nas telas
  - [ ] Teste: falha no provedor não faz o `POST /api/resultados` retornar erro

  **Arquivos relevantes**:
  - `app/api/resultados/route.js`
  - `lib/email.js`
  - `app/page.js`, `app/instrucoes/page.js`, `app/resultado/page.js`

  **Verificação**:
  - [ ] Teste completo entrega email na caixa de entrada (não em spam)
  - [ ] Derrubar o provedor não impede a gravação nem quebra a tela final
  - [ ] O resultado gravado continua sendo a fonte de verdade do que o email informa

  **Commit**: `feat: email test results to candidate after completion`

---

- [ ] **Slice 8: RH é notificado quando um teste é concluído** [Direto]

  **Demo**: ao concluir um teste, o RH recebe um email com nome, pontuação e link para o dashboard.

  **Camadas**: API + integração

  **Bloqueado por**: Slice 7 (reaproveita provedor e infraestrutura de envio)

  **Subtarefas**:
  - [ ] Variável `RH_NOTIFICACAO_EMAIL` (fora de `NEXT_PUBLIC_`)
  - [ ] Email curto com nome, pontuação, classificação e link para `/relatorios`
  - [ ] Não enviar se a variável não estiver configurada

  **Arquivos relevantes**:
  - `lib/email.js`
  - `app/api/resultados/route.js`
  - `.env.example`

  **Verificação**:
  - [ ] Concluir um teste dispara o email para o endereço configurado
  - [ ] Sem a variável configurada, a gravação segue normal e nada é enviado

  **Commit**: `feat: notify HR by email on test completion`

---

## Questões ainda sem slice

Não viraram tarefa porque dependem de uma definição de produto anterior:

| Questão | Por quê |
|---|---|
| Deduplicar tentativas do mesmo email | Hoje cada tentativa vira uma linha. Antes de deduplicar é preciso decidir o que é a verdade: a primeira tentativa, a última, ou a melhor |
| Ranking entre candidatos | Muda a hierarquia visual do dashboard. Depende de o RH avaliar comparativamente ou um por vez |
| Autenticação individual (Supabase Auth) | Só se paga quando houver mais de um perfil de acesso ou necessidade de auditar quem viu o quê. Ver PRD, Fora do Escopo |
