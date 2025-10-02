# ⏱️ Como Funciona o Timer de 3 Minutos

## 📋 Regras do Sistema

### ✅ O que o aluno PODE fazer:

1. **Ler o texto** a qualquer momento
2. **Marcar alternativa** (responder) a qualquer momento
3. **Ver feedback** (correto/incorreto) imediatamente após responder

### ❌ O que o aluno NÃO PODE fazer:

1. **Avançar para próxima questão** antes de completar 3 minutos
2. **Responder sem ler o texto** até o final (90%)

---

## 🔄 Fluxo Completo de uma Questão

```
1. Questão carrega
   └─> Timer de 3min inicia (canto superior direito)
   └─> Texto de apoio aparece
   └─> Alternativas aparecem
   └─> Botão "Próxima" está ESCONDIDO

2. Aluno rola o texto
   └─> Sistema detecta se chegou a 90% do final
   └─> Mostra: "✅ Texto lido! Pode responder"
   └─> Flag: hasReadText = true

3. Aluno clica em uma alternativa
   └─> Sistema verifica: hasReadText?
       ├─> NÃO: Mostra modal "📖 Leia o texto todo!"
       └─> SIM: Processa resposta
           └─> Desabilita todas alternativas
           └─> Mostra feedback (verde/vermelho)
           └─> Botão "Próxima" APARECE
           └─> Verifica timer:
               ├─> Ainda não passou 3min:
               │   └─> Botão fica BLOQUEADO (disabled)
               │   └─> Mostra: "⏳ Aguarde completar 3 minutos"
               └─> Já passou 3min:
                   └─> Botão fica LIBERADO (enabled)
                   └─> Aluno pode clicar e avançar

4. Timer completa 3 minutos
   └─> Som de desbloqueio toca
   └─> Timer fica verde
   └─> Se já respondeu:
       └─> Botão "Próxima" é DESBLOQUEADO
   └─> Se ainda não respondeu:
       └─> Nada acontece (aguarda resposta)

5. Aluno clica em "Próxima"
   └─> Carrega próxima questão
   └─> Repete o processo
```

---

## 🎯 Cenários Possíveis

### **Cenário 1: Aluno responde RÁPIDO (antes de 3min)**

```
00:30 - Aluno lê o texto
00:45 - ✅ Texto lido (chegou a 90%)
01:00 - Aluno marca alternativa
       └─> Feedback: "Resposta Correta!"
       └─> Botão "Próxima" APARECE mas fica BLOQUEADO
       └─> Mensagem: "⏳ Aguarde completar 3 minutos"
02:00 - Aluno espera...
03:00 - ✅ Timer completa!
       └─> Som de desbloqueio
       └─> Botão "Próxima" é LIBERADO
       └─> Aluno pode avançar
```

### **Cenário 2: Aluno responde DEVAGAR (depois de 3min)**

```
00:30 - Aluno lê o texto
01:00 - ✅ Texto lido
02:00 - Aluno pensa...
03:00 - ✅ Timer completa!
       └─> Som de desbloqueio
03:30 - Aluno finalmente marca alternativa
       └─> Feedback: "Resposta Incorreta"
       └─> Botão "Próxima" APARECE e já está LIBERADO
       └─> Aluno pode avançar IMEDIATAMENTE
```

### **Cenário 3: Aluno tenta responder SEM LER**

```
00:15 - Aluno clica em alternativa SEM rolar o texto
       └─> Sistema detecta: hasReadText = false
       └─> Modal aparece: "📖 Leia o texto todo!"
       └─> Som de alerta
       └─> Texto é destacado com borda amarela pulsante
       └─> Resposta NÃO é processada
00:45 - Aluno rola o texto até o final
       └─> ✅ Texto lido!
       └─> Agora pode responder normalmente
```

### **Cenário 4: Texto CURTO (sem scroll)**

