# Guia de Configuração de Segurança

Este guia ajuda você a configurar o sistema de segurança implementado nas correções.

## 🔐 **1. Configuração de Credenciais**

### Desenvolvimento Local
Para desenvolvimento local, defina as credenciais usando o console do navegador:

```javascript
// No console do navegador (F12)
// Substitua pelas suas credenciais reais do Supabase
setDevConfig(
  'https://sua-url-do-supabase.supabase.co',
  'sua-chave-anonima-aqui'
);
```

### Produção
Em produção, configure as variáveis de ambiente no seu servidor:

```bash
export SUPABASE_URL="https://sua-url-do-supabase.supabase.co"
export SUPABASE_ANON_KEY="sua-chave-anonima-aqui"
```

## 🔑 **2. Configuração de Senhas**

### Senhas Padrão (MUDE IMEDIATAMENTE)
As senhas padrão são:
- **Admin**: `hello` (hash: `2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824`)
- **Unlock**: `unlock` (hash: `787600ebe6d6c75b6bc0b2db0bfd6aeec78897b67d3192e2208bc8b714237841`)

### Como Gerar Novas Senhas
Use o console do navegador para gerar hashes SHA-256:

```javascript
// No console do navegador
async function generatePasswordHash(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Exemplo: gerar hash para senha "minhaSenhaSegura123"
generatePasswordHash("minhaSenhaSegura123").then(console.log);
```

### Atualizando Senhas no Código
Edite o arquivo `src/utils/auth.js`:

```javascript
// Linha 27-28
this.adminPasswordHash = 'SEU_NOVO_HASH_ADMIN_AQUI';
this.unlockPasswordHash = 'SEU_NOVO_HASH_UNLOCK_AQUI';
```

## 🛡️ **3. Proteções Implementadas**

### Autenticação
- ✅ Senhas com hash SHA-256
- ✅ Rate limiting (3 tentativas)
- ✅ Lockout temporário (15 minutos)
- ✅ Proteção contra brute force

### XSS Prevention
- ✅ Sanitização de HTML
- ✅ Validação de input do usuário
- ✅ Notificações seguras
- ✅ Escape de caracteres perigosos

### State Management
- ✅ Gerenciamento de estado consistente
- ✅ Validação de dados
- ✅ Limpeza de memória
- ✅ Prevenção de vazamentos

## ⚙️ **4. Configurações Recomendadas**

### Headers de Segurança (Configure no Servidor)
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' cdn.tailwindcss.com cdn.jsdelivr.net unpkg.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data:;
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### HTTPS
- Configure certificado SSL
- Force redirecionamento HTTP → HTTPS
- Use cookies com flag `Secure`

## 🚨 **5. Checklist de Segurança**

### Antes de Ir para Produção:
- [ ] Alterar senhas padrão
- [ ] Configurar variáveis de ambiente
- [ ] Testar autenticação
- [ ] Verificar headers de segurança
- [ ] Configurar HTTPS
- [ ] Testar sanitização XSS
- [ ] Verificar rate limiting
- [ ] Testar recuperação de sessão
- [ ] Validar logs de auditoria

### Monitoramento:
- [ ] Configurar alertas de tentativas de invasão
- [ ] Monitorar logs de erro
- [ ] Verificar métricas de performance
- [ ] Acompanhar uso de memória

## 🔧 **6. Comandos de Desenvolvimento**

### Para Testar Localmente:
```bash
# Servir aplicação
python -m http.server 8000

# Ou usando Node.js
npx http-server .

# Acessar em: http://localhost:8000
```

### Para Debug:
```javascript
// No console do navegador
localStorage.setItem('debugMode', 'true');
location.reload();

// Acessar ferramentas de debug
window.debugApp.exportLogs();
window.debugApp.state;
```

## 📝 **7. Notas Importantes**

1. **Senhas**: Nunca commit senhas em texto plano
2. **Logs**: Não logue informações sensíveis
3. **HTTPS**: Obrigatório em produção
4. **Rate Limiting**: Configure no servidor também
5. **Backup**: Mantenha backup das configurações
6. **Auditoria**: Revise logs regularmente

## 🆘 **8. Em Caso de Problemas**

### Problemas de Autenticação:
```javascript
// Limpar tentativas de login
localStorage.removeItem('auth_attempts');
localStorage.removeItem('auth_lockout');
```

### Reset Completo (Emergência):
```javascript
// CUIDADO: Remove todos os dados locais
localStorage.clear();
location.reload();
```

### Contato:
- Verifique logs no console (F12)
- Exporte logs: `window.debugApp.exportLogs()`
- Documente passos para reproduzir o problema