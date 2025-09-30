// importador-lote.js - VERSÃO CORRIGIDA E ROBUSTA

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const RESULTS_DIR = path.join(__dirname, 'resultados_recebidos');
const OUTPUT_FILE = path.join(__dirname, 'resultados_consolidados.json');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Valida se os dados da submissão estão completos
 * @param {Object} data - Dados a validar
 * @returns {Object} - {isValid: boolean, errors: string[]}
 */
function validateSubmissionData(data) {
    const errors = [];

    // Campos obrigatórios
    const requiredFields = {
        studentId: 'ID do estudante',
        studentName: 'Nome do estudante',
        grade: 'Ano/série',
        className: 'Nome da turma',
        assessmentId: 'ID da avaliação',
        score: 'Pontuação',
        totalQuestions: 'Total de questões',
        answerLog: 'Log de respostas'
    };

    // Valida presença de campos obrigatórios
    for (const [field, label] of Object.entries(requiredFields)) {
        if (data[field] === undefined || data[field] === null) {
            errors.push(`❌ ${label} (${field}) está ausente`);
        }
    }

    // Validações específicas de tipo e formato
    if (data.score !== undefined && (typeof data.score !== 'number' || data.score < 0)) {
        errors.push(`❌ Score deve ser um número >= 0 (recebido: ${data.score})`);
    }

    if (data.totalQuestions !== undefined && (typeof data.totalQuestions !== 'number' || data.totalQuestions <= 0)) {
        errors.push(`❌ totalQuestions deve ser um número > 0 (recebido: ${data.totalQuestions})`);
    }

    if (data.score !== undefined && data.totalQuestions !== undefined && data.score > data.totalQuestions) {
        errors.push(`❌ Score (${data.score}) não pode ser maior que totalQuestions (${data.totalQuestions})`);
    }

    if (!Array.isArray(data.answerLog)) {
        errors.push(`❌ answerLog deve ser um array (recebido: ${typeof data.answerLog})`);
    } else if (data.answerLog.length !== data.totalQuestions) {
        errors.push(`⚠️ answerLog tem ${data.answerLog.length} respostas mas totalQuestions é ${data.totalQuestions}`);
    }

    // Valida formato de cada resposta no answerLog
    if (Array.isArray(data.answerLog)) {
        data.answerLog.forEach((answer, index) => {
            if (!answer.questionId) {
                errors.push(`❌ Resposta ${index + 1} sem questionId`);
            }
            if (typeof answer.isCorrect !== 'boolean') {
                errors.push(`❌ Resposta ${index + 1} com isCorrect inválido (deve ser boolean)`);
            }
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

async function main() {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║     IMPORTADOR DE LOTE - SISTEMA AVALIATIVO              ║');
    console.log('║     Versão 2.0.1 - Validação Robusta                     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    // Verifica se a pasta existe
    if (!fs.existsSync(RESULTS_DIR)) {
        console.error(`❌ Pasta não encontrada: ${RESULTS_DIR}`);
        console.log('💡 Execute o servidor primeiro para criar a pasta automaticamente.');
        rl.close();
        return;
    }

    // Lista todos os arquivos JSON
    const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json'));

    if (files.length === 0) {
        console.log('⚠️  Nenhum arquivo JSON encontrado na pasta.');
        console.log(`📁 Pasta verificada: ${RESULTS_DIR}\n`);
        rl.close();
        return;
    }

    console.log(`📊 Encontrados ${files.length} arquivo(s) JSON:\n`);

    // Lê e valida todos os arquivos
    const resultados = [];
    const erros = [];

    for (const file of files) {
        try {
            const filepath = path.join(RESULTS_DIR, file);
            const content = fs.readFileSync(filepath, 'utf8');
            const data = JSON.parse(content);

            // ✅ VALIDAÇÃO CORRIGIDA E ROBUSTA
            const validation = validateSubmissionData(data);

            if (!validation.isValid) {
                throw new Error(`Validação falhou:\n${validation.errors.join('\n')}`);
            }

            resultados.push(data);
            console.log(`   ✅ ${file}`);
            console.log(`      ${data.studentName} | ${data.grade}º ${data.className} | Nota: ${data.score}/${data.totalQuestions}`);

        } catch (error) {
            erros.push({ file, error: error.message });
            console.log(`   ❌ ${file}`);
            console.log(`      Erro: ${error.message}`);
        }
    }

    console.log(`\n📈 Resumo:`);
    console.log(`   • Válidos: ${resultados.length}`);
    console.log(`   • Erros: ${erros.length}`);

    if (erros.length > 0) {
        console.log('\n⚠️  Arquivos com erro:');
        erros.forEach(({file, error}) => {
            console.log(`   - ${file}: ${error}`);
        });
    }

    if (resultados.length === 0) {
        console.log('\n❌ Nenhum resultado válido para consolidar.\n');
        rl.close();
        return;
    }

    // Pergunta se deseja continuar
    const answer = await question('\n❓ Deseja gerar arquivo consolidado para importação? (s/n): ');

    if (answer.toLowerCase() !== 's') {
        console.log('⏹  Operação cancelada.\n');
        rl.close();
        return;
    }

    // Gera arquivo consolidado
    const consolidado = {
        metadata: {
            exportDate: new Date().toISOString(),
            totalResults: resultados.length,
            validationVersion: "2.0.1",
            source: "importador-lote",
            errorsCount: erros.length
        },
        results: resultados,
        errors: erros.length > 0 ? erros : undefined
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(consolidado, null, 2));

    console.log(`\n✅ Arquivo consolidado gerado com sucesso!`);
    console.log(`📄 Arquivo: ${OUTPUT_FILE}`);
    console.log(`📊 Total de resultados: ${resultados.length}\n`);

    console.log('📋 Próximos passos:');
    console.log('   1. Abra o sistema no navegador');
    console.log('   2. Acesse a Área do Professor');
    console.log('   3. Use "Importar" e selecione: resultados_consolidados.json');
    console.log('   4. Os resultados serão enviados para o banco de dados\n');

    // Pergunta se deseja mover arquivos processados
    const moveAnswer = await question('❓ Deseja mover arquivos processados para pasta "processados"? (s/n): ');

    if (moveAnswer.toLowerCase() === 's') {
        const processedDir = path.join(RESULTS_DIR, 'processados');
        if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir, { recursive: true });
        }

        let movedCount = 0;
        for (const file of files) {
            try {
                const source = path.join(RESULTS_DIR, file);
                const dest = path.join(processedDir, file);
                fs.renameSync(source, dest);
                movedCount++;
            } catch (error) {
                console.error(`❌ Erro ao mover ${file}:`, error.message);
            }
        }

        console.log(`\n✅ ${movedCount} arquivo(s) movido(s) para: ${processedDir}\n`);
    }

    rl.close();
}

// Tratamento de erros global
main().catch(error => {
    console.error('\n❌ Erro fatal:', error.message);
    console.error('Stack trace:', error.stack);
    rl.close();
    process.exit(1);
});
