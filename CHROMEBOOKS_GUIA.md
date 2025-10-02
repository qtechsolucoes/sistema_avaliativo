# 📱 Guia Completo - Sistema em Chromebooks

## 🎯 Visão Geral

O sistema funciona em Chromebooks de **duas formas**:

### 1. **Modo Online** (com internet)
- Chromebooks acessam o sistema via navegador
- Resultados salvos automaticamente no Supabase
- Sem necessidade de configuração especial

### 2. **Modo Offline** (sem internet - rede local)
- Computador do professor vira servidor local
- Chromebooks se conectam via Wi-Fi/Hotspot
- Resultados baixados como JSON

---

## 🌐 MODO ONLINE (Com Internet)

### Requisitos:
- ✅ Internet funcionando
- ✅ Supabase configurado
- ✅ Sistema hospedado online

### Passos:

#### Para o Professor:

1. **Hospedar o Sistema Online**

   **Opção A - Vercel (Grátis e Fácil):**
   ```bash
   # 1. Instale o Vercel CLI
   npm install -g vercel

   # 2. Na pasta do projeto, execute:
   vercel

   # 3. Siga as instruções
   # 4. Receberá um link: https://seu-projeto.vercel.app
   ```

   **Opção B - GitHub Pages:**
   ```bash
   # 1. Suba o projeto para GitHub
   # 2. Vá em Settings → Pages
   # 3. Escolha branch main
   # 4. Link gerado: https://seu-usuario.github.io/projeto
   ```

   **Opção C - Netlify:**
   ```bash
   # 1. Arraste a pasta do projeto em netlify.com/drop
   # 2. Link gerado automaticamente
   ```

2. **Compartilhe o Link**
   - Anote o link gerado (ex: `https://sistema-avaliacoes.vercel.app`)
   - Envie para os alunos ou escreva no quadro

#### Para os Alunos:

1. Abra o Chrome no Chromebook
2. Digite o link fornecido pelo professor
3. Faça login (Ano → Turma → Nome)
4. Realize a prova normalmente
5. ✅ Resultado salvo automaticamente no Supabase

---

## 🔌 MODO OFFLINE (Sem Internet - Rede Local)

### Requisitos:
- ✅ Computador do professor (Windows/Mac/Linux)
- ✅ Python instalado no computador do professor
- ✅ Chromebooks com Wi-Fi habilitado
- ✅ Todos na mesma rede (Hotspot ou Wi-Fi local)

### Configuração Inicial (Fazer UMA vez):

#### PASSO 1: Descobrir o IP do Computador do Professor

**Windows:**
```cmd
1. Abra o Prompt de Comando (CMD)
2. Digite: ipconfig
3. Procure por "Adaptador de Rede sem Fio"
4. Anote o "Endereço IPv4" (ex: 192.168.137.1)
```

**Mac/Linux:**
```bash
1. Abra o Terminal
2. Digite: ifconfig (Mac) ou ip addr (Linux)
3. Procure por "inet" no adaptador Wi-Fi
4. Anote o IP (ex: 192.168.1.100)
```

#### PASSO 2: Configurar o IP no Sistema

1. Abra o arquivo: `scripts/offline-config.js`
2. Localize a linha:
   ```javascript
   serverIP: "192.168.137.1",  // ⬅️ ALTERE AQUI!
   ```
3. Substitua pelo IP do seu computador
4. Salve o arquivo

#### PASSO 3: Criar Hotspot (se não tiver Wi-Fi)

**Windows 10/11:**
```
1. Configurações → Rede e Internet → Hotspot Móvel
2. Ative "Compartilhar minha conexão de Internet"
3. Anote o Nome da Rede e Senha
4. Seu IP será automaticamente: 192.168.137.1
```

**Mac:**
```
1. Preferências do Sistema → Compartilhamento
2. Marque "Compartilhamento de Internet"
3. Escolha compartilhar de: Ethernet/Wi-Fi
4. Para: Wi-Fi
5. Clique em "Opções Wi-Fi" para definir senha
```