```
00:00 - Questão carrega com texto curto
       └─> Sistema detecta: não precisa scroll
       └─> Marca automaticamente: hasReadText = true
       └─> Log: "Texto curto - marcado como lido"
00:15 - Aluno marca alternativa
       └─> Resposta processada normalmente
       └─> Aguarda 3min para desbloquear botão
```

---

## 🎨 Indicadores Visuais

### Timer (Canto Superior Direito)

```
┌─────────────────┐
│ 🔒    02:45     │  ← Vermelho (aguardando)
│ Aguarde 3min   │
│ ████████░░░░░░  │  ← Barra de progresso
└─────────────────┘

Aos 2min30s:
┌─────────────────┐
│ ⏰    00:30     │  ← Amarelo (faltando 30s)
│ Aguarde 3min   │
│ ████████████░░  │
└─────────────────┘

Aos 3min:
┌─────────────────┐
│ ✅    00:00     │  ← Verde (liberado)
│ Pode avançar!  │
│ ██████████████  │
└─────────────────┘
```

### Validação de Leitura

**Quando lê até o final:**
```
┌─────────────────────────────────┐
│ ✅ Texto lido! Pode responder   │ ← Aparece no topo direito
└─────────────────────────────────┘
```

**Quando tenta responder sem ler:**
```
╔═══════════════════════════════╗
║         📖                    ║
║   Leia o texto todo!          ║
║                               ║
║ Você precisa ler o texto até  ║
║ o final antes de responder.   ║
║                               ║
║     [ Entendi! ]              ║
╚═══════════════════════════════╝
```

**Quando responde antes dos 3min:**
```
┌─────────────────────────────────────────┐
│ ⏳ Aguarde completar 3 minutos para     │ ← Aparece no rodapé
│    avançar                              │
└─────────────────────────────────────────┘
```

---

## 🔊 Sons do Sistema

1. **Faltando 30s:** Bip de aviso (800Hz)
2. **Timer completo:** Dois bips ascendentes (C5 → E5)
3. **Tentou responder sem ler:** Bip de alerta (600Hz)

---

## 💻 Implementação Técnica

### Arquivos Modificados:

1. **`src/quiz.js`**
   - `loadQuestion()`: Inicia timer e validação de leitura
   - `selectAnswer()`: Verifica timer antes de liberar botão
   - `initializeTextScrollControls()`: Detecta leitura completa

2. **`src/utils/questionTimer.js`**
   - Gerencia timer visual de 3 minutos
   - Callback `onUnblock()` quando completa

3. **`styles/main.css`**
   - Animações: `fadeIn`, `fadeOut`, `bounceIn`, `slideInRight`, `slideUp`, `pulse`

### Estados do Sistema:

```javascript
// Estado global (src/state.js)
state = {
    hasReadText: false,      // Se leu o texto até 90%
    hasAnswered: false,      // Se já respondeu esta questão
    questionStartTime: Date, // Timestamp de início
    // ... outros estados
}

// Timer (src/utils/questionTimer.js)
currentTimer = {
    elapsedTime: 0,          // Tempo decorrido em segundos
    isBlocked: true,         // Se ainda está bloqueado
    minTime: 180,            // 3 minutos em segundos
    // ... outras propriedades
}
```

---

## ✅ Checklist de Validações

Antes de avançar, o sistema verifica:

- [x] Aluno leu o texto até 90% do final
- [x] Aluno respondeu a questão (marcou alternativa)
- [x] Timer de 3 minutos completou

Se TODAS as condições forem verdadeiras:
- ✅ Botão "Próxima" fica **VISÍVEL** e **HABILITADO**

Se ALGUMA condição for falsa:
- ❌ Botão continua bloqueado ou escondido

---

## 🎯 Objetivo Pedagógico

Este sistema garante que:

1. **Aluno leia o texto completo** antes de responder
2. **Aluno pense por pelo menos 3 minutos** em cada questão
3. **Não haja respostas impulsivas** sem reflexão
4. **Tempo de prova seja adequado** (10 questões × 3min = 30 minutos mínimos)

---

**Implementado na versão 2.1.0 - Outubro 2025** 🎓
