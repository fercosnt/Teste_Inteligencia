# PRD - Quiz de Matrizes de Raven

## 1. Introdução/Overview

Este documento descreve os requisitos para o desenvolvimento de uma aplicação web de Quiz baseado no Teste de Matrizes Progressivas de Raven. O teste será utilizado principalmente para avaliação de inteligência em processos de recrutamento e seleção, bem como para avaliação de membros da equipe.

**Problema a ser resolvido:** Automatizar a aplicação do Teste de Matrizes de Raven, permitindo a coleta padronizada de dados dos candidatos, medição precisa do tempo de resposta, e armazenamento automático dos resultados para análise posterior.

**Goal Principal:** Criar uma plataforma digital que permita a aplicação controlada do teste, garantindo a integridade do processo (sem retrocesso de questões, resposta obrigatória) e fornecendo resultados automatizados com pontuação e percentual de acertos.

---

## 2. Goals

1. Criar uma interface intuitiva e responsiva para aplicação do Teste de Matrizes de Raven
2. Garantir que o teste seja realizado em uma única sessão contínua, sem possibilidade de pausas ou retrocessos
3. Medir com precisão o tempo total de execução do teste por cada candidato
4. Calcular automaticamente a pontuação (acertos) e o percentual de acertos
5. Integrar com N8N e Airtable para armazenamento e análise dos resultados
6. Enviar os resultados por email ao candidato após a conclusão do teste
7. Permitir que administradores acessem e analisem os resultados através do Airtable

---

## 3. User Stories

### História 1: Candidato iniciando o teste
**Como** um candidato a uma vaga,  
**Eu quero** preencher meus dados básicos (nome, email, telefone) em uma tela inicial,  
**Para que** eu possa ser identificado e começar o teste de forma organizada.

### História 2: Candidato lendo instruções
**Como** um candidato,  
**Eu quero** visualizar uma tela de instruções antes de começar o teste,  
**Para que** eu entenda como o teste funciona e o que é esperado de mim.

### História 3: Candidato realizando o teste
**Como** um candidato,  
**Eu quero** responder cada questão visualizando uma imagem maior e 6 opções de resposta,  
**Para que** eu possa escolher a opção que melhor completa o padrão apresentado.

### História 4: Candidato impedido de retroceder
**Como** um administrador do teste,  
**Eu quero** que os candidatos não possam voltar para questões anteriores,  
**Para que** seja mantida a integridade e padronização do processo de avaliação.

### História 5: Candidato concluindo o teste
**Como** um candidato,  
**Eu quero** ver meu resultado (pontuação e percentual de acertos) imediatamente após concluir o teste,  
**Para que** eu tenha um feedback instantâneo do meu desempenho.

### História 6: Candidato recebendo resultado por email
**Como** um candidato,  
**Eu quero** receber meu resultado por email,  
**Para que** eu tenha um registro permanente do meu desempenho no teste.

### História 7: Recrutador acessando resultados
**Como** um recrutador,  
**Eu quero** acessar todos os resultados dos candidatos através do Airtable,  
**Para que** eu possa analisar e comparar os desempenhos para tomar decisões de contratação.

---

## 4. Functional Requirements

### 4.1 Tela de Cadastro Inicial
**FR-001:** O sistema deve apresentar uma tela inicial com um formulário contendo os seguintes campos obrigatórios:
- Nome completo (campo de texto)
- Email (campo de email com validação de formato)
- Telefone (campo de telefone com máscara)

**FR-002:** O sistema deve validar que todos os campos estejam preenchidos antes de permitir avançar.

**FR-003:** O sistema deve exibir um botão "Próximo" ou "Iniciar Teste" que leva à tela de instruções.

### 4.2 Tela de Instruções
**FR-004:** O sistema deve apresentar uma tela de instruções explicando ao candidato como o teste funciona. O conteúdo adaptado das instruções originais deve incluir:

**Título**: "Bem-vindo ao Teste de Raciocínio Lógico"

**Texto principal**:

Você está prestes a iniciar o **Teste de Matrizes Progressivas de Raven**, uma avaliação de raciocínio abstrato e inteligência fluida.

