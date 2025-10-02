# 📡 Guia: Melhorar WiFi na Sala de Aula

## ❌ Problema Identificado

**Sintomas:**
- Chromebooks não conseguem se conectar
- Sinal fraco em partes da sala
- Erro "Unknown network"
- Conexão cai frequentemente

**Causa Provável:**
- Potência WiFi insuficiente do notebook
- Interferência de outras redes
- Obstáculos físicos (paredes, metal)
- Muitos dispositivos tentando conectar ao mesmo tempo

---

## ✅ Soluções (em ordem de eficácia)

### **🥇 Solução 1: Cabo de Rede (MAIS CONFIÁVEL)**

#### **O que você precisa:**
- 1 Switch/Hub Ethernet (8-16 portas) - R$ 50-150
- Cabos de rede (30 cabos curtos) - R$ 3-5 cada

#### **Como configurar:**

1. **Conecte o switch ao seu PC:**
   ```
   PC Servidor [Ethernet] ──→ Switch ──→ 30 Chromebooks
   ```

2. **Ative compartilhamento de rede:**
   - Windows: Configurações → Rede → Propriedades
   - Ethernet → Compartilhamento → ✓ Permitir
   - Selecione a conexão: "Ethernet"

3. **Configure IP estático no PC:**
   - IP: `192.168.137.1`
   - Máscara: `255.255.255.0`

4. **Chromebooks acessam:**
   ```
   http://192.168.137.1:8000
   ```

**Vantagens:**
- ✅ 100% estável e confiável
- ✅ Velocidade máxima (1 Gbps)
- ✅ Sem interferência
- ✅ Todos conectam simultaneamente
- ✅ Zero problemas de sinal

**Desvantagens:**
- ❌ Custo inicial (R$ 200-300)
- ❌ Cabos pela sala

---

### **🥈 Solução 2: Melhorar WiFi Existente (SEM CUSTO)**

#### **A. Posicionamento do Servidor (PC/Notebook)**

**✅ FAÇA:**
- Coloque no **CENTRO da sala** (não em canto)
- **ELEVADO** (mesa alta, estante) - altura = alcance
- **Longe de paredes** (especialmente metal/concreto)
- **Longe de micro-ondas, geladeiras** (interferem no sinal)
- **Antena vertical** (se tiver antena externa)

**❌ NÃO FAÇA:**
- Canto da sala
- Dentro de armário/gaveta
- Atrás de monitor grande
- Perto de muitas paredes

#### **B. Configuração do MyPublicWiFi**

1. **Abra MyPublicWiFi como Administrador**

2. **Configure:**
   ```
   Network Name (SSID): Sala_Aula
   Password: prova2025

   [Avançado]
   Canal: 1, 6 ou 11 (teste qual funciona melhor)
   Modo: 802.11n (mais rápido)
   Largura de banda: 40MHz
   Potência: Máxima (100%)
   ```

3. **Execute o script de otimização:**
   ```
   MELHORAR_WIFI.bat
   (Clique direito → Executar como Administrador)
   ```

#### **C. Teste de Canal WiFi**

Use o **WiFi Analyzer** (app gratuito no celular) para ver qual canal está menos ocupado:

- **Canal 1:** Menos interferência geralmente
- **Canal 6:** Padrão (mais ocupado)
- **Canal 11:** Boa alternativa

**Como mudar o canal no MyPublicWiFi:**
1. Parar rede atual
2. Settings → Channel → Escolher 1, 6 ou 11
3. Restart Network

#### **D. Reduzir Interferência**

**Desligue durante a prova:**
- ✅ Bluetooth do PC (se não usar)
- ✅ Outros WiFis próximos (peça aos colegas)
- ✅ Roteadores próximos (se possível)

**Afaste da área:**
- ❌ Micro-ondas
- ❌ Telefones sem fio
- ❌ Câmeras wireless
- ❌ Caixas de som Bluetooth

---

### **🥉 Solução 3: Roteador Externo (CUSTO BAIXO)**

#### **O que comprar:**
- Roteador WiFi básico - R$ 80-150
- TP-Link TL-WR841N ou similar

#### **Como configurar:**

1. **Conecte:**
   ```
   PC Servidor [Ethernet] ──→ Roteador ──→ WiFi para Chromebooks
   ```

2. **Configure roteador:**
   - IP: `192.168.5.1`
   - DHCP: Ativado (192.168.5.10 - 192.168.5.100)
   - Canal: 1, 6 ou 11
   - Potência: Máxima

3. **Chromebooks acessam:**
   ```
   http://192.168.5.1:8000
   ```

**Vantagens:**
- ✅ Sinal mais forte que notebook
- ✅ Alcance maior (10-20 metros)
- ✅ Mais estável
- ✅ Custo baixo

---

### **🏅 Solução 4: Repetidor WiFi (CUSTO MUITO BAIXO)**

#### **O que comprar:**
- Repetidor WiFi - R$ 50-100

#### **Como usar:**
1. Configure repetidor para ampliar rede do MyPublicWiFi
2. Posicione no meio da sala
3. Chromebooks conectam no repetidor

