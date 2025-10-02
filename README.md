# 📝 Sistema de Avaliações Educacionais

Sistema completo de avaliações online/offline para instituições de ensino.

## ⚠️ IMPORTANTE - COMO INICIAR

**NÃO abra o `index.html` diretamente!** Isso causará erro de conexão com o banco de dados.

### 🚀 Início Rápido (Windows):

1. **Duplo clique em:** `INICIAR_SISTEMA.bat`
2. **Acesse:** http://localhost:8000

### Ou via terminal:
```bash
python -m http.server 8000
```

**📖 Leia:** `COMO_USAR.txt` para instruções detalhadas

## 🚀 Funcionalidades Principais

### Para Alunos
- ✅ **Login por Ano, Turma e Nome** (sem senha)
- ✅ **Avaliações de 10 questões aleatórias** selecionadas do banco
- ✅ **Timer de 3 minutos mínimos** por questão
- ✅ **Modo Online**: Resultados salvos automaticamente no banco de dados
- ✅ **Modo Offline**: Download automático de JSON + salvamento no navegador
- ✅ **Bloqueio automático** após conclusão da prova
- ✅ **Avaliações adaptativas** para alunos com necessidades especiais

### Para Professores
- ✅ **Dashboard completo** com gráficos e estatísticas
- ✅ **Importação de resultados** (JSON individual ou em lote)
- ✅ **Exportação de dados** para backup
- ✅ **Desbloqueio de dispositivos** com senha administrativa
- ✅ **Visualização de desempenho** por turma, aluno e questão

## 📋 Pré-requisitos

- Node.js (v16 ou superior)
- Conta no Supabase (para modo online)
- Navegador moderno (Chrome, Edge, Firefox)

## ⚙️ Configuração

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

### 2. Configurar Banco de Dados (Supabase)

1. Acesse seu projeto no Supabase
2. Execute os scripts SQL na pasta `database/`:
   - `funcao_submit_assessment_corrigida.sql`
3. Importe conteúdo adaptativo (opcional):
   - `adaptive-content-simple.sql` ou
   - `adaptive-content-system.sql`

### 3. Instalar Dependências

```bash
npm install
```

### 4. Iniciar o Servidor

**Desenvolvimento:**
```bash
npm run dev
```

**Produção:**
```bash
npm start
```

O sistema estará disponível em `http://localhost:8000`

## 🔧 Configuração para Chromebooks (Modo Offline)

### IP do Servidor Local

Edite o arquivo `scripts/offline-config.js`:

```javascript
serverIP: "192.168.137.1"  // ⬅️ Altere para o IP do seu computador
```

**Como descobrir seu IP:**

**Windows:**
```cmd
ipconfig
```
Procure por "Adaptador de Rede sem Fio" → "Endereço IPv4"

**Mac/Linux:**
```bash
ifconfig
```

### Iniciar Servidor para Chromebooks

```bash
npm start
```

Os Chromebooks devem acessar: `http://IP-DO-SERVIDOR:3000`

## 📤 Importação de Resultados Offline

O professor pode importar resultados de 3 formas:

1. **JSON Individual** (gerado automaticamente pelo aluno):
   ```json
   {
     "studentName": "João Silva",
     "grade": "9",
     "className": "A",
     "score": 8,
     "totalQuestions": 10,
     ...
   }
   ```

2. **Array de Resultados**:
   ```json
   [
     { "studentId": "...", "score": 8, ... },
     { "studentId": "...", "score": 9, ... }
   ]
   ```

3. **Exportação em Lote** (formato padrão):
   ```json
   {
     "metadata": { "exportDate": "...", "totalResults": 5 },
     "results": [ ... ]
   }
   ```

## 🔒 Segurança

- ✅ Sanitização automática de entradas
- ✅ Proteção contra XSS
- ✅ Validação de dados em todas as camadas
- ✅ Bloqueio de dispositivos após conclusão
- ✅ Senha administrativa para desbloqueio

## 📊 Estrutura do Projeto

```
sistema_avaliativo/
├── src/
│   ├── adaptive/         # Sistema de avaliações adaptativas
│   ├── services/         # Serviços (banco, conectividade, logs)
│   ├── teacher/          # Módulos do professor
│   ├── utils/            # Utilitários (timer, validação, sanitização)
│   ├── main.js           # Arquivo principal
│   ├── quiz.js           # Lógica do quiz
│   ├── login.js          # Lógica de login
│   └── database.js       # Interface com banco de dados
├── scripts/
│   ├── server.js         # Servidor para modo offline
│   └── offline-config.js # Configuração do servidor
├── styles/               # Estilos CSS
├── docs/                 # Documentação técnica
├── database/             # Scripts SQL
└── index.html            # Página principal
```

## 🎮 Funcionalidades Avançadas

### Avaliações Adaptativas

O sistema detecta automaticamente alunos com necessidades especiais e adapta:

- **TEA (Transtorno do Espectro Autista)**: Interface simplificada
- **TDAH**: Elementos visuais dinâmicos
- **Síndrome de Down**: Linguagem simples e reforço positivo
- **Deficiência Intelectual**: Conteúdo gradual
- **Deficiência Visual**: Alto contraste e textos grandes
- **Deficiência Motora**: Botões grandes e tempo extra

### Sistema de Timer

- ⏱️ **3 minutos mínimos** por questão
- 🔒 Botão "Próxima" bloqueado até completar o tempo
- 🔔 Avisos sonoros
- 📊 Barra de progresso visual

### Detecção de Conectividade

O sistema detecta automaticamente se está online ou offline:

- **Online**: Salva direto no Supabase
- **Offline**:
  - Gera arquivo JSON automaticamente
  - Salva backup no localStorage
  - Exibe mensagem clara para o aluno

## 🐛 Resolução de Problemas

### "Erro ao conectar com Supabase"
- Verifique as variáveis de ambiente no `.env`
- Confirme que o projeto Supabase está ativo
- Teste a conexão em: Settings → API → URL e Keys

### "Arquivo JSON não é importado"
- Verifique se o JSON tem `studentId` e `assessmentId`
- Confirme o formato do arquivo
- Veja logs do navegador (F12 → Console)

### "Timer não aparece"
- Limpe o cache do navegador (Ctrl+Shift+Del)
- Verifique se há erros no console
- Recarregue a página (Ctrl+F5)

## 📞 Suporte

Para questões técnicas, consulte a documentação em:
- `docs/INSTRUCOES_PRODUCAO.md`
- `docs/CONFIGURAR_SUPABASE.md`
- `docs/RESUMO_FINAL.md`

## 📄 Licença

Sistema desenvolvido para uso educacional.

---

**Versão:** 2.0.1
**Última Atualização:** Outubro 2025