**Como funciona o teste:**

1. **O que você verá**: Em cada tela, haverá uma figura com um padrão visual incompleto - uma parte estará faltando.

2. **Sua tarefa**: Abaixo da figura incompleta, você verá **6 opções de resposta numeradas**. Apenas uma delas completa corretamente o padrão. Sua tarefa é identificar qual opção se encaixa logicamente.

3. **Exemplos**:
   - **Exemplo A1**: A figura tem um padrão de linhas. Analisando o padrão, a **opção 4** é a resposta correta.
   - **Exemplo B4**: Observe como as formas se repetem e se transformam. A **opção 2** completa o padrão corretamente.
   - **Exemplo C1**: Um padrão mais complexo. A **opção 8** é a que continua a sequência lógica.

**Regras importantes:**

- ✅ **Responda na ordem**: Você deve responder cada questão sequencialmente, da 1 até a 60.
- ❌ **Não é possível voltar**: Uma vez que você avança para a próxima questão, não poderá retornar à anterior.
- ⏱️ **Tempo**: Não há limite de tempo rigoroso. O sistema apenas registrará quanto tempo você levou para completar o teste. Trabalhe com calma e atenção.
- 📊 **Estrutura do teste**: O teste possui 60 questões divididas em 5 séries (A, B, C, D, E), com níveis progressivos de dificuldade.

**O que acontece depois:**

Ao concluir todas as 60 questões, você receberá imediatamente seu resultado na tela, mostrando sua pontuação e percentual de acertos. Um email com os resultados também será enviado para você.

---

**Dica**: Analise cuidadosamente cada figura antes de escolher sua resposta. Procure por padrões, sequências, simetrias e transformações visuais.

Quando estiver pronto, clique em "Iniciar Teste" para começar. O cronômetro iniciará automaticamente.

**Boa sorte! 🎯**

**FR-005:** O sistema deve exibir um botão "Começar Teste" que inicia o cronômetro e leva à primeira questão (Série A - Questão 1).

### 4.3 Estrutura do Teste
**FR-006:** O teste deve conter exatamente 60 questões, divididas em 5 séries:
- Série A: 12 questões (questões 1-12) - cada questão tem 6 opções de resposta
- Série B: 12 questões (questões 13-24) - cada questão tem 6 opções de resposta
- Série C: 12 questões (questões 25-36) - cada questão tem 8 opções de resposta
- Série D: 12 questões (questões 37-48) - cada questão tem 8 opções de resposta
- Série E: 12 questões (questões 49-60) - cada questão tem 8 opções de resposta

**FR-007:** As questões devem seguir uma ordem específica e sequencial (não aleatória).

**FR-008:** Cada questão deve ser apresentada em uma página individual.

### 4.4 Exibição das Questões
**FR-009:** Cada página de questão deve conter:
- Um indicador de progresso mostrando "Questão X de 60" e/ou uma barra de progresso
- A identificação da série (ex: "Série A - Questão 3")
- Uma imagem maior representando o padrão da matriz
- Opções de resposta numeradas:
  - Séries A e B: 6 opções (1, 2, 3, 4, 5, 6)
  - Séries C, D e E: 8 opções (1, 2, 3, 4, 5, 6, 7, 8)

**FR-010:** O sistema deve permitir que o candidato selecione apenas uma das opções disponíveis (seleção única).

**FR-011:** A opção selecionada deve ter feedback visual (ex: borda destacada, mudança de cor, checkmark).

**FR-012:** O sistema deve exibir um botão "Próxima" que só se torna habilitado após o candidato selecionar uma resposta.

### 4.5 Navegação e Controle
**FR-013:** O sistema NÃO deve permitir que o candidato retroceda para questões anteriores (sem botão "Voltar").

**FR-014:** O sistema NÃO deve permitir pular questões (obrigatório responder para avançar).

**FR-015:** Ao clicar em "Próxima", o sistema deve registrar a resposta e avançar para a próxima questão.

**FR-016:** Na última questão (questão 60), o botão deve dizer "Finalizar" ao invés de "Próxima".