**Vantagem:** Amplia alcance
**Desvantagem:** Pode reduzir velocidade pela metade

---

## 🚀 Configuração Passo a Passo (WiFi)

### **1. Antes da Prova (Preparação):**

```bash
# No PC Servidor:
1. Execute: MELHORAR_WIFI.bat (como Admin)
2. Abra MyPublicWiFi (como Admin)
3. Configure:
   - SSID: Sala_Aula
   - Senha: prova2025
   - Canal: 1, 6 ou 11
   - Modo: 802.11n
4. Start Hotspot
5. Execute: LIBERAR_FIREWALL.bat
6. Execute: npm start
7. Aguarde: "✅ CACHE PRONTO!"
```

### **2. Posicione o Servidor:**

```
┌─────────────────────────────────────┐
│                                     │
│  Alunos    Alunos    Alunos        │
│    ↓         ↓         ↓           │
│   🖥️        🖥️        🖥️           │
│                                     │
│              📡 [PC Servidor]       │ ← Centro, elevado
│            (Mesa alta)              │
│                                     │
│  Alunos    Alunos    Alunos        │
│    ↓         ↓         ↓           │
│   🖥️        🖥️        🖥️           │
│                                     │
└─────────────────────────────────────┘
```

### **3. Conectar Chromebooks (em lotes):**

**⚠️ NÃO conecte todos de uma vez!**

```
Grupo 1 (10 alunos):
1. Conectar WiFi: "Sala_Aula"
2. Senha: prova2025
3. Acessar: http://192.168.5.1:8000
4. Fazer login
5. Aguardar aparecer a tela de prova

Grupo 2 (10 alunos):
[Repetir processo]

Grupo 3 (10 alunos):
[Repetir processo]
```

**Conectar em grupos evita:**
- ✅ Sobrecarga do WiFi
- ✅ Conflitos de DHCP
- ✅ Timeouts de conexão

---

## 🔧 Troubleshooting

### **Problema: "Unknown network"**

**Causas:**
- IP duplicado
- DHCP desabilitado
- Cache DNS

**Solução:**
```bash
# No Chromebook:
1. Desconectar WiFi
2. Esquecer rede "Sala_Aula"
3. Reiniciar Chromebook
4. Conectar novamente
```

### **Problema: Sinal fraco em partes da sala**

**Solução:**
1. Mova PC para centro da sala
2. Eleve PC (mesa alta, cadeira)
3. Use roteador externo
4. Agrupe alunos mais perto do servidor

### **Problema: Muitos não conseguem conectar**

**Solução:**
```bash
# Aumentar limite de conexões MyPublicWiFi:
1. MyPublicWiFi → Settings
2. Max Clients: 50
3. Restart Network
```

### **Problema: Conexão cai durante a prova**

**Causas:**
- Interferência
- Economia de energia WiFi

**Solução:**
```bash
# Desabilitar economia de energia:
1. Painel de Controle → Energia
2. Plano atual → Configurações
3. WiFi → Economia: Desabilitada
4. Execute: MELHORAR_WIFI.bat
```

---

## 📊 Comparação de Soluções

| Solução | Custo | Estabilidade | Dificuldade | Alcance |
|---------|-------|--------------|-------------|---------|
| **Cabo Ethernet** | R$ 250 | ⭐⭐⭐⭐⭐ | Fácil | Ilimitado |
| **Roteador WiFi** | R$ 120 | ⭐⭐⭐⭐ | Fácil | Muito bom |
| **WiFi Otimizado** | R$ 0 | ⭐⭐⭐ | Fácil | Médio |
| **Repetidor WiFi** | R$ 70 | ⭐⭐⭐ | Fácil | Bom |
| **MyPublicWiFi puro** | R$ 0 | ⭐⭐ | Fácil | Ruim |

---

## ✅ Recomendação Final

### **Para 30 alunos em sala pequena:**

**1ª Escolha:** Cabo de Rede (Switch)
- 100% confiável
- Vale o investimento

**2ª Escolha:** Roteador WiFi + PC no centro
- Boa relação custo/benefício
- Muito mais estável que MyPublicWiFi

**3ª Escolha:** MyPublicWiFi otimizado + posicionamento correto
- Grátis
- Funciona se sala for pequena (6x6m)

---

## 🎯 Checklist Pré-Prova

```
Setup WiFi:
□ PC no centro da sala, elevado
□ MyPublicWiFi configurado (Canal 1/6/11)
□ Script MELHORAR_WIFI.bat executado
□ Firewall liberado (LIBERAR_FIREWALL.bat)
□ Servidor rodando (npm start)
□ Cache pronto (✅ CACHE PRONTO!)

Teste:
□ 1 Chromebook conecta com sucesso
□ Acessa http://192.168.5.1:8000
□ Faz login
□ Carrega avaliação

Conectar alunos:
□ Grupo 1: 10 alunos
□ Grupo 2: 10 alunos
□ Grupo 3: 10 alunos
□ Todos conectados? Iniciar prova!
```

---

**Qualquer dúvida, consulte este guia ou teste as soluções com antecedência!** 📡✅
