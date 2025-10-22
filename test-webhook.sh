#!/bin/bash
# Script para testar webhook do N8N

# URL do webhook de TESTE
WEBHOOK_URL="https://n8n.srv881294.hstgr.cloud/webhook-test/0e31d419-1337-46da-b26c-a5a6e02f5ab2"

# Dados de teste
JSON_DATA='{
  "nome": "Teste Manual",
  "email": "teste@example.com",
  "telefone": "(11) 99999-9999",
  "dataInicio": "2025-10-22T03:00:00.000Z",
  "dataFim": "2025-10-22T03:15:00.000Z",
  "tempoTotalMinutos": 15.5,
  "pontuacao": 45,
  "percentualAcertos": 75.00,
  "respostas": [4,5,1,2,6,3,6,2,1,3,4,5,2,6,1,2,1,3,5,6,4,3,4,5,8,2,3,8,7,4,5,1,7,6,1,2,3,4,3,7,8,6,5,4,1,2,5,6,7,6,8,2,1,5,1,6,3,2,4,5]
}'

echo "🧪 Testando webhook..."
echo "📍 URL: $WEBHOOK_URL"
echo ""

# Fazer requisição
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$JSON_DATA")

# Separar corpo e status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

echo "📡 Status HTTP: $HTTP_CODE"
echo "📦 Resposta:"
echo "$HTTP_BODY"
echo ""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Webhook funcionando!"
else
  echo "❌ Erro ao chamar webhook"
  echo "💡 Verifique se o workflow está ATIVO no N8N"
fi
