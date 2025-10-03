# 📂 Estrutura Organizada do Projeto

## 📁 Diretórios Principais

### `/` (Raiz)
Arquivos essenciais para execução e deploy:
- `server.js` - Servidor Node.js com cache
- `index.html` - Interface principal da aplicação
- `package.json` - Dependências do projeto
- `vercel.json` - Configuração para deploy no Vercel
- `netlify.toml` - Configuração para deploy no Netlify
- `.env` - Variáveis de ambiente (não commitado)
- `README.md` - Documentação principal

### `/src` - Código Fonte
```
src/
├── main.js                      # Ponto de entrada principal
├── quiz.js                      # Lógica da avaliação
├── config.js                    # Configurações (hardcoded fallback)
├── services/                    # Serviços de dados
│   ├── localServerClient.js     # Cliente da API local
│   ├── dataService.js           # Serviço unificado
│   └── supabaseClient.js        # Cliente Supabase
├── adaptive/                    # Sistema de conteúdo adaptativo
│   ├── adaptiveContent.js       # Conteúdo adaptado
│   ├── adaptiveGames.js         # Jogos educativos
│   └── adaptiveQuestions.js     # Questões adaptadas
└── utils/                       # Utilitários
    ├── timer.js                 # Timer de questões
    └── shuffle.js               # Embaralhamento
```

### `/styles` - Estilos CSS
```
styles/
└── main.css                     # Estilos principais
```

### `/config` - Configurações
```
config/
├── .env.example                 # Exemplo de variáveis de ambiente
├── .env.vercel                  # Instruções para Vercel
├── vercel.json                  # Config Vercel (cópia)
├── netlify.toml                 # Config Netlify (cópia)
└── _headers                     # Headers HTTP customizados
```

### `/tools` - Ferramentas Utilitárias
```
tools/
├── INICIAR.bat                  # Script de inicialização Windows
├── LIBERAR_FIREWALL.bat         # Libera firewall para rede local
├── MELHORAR_WIFI.bat            # Otimiza WiFi Windows
├── importar.html                # Interface de importação em lote
├── gerar-hash-senha.html        # Gerador de hash SHA-256
└── SENHAS.txt                   # Senhas de administração
```

### `/docs` - Documentação
```
docs/
├── deploy/                      # Guias de Deploy
│   ├── DEPLOY_VERCEL.md         # Deploy no Vercel
│   ├── DEPLOY_NETLIFY.md        # Deploy no Netlify (básico)
│   └── GUIA_DEPLOY_NETLIFY.md   # Deploy no Netlify (completo)
├── setup/                       # Configuração Inicial
│   ├── CONFIGURAR_RLS_SUPABASE.md  # Segurança Supabase
│   ├── GUIA_WIFI_SALA.md        # Configurar WiFi na sala
│   └── SOLUCAO_RAPIDA_WIFI.txt  # Dicas rápidas de WiFi
├── CAPACIDADE_SERVIDOR.md       # Limites e capacidade
├── CHANGELOG.md                 # Histórico de mudanças
├── FUNCIONAMENTO_TIMER.md       # Como funciona o timer
├── GUIA_COMPLETO.md             # Documentação completa
└── SINCRONIZAR_OFFLINE.md       # Modo offline
```

### `/database` - Scripts SQL
```
database/
└── *.sql                        # Scripts de criação de tabelas
```

### `/scripts` - Scripts auxiliares
```
scripts/
└── *.js                         # Scripts de manutenção
```

### `/assets` - Recursos estáticos
```
assets/
└── images/                      # Imagens do projeto
```

### `/public` - Arquivos públicos
```
public/
└── *.json                       # Dados estáticos
```

---

## 🔒 Arquivos Ignorados (.gitignore)

### Sensíveis (nunca commitados)
- `.env`
- `.env.local`
- `.env.production`
- `config/.env*`

### Dependências e Build
- `node_modules/`
- `dist/`
- `build/`
- `.vercel/`
- `.netlify/`

### Temporários
- `*.log`
- `*.tmp`
- `prova_aluno/`
- `resultados_recebidos/`

---

## 🚀 Arquivos Essenciais para Deploy

### Vercel
- ✅ `vercel.json` (raiz)
- ✅ `server.js`
- ✅ `package.json`
- ✅ Variáveis de ambiente configuradas

### Netlify
- ✅ `netlify.toml` (raiz)
- ✅ `index.html`
- ✅ Arquivos estáticos (src/, styles/, etc)

---

## 📋 Resumo de Mudanças

### ✅ Organizado
- ✅ Documentações movidas para `/docs`
- ✅ Configurações movidas para `/config`
- ✅ Ferramentas movidas para `/tools`
- ✅ README atualizado com novos caminhos

### ❌ Removido
- ❌ `prova_aluno/` (vazia)
- ❌ `resultados_recebidos/` (vazia)
- ❌ Arquivos duplicados de documentação

### 📝 Mantido na Raiz
- `server.js` - Necessário para execução
- `index.html` - Ponto de entrada web
- `package.json` - Essencial Node.js
- `vercel.json` - Deploy requer na raiz
- `netlify.toml` - Deploy requer na raiz

---

**Estrutura otimizada e organizada! 🎉**
