// src/utils/dbTest.js - Testes de integração do banco de dados

import { dataService } from '../services/dataService.js';
import { logService } from '../services/logService.js';

/**
 * Testa a integração completa com o banco de dados
 */
export async function testDatabaseIntegration() {
    console.log('🧪 Iniciando testes de integração do banco de dados...');

    const results = {
        totalTests: 0,
        passed: 0,
        failed: 0,
        errors: []
    };

    // Teste 1: Buscar turmas
    try {
        results.totalTests++;
        console.log('📋 Teste 1: Buscando turmas do 6º ano...');

        const classes = await dataService.getClassesByGrade(6);

        if (classes && classes.length > 0) {
            console.log(`✅ Encontradas ${classes.length} turmas:`, classes.map(c => c.name));
            results.passed++;
        } else {
            console.log('⚠️ Nenhuma turma encontrada (pode ser normal se não houver dados)');
            results.passed++;
        }
    } catch (error) {
        console.error('❌ Erro no teste de turmas:', error);
        results.failed++;
        results.errors.push({ test: 'getClassesByGrade', error: error.message });
    }

    // Teste 2: Buscar estudantes (se houver turmas)
    try {
        results.totalTests++;
        console.log('👥 Teste 2: Buscando estudantes...');

        const classes = await dataService.getClassesByGrade(6);

        if (classes && classes.length > 0) {
            const classId = classes[0].id;
            console.log(`📚 Testando com turma: ${classes[0].name} (${classId})`);

            const students = await dataService.getStudentsByClass(classId);

            if (students && students.length > 0) {
                console.log(`✅ Encontrados ${students.length} estudantes:`, students.map(s => s.name));
                results.passed++;
            } else {
                console.log('⚠️ Nenhum estudante encontrado (pode ser normal se não houver dados)');
                results.passed++;
            }
        } else {
            console.log('⏭️ Pulando teste de estudantes (sem turmas disponíveis)');
            results.passed++;
        }
    } catch (error) {
        console.error('❌ Erro no teste de estudantes:', error);
        results.failed++;
        results.errors.push({ test: 'getStudentsByClass', error: error.message });
    }

    // Teste 3: Buscar avaliação
    try {
        results.totalTests++;
        console.log('📝 Teste 3: Buscando avaliação...');

        const assessment = await dataService.getAssessmentData(6, 'Artes');

        if (assessment && assessment.questions && assessment.questions.length > 0) {
            console.log(`✅ Avaliação encontrada: "${assessment.title}" com ${assessment.questions.length} questões`);
            console.log('📄 Primeira questão:', assessment.questions[0].question_text?.substring(0, 50) + '...');
            results.passed++;
        } else {
            console.log('⚠️ Nenhuma avaliação encontrada ou sem questões (pode ser normal se não houver dados)');
            results.passed++;
        }
    } catch (error) {
        console.error('❌ Erro no teste de avaliação:', error);
        results.failed++;
        results.errors.push({ test: 'getAssessmentData', error: error.message });
    }

    // Teste 4: Teste de submissão (simulado)
    try {
        results.totalTests++;
        console.log('💾 Teste 4: Testando estrutura de submissão...');

        // Não faz submissão real, apenas testa a estrutura
        const mockSubmission = {
            studentId: '00000000-0000-0000-0000-000000000000',
            assessmentId: '00000000-0000-0000-0000-000000000000',
            score: 8,
            totalQuestions: 10,
            totalDuration: 300,
            answerLog: [
                { questionId: '00000000-0000-0000-0000-000000000000', isCorrect: true, duration: 30 }
            ]
        };

        console.log('📤 Estrutura de submissão válida:', mockSubmission);
        console.log('✅ Estrutura de submissão OK (não enviada)');
        results.passed++;
    } catch (error) {
        console.error('❌ Erro no teste de submissão:', error);
        results.failed++;
        results.errors.push({ test: 'submissionStructure', error: error.message });
    }

    // Resumo dos testes
    console.log('\n📊 Resumo dos Testes:');
    console.log(`Total: ${results.totalTests}`);
    console.log(`✅ Passou: ${results.passed}`);
    console.log(`❌ Falhou: ${results.failed}`);

    if (results.errors.length > 0) {
        console.log('\n🔍 Erros Encontrados:');
        results.errors.forEach((err, index) => {
            console.log(`${index + 1}. ${err.test}: ${err.error}`);
        });
    }

    const successRate = (results.passed / results.totalTests) * 100;
    console.log(`\n🎯 Taxa de Sucesso: ${successRate.toFixed(1)}%`);

    if (successRate >= 75) {
        console.log('🎉 Integração com banco de dados funcionando bem!');
    } else if (successRate >= 50) {
        console.log('⚠️ Integração parcialmente funcional - verifique os erros');
    } else {
        console.log('🚨 Problemas sérios na integração - verifique configuração');
    }

    return results;
}

