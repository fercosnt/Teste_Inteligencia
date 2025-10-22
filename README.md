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
- **Integração com N8N** para envio de resultados

## 🚀 Tecnologias Utilizadas

- **Next.js 15** - Framework React
- **Tailwind CSS 4** - Estilização
- **Webhook N8N** - Integração para envio de resultados
- **LocalStorage** - Armazenamento temporário de dados

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
│   ├── layout.js            # Layout global
│   └── globals.css          # Estilos globais
├── lib/
│   └── quiz-data.js         # Dados do quiz e gabarito
├── public/
│   └── images/              # Imagens das 60 questões
└── components/              # Componentes reutilizáveis (se necessário)
```

## 🔄 Fluxo da Aplicação

1. **Cadastro** → Usuário informa nome, email e telefone
2. **Instruções** → Explicação sobre o teste
3. **Questões** → 60 questões sequenciais (Q1 → Q60)
4. **Resultado** → Exibição da pontuação + envio para N8N

## 📡 Webhook N8N

### URLs:
- **Teste:** `https://n8n.srv881294.hstgr.cloud/webhook-test/0e31d419-1337-46da-b26c-a5a6e02f5ab2`
- **Produção:** `https://n8n.srv881294.hstgr.cloud/webhook/0e31d419-1337-46da-b26c-a5a6e02f5ab2`

### Payload Enviado:
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
  "respostas": [4, 5, 1, 2, ...]
}
```

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

## 🚀 Deploy para Hostgator

1. Execute o build:
```bash
npm run build
```

2. Os arquivos estarão em `/out/`

3. Faça upload da pasta `/out/` para o servidor Hostgator

4. **Importante:** Alterar URL do webhook de teste para produção em:
   - `app/resultado/page.js` (linha ~67)

## 📄 Licença

Este projeto foi desenvolvido para uso interno em processos de recrutamento.

---

**Desenvolvido com** ❤️ **usando Next.js e Tailwind CSS**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