### 4.6 Cronômetro
**FR-017:** O sistema deve iniciar um cronômetro automaticamente quando o candidato clicar em "Começar Teste" na tela de instruções.

**FR-018:** O cronômetro deve ser exibido em todas as páginas de questões (ex: no canto superior direito).

**FR-019:** O cronômetro deve contar o tempo total decorrido no formato "MM:SS" ou "HH:MM:SS".

**FR-020:** Quando o candidato finalizar o teste, o cronômetro deve parar e o tempo total deve ser registrado.

**FR-021:** Não há limite de tempo - o cronômetro é apenas para medição, não para forçar término do teste.

### 4.7 Cálculo de Resultados
**FR-022:** O sistema deve armazenar em memória (ou estado local) todas as respostas do candidato durante o teste.

**FR-023:** Ao finalizar o teste, o sistema deve comparar as respostas do candidato com o gabarito correto.

**FR-024:** O sistema deve calcular:
- **Pontuação total**: Número de acertos (0 a 60)
- **Percentual de acertos**: (Acertos / 60) × 100, arredondado para 2 casas decimais

**FR-025:** O cálculo deve ser feito no frontend, antes de enviar os dados para o N8N/Airtable.

### 4.8 Tela de Resultado
**FR-026:** Após finalizar o teste, o sistema deve exibir uma tela de resultado contendo:
- Mensagem de conclusão (ex: "Teste concluído com sucesso!")
- Nome do candidato
- Pontuação total (ex: "Você acertou 45 de 60 questões")
- Percentual de acertos (ex: "75.00%")
- Tempo total de execução (ex: "Tempo: 42 minutos e 15 segundos")

**FR-027:** A tela de resultado deve informar que o resultado detalhado será enviado por email.

### 4.9 Integração com N8N e Airtable
**FR-028:** Ao finalizar o teste, o sistema deve enviar os seguintes dados para o N8N via webhook (POST):
- Nome do candidato
- Email do candidato
- Telefone do candidato
- Data e hora de início do teste (ISO format)
- Data e hora de término do teste (ISO format)
- Tempo total de execução (em minutos com decimais, ex: 42.25)
- Pontuação total (número de acertos, 0-60)
- Percentual de acertos (0-100, com 2 casas decimais)
- Respostas individuais do candidato (array com 60 posições indicando a opção escolhida para cada questão)

**FR-029:** O sistema deve usar o webhook de produção:
- **Produção**: `https://n8n.srv881294.hstgr.cloud/webhook/0e31d419-1337-46da-b26c-a5a6e02f5ab2`
- **Teste** (para desenvolvimento): `https://n8n.srv881294.hstgr.cloud/webhook-test/0e31d419-1337-46da-b26c-a5a6e02f5ab2`

**FR-030:** O N8N deve processar esses dados e armazená-los no Airtable em uma tabela estruturada.

**FR-031:** O N8N deve disparar um email automático para o candidato com os resultados do teste (apenas pontuação e percentual, sem interpretação).

### 4.10 Responsividade
**FR-031:** O sistema deve ser responsivo e funcionar adequadamente em:
- Desktop (resolução mínima 1024x768)
- Tablet (landscape e portrait)
- Mobile (smartphones com tela mínima de 360px de largura)

**FR-032:** As imagens das questões e opções devem se ajustar ao tamanho da tela mantendo proporção e legibilidade.

### 4.11 Gerenciamento de Sessão
**FR-033:** Se o candidato fechar o navegador ou perder a conexão durante o teste, ao retornar, o sistema deve:
- Reiniciar o teste desde o início (não há salvamento de progresso)
- Exigir novo preenchimento do formulário inicial

**FR-034:** Não há validação para impedir que a mesma pessoa faça o teste múltiplas vezes (usando o mesmo email).

### 4.12 Armazenamento de Imagens
**FR-035:** As imagens devem ser armazenadas no projeto de forma organizada:
- **Total de imagens**: 60 imagens de questões + 408 imagens de opções (6 opções × 24 questões das séries A e B + 8 opções × 36 questões das séries C, D e E)
- **Estrutura sugerida**: 
  ```
  /public/images/
    ├── serie-a/
    │   ├── questao-1.webp
    │   ├── questao-1-opcao-1.webp
    │   ├── questao-1-opcao-2.webp
    │   ├── ... (até opcao-6)
    │   ├── questao-2.webp
    │   └── ...
    ├── serie-b/
    ├── serie-c/
    ├── serie-d/
    └── serie-e/
  ```