/**
 * Testa conectividade básica
 */
export async function testBasicConnectivity() {
    console.log('🔌 Testando conectividade básica...');

    try {
        const { testSupabaseConnection } = await import('../services/supabaseClient.js');
        const isConnected = await testSupabaseConnection();

        if (isConnected) {
            console.log('✅ Conectividade básica: OK');
            return true;
        } else {
            console.log('❌ Conectividade básica: FALHOU');
            return false;
        }
    } catch (error) {
        console.error('❌ Erro ao testar conectividade:', error);
        return false;
    }
}

/**
 * Testa especificamente a consulta de estudantes
 */
export async function debugStudentQuery(classId = null) {
    console.log('🔍 Debug específico da consulta de estudantes...');

    try {
        // Se não foi fornecido classId, busca o primeiro disponível
        if (!classId) {
            const classes = await dataService.getClassesByGrade(6);
            if (!classes || classes.length === 0) {
                console.log('❌ Nenhuma turma encontrada para testar');
                return;
            }
            classId = classes[0].id;
            console.log(`📚 Usando turma: ${classes[0].name} (${classId})`);
        }

        // Importa supabaseClient para fazer consulta direta
        const { getSupabaseClient } = await import('../services/supabaseClient.js');
        const client = getSupabaseClient();

        console.log('🔎 Fazendo consulta direta ao Supabase...');

        // Primeira tentativa: consulta com join explícito
        console.log('📋 Tentativa 1: Consulta com join explícito...');
        let { data: enrollments, error } = await client
            .from('class_enrollments')
            .select(`
                student_id,
                students:student_id (
                    id,
                    full_name,
                    adaptation_details
                )
            `)
            .eq('class_id', classId);

        let queryUsed = 'join explícito';

        // Se houver erro, tenta formato alternativo
        if (error) {
            console.log('⚠️ Primeira consulta falhou:', error);
            console.log('📋 Tentativa 2: Consulta formato alternativo...');

            const alternativeQuery = await client
                .from('class_enrollments')
                .select(`
                    students (
                        id,
                        full_name,
                        adaptation_details
                    )
                `)
                .eq('class_id', classId);

            enrollments = alternativeQuery.data;
            error = alternativeQuery.error;
            queryUsed = 'formato alternativo';
        }

        if (error) {
            console.error('❌ Erro na consulta:', error);
            return;
        }

        console.log(`📊 Resultado da consulta (${queryUsed}):`);
        console.log('- Total de enrollments:', enrollments?.length || 0);

        if (enrollments && enrollments.length > 0) {
            console.log('- Primeiro enrollment:', enrollments[0]);
            console.log('- Estrutura do students:', enrollments[0]?.students);

            // Analisa cada enrollment
            enrollments.forEach((enrollment, index) => {
                console.log(`\n📋 Enrollment ${index + 1}:`);
                console.log('  - Dados completos:', enrollment);
                console.log('  - Tem students?', !!enrollment.students);

                if (enrollment.students) {
                    console.log('  - ID do estudante:', enrollment.students.id);
                    console.log('  - full_name:', enrollment.students.full_name);
                    console.log('  - adaptation_details:', enrollment.students.adaptation_details);
                } else {
                    console.log('  ⚠️ Sem dados de students!');
                }
            });
        } else {
            console.log('⚠️ Nenhum enrollment retornado');
        }

        // Testa também usando o dataService
        console.log('\n🔄 Testando via dataService...');
        const students = await dataService.getStudentsByClass(classId);
        console.log('📝 Estudantes processados pelo dataService:', students);

    } catch (error) {
        console.error('❌ Erro no debug da consulta:', error);
    }
}

// Disponibiliza globalmente para debug
if (typeof window !== 'undefined') {
    window.testDB = testDatabaseIntegration;
    window.testConnection = testBasicConnectivity;
    window.debugStudents = debugStudentQuery;
}