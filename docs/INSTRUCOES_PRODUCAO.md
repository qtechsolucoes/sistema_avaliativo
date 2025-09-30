# 📋 INSTRUÇÕES PARA USO EM PRODUÇÃO - SISTEMA AVALIATIVO

## 🎯 Visão Geral do Fluxo

Este sistema permite que alunos façam provas em Chromebooks **offline** conectados via **rede local (hotspot)** ao seu computador. Os resultados são enviados **automaticamente via rede** e salvos no seu computador.

---

## 🔧 CONFIGURAÇÃO INICIAL (Fazer 1 vez)

### 1️⃣ Descobrir seu IP Local

**Windows:**
```bash
ipconfig
```
Procure por "Adaptador de Rede sem Fio" → "Endereço IPv4"
Exemplo: `192.168.137.1` (IP padrão do MyPublicWiFi)

**Mac/Linux:**
```bash
ifconfig
```

### 2️⃣ Configurar o IP no Sistema

Abra o arquivo: `offline-config.js`

```javascript
serverIP: "192.168.137.1", // ⬅️ COLOQUE SEU IP AQUI
```

---

## 📝 PASSO A PASSO DO DIA DA PROVA

### ANTES DA PROVA (No seu computador)

#### 1. Inicie o Servidor
```bash
node server.js
```

Você verá:
```
🚀 Servidor rodando em: http://localhost:3000
📡 Endereço para Chromebooks: http://192.168.137.1:3000
📁 Resultados salvos em: D:\sistema_avaliativo\resultados_recebidos
```

**⚠️ NÃO FECHE ESTA JANELA durante a aplicação da prova!**

#### 2. Configure o Hotspot
- Abra o MyPublicWiFi
- Crie uma rede (ex: "Prova_Escola")
- Defina senha
- Inicie o hotspot

#### 3. Gere o HTML Offline
1. Abra o sistema no navegador: `http://localhost:8000`
2. Acesse "Área do Professor"
3. Clique em "Gerar e Baixar Arquivo"
4. Salve o arquivo: `plataforma_offline_2025-XX-XX.html`

#### 4. Distribua para os Chromebooks
- Copie o arquivo HTML para **pen drive/rede**
- Envie para cada Chromebook
- Alunos devem abrir o arquivo no navegador

---

### DURANTE A PROVA

#### No Chromebook (Aluno):
1. Conectar ao WiFi "Prova_Escola"
2. Abrir arquivo HTML no navegador
3. Selecionar: Ano → Turma → Nome
4. Realizar a prova
5. Finalizar

**O que acontece automaticamente:**
- ✅ Ao finalizar, o resultado é enviado via rede para seu computador
- ✅ Arquivo JSON é salvo em `resultados_recebidos/`
- ✅ Chromebook é bloqueado para novas provas

#### No seu Computador (Professor):
Acompanhe no terminal:
```
✅ Resultado recebido: João_Silva_6A_2025-03-30T14-25-30.json
   Aluno: João Silva | Turma: 6º A
   Nota: 8/10
```

---

### DEPOIS DA PROVA

#### 1. Consolidar Resultados

Pare o servidor (Ctrl+C) e execute:
```bash
node importador-lote.js
```

O script irá:
- Ler todos os JSONs da pasta `resultados_recebidos`
- Validar os dados
- Gerar arquivo consolidado: `resultados_consolidados.json`
- (Opcional) Mover arquivos processados para subpasta

#### 2. Importar para o Banco de Dados

**Opção A: Via Interface Web**
1. Abra o sistema: `http://localhost:8000`
2. Acesse "Área do Professor"
3. Clique em "Importar"
4. Selecione: `resultados_consolidados.json`
5. Aguarde confirmação

**Opção B: Importação Manual**
- Se preferir, pode importar JSONs individuais um por um

---

## 📊 ESTRUTURA DE ARQUIVOS

```
sistema_avaliativo/
├── server.js                    # Servidor que recebe resultados
├── importador-lote.js          # Script para consolidar JSONs
├── offline-config.js           # Configuração do IP do servidor
├── resultados_recebidos/       # ⬅️ JSONs chegam aqui automaticamente
│   ├── João_Silva_6A_2025-...json
│   ├── Maria_Costa_7B_2025-...json
│   └── processados/            # Arquivos já importados (opcional)
└── resultados_consolidados.json # Arquivo final para importação
```

---

## 🔍 SOLUÇÃO DE PROBLEMAS

### ❌ "Servidor não acessível. Salvo localmente"

**Causas:**
- Servidor não está rodando (`node server.js`)
- IP configurado errado em `offline-config.js`
- Chromebook não está conectado ao hotspot
- Firewall bloqueando porta 3000

**Solução:**
1. Verifique se servidor está rodando
2. Confirme IP com `ipconfig`
3. Teste acesso no navegador: `http://SEU_IP:3000/status`
4. Libere porta 3000 no firewall

---

### ❌ Chromebook não salva resultado

**Solução de Emergência:**
Os resultados ficam salvos no navegador do Chromebook (localStorage).

Para recuperar:
1. Abra o console do navegador (F12)
2. Execute:
```javascript
console.log(localStorage.getItem('pending_results'));
```
3. Copie o JSON exibido
4. Salve em arquivo `.json`
5. Importe manualmente

---

### ❌ Arquivo HTML não abre corretamente

**Verifique:**
- Arquivo foi gerado com todos os dados (deve ter alguns MB)
- Abra com navegador moderno (Chrome, Edge, Firefox)
- Veja erros no console (F12)

---

## 💡 DICAS IMPORTANTES

### ✅ Boas Práticas

1. **Teste antes do dia da prova**
   - Gere um HTML de teste
   - Teste em 1 Chromebook
   - Verifique se resultado chega

2. **Mantenha backup**
   - Não delete a pasta `resultados_recebidos` até importar
   - Faça backup do arquivo consolidado

3. **Internet não é necessária**
   - Sistema funciona 100% offline
   - Apenas rede local é necessária

4. **Monitore durante a prova**
   - Observe terminal para ver resultados chegando
   - Se nenhum chegar, investigue

### ⚠️ Evite Problemas

- ❌ NÃO feche o servidor durante a prova
- ❌ NÃO altere IP depois de gerar HTML
- ❌ NÃO delete JSONs antes de importar
- ❌ NÃO use rede WiFi externa (use hotspot local)

---

## 🎓 RESUMO RÁPIDO

```bash
# 1. Configurar IP uma vez
# Editar: offline-config.js

# 2. No dia da prova:
node server.js                    # Terminal 1 (deixar aberto)

# 3. Gerar HTML via interface web
# 4. Distribuir para Chromebooks
# 5. Aplicar prova

# 6. Depois da prova:
# Ctrl+C no servidor
node importador-lote.js           # Terminal 1

# 7. Importar via interface web
# Área do Professor → Importar → resultados_consolidados.json
```

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verifique logs do servidor no terminal
2. Veja console do navegador (F12)
3. Confira pasta `resultados_recebidos`
4. Teste URL: `http://SEU_IP:3000/status`

---

**✨ Sistema pronto para produção!**

Última atualização: 2025-09-30