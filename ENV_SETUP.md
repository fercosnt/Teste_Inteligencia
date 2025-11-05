# 🔧 Configuração de Variáveis de Ambiente

## Arquivo `.env.local`

Crie um arquivo `.env.local` na raiz do projeto com a seguinte configuração:

```bash
# URL do Webhook N8N para envio de resultados
NEXT_PUBLIC_WEBHOOK_URL=https://n8n.srv881294.hstgr.cloud/webhook/0e31d419-1337-46da-b26c-a5a6e02f5ab2
```

## URLs Disponíveis

### Produção
```
https://n8n.srv881294.hstgr.cloud/webhook/0e31d419-1337-46da-b26c-a5a6e02f5ab2
```

### Teste
```
https://n8n.srv881294.hstgr.cloud/webhook-test/0e31d419-1337-46da-b26c-a5a6e02f5ab2
```

## Fallback

Se a variável `NEXT_PUBLIC_WEBHOOK_URL` não estiver definida, o sistema automaticamente usará a URL de produção como fallback.

## Importante

⚠️ **Não commite o arquivo `.env.local`** no repositório Git. Ele contém configurações sensíveis e deve ser mantido localmente.

Para produção, configure a variável de ambiente diretamente no servidor/hospedagem.


