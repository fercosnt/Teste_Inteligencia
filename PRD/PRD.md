# Persistência e Dashboard de Resultados do Teste de Raven — PRD

**Autor**: Fernando | **Data**: 2026-07-24 | **Status**: Draft
**Nível**: Standard
**Upstream**: `prd-quiz-matrizes-raven.md` (v2.0, 21/10/2025) — este PRD substitui as seções 4.9 e 7.5 daquele documento
**Projeto Supabase**: `qyrkyvoilfaxppbvtkpi` (Beauty Smile Hub)

---

## 1. Problema & Contexto

### O que está acontecendo

O Teste de Matrizes de Raven está no ar e candidatos o respondem até o fim. **Nenhum resultado está sendo salvo em lugar nenhum.**

Ao concluir as 60 questões, o app dispara um `POST` do navegador do candidato para um webhook do N8N ([app/resultado/page.js:60](../app/resultado/page.js#L60)). Esse workflow **não existe mais no N8N** — verificado pelo Fernando em 2026-07-24 — e nada chega no Airtable, que era o destino final do fluxo `N8N → Airtable → Email` descrito em [RESUMO-EXECUTIVO.md:74](../RESUMO-EXECUTIVO.md#L74).

### Quem sofre

**O candidato** responde 60 questões, gasta em média 40 minutos, vê a tela de sucesso — e o resultado dele evapora. A tela ainda promete, hoje, textualmente:

> "Você receberá um email com os resultados detalhados"
> "O relatório completo será enviado para a equipe de RH"

Ambas as promessas são falsas no estado atual ([app/resultado/page.js:313-315](../app/resultado/page.js#L313-L315)).

**O RH** não tem nenhuma fonte de resultados. A página [/relatorios](../app/relatorios/page.js#L15) aponta para três views do Airtable de uma base que nunca recebeu dados.

### Por que agora

Não há backup em lugar nenhum. Os dados existem apenas no `localStorage` do navegador do candidato até o webhook responder. Cada teste feito hoje é um teste perdido de forma irrecuperável — não há fila, retentativa server-side, nem log. **Quanto mais tempo o app fica no ar assim, mais candidatos são desperdiçados.**

### Suposições que estão sendo desafiadas

| Suposição original | Realidade |
|---|---|
| "O N8N é uma camada confiável de persistência" | Um workflow deletado derruba a persistência inteira, silenciosamente |
| "O cliente pode calcular a pontuação" | O `POST` parte do navegador com URL pública; qualquer um pode forjar uma pontuação |
| "O Airtable serve como interface de análise" | Ninguém nunca viu um dado lá; a base está vazia |

### How Might We

**HMW** garantir que todo teste concluído vire um registro durável e confiável, e que o RH consiga ler esse resultado sem depender de uma integração intermediária que pode sumir sem aviso?

---

## 2. Objetivos & Métricas

### Métrica primária

| Métrica | Baseline | Meta |
|---|---|---|
| Testes concluídos que resultam em linha gravada no banco | **0%** | **100%** |

### Métricas secundárias

| Métrica | Meta |
|---|---|
| Tempo entre o candidato concluir e o RH conseguir ver o resultado | < 5s (leitura direta do banco) |
| Pontuação exibida ao candidato idêntica à calculada pelo banco | 100% |

### Guardrails

Métricas que **não podem piorar** com esta mudança:

| Guardrail | Limite |
|---|---|
| Taxa de erro na tela final do candidato | ≤ hoje (a gravação não pode virar novo ponto de falha visível) |
| Tempo de carregamento da tela de resultado | ≤ 3s (p95) |
| Dados pessoais de candidatos acessíveis sem autenticação | **0** |
| Linhas com pontuação divergente do gabarito oficial | **0** |

---

## 3. Escopo

### v1 (esta entrega)

- Tabela `raven_resultados` no Supabase, com pontuação **calculada pelo banco**
- Views de leitura para dashboard (detalhe por candidato + agregados)
- Rota server-side `POST /api/resultados` que grava no Supabase
- Remoção da chamada ao webhook N8N
- Dashboard em `/relatorios`, protegido por senha
- Correção da copy que promete email

### v2 (próximo ciclo)

- Envio de email de resultado ao candidato e ao RH
- Exportação CSV/PDF do dashboard
- Filtros e busca por candidato no dashboard

---

## Fora do Escopo

| Item | Por quê | Futuro |
|---|---|---|
| **Envio de email** | Decidido em 2026-07-24: não haverá envio de email nesta fase, nem ao candidato nem ao RH. A copy das telas foi corrigida para não prometer o que não entrega. | Sem data — reabrir quando houver necessidade |
| **Autenticação individual por usuário (Supabase Auth)** | Senha única resolve o risco imediato (link aberto) com uma fração do esforço. Contas individuais só se pagam quando houver mais de um perfil de acesso ou necessidade de auditoria de quem viu o quê. | v2, se surgir a necessidade |
| **Percentis normativos do Raven** | Converter pontuação bruta em percentil por faixa etária exige as tabelas normativas licenciadas do teste, que não temos. | Fora — depende de aquisição de material |
| **Edição/exclusão de resultados pelo dashboard** | Resultado de teste psicométrico é registro imutável; permitir edição destrói a confiabilidade. | Fora por decisão de produto |
| **Retomar teste interrompido** | Muda o modelo de sessão inteiro (hoje é `localStorage` de sessão única). Não é o problema que este PRD resolve. | Fora |
| **Migração de dados históricos do Airtable** | A base do Airtable está vazia — não existe histórico para migrar. | Não aplicável |

---

## 4. Personas & Casos de Uso

**Candidato** — faz o teste uma vez, num navegador, sem conta. Não interage com o dashboard. Só precisa que o esforço dele não se perca e que a tela não minta sobre o que vai acontecer depois.

**RH / Recrutador** — precisa ver quem fez o teste, quanto acertou no total e por série, quanto tempo levou, e comparar candidatos entre si. Acessa de desktop. Hoje não tem nenhuma ferramenta.

---

## 5. Epic Hypotheses

**Épico 1 — Persistência confiável**
> Se movermos a gravação do webhook externo para uma rota server-side que escreve direto no Postgres, então a taxa de resultados perdidos cai de 100% para ~0%, porque eliminamos a dependência de um serviço de terceiros que pode ser desligado sem aviso.

*Tiny act of discovery*: gravar um resultado de ponta a ponta e conferir a linha no banco antes de construir qualquer tela.

**Épico 2 — Pontuação confiável**
> Se o banco recalcular a pontuação a partir das respostas cruas em vez de aceitar o número enviado pelo cliente, então nenhuma pontuação forjada entra na base, porque o gabarito nunca sai do servidor.

*Tiny act of discovery*: inserir uma linha com respostas conhecidas e verificar que os campos derivados batem com o cálculo manual. **Já executado — ver seção 8.**

**Épico 3 — Leitura autônoma pelo RH**
> Se o RH tiver um dashboard próprio lendo direto do banco, então o tempo até enxergar um resultado cai de "nunca" para segundos, sem depender de ninguém do time técnico.

---

## 6. Requisitos Funcionais

| ID | Requisito | Prioridade | Critério de aceite |
|---|---|---|---|
| **RF-01** | Ao concluir o teste, o app envia `nome`, `email`, `telefone`, `data_inicio`, `data_fim`, `tempo_total_segundos` e o array de 60 `respostas` para `POST /api/resultados` | Must | Uma linha aparece em `raven_resultados` com os 60 valores preservados na ordem original |
| **RF-02** | A rota grava no Supabase usando `service_role`, sem expor a chave ao navegador | Must | `grep` no bundle JS de produção não encontra a service role key |
| **RF-03** | A pontuação total e os acertos por série são calculados pelo banco, ignorando qualquer valor de pontuação enviado pelo cliente | Must | Um `POST` com `pontuacao: 60` e respostas erradas grava a pontuação real, não 60 |
| **RF-04** | O array de respostas é rejeitado se não tiver exatamente 60 posições ou contiver valor fora do intervalo válido da série | Must | `POST` com 59 respostas retorna 400 e não grava nada |
| **RF-05** | Se a gravação falhar, a tela do candidato exibe erro com botão "tentar novamente", preservando os dados no `localStorage` | Must | Com a rota derrubada, o botão reenvia e grava quando ela volta |
| **RF-06** | A chamada ao webhook N8N é removida do código e do `.env.example` | Must | Nenhuma referência a `n8n.srv881294` fora de documentação histórica |
| **RF-07** | A copy da tela final deixa de prometer email enquanto o envio não existir | Must | O texto não contém promessa de email nem de relatório automático ao RH |
| **RF-08** | `/relatorios` exibe a lista de candidatos com nome, data, tempo, pontuação total, percentual e classificação | Must | Com N linhas no banco, a tabela mostra as N linhas ordenadas por data decrescente |
| **RF-09** | O dashboard exibe o painel agregado: total de candidatos, tempo médio, pontuação média e média por série | Must | Os números batem com `raven_dashboard_resumo` |
| **RF-10** | O dashboard exibe o detalhamento por série de cada candidato (acertos, percentual, respostas vs gabarito com ✓/✗) | Must | O detalhe de um candidato reproduz o formato definido na seção 8.3 |
| **RF-11** | Todas as rotas do dashboard exigem senha, validada por middleware | Must | Acesso a `/relatorios` sem cookie de sessão redireciona para a tela de senha |
| **RF-12** | A distribuição de candidatos por faixa de classificação é exibida no dashboard | Should | Os totais batem com `raven_dashboard_classificacao` |

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Métrica |
|---|---|---|
| **RNF-01** | A gravação não pode bloquear a exibição do resultado ao candidato | A pontuação aparece na tela mesmo se a gravação estiver em curso |
| **RNF-02** | A tabela nega leitura por padrão | RLS habilitado sem policy pública; acesso só via `service_role` |
| **RNF-03** | A senha do dashboard e a service role key nunca chegam ao cliente | Ambas fora de variáveis `NEXT_PUBLIC_*` |
| **RNF-04** | O dashboard carrega em < 2s com até 500 candidatos | Medido com dados sintéticos |
| **RNF-05** | Timestamps armazenados com fuso | `timestamptz`, exibidos em `America/Sao_Paulo` |

---

## 7b. Testing Decisions

**Prior art: não existe.** O repositório não tem nenhum teste, nenhum runner instalado e nenhum script de teste no `package.json`. Não há estilo estabelecido para seguir — este PRD define o ponto de partida.

**O que será testado** (comportamento externo, não implementação):

| Alvo | Teste | Por que importa |
|---|---|---|
| `raven_acertos` no banco | Respostas conhecidas → pontuação esperada, por série e total | É o coração da confiabilidade; um erro aqui corrompe toda a base silenciosamente |
| `POST /api/resultados` | Payload válido grava; payload com 59 respostas retorna 400; pontuação forjada é ignorada | É a fronteira de confiança do sistema |
| Middleware de senha | Sem cookie → redireciona; com cookie válido → passa | Uma falha aqui expõe dados pessoais |

**Definição de bom teste aqui**: verifica o que entra e o que sai (linha no banco, status HTTP, redirecionamento), nunca o nome de funções internas ou a forma da query. Um teste que quebra ao renomear um helper é um teste ruim.

**Nível mínimo aceitável para v1**: os testes de `raven_acertos` e da validação da rota. Os demais são desejáveis.

---

## 8. Considerações Técnicas

### 8.1 Estado atual da arquitetura

O app é Next.js 15 (App Router), **100% client-side** — não existe `app/api/`, nenhum `route.js`, nenhuma conexão de banco. Deploy na Vercel via [vercel.json](../vercel.json). Esta entrega introduz a primeira camada server-side do projeto.

### 8.2 Deep module: a pontuação vive no banco

A decisão estrutural central é encapsular **todo** o conhecimento sobre o gabarito e a pontuação dentro do Postgres, atrás de uma interface mínima: *quem grava só precisa entregar 60 respostas cruas.*

Interface simples (o que o chamador precisa saber):
```
INSERT (nome, email, telefone, data_inicio, data_fim, tempo_total_segundos, respostas[60])
```

Complexidade encapsulada (o que o chamador não precisa saber): o gabarito, os limites de cada série, como se conta acerto, como se calcula percentual, como se classifica.

Consequência prática: o cliente pode ser reescrito, um importador em lote pode ser adicionado, o N8N pode voltar — e nenhum deles consegue gravar uma pontuação errada, porque nenhum deles conhece o gabarito.

### 8.3 Schema — já aplicado no Supabase

Três migrations aplicadas em `qyrkyvoilfaxppbvtkpi` em 2026-07-24:

**`create_raven_gabarito_functions`** — `raven_gabarito()` retorna o array de 60 respostas corretas; `raven_acertos(respostas, q_inicio, q_fim)` conta acertos num intervalo. Ambas `IMMUTABLE`, requisito para uso em colunas geradas.

**`create_raven_resultados`** — a tabela. As colunas derivadas são `GENERATED ALWAYS AS ... STORED`:

| Coluna | Tipo | Origem |
|---|---|---|
| `id` | `uuid` | `gen_random_uuid()` |
| `nome`, `email`, `telefone` | `text` | cliente |
| `data_inicio`, `data_fim` | `timestamptz` | cliente |
| `tempo_total_segundos` | `integer` | cliente |
| `respostas` | `smallint[]` | cliente — `CHECK` de exatamente 60 posições |
| `tempo_total_minutos` | `numeric(10,2)` | derivado de `tempo_total_segundos` |
| `acertos_serie_a` … `acertos_serie_e` | `smallint` | derivado — `raven_acertos` por faixa de 12 |
| `pontuacao_total` | `smallint` | derivado — `raven_acertos(1,60)` |
| `percentual_acertos` | `numeric(5,2)` | derivado — **escala 0–100** |
| `created_at` | `timestamptz` | `now()` |

RLS habilitado **sem policy pública** — nega tudo por padrão; a escrita passa por `service_role`.

**`create_raven_views`** — três views com `security_invoker = true`:

- **`raven_resultados_detalhe`** — percentuais por série, `classificacao`, e os blocos de texto por série reproduzindo o formato das fórmulas originais do Airtable:
  ```
  Série A - Percepção Visual
  Acertos: 12/12 (100.0%)

  Respostas: 4,5,1,2,6,3,6,2,1,3,4,5
  Gabarito: 4,5,1,2,6,3,6,2,1,3,4,5
  Status: ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓ ✓
  ```
- **`raven_dashboard_resumo`** — total de candidatos, tempo médio e mediano, pontuação média, melhor/pior, média por série, primeiro/último teste
- **`raven_dashboard_classificacao`** — distribuição por faixa

**Validação executada**: duas linhas de teste inseridas e conferidas — gabarito perfeito deu 60/60 e 100,00%; série A zerada com o resto correto deu 48/60 e 80,00%; 2520s virou 42,00 min. As linhas de teste foram removidas; a tabela está vazia.

### 8.3b Retenção de dados (LGPD)

Migration `add_retencao_1_ano` + `schedule_retencao_raven`, aplicadas em 2026-07-24.

A coluna `anonimizado_em` marca quando os dados pessoais foram removidos. A função
`raven_anonimizar_antigos()` substitui `nome`, `email` e `telefone` de linhas com mais de
1 ano, preservando respostas, pontuação e tempos — as médias históricas do dashboard não
mudam retroativamente. É idempotente: ignora quem já foi anonimizado.

Agendada via `pg_cron` (extensão habilitada nesta entrega) em `0 6 * * *` — 03:00 de Brasília.

**Validação executada**: linha com 13 meses foi anonimizada mantendo `pontuacao_total = 60`;
linha com 1 mês ficou intacta; segunda execução retornou 0 linhas afetadas.

### 8.4 Duas correções em relação às fórmulas do Airtable

**Escala do percentual.** As fórmulas comparavam `{Percentual_Acertos} >= 0.95` (escala 0–1), mas o app envia `percentualAcertos` já multiplicado por 100 ([app/resultado/page.js:119](../app/resultado/page.js#L119)). Alimentada com `75.00`, a fórmula classificaria **todo candidato como "🏆 Excepcional"**. Padronizado em 0–100 e os limites viraram `95 / 90 / 75 / 60 / 40`.

**Limite inferior incoerente.** A fórmula original usava `> 0.40` para "Regular", cujo rótulo dizia "41-59%" — então `24/60 = 40,00%` caía em "Abaixo da Média (<40%)", apesar de 40 não ser menor que 40. Corrigido em 2026-07-24 para `>= 40`, com o rótulo virando "Regular (40-59%)". Verificado: 24 acertos → Regular; 23 acertos (38,33%) → Abaixo da Média.

**Percentual por série.** `ROUND({Acertos_Serie_A}/12, 1)` retorna uma razão (0,8 para 10/12), não uma porcentagem — enquanto os blocos de texto usavam corretamente `/12*100` (83,3%). Adotada a versão com `*100`.

### 8.5 Contrato da rota de gravação

```
POST /api/resultados
Content-Type: application/json

{ nome, email, telefone, dataInicio, dataFim, tempoTotalSegundos, respostas: number[60] }

201 → { id }
400 → { erro }   payload inválido (fora de 60 posições, opção fora do intervalo da série, data_fim < data_inicio)
500 → { erro }   falha ao gravar
```

O campo `pontuacao` deixa de ser enviado. Se vier, é ignorado.

### 8.6 Variáveis de ambiente

| Variável | Escopo | Uso |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | público | URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | **servidor** | grava e lê ignorando RLS |
| `DASHBOARD_PASSWORD` | **servidor** | senha do dashboard |
| ~~`NEXT_PUBLIC_WEBHOOK_URL`~~ | — | **removida** |

### 8.7 Topologia dos arquivos novos

```
app/api/resultados/     rota de gravação (server-side)
app/relatorios/         dashboard (server component, lê as views)
middleware.js           guarda de senha das rotas do dashboard
lib/                    cliente Supabase server-side
```

---

## 9. Riscos & Mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| **Alterar `raven_gabarito()` depois não recalcula linhas antigas** — colunas `STORED` congelam o valor na gravação | Base com pontuações de gabaritos diferentes, sem sinalização | Documentado como comentário na própria função. Se o gabarito mudar, exige migration explícita de recálculo — e isso é desejável, para não reescrever histórico sem querer |
| **Senha única vaza e não há como revogar sem trocar para todos** | Exposição de dados pessoais de candidatos | Senha em variável de ambiente, trocável sem deploy de código. Caminho de upgrade para Supabase Auth documentado em v2 |
| **Rota de gravação vira novo ponto único de falha** | Resultado perdido, como hoje | `localStorage` preservado + botão de retentativa (RF-05). O dado sobrevive na máquina do candidato enquanto a aba estiver aberta |

---

## 9b. Decisões Tomadas

| Data | Decisão | Contexto |
|---|---|---|
| 2026-07-24 | Acesso ao dashboard por **senha única** em variável de ambiente | Uso interno neste primeiro momento; contas individuais ficam para quando houver mais de um perfil de acesso |
| 2026-07-24 | Chamada ao N8N **removida de vez** | O workflow não existe mais; manter a chamada só geraria erro na tela do candidato |
| 2026-07-24 | Botão "Relatórios" **permanece** na tela inicial | Agora leva à tela de senha; o comportamento foi validado |
| 2026-07-24 | **Sem envio de email** neste ciclo | Segue em aberto para um momento futuro — a copy das telas foi corrigida para não prometer o que não entrega |
| 2026-07-24 | Limite da classificação passa de `> 40` para **`>= 40`**, com o rótulo virando "Regular (40-59%)" | Com `> 40`, um candidato com exatamente 24/60 (40,00%) era rotulado "Abaixo da Média (<40%)" — mas 40 não é menor que 40. Agora toda faixa fecha com a anterior sem buraco |
| 2026-07-24 | Retenção de dados pessoais: **1 ano**, por **anonimização** | Remove nome, email e telefone (o que a LGPD alcança) e preserva respostas, pontuação e tempos, para que as médias históricas do dashboard não mudem retroativamente |
| 2026-07-24 | **Email removido do backlog** | Não haverá envio de email nesta fase. As fatias 7 e 8 saíram da tasklist e voltaram para Fora do Escopo |

---

## 10. Questões em Aberto

| # | Questão | Bloqueia? |
|---|---|---|
| 1 | ~~O limite de 40% exato~~ | **Resolvida** em 2026-07-24 — ver seção 9b |
| 2 | O teste não tem autenticação nem limite de tentativas: a mesma pessoa pode responder várias vezes e cada tentativa vira uma linha. Deduplicar por email ou manter todas? | Não — v1 mantém todas |
| 3 | ~~Retenção de dados pessoais~~ | **Resolvida** em 2026-07-24 — 1 ano, por anonimização |
| 4 | O RH quer comparar candidatos entre si (ranking) ou avaliar um por vez? Muda a hierarquia visual do dashboard | Não — v1 entrega lista ordenável |

---

## Changelog

**v1.0 (2026-07-24)** — PRD inicial. Substitui as seções 4.9 (Integração N8N/Airtable) e 7.5 (Airtable Schema) do `prd-quiz-matrizes-raven.md` v2.0.
