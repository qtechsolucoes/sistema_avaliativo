# 🚀 Deploy no Render.com - Guia Completo

## Por que Render.com?

✅ **Suporte nativo a Node.js** - Sem gambiarras
✅ **Deploy automático** - Conecte o Git e pronto
✅ **HTTPS grátis** - SSL automático
✅ **Free tier generoso** - Perfeito para começar
✅ **Simples de configurar** - 5 minutos e está no ar

---

## 📋 Passo a Passo

### 1️⃣ Criar conta no Render

1. Acesse: https://render.com
2. Clique em **"Get Started for Free"**
3. Faça login com GitHub (recomendado)

---

### 2️⃣ Fazer Push do Código

```bash
# Adicionar alterações
git add .

# Commit
git commit -m "Configurar deploy para Render"

# Push para GitHub
git push origin main
```

---

### 3️⃣ Criar Web Service no Render

1. No dashboard do Render, clique em **"New +"**
2. Selecione **"Web Service"**
3. Conecte seu repositório GitHub
4. Selecione o repositório `sistema_avaliativo`

---

### 4️⃣ Configurar o Service

**Preencha os campos:**

| Campo | Valor |
|-------|-------|
| **Name** | `sistema-avaliativo` (ou o nome que preferir) |
| **Environment** | `Node` |
| **Region** | `Oregon (US West)` (mais próximo do Brasil) |
| **Branch** | `main` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Plan** | `Free` |

---

### 5️⃣ Configurar Variáveis de Ambiente

Na seção **"Environment Variables"**, clique em **"Add Environment Variable"** e adicione:

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://vvpzwypeydzpwyrpvqcf.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sua-chave-aqui` (do arquivo `.env.vercel`) |
| `NODE_ENV` | `production` |
| `PORT` | `8000` |

**💡 Dica:** Copie os valores do arquivo `config/.env.vercel`

---

### 6️⃣ Deploy Automático

1. Clique em **"Create Web Service"**
2. Aguarde o build (leva ~2 minutos)
3. ✅ Pronto! Seu app estará no ar!

**URL:** `https://sistema-avaliativo.onrender.com` (ou o nome que escolheu)

---

## ✅ Verificar se Funcionou

### Teste 1: Status da API
```bash
curl https://seu-app.onrender.com/api/status
```

**Resposta esperada:**
```json
{
  "status": "online",
  "cacheReady": true,
  "lastUpdate": "2025-10-03T12:00:00.000Z"
}
```

### Teste 2: Frontend
Acesse: `https://seu-app.onrender.com`

Deve carregar a página de login normalmente.

---

## 🔄 Deploy Automático

Após a configuração inicial, **cada push no GitHub fará deploy automático**!

```bash
# Fazer alteração no código
git add .
git commit -m "Atualização"
git push

# Render detecta e faz deploy automaticamente! 🎉
```

---

## 🐛 Problemas Comuns

### ❌ Erro: "Build failed"

**Causa:** Dependências não instaladas

**Solução:**
1. Verifique se `package.json` está correto
2. No Render, vá em **Logs** para ver o erro exato
3. Certifique-se de que `Build Command` é `npm install`

---

### ❌ Erro: "Application failed to respond"

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
1. Vá em **Environment** no dashboard
2. Verifique se todas as variáveis estão definidas:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `NODE_ENV`
   - `PORT`
3. Clique em **"Manual Deploy"** → **"Deploy latest commit"**

---

### ❌ Erro: "Cache não está pronto"

**Causa:** Servidor ainda está carregando dados

**Solução:** Aguarde 30 segundos e recarregue. O cache demora um pouco para carregar no primeiro acesso.

---

### ⚠️ App "adormece" após inatividade (Free Plan)

No plano gratuito, o Render "adormece" apps inativos após 15 minutos.

**Soluções:**

**Opção 1 - Keep Alive Simples:**
Use um serviço de ping gratuito:
- https://uptimerobot.com (gratuito)
- Configure para fazer ping a cada 5 minutos em `https://seu-app.onrender.com/api/status`

**Opção 2 - Upgrade (Recomendado para produção):**
- Plano pago: $7/mês
- Sem "sleep"
- Mais recursos

---

## 📊 Monitoramento

### Ver Logs em Tempo Real

1. No dashboard, clique no seu service
2. Vá em **"Logs"**
3. Veja logs em tempo real

### Métricas

1. Vá em **"Metrics"**
2. Veja uso de CPU, memória e requisições

---

## 🔐 Segurança

### Variáveis de Ambiente Seguras

✅ Variáveis ficam **criptografadas** no Render
✅ Não aparecem nos logs
✅ Não são expostas no frontend

### HTTPS Automático

✅ Certificado SSL gratuito
✅ Renovação automática
✅ HTTPS forçado por padrão

---

## 🎯 Configuração Avançada

### Custom Domain (Opcional)

1. Vá em **Settings** → **Custom Domains**
2. Clique em **"Add Custom Domain"**
3. Digite seu domínio
4. Configure DNS conforme instruções

### Health Checks

Já configurado automaticamente em `render.yaml`:
```yaml
healthCheckPath: /api/status
```

Render verifica a cada 30s se o app está respondendo.

---

## 📱 Usar em Produção

### Recomendações:

1. **Upgrade para plano pago** ($7/mês)
   - Sem "sleep"
   - Melhor performance
   - Mais confiável

2. **Configure domínio próprio**
   - Mais profissional
   - Melhor para usuários

3. **Ative notificações**
   - Email quando deploy falhar
   - Alertas de downtime

---

## 📝 Checklist Final

- [ ] Conta criada no Render.com
- [ ] Repositório conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy concluído com sucesso
- [ ] `/api/status` retorna `{"status":"online"}`
- [ ] Frontend carrega corretamente
- [ ] Cache funcionando (verificar logs)
- [ ] (Opcional) UptimeRobot configurado para keep-alive

---

## 🆘 Suporte

- **Documentação Render:** https://render.com/docs
- **Status do Render:** https://status.render.com
- **Suporte:** https://render.com/support

---

## 🎉 Pronto!

Seu sistema está online em:
```
https://sistema-avaliativo.onrender.com
```

**Vantagens sobre Vercel/Netlify:**
- ✅ Funciona de primeira (sem erro 404)
- ✅ Servidor Node.js real
- ✅ Cache em memória funciona perfeitamente
- ✅ Deploy automático a cada push
- ✅ HTTPS grátis

**Agora é só usar! 🚀**