- **Formato recomendado**: WebP (melhor compressão) ou PNG otimizado
- **Tamanho recomendado**: 
  - Imagens de questão: máx 800x600px
  - Imagens de opções: máx 300x300px
- **Otimização**: Todas as imagens devem ser otimizadas para web (compressão sem perda significativa de qualidade)

---

## 5. Non-Goals (Out of Scope)

**NG-001:** O sistema NÃO incluirá funcionalidade de login ou autenticação de usuários nesta versão.

**NG-002:** O sistema NÃO permitirá salvar o progresso do teste para continuar posteriormente.

**NG-003:** O sistema NÃO terá um limite de tempo (timer countdown) - apenas medição de tempo decorrido.

**NG-004:** O sistema NÃO incluirá interpretação psicológica ou classificação qualitativa dos resultados (ex: "acima da média", percentis). Apenas pontuação numérica e percentual.

**NG-005:** O sistema NÃO terá uma interface administrativa para visualização de resultados - isso será feito diretamente no Airtable.

**NG-006:** O sistema NÃO impedirá que a mesma pessoa faça o teste múltiplas vezes.

**NG-007:** O sistema NÃO incluirá validação de identidade (ex: verificação de documento, foto).

**NG-008:** O sistema NÃO armazenará dados localmente no navegador (localStorage) para recuperação de sessão.

**NG-009:** O sistema NÃO terá modo de treino ou visualização de respostas corretas após o teste.

---

## 6. Design Considerations

### 6.1 Interface do Usuário
- **Layout limpo e minimalista** para não distrair o candidato
- **Tipografia clara** com bom contraste para facilitar leitura
- **Cores neutras** para não influenciar as respostas
- **Imagens em alta qualidade** para garantir que os padrões sejam claramente visíveis

### 6.2 Fluxo de Telas
1. Tela de Cadastro → 2. Tela de Instruções → 3. Questões (1-60) → 4. Tela de Resultado

### 6.3 Componentes Sugeridos
- **Card de Questão**: Container para exibir a imagem maior e as 6 opções
- **Barra de Progresso**: Indicador visual do andamento do teste
- **Cronômetro**: Componente sempre visível durante o teste
- **Botões de Ação**: Padrão consistente (tamanho, cor, posição)

### 6.4 Acessibilidade
- Textos alternativos (alt) para todas as imagens
- Contraste adequado entre texto e fundo
- Navegação possível via teclado (Tab, Enter)

---

## 7. Technical Considerations

### 7.1 Stack Tecnológico Sugerido
- **Frontend**: React.js ou Next.js (para facilitar roteamento e gerenciamento de estado)
- **Gerenciamento de Estado**: React Context API ou useState/useReducer para armazenar respostas
- **Estilização**: Tailwind CSS ou CSS Modules para responsividade
- **Integração**: Axios ou Fetch API para enviar dados ao N8N

### 7.2 Estrutura de Dados
```javascript
// Exemplo de estrutura de dados do candidato
{
  nome: "João Silva",
  email: "joao@example.com",
  telefone: "(11) 98765-4321",
  dataInicio: "2025-10-21T14:30:00.000Z",
  dataFim: "2025-10-21T15:12:35.000Z",
  tempoTotalMinutos: 42.58,
  respostas: [4, 5, 1, 2, 6, 3, ...], // Array com 60 posições
  pontuacao: 45,
  percentualAcertos: 75.00
}
```

### 7.3 Gabarito Completo
O gabarito com as respostas corretas das 60 questões deve ser armazenado de forma segura no código. **Importante**: Todas as 60 questões possuem exatamente 6 opções de resposta.

