# 🚀 Guia Completo: Deploy no Netlify

## ✅ **Solução para Erro 404**

O erro 404 acontece porque o Netlify está tentando procurar arquivos em pastas erradas (como `dist/` ou `build/`), mas seu projeto não tem essas pastas - é um projeto **vanilla** (HTML, CSS, JS puros).

---

## 📋 **Passo a Passo: Configurar Netlify**

### **Método 1: Via Interface Web (RECOMENDADO)**

#### **1. Acesse as Configurações:**
```
1. Vá para: https://app.netlify.com
2. Selecione seu site
3. Clique em "Site configuration"
4. Clique em "Build & deploy"
```

#### **2. Edite Build Settings:**
```
Clique em "Edit settings"

┌─────────────────────────────────────────┐
│ Build command:                          │
│ [DEIXE VAZIO - delete tudo]            │
│                                         │
│ Publish directory:                      │
│ [DEIXE VAZIO ou coloque apenas: .]     │
└─────────────────────────────────────────┘
```

**IMPORTANTE:**
- ✅ **Build command:** VAZIO (apague `npm run build` ou qualquer outro comando)
- ✅ **Publish directory:** VAZIO ou apenas `.` (ponto)

#### **3. Configure Variáveis de Ambiente:**
```
Ainda em "Build & deploy":
1. Vá em "Environment variables"
2. Clique "Add a variable"
3. Adicione:
```

| Key | Value |
|-----|-------|
| `VITE_SUPABASE_URL` | `https://vvpzwypeydzpwyrpvqcf.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sua-chave-anonima` |

#### **4. Salve e Redeploy:**
```
1. Clique "Save"
2. Vá para aba "Deploys"
3. Clique "Trigger deploy"
4. Selecione "Deploy site"
5. Aguarde 1-2 minutos
```

---

### **Método 2: Via Arquivo netlify.toml (AUTOMÁTICO)**

Já criei o arquivo `netlify.toml` na raiz do projeto. Agora:

#### **1. Commit e Push:**
```bash
git add netlify.toml
git commit -m "Configuração Netlify"
git push
```

#### **2. Netlify detecta automaticamente:**
O Netlify lerá o arquivo `netlify.toml` e configurará tudo sozinho!

---

## 📁 **Estrutura Esperada:**

O Netlify deve encontrar esta estrutura:

```
sistema_avaliativo/
├── index.html           ← Arquivo principal
├── importar.html        ← Interface de importação
├── netlify.toml         ← Configuração Netlify
├── src/
│   ├── main.js
│   ├── quiz.js
│   └── ...
├── styles/
│   └── main.css
└── package.json
```

---

## 🔧 **Verificar se Funcionou:**

### **1. Acesse seu site:**
```
https://seu-site.netlify.app
```

### **2. Deve aparecer:**
- ✅ Tela de login do sistema
- ✅ Sem erro 404
- ✅ Console sem erros (F12)

### **3. Teste:**
```
1. Selecione ano (7º, 8º, 9º)
2. Deve carregar turmas do Supabase
3. Selecione turma e aluno
4. Deve iniciar prova
```

---

## ❌ **Problemas Comuns:**

### **Problema 1: Ainda dá 404**

**Causa:** Build settings incorretos

**Solução:**
1. Vá em "Site configuration" → "Build & deploy"
2. Verifique:
   - Build command: **VAZIO**
   - Publish directory: **VAZIO** ou `.`
3. Trigger deploy novamente

---

### **Problema 2: "Failed to load module"**

**Causa:** Imports relativos incorretos

**Solução:**
Verifique se os imports em `index.html` estão assim:
```html
<script type="module" src="/src/main.js"></script>
```

**NÃO assim:**
```html
<script type="module" src="./src/main.js"></script>
<script type="module" src="src/main.js"></script>
```

---

### **Problema 3: Supabase não conecta**

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
1. "Site configuration" → "Environment variables"
2. Adicionar:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Trigger deploy

---

### **Problema 4: RLS bloqueando**

**Causa:** Row Level Security ativo no Supabase

**Solução:**
```sql
-- No Supabase SQL Editor:
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
```

---

## 📊 **Logs de Deploy:**

Para ver o que aconteceu durante o deploy:

```
1. Netlify Dashboard
2. Aba "Deploys"
3. Clique no deploy mais recente
4. Veja "Deploy log"
```

**Deploy bem-sucedido deve mostrar:**
```
✓ Site is live
✓ Published successfully
```

---

## 🎯 **Checklist Completo:**

```
Antes do Deploy:
□ Arquivo netlify.toml na raiz
□ Variáveis VITE_* no .env
□ Commit e push para GitHub

No Netlify:
□ Build command: VAZIO
□ Publish directory: . (ponto)
□ Environment variables configuradas
□ RLS desabilitado no Supabase

Após Deploy:
□ Site carrega sem 404
□ Console sem erros
□ Consegue fazer login
□ Carrega turmas do Supabase
```

---

## 🔐 **Segurança:**

### **Variáveis de Ambiente:**

**⚠️ NUNCA comite no Git:**
- ❌ `.env`
- ❌ Chaves do Supabase no código

**✅ SEMPRE use:**
- Variáveis de ambiente do Netlify
- `.gitignore` configurado

### **Verificar .gitignore:**
```
node_modules/
.env
.env.local
*.log
.DS_Store
```

---

## 📝 **Comandos Úteis:**

### **Ver logs do Netlify via CLI:**
```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Ver sites
netlify sites:list

# Ver logs
netlify logs

# Deploy manual
netlify deploy --prod
```

---

## 🚀 **Deploy Automático:**

Após configurar uma vez, todo `git push` fará deploy automático!

```bash
# Fazer mudanças
git add .
git commit -m "Atualização"
git push

# Netlify detecta push e faz deploy sozinho
# Aguarde 1-2 minutos
```

---

## 💡 **Dicas:**

1. **Preview Deploys:** Cada Pull Request gera um preview
2. **Domínio Custom:** Configure em "Domain settings"
3. **SSL/HTTPS:** Automático e gratuito
4. **Forms:** Netlify Forms funciona automaticamente
5. **Analytics:** Ative em "Site settings"

---

## 📞 **Se Ainda Não Funcionar:**

1. **Compartilhe:**
   - URL do seu site Netlify
   - Screenshot do erro
   - Deploy log completo

2. **Verifique:**
   - Site configuration → Build settings
   - Deploy log na aba "Deploys"
   - Console do navegador (F12)

3. **Teste Local:**
   ```bash
   # Servidor local
   python -m http.server 8000
   # Ou
   npx http-server

   # Acesse: http://localhost:8000
   # Se funcionar local mas não no Netlify = problema de config
   ```

---

## ✅ **Resumo da Solução:**

**Problema:** Erro 404 no Netlify
**Causa:** Build settings procurando pasta dist/build que não existe
**Solução:**
1. Build command: **VAZIO**
2. Publish directory: **. (ponto)**
3. Arquivo `netlify.toml` configurado
4. Redeploy

---

**Agora seu site deve funcionar perfeitamente no Netlify!** 🎉
