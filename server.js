// server.js - Servidor local com cache para rede local
// Carrega dados do Supabase uma vez e serve em cache para os Chromebooks

const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// ==========================================
// CACHE EM MEMÓRIA
// ==========================================
const cache = {
    students: null,
    classes: null,
    assessments: null,
    lastUpdate: null,
    isReady: false
};

// Cliente Supabase
let supabase = null;

function initializeSupabase() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Credenciais Supabase não encontradas - servidor rodará em modo offline');
        return null;
    }

    console.log('✅ Inicializando cliente Supabase...');
    return createClient(supabaseUrl, supabaseKey);
}

// ==========================================
// CARREGAMENTO INICIAL DE DADOS
// ==========================================
async function loadDataFromSupabase() {
    console.log('\n🔄 Carregando dados do Supabase...\n');

    if (!supabase) {
        console.log('❌ Supabase não configurado - cache não será preenchido');
        cache.isReady = false;
        return;
    }

    try {
        // Carrega turmas
        console.log('📚 Carregando turmas...');
        const { data: classes, error: classError } = await supabase
            .from('classes')
            .select('*')
            .order('grade', { ascending: true });

        if (classError) throw classError;
        cache.classes = classes;
        console.log(`   ✓ ${classes?.length || 0} turmas carregadas`);

        // Carrega estudantes com suas matrículas
        console.log('👥 Carregando estudantes...');
        const { data: students, error: studentError } = await supabase
            .from('students')
            .select(`
                id,
                full_name,
                adaptation_details,
                class_enrollments (
                    class_id,
                    classes (
                        id,
                        name,
                        grade,
                        academic_period_id
                    )
                )
            `)
            .order('full_name', { ascending: true });

        if (studentError) throw studentError;
        cache.students = students;
        console.log(`   ✓ ${students?.length || 0} estudantes carregados`);

        // Carrega avaliações com questões
        console.log('📝 Carregando avaliações e questões...');
        const { data: assessments, error: assessmentError } = await supabase
            .from('assessments')
            .select(`
                id,
                title,
                base_text,
                grade,
                discipline_id,
                academic_period_id,
                assessment_questions (
                    question_order,
                    questions (
                        id,
                        question_text,
                        options,
                        grade
                    )
                )
            `)
            .order('grade', { ascending: true });

        if (assessmentError) throw assessmentError;

        // Processa avaliações para garantir que questões correspondem ao ano
        const processedAssessments = assessments.map(assessment => {
            const assessmentGrade = assessment.grade;

            // Filtra questões para garantir que são do ano correto
            const validQuestions = (assessment.assessment_questions || [])
                .filter(aq => {
                    const question = aq.questions;
                    // Mantém apenas questões que são do mesmo ano da avaliação
                    return question && (question.grade === assessmentGrade || !question.grade);
                });

            return {
                ...assessment,
                assessment_questions: validQuestions
            };
        });

        cache.assessments = processedAssessments;
        console.log(`   ✓ ${assessments?.length || 0} avaliações carregadas`);

        // Marca cache como pronto
        cache.lastUpdate = new Date();
        cache.isReady = true;

        console.log('\n✅ CACHE PRONTO! Dados disponíveis na rede local.\n');
        console.log('═══════════════════════════════════════════════════');
        console.log(`📊 Resumo do Cache:`);
        console.log(`   • Turmas: ${cache.classes?.length || 0}`);
        console.log(`   • Estudantes: ${cache.students?.length || 0}`);
        console.log(`   • Avaliações: ${cache.assessments?.length || 0}`);
        console.log(`   • Última atualização: ${cache.lastUpdate.toLocaleString()}`);
        console.log('═══════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Erro ao carregar dados do Supabase:', error);
        cache.isReady = false;
    }
}

// ==========================================
// ROTAS DA API - SERVINDO DO CACHE
// ==========================================

// Status do servidor
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        cacheReady: cache.isReady,
        lastUpdate: cache.lastUpdate,
        cachedData: {
            classes: cache.classes?.length || 0,
            students: cache.students?.length || 0,
            assessments: cache.assessments?.length || 0
        }
    });
});

// Recarregar cache
app.post('/api/reload-cache', async (req, res) => {
    console.log('🔄 Recebida solicitação para recarregar cache...');
    await loadDataFromSupabase();
    res.json({ success: true, lastUpdate: cache.lastUpdate });
});

// Buscar turmas por ano
app.get('/api/classes/:grade', (req, res) => {
    if (!cache.isReady) {
        return res.status(503).json({ error: 'Cache não está pronto' });
    }

    const grade = parseInt(req.params.grade);
    const classes = cache.classes.filter(c => c.grade === grade);

    console.log(`📚 Servindo ${classes.length} turmas do ${grade}º ano do CACHE`);
    res.json(classes);
});

// Buscar estudantes por turma
app.get('/api/students/:classId', (req, res) => {
    if (!cache.isReady) {
        return res.status(503).json({ error: 'Cache não está pronto' });
    }

    const classId = req.params.classId;

    // Filtra estudantes que estão matriculados nesta turma
    const students = cache.students
        .filter(student =>
            student.class_enrollments?.some(enrollment =>
                enrollment.class_id === classId
            )
        )
        .map(student => ({
            id: student.id,
            name: student.full_name,
            adaptation_details: student.adaptation_details,
            special_needs: !!student.adaptation_details
        }));

    console.log(`👥 Servindo ${students.length} estudantes da turma ${classId} do CACHE`);
    res.json(students);
});