```javascript
const gabarito = [
  // Série A (questões 1-12)
  4, 5, 1, 2, 6, 3, 6, 2, 1, 3, 4, 5,
  
  // Série B (questões 13-24)
  2, 6, 1, 2, 1, 3, 5, 6, 4, 3, 4, 5,
  
  // Série C (questões 25-36)
  8, 2, 3, 8, 7, 4, 5, 1, 7, 6, 1, 2,
  
  // Série D (questões 37-48)
  3, 4, 3, 7, 8, 6, 5, 4, 1, 2, 5, 6,
  
  // Série E (questões 49-60)
  7, 6, 8, 2, 1, 5, 1, 6, 3, 2, 4, 5
];

// ⚠️ NOTA IMPORTANTE: Embora o gabarito contenha números de 1 a 8, 
// o sistema deve apresentar apenas 6 opções para o candidato.
// As respostas 7 e 8 no gabarito das séries C, D e E podem indicar
// que o teste original tinha mais opções, mas para esta implementação
// digital, confirme com o stakeholder se:
// 1. Todas as questões devem ter 6 opções (e ajustar o gabarito), OU
// 2. As séries C, D e E devem ter 8 opções (e manter o gabarito atual)

// Função para determinar a série da questão
function getSerie(numeroQuestao) {
  if (numeroQuestao <= 12) return 'A';
  if (numeroQuestao <= 24) return 'B';
  if (numeroQuestao <= 36) return 'C';
  if (numeroQuestao <= 48) return 'D';
  return 'E';
}
```

### 7.4 N8N Webhook
**Endpoints disponíveis:**
- **Produção**: `https://n8n.srv881294.hstgr.cloud/webhook/0e31d419-1337-46da-b26c-a5a6e02f5ab2`
- **Teste/Desenvolvimento**: `https://n8n.srv881294.hstgr.cloud/webhook-test/0e31d419-1337-46da-b26c-a5a6e02f5ab2`

**Método**: POST  
**Content-Type**: application/json

**Corpo da requisição esperado:**
```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "telefone": "(11) 98765-4321",
  "dataInicio": "2025-10-21T14:30:00.000Z",
  "dataFim": "2025-10-21T15:12:35.000Z",
  "tempoTotalMinutos": 42.58,
  "pontuacao": 45,
  "percentualAcertos": 75.00,
  "respostas": [4, 5, 1, 2, 6, 3, 6, 2, 1, 3, 4, 5, 2, 6, 1, 2, 1, 3, 5, 6, 4, 3, 4, 5, 8, 2, 3, 8, 7, 4, 5, 1, 7, 6, 1, 2, 3, 4, 3, 7, 8, 6, 5, 4, 1, 2, 5, 6, 7, 6, 8, 2, 1, 5, 1, 6, 3, 2, 4, 5]
}
```

**Tratamento de erros:**
- Implementar retry com backoff exponencial (3 tentativas)
- Mostrar mensagem ao usuário em caso de falha persistente
- Ainda assim exibir o resultado na tela mesmo se o envio falhar

### 7.5 Airtable Schema Sugerido
**Tabela: Resultados_Teste_Raven**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| ID | Autonumber | ID único do registro |
| Nome | Single line text | Nome do candidato |
| Email | Email | Email do candidato |
| Telefone | Phone number | Telefone do candidato |
| Data_Inicio | Date (with time) | Data e hora de início do teste |
| Data_Fim | Date (with time) | Data e hora de término |
| Tempo_Total_Min | Number (decimal, 2 places) | Tempo total em minutos |
| Pontuacao | Number | Número de acertos (0-60) |
| Percentual | Percent | Percentual de acertos |
| Respostas | Long text | JSON string com todas as 60 respostas |
| Acertos_Serie_A | Number | Acertos na Série A (0-12) |
| Acertos_Serie_B | Number | Acertos na Série B (0-12) |
| Acertos_Serie_C | Number | Acertos na Série C (0-12) |
| Acertos_Serie_D | Number | Acertos na Série D (0-12) |
| Acertos_Serie_E | Number | Acertos na Série E (0-12) |
| Created | Created time | Timestamp automático |

**Nota**: Os campos `Acertos_Serie_X` podem ser calculados pelo N8N antes de inserir no Airtable, facilitando análises posteriores por série.

