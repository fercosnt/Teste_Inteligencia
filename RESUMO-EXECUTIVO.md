# 📋 RESUMO EXECUTIVO - Quiz de Matrizes de Raven

## 🎯 Visão Geral do Projeto

Desenvolvimento de uma aplicação web para aplicação digital do **Teste de Matrizes Progressivas de Raven**, utilizado para avaliação de inteligência em processos de recrutamento.

---

## 📊 Especificações Técnicas Rápidas

- **Total de Questões:** 60 questões
- **Estrutura:** 5 séries (A, B, C, D, E) com 12 questões cada
- **Opções por Questão:** 6 opções (numeradas de 1 a 6)
- **Tempo:** Sem limite, apenas cronometrado
- **Navegação:** Unidirecional (não pode voltar)
- **Plataformas:** Responsivo (Desktop, Tablet, Mobile)

---

## 🚨 ATENÇÃO - AÇÃO CRÍTICA NECESSÁRIA

### ⚠️ Conflito no Gabarito

O gabarito fornecido contém respostas com valores **7 e 8** nas séries C, D e E:
- **Série C:** respostas incluem 8, 7
- **Série D:** respostas incluem 7, 8
- **Série E:** respostas incluem 7, 8

**PROBLEMA:** O cliente afirmou que "**todas as questões têm 6 opções**".

### ✅ ANTES DE IMPLEMENTAR:

1. **Revisar o PDF do teste** (`matrizes_-_SPM.pdf`) nas séries C, D e E
2. **Contar as opções** disponíveis em cada questão dessas séries
3. **Confirmar com o stakeholder:**
   - Se todas têm mesmo 6 opções → Gabarito está incorreto, ajustar
   - Se séries C/D/E têm 8 opções → Sistema deve exibir 8 opções

**⚠️ Esta definição impacta diretamente a interface e a lógica de validação!**

---

## 🔗 URLs e Integrações

### Webhooks N8N:
- **Produção:** `https://n8n.srv881294.hstgr.cloud/webhook/0e31d419-1337-46da-b26c-a5a6e02f5ab2`
- **Teste:** `https://n8n.srv881294.hstgr.cloud/webhook-test/0e31d419-1337-46da-b26c-a5a6e02f5ab2`

### Hospedagem:
- **Servidor:** Hostgator
- **Domínio:** A ser definido pelo cliente

---

## 📁 Arquivos Fornecidos

1. ✅ **Gabarito_Limpo.xlsx** - Gabarito completo (60 questões)
2. ✅ **Instrucao_para_aplicacao_dos_testes.docx** - Instruções originais
3. ✅ **matrizes_-_SPM.pdf** - Teste completo com todas as imagens
4. ✅ **prd-quiz-matrizes-raven.md** - PRD completo e detalhado

---

## 🛠️ Stack Tecnológico Sugerido

```
Frontend:
- React.js ou Next.js (roteamento e estado)
- Tailwind CSS (estilização responsiva)
- TypeScript (opcional, mas recomendado)

Backend/Integração:
- Fetch API ou Axios (chamadas ao N8N)
- Webhook POST para N8N → Airtable → Email

Imagens:
- Formato: WebP ou PNG otimizado
- Compressão: TinyPNG ou similar
- Organização: Por série (serie-a, serie-b, etc.)
```

---

## 🎨 Fluxo da Aplicação

```
1. TELA INICIAL
   ├─ Formulário: Nome, Email, Telefone
   └─ Botão: "Próximo" → Tela de Instruções

2. TELA DE INSTRUÇÕES
   ├─ Explicação do teste
   ├─ Exemplos (A1, B4, C1)
   └─ Botão: "Iniciar Teste" → Inicia cronômetro e vai para Q1

3. QUESTÕES (Q1 - Q60)
   ├─ Cronômetro visível
   ├─ Indicador de progresso
   ├─ Imagem da matriz incompleta
   ├─ 6 opções de resposta (clicáveis)
   └─ Botão: "Próxima" (habilitado após selecionar)

4. TELA DE RESULTADO
   ├─ Nome do candidato
   ├─ Pontuação (X de 60)
   ├─ Percentual de acertos
   ├─ Tempo total
   └─ Mensagem: "Resultado enviado por email"
```

