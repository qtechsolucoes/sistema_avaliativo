// server.js - Servidor para receber resultados dos Chromebooks via rede local
// Execute: node server.js

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const RESULTS_DIR = path.join(__dirname, 'resultados_recebidos');

// Cria diretório de resultados se não existir
if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
    // Habilita CORS para aceitar requisições dos Chromebooks
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Responde a requisições OPTIONS (preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Endpoint para receber resultados
    if (req.method === 'POST' && req.url === '/submit-result') {
        let body = '';

        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const resultData = JSON.parse(body);

                // Valida dados essenciais
                if (!resultData.studentName || !resultData.grade || !resultData.className) {
                    throw new Error('Dados incompletos');
                }

                // Cria nome do arquivo: Nome_AnoTurma_Timestamp.json
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const safeName = resultData.studentName.replace(/[^a-zA-Z0-9]/g, '_');
                const filename = `${safeName}_${resultData.grade}${resultData.className}_${timestamp}.json`;
                const filepath = path.join(RESULTS_DIR, filename);

                // Salva o arquivo JSON
                fs.writeFileSync(filepath, JSON.stringify(resultData, null, 2));

                console.log(`✅ Resultado recebido: ${filename}`);
                console.log(`   Aluno: ${resultData.studentName} | Turma: ${resultData.grade}º ${resultData.className}`);
                console.log(`   Nota: ${resultData.score}/${resultData.totalQuestions}`);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    message: 'Resultado recebido com sucesso',
                    filename: filename
                }));

            } catch (error) {
                console.error('❌ Erro ao processar resultado:', error.message);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: false,
                    error: error.message
                }));
            }
        });

        return;
    }

    // Endpoint de status (verificar se servidor está ativo)
    if (req.method === 'GET' && req.url === '/status') {
        const totalFiles = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json')).length;

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'online',
            resultados_recebidos: totalFiles,
            pasta: RESULTS_DIR
        }));
        return;
    }

    // Rota padrão
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Servidor de Resultados - Use POST /submit-result');
});

server.listen(PORT, '0.0.0.0', () => {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║     SERVIDOR DE RESULTADOS - SISTEMA AVALIATIVO          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
    console.log(`📡 Endereço para Chromebooks: http://SEU_IP_LOCAL:${PORT}`);
    console.log(`📁 Resultados salvos em: ${RESULTS_DIR}\n`);
    console.log('💡 Dicas:');
    console.log('   1. Descubra seu IP local: ipconfig (Windows) ou ifconfig (Linux/Mac)');
    console.log('   2. Configure o IP no arquivo offline-config.js');
    console.log('   3. Compartilhe internet via MyPublicWiFi');
    console.log('   4. Os Chromebooks enviarão resultados automaticamente\n');
    console.log('⏹  Pressione Ctrl+C para parar o servidor\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
    const totalFiles = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json')).length;
    console.log(`\n\n📊 Total de resultados recebidos: ${totalFiles}`);
    console.log('👋 Servidor encerrado.\n');
    process.exit(0);
});
