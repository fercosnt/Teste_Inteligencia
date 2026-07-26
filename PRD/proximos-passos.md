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
| Testes | 133, `npm test` |
| Gabarito | conferido 60/60 contra o PDF oficial; vive em [lib/gabarito-servidor.js](../lib/gabarito-servidor.js) atrás de `server-only` |
| Dashboard | [app/relatorios/page.js](../app/relatorios/page.js) — lista; ficha em [app/relatorios/[id]/page.js](../app/relatorios/[id]/page.js) |
| Escala | normativa do SPM, por acertos, em `raven_classificacao()` no banco |
| Material do teste | `material-teste/` — **fora do git**, só existe nesta máquina |
| Imagens das questões | 60/60 conferidas à mão contra o PDF em 2026-07-26, sem divergência |

**Cuidado que não pode se perder**: o gabarito não pode voltar para o bundle do cliente.
A trava é o `import 'server-only'`; se um componente `'use client'` importar aquele módulo, o
build falha. Isso é proposital — já vazou uma vez.

---

## Frente A — auditoria figura a figura ✅ CONCLUÍDA em 2026-07-26

**Resultado**: as 60 questões foram conferidas manualmente pelo Fernando, figura a figura,
contra o PDF oficial. **Nenhuma divergência.** Com isso cai a última ressalva que vinha sendo
carregada desde a correção da Q53 — o conjunto de imagens está íntegro e alinhado com o
material oficial, e não só na contagem.

Não há o que refazer aqui. O registro abaixo fica para reproduzir a conferência se as imagens
mudarem no futuro.

<details>
<summary>Como a auditoria foi feita</summary>

**Por quê**: a conferência automática foi feita só por *contagem* de opções nas 60 questões.
Isso pega o tipo de falha da Q53 (arquivo faltando, numeração deslocada), mas **não pegaria
duas imagens trocadas entre si** numa questão com a contagem certa. Q12, Q29 e Q53 foram
conferidas à mão durante a correção; as outras 57 ficaram pendentes até esta auditoria.

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

</details>

---

## Frente B — visão do candidato no dashboard ✅ CONCLUÍDA em 2026-07-26

Clicar num candidato abre `/relatorios/[id]`: uma ficha própria com comparação contra a média
da base, a régua normativa inteira e a grade questão a questão. O acordeão saiu.

### As três decisões, e o que foi feito com elas

**1. Rota dedicada `/relatorios/[id]`** — nem modal nem interceptação.
O link é compartilhável e imprimível, e a página inteira é Server Component (173 B de JS no
cliente). O custo previsto era perder o contexto da lista; ficou pago porque busca e ordenação
viajam na URL (`construirHref` com `base`), então o "Voltar para a lista" devolve a lista com o
mesmo filtro e a mesma ordem.

**2. Comparação contra a média da base**, não a média do próprio candidato por questão.
Aparece em três lugares: tempo total contra `tempo_medio_minutos`, pontuação contra
`pontuacao_media`, e cada série contra `media_serie_*` — nesta última como um risco escuro
desenhado na própria barra, além do número.

Duas decisões de honestidade que vieram junto:
- diferenças abaixo de 5% no tempo (ou de meio acerto na pontuação) são escritas como
  "na média". Com base pequena, "2% mais lento" é ruído com cara de resultado.
- com um único candidato na base, o bloco de comparação some. Comparar alguém com uma média
  da qual ele é o único termo sugere uma referência que não existe.

**3. Régua inteira, com a faixa dele destacada.**
As sete faixas, cada uma com a largura do seu intervalo real — "Muito inferior" cobre 20 dos 61
acertos possíveis e "Muito superior" cobre 3, e desenhá-las iguais mentiria sobre a distância
entre elas. Abaixo, quantos acertos faltaram para a faixa de cima.

Os cortes **não** foram copiados para o JavaScript. A view `raven_escala_classificacao` percorre
as 61 pontuações possíveis, chama `raven_classificacao()` em cada uma e agrupa — os limites saem
do `min`/`max` de cada grupo. Mudar a função no banco reescreve a régua sozinho.

