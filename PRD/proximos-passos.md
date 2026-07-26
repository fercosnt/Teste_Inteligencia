# Próximos passos — auditoria manual e visão do candidato

**Escrito em**: 2026-07-26
**Para**: abrir uma sessão nova a partir daqui
**Estado do projeto**: v2 + correções de segurança no ar em https://ti.bslabs.com.br

---

## Onde as coisas estão

O que já foi entregue e verificado está em [PRD.md](PRD.md) e [tasks-raven-supabase.md](tasks-raven-supabase.md).
O resumo do que importa para continuar:

| | |
|---|---|
| `main` | `80fe0b6`, tudo publicado |
| Testes | 86, `npm test` |
| Gabarito | conferido 60/60 contra o PDF oficial; vive em [lib/gabarito-servidor.js](../lib/gabarito-servidor.js) atrás de `server-only` |
| Dashboard | [app/relatorios/page.js](../app/relatorios/page.js) — lista + acordeão inline |
| Escala | normativa do SPM, por acertos, em `raven_classificacao()` no banco |
| Material do teste | `material-teste/` — **fora do git**, só existe nesta máquina |

**Cuidado que não pode se perder**: o gabarito não pode voltar para o bundle do cliente.
A trava é o `import 'server-only'`; se um componente `'use client'` importar aquele módulo, o
build falha. Isso é proposital — já vazou uma vez.

---

## Frente A — auditoria figura a figura (manual)

**Por quê**: a conferência automática foi feita só por *contagem* de opções nas 60 questões.
Isso pega o tipo de falha da Q53 (arquivo faltando, numeração deslocada), mas **não pegaria
duas imagens trocadas entre si** numa questão com a contagem certa. Q12, Q29 e Q53 foram
conferidas à mão; as outras 57, não.

Tentei automatizar duas vezes comparando pixels e **descartei os dois resultados** — o contorno
da etiqueta é idêntico em toda opção e dominava a métrica, produzindo ~150 falsos positivos.
Por isso a conferência é visual.

**O material está pronto**: `material-teste/auditoria/q01.png` … `q60.png`.

Cada folha tem, para uma questão:
- em cima, as opções **como estão no PDF oficial** (com a numeração impressa do próprio PDF)
- embaixo, as imagens **que o app serve**
- o número de cada opção nas duas linhas, e um ✓ verde na que é o gabarito

**O que conferir**: em cada número, a figura de cima e a de baixo têm que ser a mesma.
E a marcada com ✓ tem que ser a resposta que a matriz pede.

Regenerar (se as imagens mudarem): `node scripts/folhas-auditoria.js` — precisa do
`pdftoppm` (`brew install poppler`) e do PDF em `material-teste/`.

**Se achar divergência**, anote questão + número da opção. O conserto tem duas formas,
dependendo do caso — as duas já foram feitas e ficaram registradas no commit `8d13462`:
- imagem faltando ou numeração deslocada → extrair do PDF e renumerar (foi o caso da Q53)
- arquivo a mais que o PDF não tem → apagar (foi o caso da Q12)

---

## Frente B — visão do candidato no dashboard

**O que se quer**: hoje clicar num candidato abre um acordeão na mesma página. Passar isso
para uma tela dedicada, com mais dados do teste e visualização melhor — percentual e número de
acertos por série, tempo, e uma leitura geral mais clara.

### Decisões para tomar no começo da sessão

**1. Página dedicada, modal, ou os dois?**

| Opção | A favor | Contra |
|---|---|---|
| Rota `/relatorios/[id]` | Link direto, dá para imprimir/salvar PDF, server component simples | Perde o contexto da lista ao navegar |
| Modal sobre a lista | Mantém o contexto, volta rápido | Não é linkável nem imprimível |
| Rota + interceptação | Modal ao clicar na lista, página cheia no link direto | Mais peça móvel (parallel/intercepting routes do Next) |

*Minha inclinação*: rota dedicada. O RH avalia um candidato por vez e vai querer imprimir ou
mandar o link para alguém. A interceptação é elegante, mas é complexidade que só se paga se o
vai-e-volta na lista incomodar de verdade.

**2. Contra o que comparar o candidato?**

"Tempo médio" pode significar duas coisas. Vale decidir antes de desenhar:
- o tempo médio **deste candidato** por questão (total ÷ 60), ou
- a **média de todos os candidatos**, para dizer se este foi mais rápido ou mais lento

A segunda é mais útil para decisão de contratação, e o dashboard já calcula os agregados em
`raven_dashboard_resumo`. Comparar acertos por série contra a média da base também cabe aqui.

**3. O que fazer com a classificação normativa nesta tela**

Ela existe e é por acertos. Vale mostrar onde o candidato cai na régua inteira (as sete faixas,
com a dele destacada), em vez de só o rótulo — dá noção de distância para a faixa vizinha.

### Uma limitação que precisa ser dita antes de desenhar

**Não existe tempo por questão nem por série.** O banco guarda `data_inicio`, `data_fim` e o
array de respostas — nada mais. `tempo_total_segundos` é a diferença entre as duas datas.

Então "tempo por série" **não é possível hoje**. Para ter isso seria preciso:
1. a tela da questão gravar o instante de cada resposta (hoje o `localStorage` só guarda o array),
2. o payload de `POST /api/resultados` carregar esses instantes,
3. uma coluna nova em `raven_resultados`.

É uma fatia própria, e só vale a pena se o RH for de fato usar essa informação. **Decidir se
entra no escopo antes de desenhar a tela** — muda o que a tela pode prometer.

### O que já existe e dá para reaproveitar

- `raven_resultados_detalhe` já traz acertos e percentual por série, classificação, descrição da
  faixa e o array de respostas
- `raven_detalhe_serie()` monta o bloco de texto por série (respostas vs gabarito com ✓/✗)
- `DetalheQuestoes` e `BarraSerie` em [app/relatorios/page.js](../app/relatorios/page.js) já
  desenham a grade questão a questão e as barras por série — dá para extrair para componentes
- o middleware já protege `/relatorios/:path*`, então uma rota filha nasce protegida

### Ordem sugerida

1. Decidir os três pontos acima
2. Extrair `BarraSerie` e `DetalheQuestoes` para `app/relatorios/componentes/`
3. Criar `/relatorios/[id]` lendo `raven_resultados_detalhe` por id
4. Trocar o acordeão por link na lista
5. Enriquecer: comparação com a média, régua das faixas, tempo
6. Testes: rota sem cookie redireciona; id inexistente dá 404; números batem com a view

---

## Como verificar o que for feito

O que funcionou bem nesta fase e vale repetir:

- **Dados de teste**: use emails no domínio `@teste-automatizado.invalid`. `tests/db/busca.test.js`
  limpa esse domínio no início e no fim, então sobra de execução interrompida se resolve sozinha.
  Cuidado: rodar `npm test` apaga essas linhas — não semeie e rode a suíte esperando que fiquem.
- **Verificação de verdade é contra o runtime**, não contra o código. Subir o dev server e medir
  (altura da página, ordem dos nomes no HTML, status HTTP) pegou coisas que o build não pegaria.
- **Limpar sempre**: conferir no banco que voltou a zero linha de teste. Uma escapou uma vez por
  não estar no domínio `.invalid`.
