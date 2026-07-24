# Tasks — Persistência e Dashboard de Resultados do Teste de Raven

**Parent**: [PRD/PRD.md](PRD.md)
**Gerado em**: 2026-07-24
**Slicing**: vertical (cada fatia é demonstrável de ponta a ponta)
**Total de fatias**: 5 (5 Direto / 0 Bloqueante)

> Fatia 0 (schema no Supabase) já foi executada e validada antes deste documento — ver PRD seção 8.3.

---

## Fatia 1 — Gravar um resultado real no banco `[Direto]`

**Demo**: concluir o teste no navegador e ver a linha aparecer em `raven_resultados` com a pontuação correta.

**Camadas**: dependência → cliente Supabase → rota de API → tela de resultado
**Bloqueado por**: nenhum

**Subtarefas**
1. Instalar `@supabase/supabase-js`
2. Criar o cliente server-side (lê `SUPABASE_SERVICE_ROLE_KEY`, nunca exposto ao browser)
3. Criar `POST /api/resultados` com validação: 60 respostas, intervalo válido por série (A/B: 1–6, C/D/E: 1–8), `data_fim >= data_inicio`
4. Trocar a chamada do webhook por `fetch('/api/resultados')` na tela de resultado
5. Parar de enviar `pontuacao` — o banco calcula

**Verificação end-to-end**: fazer um teste completo; conferir no banco que `pontuacao_total` bate com o exibido na tela.

**Commit**: `feat: gravar resultados do teste direto no Supabase`

---

## Fatia 2 — Remover o N8N e corrigir a promessa de email `[Direto]`

**Demo**: nenhuma referência ao webhook no código; a tela final não promete mais um email que não existe.

**Camadas**: tela de resultado → config → docs
**Bloqueado por**: Fatia 1 (a gravação precisa estar funcionando antes de remover o caminho antigo)

**Subtarefas**
1. Remover a URL do webhook e o `.env` correspondente
2. Reescrever o bloco "Próximos Passos" — sem promessa de email nem de relatório automático
3. Atualizar `.env.example` e `README.md`

**Verificação end-to-end**: `grep -r "n8n.srv881294" app/ lib/` não retorna nada.

**Commit**: `refactor: remover integração N8N e corrigir copy da tela final`

---

## Fatia 3 — Trancar o dashboard com senha `[Direto]`

**Demo**: acessar `/relatorios` sem senha redireciona para a tela de login; com a senha certa, entra.

**Camadas**: middleware → tela de login → rota de autenticação
**Bloqueado por**: nenhum

**Subtarefas**
1. Middleware protegendo `/relatorios` e a API de leitura
2. Tela de login com campo de senha
3. Rota que valida contra `DASHBOARD_PASSWORD` e grava cookie `httpOnly`

**Verificação end-to-end**: acessar em aba anônima → login; senha errada → erro; senha certa → dashboard.

**Commit**: `feat: proteger dashboard com senha`

---

## Fatia 4 — Dashboard com a lista de candidatos e agregados `[Direto]`

**Demo**: abrir `/relatorios` e ver o painel de números agregados + a tabela de candidatos ordenada por data.

**Camadas**: leitura das views → página do dashboard → componentes visuais
**Bloqueado por**: Fatias 1 e 3

**Subtarefas**
1. Ler `raven_dashboard_resumo` e `raven_resultados_detalhe`
2. Cards de agregados: total, tempo médio, pontuação média, média por série
3. Tabela: nome, data, tempo, pontuação, percentual, classificação
4. Estado vazio (nenhum candidato ainda)

**Verificação end-to-end**: com N linhas no banco, a tabela mostra N linhas e os cards batem com a view.

**Commit**: `feat: dashboard de resultados com agregados e lista de candidatos`

---

## Fatia 5 — Detalhe por série de cada candidato `[Direto]`

**Demo**: clicar num candidato e ver o desempenho série a série, com respostas vs gabarito.

**Camadas**: página de detalhe → componentes
**Bloqueado por**: Fatia 4

**Subtarefas**
1. Barra de acertos por série (A–E) com percentual
2. Comparação resposta × gabarito com ✓/✗ por questão
3. Distribuição por classificação no painel geral

**Verificação end-to-end**: o detalhe de um candidato conhecido reproduz exatamente os números de `raven_resultados_detalhe`.

**Commit**: `feat: detalhamento por série no dashboard`
