# 🔧 Configuração do Supabase

## ⚠️ **IMPORTANTE: Configure as Credenciais Antes de Usar**

A aplicação agora está configurada para buscar dados reais do Supabase, mas você precisa definir suas credenciais primeiro.

## 🎯 **Passo 1: Configurar Credenciais**

### Opção A: Para Desenvolvimento Local
1. Abra o console do navegador (F12)
2. Execute `configSupabase()` para ver as instruções
3. Ou execute diretamente:

```javascript
setDevConfig(
  'https://vvpzwypeydzpwyrpvqcf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2cHp3eXBleWR6cHd5cnB2cWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxOTgyMzIsImV4cCI6MjA3Mzc3NDIzMn0.gHDGSdIKuKUGeYazg247fRhFxGB0_NLhsKXwNQz84Cg'
);
```

4. A página será recarregada automaticamente

### Opção B: Editar .env (Para Produção)
1. Copie `.env.example` para `.env`
2. Preencha com suas credenciais reais:

```bash
SUPABASE_URL=https://sua-url-aqui.supabase.co
SUPABASE_ANON_KEY=sua-chave-aqui
```

## 🔍 **Passo 2: Verificar Funcionamento**

Após configurar, recarregue a página e verifique no console:

✅ **Funcionando Corretamente:**
```
✅ Supabase inicializado com sucesso
🔌 Testando conexão com Supabase...
✅ Conexão com Supabase funcionando
✅ Conexão com Supabase confirmada - dados reais disponíveis
```

❌ **Usando Dados Mock:**
```
⚠️ Credenciais do Supabase são placeholders - modo offline
📴 Modo offline - usando dados mock
```

## 🗄️ **Estrutura do Banco de Dados Esperada**

A aplicação espera as seguintes tabelas no Supabase:

### Tabelas Principais:
- `academic_periods` - Períodos acadêmicos (anos letivos)
- `classes` - Turmas
- `students` - Estudantes
- `class_enrollments` - Matrículas (relação estudante-turma)
- `assessments` - Avaliações
- `questions` - Questões
- `assessment_questions` - Relação avaliação-questão
- `submissions` - Submissões dos estudantes

### Função RPC Esperada:
- `get_assessment_by_details(grade, discipline, period, year)` - Busca avaliação

## 🔄 **Como o Sistema Funciona Agora**

### 1. **Inicialização**
- Verifica se credenciais estão configuradas
- Testa conectividade com Supabase
- Define modo de operação (online vs offline)

### 2. **Busca de Dados**
- **Se Online**: Busca dados reais do Supabase
- **Se Offline**: Usa dados mock como fallback
- **Fallback Inteligente**: Se houver erro, volta para mock automaticamente

### 3. **Fluxo de Dados**
```
Login → Busca Turmas → Busca Estudantes → Busca Avaliação → Salva Resultados
  ↓           ↓              ↓               ↓              ↓
Supabase   Supabase       Supabase       Supabase      Supabase
   ↓           ↓              ↓               ↓              ↓
 Mock      Mock           Mock            Mock          Local
```

## 🚀 **Vantagens da Nova Implementação**

1. **Dados Reais**: Agora busca dados verdadeiros do Supabase
2. **Fallback Robusto**: Se falhar, usa mock sem quebrar
3. **Logs Detalhados**: Mostra exatamente o que está acontecendo
4. **Teste de Conectividade**: Verifica se consegue acessar o banco
5. **Configuração Flexível**: Funciona em dev e produção

## 🔧 **Comandos de Debug**

No console do navegador:

```javascript
// Verificar configuração atual
debugConfig()

// Testar integração completa do banco
testDB()

// Testar conectividade básica
testConnection()

// Verificar status da conexão
window.debugApp?.supabase?.status()

// Ver logs detalhados
window.debugApp?.exportLogs()

// Mostrar comandos de configuração
configSupabase()
```

## 📋 **Checklist de Configuração**

- [ ] Credenciais do Supabase configuradas
- [ ] Console mostra "Conexão confirmada"
- [ ] Dados reais sendo carregados (não mock)
- [ ] Submissões salvando no banco
- [ ] Fallback para mock funcionando se desconectar

## 🆘 **Solução de Problemas**

### Problema: "Usando dados mock"
**Causa**: Credenciais não configuradas ou inválidas
**Solução**: Configure as credenciais corretas

### Problema: "Erro ao conectar"
**Causa**: Problema de rede ou permissões
**Solução**: Verifique firewall e políticas RLS no Supabase

### Problema: "Tabela não encontrada"
**Causa**: Estrutura do banco diferente
**Solução**: Ajuste as consultas no código conforme sua estrutura

---

**🎯 Resultado**: Aplicação totalmente funcional com dados reais do Supabase!