// Buscar avaliação por ano
app.get('/api/assessment/:grade', (req, res) => {
    if (!cache.isReady) {
        return res.status(503).json({ error: 'Cache não está pronto' });
    }

    const grade = parseInt(req.params.grade);
    const disciplineName = req.query.discipline || 'Artes';

    // Busca avaliação do ano correto
    const assessment = cache.assessments.find(a => a.grade === grade);

    if (!assessment) {
        return res.status(404).json({ error: `Avaliação não encontrada para o ${grade}º ano` });
    }

    // Processa questões
    const questions = (assessment.assessment_questions || [])
        .map(aq => {
            const question = aq.questions;
            return {
                id: question.id,
                question_text: question.question_text,
                options: typeof question.options === 'string'
                    ? JSON.parse(question.options)
                    : question.options,
                order: aq.question_order,
                grade: question.grade
            };
        })
        .filter(q => q.grade === grade || !q.grade) // FILTRO CRÍTICO: apenas questões do ano correto
        .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Seleciona 10 questões aleatórias
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, Math.min(10, shuffled.length));

    console.log(`📝 Servindo avaliação do ${grade}º ano com ${selectedQuestions.length} questões do CACHE`);

    res.json({
        id: assessment.id,
        title: assessment.title,
        baseText: assessment.base_text || '',
        questions: selectedQuestions
    });
});

// Salvar submissão
app.post('/api/submission', async (req, res) => {
    const submissionData = req.body;

    console.log(`💾 Recebendo submissão do aluno ${submissionData.studentId}...`);

    if (!supabase) {
        console.log('⚠️ Modo offline - salvando apenas localmente');
        return res.json({
            success: true,
            synced: false,
            mode: 'offline'
        });
    }

    try {
        // Tenta salvar no Supabase via RPC
        const { data, error } = await supabase.rpc('submit_assessment', {
            p_student_id: submissionData.studentId,
            p_assessment_id: submissionData.assessmentId,
            p_score: submissionData.score,
            p_total_questions: submissionData.totalQuestions,
            p_total_duration: submissionData.totalDuration,
            p_answers: submissionData.answerLog
        });

        if (error) {
            console.error('❌ Erro ao salvar no Supabase:', error);
            return res.json({
                success: false,
                synced: false,
                error: error.message
            });
        }

        console.log('✅ Submissão salva no Supabase com sucesso!');
        res.json({
            success: true,
            synced: true,
            mode: 'online'
        });

    } catch (error) {
        console.error('❌ Erro crítico ao salvar submissão:', error);
        res.json({
            success: false,
            synced: false,
            error: error.message
        });
    }
});

// Buscar submissões completadas
app.get('/api/completed-submissions/:classId', async (req, res) => {
    const classId = req.params.classId;

    if (!supabase) {
        return res.json([]);
    }

    try {
        // Busca IDs dos estudantes da turma
        const { data: enrollments, error: enrollError } = await supabase
            .from('class_enrollments')
            .select('student_id')
            .eq('class_id', classId);

        if (enrollError) throw enrollError;

        const studentIds = enrollments.map(e => e.student_id);

        // Busca submissões desses estudantes
        const { data: submissions, error } = await supabase
            .from('submissions')
            .select('student_id')
            .in('student_id', studentIds);

        if (error) throw error;

        const completed = submissions?.map(s => ({ studentId: s.student_id })) || [];
        console.log(`🔒 Servindo ${completed.length} estudantes bloqueados da turma ${classId}`);

        res.json(completed);

    } catch (error) {
        console.error('❌ Erro ao buscar submissões completadas:', error);
        res.json([]);
    }
});

// Servir index.html para todas as outras rotas
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR
// ==========================================
async function startServer() {
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║   SERVIDOR DE AVALIAÇÕES COM CACHE LOCAL          ║');
    console.log('╚════════════════════════════════════════════════════╝\n');

    // Inicializa Supabase
    supabase = initializeSupabase();

    // Carrega dados do Supabase
    if (supabase) {
        await loadDataFromSupabase();
    } else {
        console.log('⚠️ Servidor iniciará em modo offline (sem cache)');
    }

    // Inicia servidor
    app.listen(PORT, '0.0.0.0', () => {
        console.log('\n╔════════════════════════════════════════════════════╗');
        console.log(`║  🚀 SERVIDOR RODANDO NA REDE LOCAL!               ║`);
        console.log('╠════════════════════════════════════════════════════╣');
        console.log(`║  📍 URL: http://192.168.5.1:${PORT}                   ║`);
        console.log(`║  💾 Cache: ${cache.isReady ? 'ATIVO' : 'INATIVO'}                              ║`);
        console.log(`║  🌐 Modo: ${supabase ? 'ONLINE' : 'OFFLINE'}                            ║`);
        console.log('╚════════════════════════════════════════════════════╝\n');

        if (cache.isReady) {
            console.log('✅ Chromebooks podem acessar sem depender de internet individual!\n');
        }
    });
}

// Inicia o servidor
startServer().catch(error => {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Encerrando servidor...\n');
    process.exit(0);
});
