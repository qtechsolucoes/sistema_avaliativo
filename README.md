# 🎓 Sistema de Avaliações com Servidor Local

Sistema de avaliações educacionais otimizado para uso em rede local, com cache inteligente e suporte a conteúdo adaptativo.

## ⚡ Início Rápido

### Passo 1: Instalar dependências
```bash
npm install
```

### Passo 2: Configurar credenciais
Crie um arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### Passo 3: Iniciar o servidor
```bash
npm start
```
ou execute:
```bash
INICIAR.bat
```

### Passo 4: Acessar nos Chromebooks
Acesse `http://192.168.5.1:8000` nos dispositivos conectados à sua rede.

---

## 🌟 Principais Funcionalidades

### ✅ Servidor Local com Cache
- **Carregamento único:** Dados baixados do Supabase apenas uma vez
- **Cache em memória:** Acesso instantâneo para todos os alunos
- **Economia de dados:** Não requer internet individual em cada dispositivo
- **Correção automática:** Filtra questões pelo ano correto

### 📝 Sistema de Avaliações
- Interface intuitiva para alunos
- Questões de múltipla escolha
- Embaralhamento automático de questões e alternativas
- Timer por questão (mínimo de 3 minutos)
- Feedback visual instantâneo

### ♿ Suporte a Conteúdo Adaptativo
- Textos simplificados para TEA, TDAH e Down
- Questões adaptadas por nível de dificuldade
- Jogos educativos interativos
- Feedback personalizado

### 🔒 Bloqueio de Dispositivos
- Impede que alunos refaçam a prova
- Controle centralizado de submissões
- Desbloqueio via senha administrativa

---

## 📁 Estrutura do Projeto

```
sistema_avaliativo/
├── server.js                    # Servidor Node.js com cache
├── index.html                   # Interface principal
├── INICIAR.bat                  # Script de inicialização
├── LIBERAR_FIREWALL.bat         # Configuração do firewall
├── GUIA_COMPLETO.md             # Documentação completa
├── src/
│   ├── main.js                  # Ponto de entrada
│   ├── quiz.js                  # Lógica da avaliação
│   ├── services/
│   │   ├── localServerClient.js # Cliente para API local
│   │   ├── dataService.js       # Serviço unificado de dados
│   │   └── supabaseClient.js    # Cliente Supabase (fallback)
│   ├── adaptive/                # Sistema de conteúdo adaptativo
│   └── utils/                   # Utilitários diversos
└── package.json                 # Dependências
```

---

## 🔧 Modos de Operação

### 1. Servidor Local (RECOMENDADO)
```bash
npm start
```
- ✅ Dados em cache
- ✅ Um único download do banco
- ✅ Acesso rápido para todos
- ✅ Filtros automáticos de qualidade

### 2. Modo Direto
```bash
npm run dev
```
- ⚠️ Cada aluno acessa o Supabase
- ⚠️ Requer internet em todos os dispositivos

---

## 🐛 Solução de Problemas

### Questões incorretas na prova
**Solução:** O servidor agora filtra automaticamente questões pelo ano correto.

### Chromebooks não conseguem acessar
1. Execute `LIBERAR_FIREWALL.bat`
2. Verifique se todos estão na mesma rede WiFi
3. Teste: `http://192.168.5.1:8000/api/status`

### Cache desatualizado
Reinicie o servidor com `npm start` para recarregar dados.

---

## 📊 Monitoramento

### Ver status do servidor
Acesse: `http://192.168.5.1:8000/api/status`

Resposta:
```json
{
  "status": "online",
  "cacheReady": true,
  "lastUpdate": "2025-10-02T12:00:00.000Z",
  "cachedData": {
    "classes": 12,
    "students": 350,
    "assessments": 6
  }
}
```

---

## 🔐 Segurança

- ✅ Cache apenas em memória (não persiste em disco)
- ✅ Credenciais Supabase ficam no servidor
- ✅ Chromebooks não têm acesso direto ao banco
- ✅ Bloqueio automático após conclusão da prova

---

## 📦 Dependências

- **Node.js** ≥ 14.0.0
- **express** - Servidor HTTP
- **@supabase/supabase-js** - Cliente Supabase
- **cors** - Permite requisições cross-origin
- **dotenv** - Carrega variáveis de ambiente

---

## 🎯 Benefícios

| Característica | Antes | Agora |
|---|---|---|
| Carregamento do banco | Por aluno | Uma única vez |
| Questões incorretas | Podem aparecer | Filtradas automaticamente |
| Dependência de internet | Todos os dispositivos | Apenas o servidor |
| Performance | Variável | Consistente e rápida |

---

## 📝 Licença

MIT License - Uso livre para fins educacionais

---

## 🆘 Suporte

Para dúvidas ou problemas:
1. Consulte `GUIA_COMPLETO.md`
2. Verifique os logs do servidor no terminal
3. Teste a rota `/api/status` para diagnóstico

---

**Versão:** 2.1.0
**Última Atualização:** Outubro 2025
**Desenvolvido para otimizar a aplicação de avaliações em ambientes educacionais** 🎓