**Tempo por questão/série: fora do escopo**, por decisão. Nada foi instrumentado, e a tela não
promete esse dado. Se um dia entrar, o caminho continua sendo o de sempre: gravar o instante de
cada resposta na tela da questão, carregar no payload de `POST /api/resultados` e criar a coluna.
Vale lembrar que isso só serve para testes feitos **depois** da mudança — os já aplicados nunca
terão esse dado.

### O que foi construído

| | |
|---|---|
| Rota | [app/relatorios/[id]/page.js](../app/relatorios/[id]/page.js) + `not-found.js` |
| Componentes | [app/relatorios/componentes/](../app/relatorios/componentes/) — `barra-serie`, `detalhe-questoes`, `card-metrica`, `regua-classificacao` |
| Lógica pura | [lib/relatorios-candidato.js](../lib/relatorios-candidato.js) — comparações, régua, formatação |
| Banco | view `raven_escala_classificacao` (só `service_role`, como as outras) |
| Testes | 133 no total (eram 86) |

**A ficha é Server Component de ponta a ponta e precisa continuar sendo** — `DetalheQuestoes`
compara com `lib/gabarito-servidor.js`, que está atrás de `server-only`. Marcar qualquer arquivo
dessa árvore com `'use client'` quebra o build, e a quebra é a proteção funcionando.

<details>
<summary>Coisas que só apareceram rodando, e que valem para a próxima fatia</summary>

**A régua com opacidade não funcionava no pé da escala.** A primeira versão esmaecia as faixas
não-atuais. No topo ficava ótimo; embaixo, onde a faixa do candidato é a mais clara da rampa,
esmaecer as vizinhas não destacava nada — o candidato de 12 acertos não conseguia se achar na
própria régua. Trocado por um colchete escuro contornando o segmento, que funciona nas sete.
Só apareceu olhando o print dos dois extremos, não do caso do meio.

**Ponto e vírgula decimal na mesma tela.** O Postgres devolve `numeric` como `78.33` e o React
imprime o ponto; do lado, `média da base 31,2` saía com vírgula pelo `toLocaleString`. Duas
convenções decimais a 3cm uma da outra parecem erro de dado, não de formatação. Resolvido com
`formatarNumero`, que também devolve travessão para valor ausente — `Number(null)` é `0`, e um
percentual faltando virando "0%" lê como "errou tudo".

**Dois testes de banco não podiam rodar em paralelo.** `tests/db/busca.test.js` e o novo
`tests/db/escala.test.js` tratam o domínio `@teste-automatizado.invalid` como sandbox exclusiva
e apagam o domínio inteiro ao começar. Em paralelo, um limpava as linhas do outro. Resolvido com
`fileParallelism: false` no Vitest, preservando a limpeza total — que é a propriedade que impede
sobra de dado pessoal falso no banco.

**O Vitest não lia JSX em arquivo `.js`.** Convenção do Next, que compila esses arquivos sabendo
disso; o Vite decide pela extensão e via o primeiro `<div>` como erro de sintaxe. Não dá para
resolver com opção global (`oxc.lang`), que valeria também para os `.tsx` de `components/ui` e
quebraria a sintaxe de tipos. Tem um plugin de seis linhas em `vitest.config.js` para isso.

**A trava do `server-only` disparou durante a verificação**, ao tentar semear dados com um script
node que importava `lib/gabarito-servidor.js`. Funcionou como devia. O jeito certo de semear é
pedir o gabarito ao servidor — `supabase.rpc('raven_gabarito')` — em vez de afrouxar a trava.

**Cuidado ao verificar contra o runtime**: subir um segundo `npm start` sem matar o primeiro
deixa o servidor velho no ar servindo um `.next` que já foi sobrescrito. O sintoma é a página vir
sem CSS nenhum e com classes de uma versão anterior — o que parece bug da mudança e não é.

</details>

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