---

## 🚀 Usando no Dia da Prova (Modo Offline)

### No Computador do Professor:

1. **Inicie o Servidor Local**
   ```bash
   # Método 1: Duplo clique
   INICIAR_SISTEMA.bat

   # Método 2: Terminal
   npm start

   # Método 3: Python direto
   python -m http.server 3000
   ```

2. **Confirme o Servidor**
   - Deve aparecer: "Servidor rodando em http://0.0.0.0:3000"
   - Teste no seu navegador: `http://localhost:3000`

3. **Anote o Link para os Alunos**
   ```
   http://SEU-IP:3000

   Exemplo: http://192.168.137.1:3000
   ```

4. **Escreva o Link no Quadro ou Compartilhe**

### Nos Chromebooks dos Alunos:

1. **Conectar na Rede**
   - Se Hotspot: Conecte no Wi-Fi do professor
   - Se Wi-Fi local: Já deve estar conectado

2. **Abrir o Navegador**
   - Abra o Chrome
   - Digite o link fornecido: `http://192.168.137.1:3000`
   - ⚠️ Use `http://` não `https://`

3. **Fazer Login**
   - Escolha Ano
   - Escolha Turma
   - Digite Nome
   - Clique em "Iniciar Avaliação"

4. **Realizar a Prova**
   - Responda as 10 questões
   - Aguarde 3 minutos por questão
   - Clique em "Finalizar Avaliação"

5. **Sistema Detecta Offline Automaticamente**
   ```
   🔌 VOCÊ ESTÁ DESCONECTADO
   PROVA EXTRAÍDA COM SUCESSO!

   ✅ Arquivo prova_joao_9A_2025-10-02.json
      baixado automaticamente

   📤 Entregue o arquivo ao professor
   ```

6. **Entregar o Arquivo JSON**
   - Chromebook baixou o arquivo na pasta Downloads
   - Aluno deve enviar ao professor via:
     - Pendrive
     - Google Drive
     - Email
     - Ou qualquer método combinado

### Professor: Importar os Resultados

1. **Receber os Arquivos JSON dos Alunos**
   - Cada aluno tem um arquivo: `prova_nome_turma_data.json`

2. **Importar no Sistema**
   - Acesse: Área do Professor → Sincronizar Resultados
   - Clique em "Importar Resultados"
   - Selecione o arquivo JSON do aluno
   - Sistema importa automaticamente

3. **Importar Vários Arquivos**
   - Repita o processo para cada arquivo
   - Ou use importação em lote (se tiver)

---

## 📊 Fluxograma do Modo Offline

```
┌─────────────────────────────────────────┐
│  PROFESSOR                              │
│  1. Cria Hotspot                        │
│  2. Inicia servidor (npm start)         │
│  3. IP: 192.168.137.1:3000             │
└─────────────────────────────────────────┘
                  │
                  │ Wi-Fi/Hotspot
                  ↓
┌─────────────────────────────────────────┐
│  CHROMEBOOKS (Alunos)                   │
│  1. Conectam no Wi-Fi                   │
│  2. Acessam http://192.168.137.1:3000  │
│  3. Fazem a prova                       │
│  4. JSON baixado automaticamente        │
└─────────────────────────────────────────┘
                  │
                  │ Entrega arquivo
                  ↓
┌─────────────────────────────────────────┐
│  PROFESSOR                              │
│  1. Recebe arquivos JSON                │
│  2. Importa no sistema                  │
│  3. Visualiza no dashboard              │
└─────────────────────────────────────────┘
```

---

## 🔧 Solução de Problemas - Chromebooks

### ❌ "Não consigo acessar o link"

**Causa:** Chromebook não está na mesma rede
**Solução:**
1. Verifique se conectou no Wi-Fi/Hotspot correto
2. Confirme o IP está correto
3. Teste no computador do professor primeiro
4. Certifique-se de usar `http://` não `https://`