### 7.6 Hospedagem e Deploy
- **Hospedagem**: Hostgator (domínio próprio do cliente)
- **Considerações**:
  - Verificar se o Hostgator suporta Node.js ou se será necessário build estático
  - Para Next.js/React: gerar build de produção otimizado
  - Configurar CORS adequadamente para comunicação com N8N
  - Otimizar imagens antes do upload (compressão, WebP)
  - Considerar uso de CDN ou otimização de assets do Hostgator

---

## 8. Success Metrics

**SM-001:** Taxa de conclusão do teste acima de 95% (candidatos que iniciam completam o teste).

**SM-002:** Tempo médio de conclusão entre 30-60 minutos.

**SM-003:** Taxa de erro no envio de dados ao Airtable inferior a 2%.

**SM-004:** 100% dos resultados enviados com sucesso geram email automático ao candidato.

**SM-005:** Interface responsiva funciona corretamente em 99% dos dispositivos testados.

**SM-006:** Feedback de recrutadores sobre a facilidade de acesso aos dados no Airtable (meta: 4/5 estrelas).

---

## 9. Open Questions

**OQ-001:** ✅ RESOLVIDO - Gabarito completo fornecido no documento Excel

**OQ-002:** ✅ RESOLVIDO - Não há template específico de email, apenas resultado numérico

**OQ-003:** ✅ RESOLVIDO - Webhooks fornecidos (teste e produção)

**OQ-004:** ✅ RESOLVIDO - A tabela do Airtable será criada pelo usuário durante a integração

**OQ-005:** ✅ RESOLVIDO - Não existe identidade visual específica no momento, usar design limpo e profissional

**OQ-006:** ✅ RESOLVIDO - Imagens serão fornecidas em formato otimizado para web

**OQ-007:** ✅ RESOLVIDO - Instruções detalhadas fornecidas no documento Word

**OQ-008:** ✅ RESOLVIDO - Email enviado pelo N8N deve conter apenas resultado numérico

**OQ-009:** ✅ RESOLVIDO - Campos do Airtable definidos (possibilidade de adicionar campos de acertos por série)

**OQ-010:** ✅ RESOLVIDO - Será hospedado em domínio do Hostgator

**OQ-011:** Existe algum prazo específico para conclusão do desenvolvimento?

**OQ-012:** Qual deve ser o comportamento se o webhook do N8N estiver fora do ar no momento do envio?

**OQ-013:** As imagens já estão nomeadas de forma padronizada ou precisarão ser renomeadas durante a implementação?

---

## Glossário

- **Matriz de Raven**: Teste psicológico não-verbal que mede o raciocínio abstrato e a inteligência fluida.
- **Série**: Grupo de questões do teste (A, B, C, D, E) com níveis progressivos de dificuldade.
- **Gabarito**: Conjunto de respostas corretas para todas as questões do teste.
- **Cronômetro**: Medidor de tempo que conta progressivamente do início até o fim do teste.
- **N8N**: Plataforma de automação de workflow que conecta o sistema ao Airtable e ao envio de emails.
- **Airtable**: Banco de dados em nuvem usado para armazenar e visualizar os resultados dos testes.

---

## Aprovações Necessárias

- [ ] Product Owner / Gerente de Projeto
- [ ] Psicólogo responsável pela aplicação do teste
- [ ] Equipe de Desenvolvimento
- [ ] Equipe de RH (usuários finais)

---

**Data de Criação:** 21 de Outubro de 2025  
**Última Atualização:** 21 de Outubro de 2025  
**Versão:** 2.0  
**Autor:** Product Manager

---

## Changelog

### Versão 2.0 (21/10/2025)
**Atualizações Importantes:**
- ✅ Corrigido: Teste tem **60 questões**, não 58
- ✅ Adicionado: Gabarito completo das 60 questões fornecido pelo cliente
- ✅ Adicionado: Instruções detalhadas adaptadas do documento Word fornecido
- ✅ Adicionado: Webhooks N8N (teste e produção)
- ✅ Adicionado: Schema detalhado do Airtable com campos de acertos por série
- ✅ Adicionado: Informações sobre hospedagem (Hostgator)
- ✅ Atualizado: Open Questions com status de resolução
- ⚠️ **ATENÇÃO**: Gabarito contém respostas 7 e 8 em algumas séries - confirmar com stakeholder se todas as questões têm 6 opções ou se séries C/D/E têm 8 opções

