# 🔧 Configuração de Variáveis de Ambiente

## Arquivo `.env.local`

Crie um arquivo `.env.local` na raiz do projeto (modelo em `.env.example`):

```bash
# Supabase — projeto Beauty Smile Hub (qyrkyvoilfaxppbvtkpi)
NEXT_PUBLIC_SUPABASE_URL=https://qyrkyvoilfaxppbvtkpi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=

# Senha de acesso ao dashboard /relatorios
DASHBOARD_PASSWORD=
```

## Onde obter cada valor

| Variável | Onde |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Já preenchida acima |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API Keys → `service_role` |
| `DASHBOARD_PASSWORD` | Você define. Compartilhe apenas com quem deve ver os resultados |

## Comportamento quando faltam

| Faltando | O que acontece |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | A tela final do candidato mostra erro ao gravar; o dashboard não carrega os dados |
| `DASHBOARD_PASSWORD` | `/relatorios` responde **503** — fecha o acesso em vez de abrir |

## Importante

⚠️ **Não commite o `.env.local`.** Ele já está no `.gitignore`.

⚠️ **Nunca prefixe `SUPABASE_SERVICE_ROLE_KEY` ou `DASHBOARD_PASSWORD` com `NEXT_PUBLIC_`.**
Esse prefixo embute o valor no JavaScript entregue ao navegador — a service role key
ignora RLS, então isso daria a qualquer visitante acesso total de leitura e escrita ao banco.

Para produção, configure as três em **Vercel → Project Settings → Environment Variables**.
