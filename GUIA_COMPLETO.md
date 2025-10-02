# Sistema de Avaliações - Guia Completo

## 🚀 Inicialização Rápida

### Opção 1: Servidor Local com Cache (RECOMENDADO)
```bash
npm start
```
- Carrega dados do Supabase **uma única vez**
- Serve dados em cache na rede local (192.168.5.1:8000)
- Chromebooks acessam sem precisar de internet individual
- Submissões são enviadas automaticamente ao Supabase

### Opção 2: Modo Direto (cada aluno baixa do Supabase)
```bash
npm run dev
```
- Cada Chromebook acessa o Supabase diretamente
- Requer que todos os dispositivos tenham acesso à internet

---

## 📋 Pré-requisitos

1. **Node.js** instalado (versão 14 ou superior)
2. **Arquivo .env** configurado com credenciais do Supabase:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima
   ```

---

## 🔧 Configuração Inicial

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   - Copie `.env.example` para `.env`
   - Adicione suas credenciais do Supabase

3. **Configurar firewall (Windows):**
   ```bash
   LIBERAR_FIREWALL.bat
   ```

---

## 🌐 Como Usar na Rede Local

### No Computador Servidor (Professor):

1. Inicie o servidor:
   ```bash
   npm start
   ```

2. Aguarde a mensagem:
   ```
   ✅ CACHE PRONTO! Dados disponíveis na rede local.
   🚀 SERVIDOR RODANDO NA REDE LOCAL!
   📍 URL: http://192.168.5.1:8000
   ```

3. Compartilhe sua rede WiFi com os Chromebooks

### Nos Chromebooks (Alunos):

1. Conecte ao WiFi do professor
2. Acesse: `http://192.168.5.1:8000`
3. Faça login e realize a prova
4. Resultados são enviados automaticamente

---

## 🐛 Solução de Problemas

### Questões incorretas aparecem na prova
**Causa:** Questões cadastradas no ano errado no banco de dados
**Solução:** O servidor agora filtra automaticamente questões pelo ano correto

### Chromebooks não conseguem acessar
1. Verifique se o firewall está liberado
2. Confirme que todos estão na mesma rede
3. Teste acessando `http://192.168.5.1:8000/api/status`

### Cache desatualizado
**Recarregue o cache manualmente:**
```bash
curl -X POST http://192.168.5.1:8000/api/reload-cache
```

---

## 📊 Status do Sistema

Acesse `http://192.168.5.1:8000/api/status` para ver:
- Status do cache
- Quantidade de dados carregados
- Última atualização

---

## 🔐 Segurança

- Dados são cacheados apenas em memória (não persistidos em disco)
- Credenciais do Supabase ficam apenas no servidor
- Chromebooks não precisam de acesso direto ao Supabase

---

## 📝 Estrutura do Projeto

```
sistema_avaliativo/
├── server.js                 # Servidor Node.js com cache
├── index.html                # Interface do aluno
├── src/
│   ├── services/
│   │   ├── localServerClient.js   # Cliente para API local
│   │   └── dataService.js         # Serviço unificado de dados
│   └── ...
├── .env                      # Credenciais (não compartilhar!)
└── package.json              # Dependências do projeto
```

---

## 🎯 Benefícios do Modo Cache

✅ **Performance:** Dados carregados apenas uma vez
✅ **Confiabilidade:** Não depende de internet em cada dispositivo
✅ **Economia:** Reduz uso de dados móveis
✅ **Simplicidade:** Um único ponto de acesso ao banco
✅ **Correção Automática:** Filtra questões pelo ano correto

---

## 💡 Dicas

- Mantenha o servidor rodando durante toda a aplicação das provas
- Recarregue o cache se houver alterações no banco de dados
- Use `npm start` para produção (modo otimizado)
- Use `npm run dev` apenas para testes individuais

---

## 📞 Suporte

Para problemas ou dúvidas, verifique os logs do servidor no terminal.