---

## 📋 Checklist de Desenvolvimento

### Fase 1: Setup e Estrutura
- [ ] Criar projeto React/Next.js
- [ ] Configurar Tailwind CSS
- [ ] Criar estrutura de pastas
- [ ] Organizar imagens por série
- [ ] **CRÍTICO:** Verificar quantidade de opções nas séries C/D/E
- [ ] Ajustar gabarito se necessário

### Fase 2: Telas Principais
- [ ] Tela de Cadastro (formulário + validação)
- [ ] Tela de Instruções (texto adaptado + botão iniciar)
- [ ] Componente de Questão (imagem + opções + navegação)
- [ ] Tela de Resultado (pontuação + percentual + tempo)

### Fase 3: Lógica de Negócio
- [ ] Gerenciamento de estado (respostas + tempo)
- [ ] Cronômetro funcional
- [ ] Validação de respostas obrigatórias
- [ ] Cálculo de pontuação e percentual
- [ ] Navegação unidirecional (sem voltar)

### Fase 4: Integração
- [ ] Implementar chamada ao webhook N8N
- [ ] Testar com webhook de teste
- [ ] Tratamento de erros (retry + mensagem ao usuário)
- [ ] Confirmar recebimento no Airtable

### Fase 5: Responsividade e Testes
- [ ] Testar em Desktop (1920x1080, 1366x768)
- [ ] Testar em Tablet (iPad, Android)
- [ ] Testar em Mobile (iPhone, Android)
- [ ] Verificar performance de carregamento
- [ ] Otimizar imagens

### Fase 6: Deploy
- [ ] Build de produção
- [ ] Upload para Hostgator
- [ ] Configurar domínio
- [ ] Trocar webhook de teste para produção
- [ ] Teste final end-to-end

---

## 🎯 Requisitos Não-Funcionais Críticos

1. **Não pode retroceder questões** - Uma vez avançada, não há volta
2. **Resposta obrigatória** - Não pode pular questões
3. **Sessão única** - Se fechar navegador, perde progresso
4. **Sem autenticação** - Qualquer pessoa com link pode fazer o teste
5. **Sem limite de tentativas** - Mesma pessoa pode fazer múltiplas vezes

---

## 📧 Dados Enviados ao N8N/Airtable

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
  "respostas": [4, 5, 1, 2, ...] // Array com 60 posições
}
```

---

## 🆘 Suporte e Dúvidas

**Documentos de Referência:**
- `prd-quiz-matrizes-raven.md` - PRD completo (versão 2.0)
- `gabarito_formatado.js` - Gabarito em formato JavaScript
- `gabarito_limpo.json` - Gabarito em formato JSON
- `instrucoes_adaptadas.md` - Instruções adaptadas para contexto digital

**Stakeholder:** Cliente forneceu todos os materiais necessários

---

## ⏱️ Estimativa de Desenvolvimento

**Desenvolvimento:** 40-60 horas de trabalho
- Frontend: 20-30h
- Integração: 8-12h
- Testes e ajustes: 12-18h

**Prazo sugerido:** 2-3 semanas

---

## ✅ Pronto para Começar?

1. ✅ Ler o PRD completo (`prd-quiz-matrizes-raven.md`)
2. ⚠️ **RESOLVER o conflito do gabarito (6 ou 8 opções?)**
3. ✅ Organizar as imagens do teste
4. ✅ Configurar ambiente de desenvolvimento
5. ✅ Começar pela Fase 1 do checklist acima

**Boa sorte no desenvolvimento! 🚀**
