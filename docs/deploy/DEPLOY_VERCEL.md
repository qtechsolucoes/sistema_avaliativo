# 🚀 Deploy no Vercel - Guia Completo

## 📋 Pré-requisitos

- Conta no [Vercel](https://vercel.com)
- Conta no [Supabase](https://supabase.com)
- Projeto no GitHub/GitLab/Bitbucket (ou Vercel CLI)

---

## 🔧 Passo 1: Configurar Variáveis de Ambiente

### Via Dashboard do Vercel (Recomendado)

1. Acesse seu projeto no Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `VITE_SUPABASE_URL` | `https://vvpzwypeydzpwyrpvqcf.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `sua-chave-aqui` (veja .env.vercel) | Production, Preview, Development |

4. Clique em **Save** após cada variável

### Via Vercel CLI (Alternativa)

```bash
# Instalar CLI
npm i -g vercel

# Fazer login
vercel login

# Adicionar variáveis
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
```

---

## 📦 Passo 2: Deploy

### Método 1: Via Git (Automático)

1. Conecte seu repositório no Vercel
2. O Vercel detectará automaticamente o `vercel.json`
3. Cada push no branch principal fará deploy automático

### Método 2: Via CLI (Manual)

```bash
# Fazer deploy
vercel

# Deploy para produção
vercel --prod
```

---

## ✅ Passo 3: Verificar Deploy

Após o deploy, verifique:

1. **Status do servidor**: `https://seu-app.vercel.app/api/status`
   - Deve retornar: `{"status":"online","cacheReady":true}`

2. **Frontend**: `https://seu-app.vercel.app`
   - Deve carregar a página de login

3. **Logs**: Vá em **Deployments** → clique no deploy → **Logs**

---

## 🐛 Problemas Comuns

### ❌ Erro: "Cache não está pronto"

**Causa**: Variáveis de ambiente não configuradas

**Solução**:
```bash
# Verificar se as variáveis estão definidas
vercel env ls

# Se não estiverem, adicione:
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# Fazer redeploy
vercel --prod
```

### ❌ Erro: "Cannot find module 'express'"

**Causa**: Dependências não instaladas

**Solução**: Verifique se `package.json` tem todas as dependências:
```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.58.0",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "compression": "^1.7.4"
  }
}
```

### ❌ Página em branco ou erro 404

**Causa**: Rotas não configuradas corretamente

**Solução**: Verifique se `vercel.json` existe e está correto:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server.js"
    },
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

### ❌ Erro: "Function execution timed out"

**Causa**: Vercel tem timeout de 10s para serverless functions

**Solução**: O cache inicial pode demorar. Aguarde alguns segundos e recarregue.

---

## 📊 Monitoramento

### Verificar saúde do servidor

```bash
curl https://seu-app.vercel.app/api/status
```

Resposta esperada:
```json
{
  "status": "online",
  "cacheReady": true,
  "lastUpdate": "2024-01-15T10:30:00.000Z",
  "cachedData": {
    "classes": 12,
    "students": 350,
    "assessments": 8
  }
}
```

### Logs em tempo real

```bash
vercel logs seu-app.vercel.app
```

---

## 🔄 Recarregar Cache

Se precisar atualizar os dados do Supabase:

```bash
curl -X POST https://seu-app.vercel.app/api/reload-cache
```

---

## 🔐 Segurança

### ⚠️ IMPORTANTE

1. **Nunca commite o arquivo `.env`**
2. Use apenas `VITE_SUPABASE_ANON_KEY` (chave pública)
3. Não exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend
4. Configure Row Level Security (RLS) no Supabase

### Verificar .gitignore

Certifique-se de que `.env` está no `.gitignore`:

```bash
# .gitignore
.env
.env.local
.vercel
```

---

## 📱 Custom Domain (Opcional)

1. Vá em **Settings** → **Domains**
2. Adicione seu domínio personalizado
3. Configure DNS conforme instruções do Vercel

---

## 🆘 Suporte

- **Documentação Vercel**: https://vercel.com/docs
- **Documentação Supabase**: https://supabase.com/docs
- **Issues do Projeto**: [GitHub Issues](seu-repo-aqui)

---

## 📝 Checklist Final

- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] `vercel.json` criado na raiz do projeto
- [ ] Deploy realizado com sucesso
- [ ] `/api/status` retorna `{"status":"online"}`
- [ ] Frontend carrega corretamente
- [ ] Cache está funcionando (verificar logs)
- [ ] `.env` NÃO está commitado no Git

---

**✅ Deploy concluído com sucesso!**

Acesse: `https://seu-app.vercel.app`