### ❌ "Página não carrega"

**Causa:** Servidor não está rodando
**Solução:**
1. Verifique se o servidor está ativo no computador do professor
2. Veja se aparece: "Servidor rodando em..."
3. Reinicie o servidor: Ctrl+C e inicie novamente

### ❌ "Arquivo JSON não baixou"

**Causa:** Download bloqueado ou pasta Downloads cheia
**Solução:**
1. Verifique Downloads do Chrome
2. Limpe arquivos antigos se necessário
3. Tente novamente a prova
4. Alternativamente, dados ficam salvos no navegador

### ❌ "Wi-Fi muito lento"

**Causa:** Muitos dispositivos conectados
**Solução:**
1. Limite 10-15 Chromebooks por vez
2. Use roteador se possível ao invés de Hotspot
3. Desative downloads automáticos desnecessários

### ❌ "Professor não consegue importar JSON"

**Causa:** Arquivo corrompido ou formato errado
**Solução:**
1. Abra o JSON em editor de texto para verificar
2. Confirme que tem: studentId, assessmentId, score
3. Se corrompido, dados podem estar no localStorage do Chromebook

---

## 💡 Dicas e Boas Práticas

### ✅ Antes da Prova:

1. **Teste o Sistema**
   - Faça um teste com 2-3 Chromebooks
   - Confirme que o download do JSON funciona
   - Teste a importação

2. **Prepare os Chromebooks**
   - Limpe a pasta Downloads
   - Feche abas desnecessárias
   - Carregue as baterias

3. **Tenha um Plano B**
   - Anote os IPs alternativos
   - Tenha pendrive para coletar JSONs
   - Prepare provas impressas (emergência)

### ✅ Durante a Prova:

1. **Deixe o Servidor Rodando**
   - Não feche o terminal/CMD
   - Não desligue o computador
   - Não mude de rede Wi-Fi

2. **Monitore os Alunos**
   - Verifique se estão acessando corretamente
   - Confirme que o timer está funcionando
   - Observe o download dos JSONs

3. **Colete os Arquivos**
   - Combine método de entrega antes
   - Nomeie arquivos por aluno se necessário
   - Organize em pastas por turma

### ✅ Depois da Prova:

1. **Importe os Resultados**
   - Faça backup dos JSONs antes
   - Importe um por vez verificando
   - Confira o dashboard

2. **Limpe o Sistema**
   - Remova dados de teste
   - Prepare para próxima turma

---

## 📞 Suporte Rápido

### Atalhos Úteis:

**Descobrir IP rapidamente:**
```bash
# Windows
ipconfig | findstr IPv4

# Mac/Linux
ifconfig | grep inet
```

**Testar conexão entre professor e aluno:**
```bash
# No Chromebook, abra terminal (Ctrl+Alt+T)
ping 192.168.137.1
```

**Ver dispositivos conectados no Hotspot:**
```bash
# Windows: Configurações → Rede → Hotspot → Ver dispositivos
```

---

## 📋 Checklist Rápido - Dia da Prova

### Professor:
- [ ] Computador carregado
- [ ] Python/Node.js instalado
- [ ] IP configurado em offline-config.js
- [ ] Hotspot ativo (ou Wi-Fi configurado)
- [ ] Servidor iniciado (npm start)
- [ ] Link testado no navegador
- [ ] Link escrito no quadro

### Alunos (Chromebooks):
- [ ] Conectados no Wi-Fi/Hotspot
- [ ] Navegador Chrome aberto
- [ ] Link digitado corretamente
- [ ] Login realizado
- [ ] Timer funcionando
- [ ] JSON baixado após finalizar
- [ ] Arquivo entregue ao professor

### Pós-Prova:
- [ ] Todos JSONs coletados
- [ ] Arquivos importados no sistema
- [ ] Dashboard verificado
- [ ] Dados conferidos

---

**Versão:** 2.0.1
**Última Atualização:** Outubro 2025
