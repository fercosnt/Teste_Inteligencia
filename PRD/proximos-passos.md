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
| Testes | 157, `npm test` |
| Gabarito | conferido 60/60 contra o PDF oficial; vive em [lib/gabarito-servidor.js](../lib/gabarito-servidor.js) atrás de `server-only` |
| Dashboard | [app/relatorios/page.js](../app/relatorios/page.js) — lista; ficha em [app/relatorios/[id]/page.js](../app/relatorios/[id]/page.js) |
| Escala | normativa do SPM, por acertos, em `raven_classificacao()` no banco |
| Base | 50 candidatos / 55 testes — 49 pessoas importadas do Airtable em 2026-07-26 |
| Retenção | 2 anos, em `raven_retencao_intervalo()` |
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

## Frente C — tentativas, exclusão e o fim do reenvio ✅ CONCLUÍDA em 2026-07-26

### O bug que estava rodando

A tela de resultado **regravava o teste a cada visita**. O `localStorage` nunca era limpo depois
de gravar, então um F5 remontava o componente e reenviava o mesmo payload; a API sempre fazia
`insert`, e o índice de email não era único.

Não era hipótese. **48 das 102 linhas do Airtable eram isso** — um candidato tinha 29 cópias do
mesmo teste (mesmo tempo, mesma nota, `Created_Time` espalhado por duas semanas). No sistema novo
já havia gerado 2 linhas extras, nascidas enquanto o dashboard era conferido.

O conserto tem três camadas, e a do meio é a que segura se as outras falharem:

| Camada | O quê |
|---|---|
| Tela | grava um comprovante e apaga as chaves do teste; uma recarga mostra a nota, não reenvia |
| Banco | índice único `(email, data_inicio)` |
| API | traduz o `23505` para "já registrado" com **200** |

O 200 importa: um 500 faria a tela dizer "falha ao gravar" a um candidato cujo teste **está**
salvo — e candidato que vê falha tenta de novo.

**A chave `(email, data_inicio)` separa reenvio de refação.** Reenviar repete o `data_inicio`
(vem do `localStorage`); refazer passa por `/instrucoes`, que grava um novo. A trava barra um sem
fechar a porta do outro.

### Tentativas: a primeira é a que vale

`raven_resultados_detalhe` numera as sessões de cada pessoa e marca a primeira como `vale`;
`raven_candidatos` entrega uma linha por candidato. **A lista, os agregados e o export leem daí.**
Antes "Candidatos" contava tentativas, e quem repetia pesava mais na média da base — que é
justamente a régua contra a qual a ficha compara todos os outros.

A razão de ser a primeira não é arbitrária. As seguintes não são medidas melhores, são medidas
contaminadas: a pessoa já viu as matrizes. Nos três repetentes do histórico a nota subiu nas três,
e um caso resume tudo:

```
luciana martins   1ª  21/01 12:56   45/60  🟡 Superior      <- é esta que vale
                  2ª  21/01 23:09   46/60  🟡 Superior
                  3ª  22/01 15:00   56/60  🟢 Muito superior
                  4ª  04/02 22:44   52/60  🟡 Superior
```

**+11 acertos em 26 horas**, cruzando de faixa. Contar a maior ou a mais recente faria o RH ler
uma pessoa que não existe.

### Exclusão

Definitiva, em dois escopos — uma tentativa ou o candidato inteiro — com confirmação que lista o
que será perdido.

**A rota vive sob `/api/admin`, e isso não é estética.** O matcher do middleware é estreito de
propósito para `/api/resultados` continuar público (é por onde o candidato grava). Uma rota de
exclusão sob esse prefixo só seria protegida com `:path*`, que casaria também com a gravação e
**trancaria o teste para todo mundo**. Num prefixo separado, toda rota administrativa nasce
fechada. Há teste que quebra se alguém "simplificar" o matcher.

### Retenção e anonimização

Passou para 2 anos, com o prazo extraído para `raven_retencao_intervalo()`. Antes só dava para
conferir o prazo rodando `raven_anonimizar_antigos()`, que reescreve a tabela inteira — e nenhuma
suíte de testes pode disparar o ciclo de vida de dado pessoal real.

O email anonimizado passou a ser **pseudônimo estável por pessoa** (`md5('raven:' || email)`). Era
por linha; assim, no dia em que fossem anonimizadas, as tentativas de um mesmo candidato virariam
pessoas diferentes, e a regra de "só a primeira conta" passaria a contar todas, sem aviso.

### A importação do histórico

49 pessoas / 54 sessões vindas do Airtable, deduplicadas por `(email, data_inicio)`.

- **Pontuação não foi importada.** O banco recalcula das respostas. Trazer o número pronto criaria
  uma segunda fonte de verdade capaz de divergir do gabarito em silêncio.
- **As 54 conferiram com o Airtable, sem uma divergência.** Confirmação forte de que os dois
  sistemas pontuam igual, o que importa porque este gabarito passou pela correção da Q53.
- `created_at` recebeu a data real do teste, então o relógio de retenção conta de quando a pessoa
  fez a prova — e não de quando a linha entrou.

<details>
<summary>Como o histórico foi extraído, se precisar refazer</summary>

Scripts em `scratchpad/airtable/` (fora do git, contêm dados pessoais). O caminho que funcionou:

1. **CSV do Airtable dá 403** em view compartilhada, e a API responde **MessagePack** num formato
   de stream proprietário — 15.961 tokens que não valem reconstruir.
2. O que funcionou foi ler a grade **por `(rowid, columnid)`, nos dois eixos**. A grade é
   virtualizada nas duas direções; ler por posição dá um resultado que parece certo e não é. Uma
   primeira tentativa só na vertical devolveu 91 registros — o número real era 102.
3. O raspador **confere a completude** ao final e falha se algum campo não estiver 100%. Foi essa
   checagem que pegou a leitura parcial.

Se for refazer uma migração, um CSV exportado à mão continua sendo entrada melhor que raspagem.

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
