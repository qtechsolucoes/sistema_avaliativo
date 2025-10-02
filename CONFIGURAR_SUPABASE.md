# 🔑 Guia Rápido - Configurar Supabase

## 🚀 Modo Servidor Local (RECOMENDADO)

O sistema agora usa um **servidor local com cache**. Configure uma vez e todos os alunos acessam sem internet individual!

## ✅ Variáveis de Ambiente

### **ESSENCIAIS (Obrigatórias):**

| Variável | Onde Encontrar | Descrição |
|----------|----------------|-----------|
| `VITE_SUPABASE_URL` | Settings → API → Project URL | URL do seu projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Settings → API → anon public | Chave pública/anônima |

> **IMPORTANTE:** Use o prefixo `VITE_` para as variáveis no arquivo `.env`

### **OPCIONAIS (Avançadas):**

| Variável | Onde Encontrar | Uso |
|----------|----------------|-----|
| `SUPABASE_DATABASE_URL` | Settings → Database → Connection string | Conexão direta ao PostgreSQL |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role | Operações administrativas (⚠️ NUNCA expor ao cliente!) |
| `SUPABASE_JWT_SECRET` | Settings → API → JWT Secret | Verificação de tokens JWT |

---

## 📋 Passo a Passo - Configuração

### 1️⃣ Acessar o Supabase

```
1. Vá em: https://supabase.com
2. Faça login
3. Selecione seu projeto (ou crie um novo)
```

### 2️⃣ Copiar Credenciais Essenciais

**No Supabase:**
```
1. Clique em "Settings" (⚙️) no menu lateral
2. Vá em "API"
3. Copie:
   - Project URL → SUPABASE_URL
   - anon public → SUPABASE_ANON_KEY
```

### 3️⃣ Configurar no Sistema

**Método 1 - Arquivo .env (RECOMENDADO):**
```bash
1. Copie .env.example para .env
2. Cole as credenciais:

VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui
```

### 4️⃣ Iniciar o Servidor Local

**Windows:**
```bash
INICIAR.bat
```

**Ou via terminal:**
```bash
npm start
```

O servidor irá:
1. ✅ Carregar dados do Supabase **uma única vez**
2. ✅ Criar cache em memória
3. ✅ Filtrar questões automaticamente pelo ano correto
4. ✅ Servir na rede local: `http://192.168.5.1:8000`

**Método 2 - Console do Navegador (Desenvolvimento):**
```javascript
// Abra o console (F12) e execute:
setDevConfig(
  "https://seu-projeto.supabase.co",
  "sua-chave-aqui"
)
```

**Método 3 - Hardcoded (Testes):**
```javascript
// Edite src/config.js diretamente (linha 20-21)
const envVars = {
    'SUPABASE_URL': 'https://seu-projeto.supabase.co',
    'SUPABASE_ANON_KEY': 'sua-chave-aqui'
};
```

### 4️⃣ Verificar Configuração

**No Console do Navegador (F12):**
```javascript
// Mostra status da configuração
debugConfig()

// Ou
configSupabase()
```

---

## 🔐 Credenciais Opcionais (Avançado)

### DATABASE_URL (Conexão Direta)

**Quando usar:** Scripts de migração, backups, operações SQL diretas

**Onde encontrar:**
```
Settings → Database → Connection string → URI
```

**Formato:**
```
postgresql://postgres:[PASSWORD]@db.seu-projeto.supabase.co:5432/postgres
```

### SERVICE_ROLE_KEY (Admin)

**Quando usar:** Operações que ignoram RLS (Row Level Security)

**⚠️ CUIDADO:**
- NUNCA exponha ao cliente (navegador)
- Apenas para código server-side
- Tem permissões totais no banco

**Onde encontrar:**
```
Settings → API → service_role (secret)
```

### JWT_SECRET

**Quando usar:** Verificação manual de tokens JWT

**Onde encontrar:**
```
Settings → API → JWT Secret
```

---

## ✅ Checklist de Configuração

### Desenvolvimento Local:
- [ ] Python instalado
- [ ] Servidor rodando (`python -m http.server 8000`)
- [ ] Console aberto (F12)
- [ ] Executar: `setDevConfig("URL", "KEY")`
- [ ] Recarregar página
- [ ] Executar: `debugConfig()` para confirmar

### Produção (Hospedado):
- [ ] Arquivo `.env` criado (cópia de `.env.example`)
- [ ] `SUPABASE_URL` preenchido
- [ ] `SUPABASE_ANON_KEY` preenchido
- [ ] Sistema hospedado (Vercel/Netlify)
- [ ] Variáveis de ambiente configuradas no host
- [ ] Teste de conexão realizado

---

## 🐛 Solução de Problemas

### ❌ "SUPABASE_URL não está configurada"

**Causa:** Variáveis não encontradas

**Solução:**
1. Verifique se `.env` existe na raiz do projeto
2. Confirme que está usando `SUPABASE_URL` (sem prefixo `VITE_`)
3. Reinicie o servidor
4. Limpe cache do navegador (Ctrl+Shift+Del)

### ❌ "Erro de CORS" ou "Network Error"

**Causa:**
- Abrindo `index.html` diretamente (file://)
- URL do Supabase incorreta

**Solução:**
1. Use servidor local: `python -m http.server 8000`
2. Verifique URL: deve começar com `https://`
3. Teste URL no navegador: deve retornar JSON

### ❌ "Invalid API key"

**Causa:** Chave anônima incorreta ou expirada

**Solução:**
1. Gere nova chave no Supabase (Settings → API → Generate)
2. Copie a chave completa (incluindo prefixo `eyJ`)
3. Atualize `.env` ou `config.js`
4. Recarregue a página

### ❌ "Row Level Security policy violation"

**Causa:** RLS ativo sem políticas configuradas

**Solução:**
1. Desabilite RLS temporariamente:
   ```sql
   ALTER TABLE submissions DISABLE ROW LEVEL SECURITY;
   ALTER TABLE students DISABLE ROW LEVEL SECURITY;
   ```
2. Ou configure políticas adequadas em `docs/CONFIGURAR_RLS_SUPABASE.md`

---

## 📊 Estrutura Mínima do Banco

Para o sistema funcionar, você precisa destas tabelas no Supabase:

```sql
-- Tabelas essenciais
✓ students
✓ classes
✓ class_enrollments
✓ assessments
✓ assessment_questions
✓ questions
✓ submissions
✓ submission_answers
✓ academic_periods
✓ disciplines

-- Função RPC essencial
✓ submit_assessment(...)
✓ get_assessment_by_details(...)
```

**Scripts SQL:** Veja pasta `database/`

---

## 🚀 Teste Rápido

Após configurar, teste no console (F12):

```javascript
// 1. Verificar configuração
debugConfig()

// 2. Testar conexão
testConnection()

// 3. Testar banco completo
testDB()
```

**Resultado esperado:**
```
✅ Config carregado: { url: '✓ Configurado', key: '✓ Configurado', isValid: true }
✅ Conexão com Supabase estabelecida
✅ Integração completa testada com sucesso
```

---

## 📞 Comandos Úteis (Console)

```javascript
// Mostra como configurar
configSupabase()

// Mostra status atual
debugConfig()

// Define credenciais em desenvolvimento
setDevConfig("url", "key")

// Ativa modo debug
enableDebug()

// Testa conexão básica
testConnection()

// Testa integração completa
testDB()
```

---

**Versão:** 2.0.1
**Última Atualização:** Outubro 2025
