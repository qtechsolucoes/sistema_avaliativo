# 📤 Como Sincronizar Provas Salvas Localmente

## ❓ O que aconteceu?

Alguns Chromebooks **não conseguiram conectar ao servidor** durante a finalização da prova.

Quando isso acontece, o sistema automaticamente:
1. ✅ Salva os dados **localmente no navegador** (localStorage)
2. ✅ Faz **download automático de um arquivo JSON** com os dados
3. ✅ Mostra mensagem: **"Será sincronizado depois"**

**Isso é NORMAL e SEGURO!** Os dados NÃO foram perdidos! 📦

---

## 📋 O que foi salvo?

Cada aluno que finalizou offline recebeu:

### **1. Arquivo JSON baixado automaticamente:**
```
📁 Downloads/
   └── prova_[NOME_ALUNO]_[DATA].json
```

**Exemplo:**
```
prova_João_Silva_2025-10-02_15-30.json
```

### **2. Dados salvos no navegador:**
- Armazenados no localStorage do Chromebook
- Podem ser sincronizados depois quando conectar

---

## 🔄 Como Sincronizar?

### **Opção 1: Importar os arquivos JSON (RECOMENDADO)**

#### **Passo 1: Coletar os arquivos JSON**

Peça aos alunos que:
1. Abram a pasta **Downloads**
2. Procurem arquivo: `prova_[nome]_[data].json`
3. Enviem para você via:
   - Pen drive
   - Email
   - Google Drive
   - Compartilhamento de rede

#### **Passo 2: Importar no sistema**

**AINDA NÃO IMPLEMENTADO - Vou criar agora!**

Vou criar uma interface de importação em lote para você.

---

### **Opção 2: Reconectar Chromebook ao servidor**

Se o Chromebook **ainda não foi reiniciado:**

1. **Conecte o Chromebook à rede WiFi do servidor**
   ```
   WiFi: Sala_Aula
   Senha: prova2025
   ```

2. **Acesse o sistema:**
   ```
   http://192.168.5.1:8000
   ```

3. **O sistema detectará automaticamente:**
   - Há dados salvos localmente
   - Perguntar se deseja sincronizar
   - Enviará automaticamente ao servidor

**⚠️ IMPORTANTE:** Isso só funciona se:
- Chromebook não foi limpo/reiniciado
- Navegador não foi fechado com limpeza de dados
- localStorage ainda existe

---

## 📊 Verificar Quem Está Pendente

### **No servidor, acesse:**
```
http://192.168.5.1:8000/api/status
```

**Ou via terminal:**
```bash
# Ver submissões no banco
node verificar-submissoes.js
```

---

## 🛠️ Ferramenta de Importação (Vou criar agora)

Vou criar uma interface web para você importar os arquivos JSON facilmente.

---

## ⚠️ Prevenção para Próxima Vez

### **Garantir que todos salvem no servidor:**

**1. Teste conexão ANTES da prova:**
```bash
# Em cada Chromebook, abrir:
http://192.168.5.1:8000/api/status

# Deve aparecer:
{
  "status": "online",
  "cacheReady": true
}
```

**2. Configure WiFi corretamente:**
- Use script: `MELHORAR_WIFI.bat`
- Posicione PC no centro
- Conecte em grupos de 10

**3. Monitore durante a prova:**
```bash
# Acesse no PC servidor:
http://192.168.5.1:8000/api/status

# Verifique:
- activeConnections: deve mostrar número de alunos
- cacheHitRate: deve estar > 80%
```

---

## 📝 Dados Contidos no JSON

Cada arquivo JSON contém:

```json
{
  "studentId": "uuid-do-aluno",
  "studentName": "Nome Completo",
  "grade": "7",
  "className": "A",
  "assessmentId": "uuid-da-avaliacao",
  "score": 8,
  "totalQuestions": 10,
  "totalDuration": 1847,
  "timestamp": "2025-10-02T18:30:00.000Z",
  "answerLog": [
    {
      "questionId": "uuid-1",
      "isCorrect": true,
      "duration": 185
    },
    {
      "questionId": "uuid-2",
      "isCorrect": false,
      "duration": 178
    }
    // ... mais 8 respostas
  ],
  "metadata": {
    "syncStatus": "pending",
    "savedAt": "2025-10-02T18:30:00.000Z",
    "device": "Chromebook",
    "userAgent": "..."
  }
}
```

**Tudo está salvo!** ✅

---

## 🚨 Casos Especiais

### **Caso 1: Aluno não tem o arquivo JSON**

**Opções:**

1. **Verificar pasta Downloads:**
   - Pode estar com nome diferente
   - Ordenar por data (mais recente)

2. **Verificar localStorage (se Chromebook disponível):**
   ```javascript
   // Abrir Console (F12) no Chromebook
   console.log(localStorage.getItem('offline_submissions'))
   ```

3. **Copiar dados do localStorage:**
   ```javascript
   // Copiar tudo:
   copy(localStorage.getItem('offline_submissions'))
   // Colar em arquivo .txt e enviar para você
   ```

### **Caso 2: Arquivo JSON corrompido**

Se o JSON não abrir:
1. Abra com **Notepad**
2. Verifique se tem `{` no início e `}` no final
3. Envie para mim analisar

### **Caso 3: Múltiplos arquivos do mesmo aluno**

Se aluno fez prova 2x (por erro):
- Importar o arquivo **mais recente** (data no nome)
- Outros podem ser descartados

---

## ✅ Próximos Passos

**Vou criar AGORA:**

1. ✅ Interface web de importação em lote
2. ✅ Script para importar JSONs via linha de comando
3. ✅ Validação automática dos arquivos
4. ✅ Relatório de importação

**Aguarde, estou criando...**