### Versão 1.0 (21/10/2025)
- Versão inicial do PRD

---

## ANEXOS

### Anexo A: Gabarito Completo (60 questões)

```javascript
// Gabarito fornecido pelo cliente (arquivo Gabarito_Limpo.xlsx)
const gabarito = [
  // Série A (questões 1-12)
  4, 5, 1, 2, 6, 3, 6, 2, 1, 3, 4, 5,
  
  // Série B (questões 13-24)
  2, 6, 1, 2, 1, 3, 5, 6, 4, 3, 4, 5,
  
  // Série C (questões 25-36)
  8, 2, 3, 8, 7, 4, 5, 1, 7, 6, 1, 2,
  
  // Série D (questões 37-48)
  3, 4, 3, 7, 8, 6, 5, 4, 1, 2, 5, 6,
  
  // Série E (questões 49-60)
  7, 6, 8, 2, 1, 5, 1, 6, 3, 2, 4, 5
];
```

**⚠️ IMPORTANTE - AÇÃO NECESSÁRIA DO DESENVOLVEDOR:**

O gabarito acima contém respostas com valores 7 e 8 nas séries C, D e E. Entretanto, o cliente informou que "**todas as questões têm 6 opções de resposta**".

**ANTES DE IMPLEMENTAR, O DESENVOLVEDOR DEVE:**

1. **Verificar as imagens** das questões das séries C, D e E
2. **Confirmar quantas opções** cada questão realmente possui
3. **Escolher uma das opções:**
   - **Opção 1**: Se todas as questões têm realmente apenas 6 opções, o gabarito está incorreto e precisa ser ajustado
   - **Opção 2**: Se as séries C, D e E têm 8 opções, o sistema deve ser ajustado para exibir 8 opções nessas séries

**RECOMENDAÇÃO:** Revisar o teste original em PDF e as imagens para confirmar a quantidade correta de opções antes de prosseguir.

### Anexo B: Arquivos Fornecidos pelo Cliente

1. **Gabarito_Limpo.xlsx** - Arquivo Excel com gabarito de todas as 60 questões
2. **Instrucao_para_aplicacao_dos_testes.docx** - Documento com instruções originais de aplicação presencial
3. **matrizes_-_SPM.pdf** - PDF completo do teste com todas as 60 questões e imagens

### Anexo C: Instruções Originais (Documento Word)

As instruções originais eram para aplicação presencial do teste. A versão adaptada para o contexto digital está na seção **FR-004** deste PRD.

**Pontos-chave das instruções originais:**
- Explicar que o teste mostra figuras com padrões incompletos
- Mostrar exemplos: A1 (resposta 4), B4 (resposta 2), C1 (resposta 8)
- Enfatizar que deve-se responder na ordem, sem pular ou voltar
- Explicar que o tempo não é fator de avaliação, mas há um limite prático
- Encorajar a trabalhar com calma e atenção

### Anexo D: Estrutura de Nomenclatura de Imagens (Sugerida)

Para facilitar o desenvolvimento, recomenda-se organizar as imagens da seguinte forma:

```
/public/images/questoes/
├── serie-a/
│   ├── q01-matriz.png         (imagem da matriz incompleta)
│   ├── q01-opcao-1.png
│   ├── q01-opcao-2.png
│   ├── q01-opcao-3.png
│   ├── q01-opcao-4.png
│   ├── q01-opcao-5.png
│   ├── q01-opcao-6.png
│   ├── q02-matriz.png
│   └── ...
├── serie-b/
│   └── ...
├── serie-c/
│   └── ...
├── serie-d/
│   └── ...
└── serie-e/
    └── ...
```

**Recomendações:**
- Usar formato WebP ou PNG otimizado
- Comprimir imagens sem perda de qualidade (ex: TinyPNG)
- Manter dimensões consistentes dentro de cada série
- Adicionar atributo `alt` descritivo para acessibilidade
