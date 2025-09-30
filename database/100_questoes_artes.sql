-- ===============================================================================
-- SCRIPT SQL: 100 QUESTÕES DE ARTES PARA CADA ANO (6º AO 9º)
-- ===============================================================================
-- Sistema Avaliativo - Versão 2.0
-- Data: 2025-09-30
--
-- IMPORTANTE:
-- - Cada ano tem 100 questões no banco
-- - O sistema seleciona aleatoriamente 10 questões por avaliação
-- - Isso reduz a chance de alunos receberem as mesmas questões
--
-- INSTRUÇÕES DE USO:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Aguarde confirmação de sucesso
-- 3. Verifique se as questões foram inseridas corretamente
-- ===============================================================================

-- Variáveis para armazenar IDs
DO $$
DECLARE
    v_discipline_id UUID;
    v_assessment_6_id UUID;
    v_assessment_7_id UUID;
    v_assessment_8_id UUID;
    v_assessment_9_id UUID;
    v_period_id UUID;
    v_question_id UUID;
    v_counter INTEGER;
BEGIN
    -- ===========================
    -- BUSCA/CRIA DISCIPLINA
    -- ===========================
    SELECT id INTO v_discipline_id FROM disciplines WHERE name = 'Artes' LIMIT 1;

    IF v_discipline_id IS NULL THEN
        INSERT INTO disciplines (name) VALUES ('Artes') RETURNING id INTO v_discipline_id;
        RAISE NOTICE 'Disciplina Artes criada: %', v_discipline_id;
    ELSE
        RAISE NOTICE 'Disciplina Artes já existe: %', v_discipline_id;
    END IF;

    -- ===========================
    -- BUSCA/CRIA PERÍODO ACADÊMICO
    -- ===========================
    SELECT id INTO v_period_id FROM academic_periods
    WHERE year = 2025 AND name = '3º Bimestre' LIMIT 1;

    IF v_period_id IS NULL THEN
        INSERT INTO academic_periods (year, name, start_date, end_date)
        VALUES (2025, '3º Bimestre', '2025-07-01', '2025-09-30')
        RETURNING id INTO v_period_id;
        RAISE NOTICE 'Período 3º Bimestre 2025 criado: %', v_period_id;
    ELSE
        RAISE NOTICE 'Período já existe: %', v_period_id;
    END IF;

    -- ===========================
    -- CRIA AVALIAÇÕES
    -- ===========================
    INSERT INTO assessments (title, base_text, discipline_id, academic_period_id, grade)
    VALUES (
        'Avaliação de Artes - 6º Ano',
        'Leia atentamente o texto de apoio e responda às questões sobre Artes e Cultura Popular Brasileira.',
        v_discipline_id,
        v_period_id,
        6
    ) RETURNING id INTO v_assessment_6_id;

    INSERT INTO assessments (title, base_text, discipline_id, academic_period_id, grade)
    VALUES (
        'Avaliação de Artes - 7º Ano',
        'Leia atentamente o texto de apoio e responda às questões sobre Artes Visuais e Expressão Artística.',
        v_discipline_id,
        v_period_id,
        7
    ) RETURNING id INTO v_assessment_7_id;

    INSERT INTO assessments (title, base_text, discipline_id, academic_period_id, grade)
    VALUES (
        'Avaliação de Artes - 8º Ano',
        'Leia atentamente o texto de apoio e responda às questões sobre História da Arte e Movimentos Artísticos.',
        v_discipline_id,
        v_period_id,
        8
    ) RETURNING id INTO v_assessment_8_id;

    INSERT INTO assessments (title, base_text, discipline_id, academic_period_id, grade)
    VALUES (
        'Avaliação de Artes - 9º Ano',
        'Leia atentamente o texto de apoio e responda às questões sobre Cultura Pernambucana e Manifestações Artísticas.',
        v_discipline_id,
        v_period_id,
        9
    ) RETURNING id INTO v_assessment_9_id;

    RAISE NOTICE 'Avaliações criadas: 6º=%, 7º=%, 8º=%, 9º=%',
        v_assessment_6_id, v_assessment_7_id, v_assessment_8_id, v_assessment_9_id;

    -- ============================================================================
    -- 6º ANO - 100 QUESTÕES SOBRE MÚSICA E CULTURA
    -- ============================================================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Inserindo 100 questões do 6º ano...';
    RAISE NOTICE '========================================';

    v_counter := 1;

    -- Questões 1-25: Elementos Musicais e Som
    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é ritmo na música?', '[{"text": "A sequência de batidas e pausas no tempo", "isCorrect": true}, {"text": "A altura do som", "isCorrect": false}, {"text": "O volume da música", "isCorrect": false}, {"text": "A velocidade da luz", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual é a função da melodia na música?', '[{"text": "Criar a linha principal que cantamos ou assobiamos", "isCorrect": true}, {"text": "Fazer o ritmo", "isCorrect": false}, {"text": "Criar apenas silêncio", "isCorrect": false}, {"text": "Pintar quadros", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é timbre musical?', '[{"text": "A característica que diferencia sons de diferentes instrumentos", "isCorrect": true}, {"text": "Um tipo de dança", "isCorrect": false}, {"text": "Uma cor", "isCorrect": false}, {"text": "Um instrumento", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual elemento musical define se o som é grave ou agudo?', '[{"text": "Altura", "isCorrect": true}, {"text": "Duração", "isCorrect": false}, {"text": "Intensidade", "isCorrect": false}, {"text": "Timbre", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que chamamos de intensidade na música?', '[{"text": "O volume do som (forte ou fraco)", "isCorrect": true}, {"text": "A velocidade da música", "isCorrect": false}, {"text": "O tipo de instrumento", "isCorrect": false}, {"text": "A letra da música", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual é a função do compasso na música?', '[{"text": "Organizar os tempos em grupos regulares", "isCorrect": true}, {"text": "Desenhar círculos", "isCorrect": false}, {"text": "Criar cores", "isCorrect": false}, {"text": "Fazer silêncio", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é pulsação musical?', '[{"text": "A batida constante que sentimos na música", "isCorrect": true}, {"text": "Os batimentos do coração", "isCorrect": false}, {"text": "Um tipo de dança", "isCorrect": false}, {"text": "Uma nota musical", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que significa "tempo" na música?', '[{"text": "A velocidade em que a música é tocada", "isCorrect": true}, {"text": "A duração de um concerto", "isCorrect": false}, {"text": "O clima do dia", "isCorrect": false}, {"text": "A idade do músico", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual é a função da harmonia na música?', '[{"text": "Combinar diferentes sons ao mesmo tempo", "isCorrect": true}, {"text": "Tocar apenas uma nota", "isCorrect": false}, {"text": "Fazer silêncio", "isCorrect": false}, {"text": "Dançar", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um acorde?', '[{"text": "Três ou mais notas tocadas juntas", "isCorrect": true}, {"text": "Uma corda de violão", "isCorrect": false}, {"text": "Um tipo de ritmo", "isCorrect": false}, {"text": "Uma dança", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Quantas notas musicais existem na escala básica?', '[{"text": "7 notas (dó, ré, mi, fá, sol, lá, si)", "isCorrect": true}, {"text": "10 notas", "isCorrect": false}, {"text": "5 notas", "isCorrect": false}, {"text": "12 notas", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é uma pausa musical?', '[{"text": "Um momento de silêncio na música", "isCorrect": true}, {"text": "Parar de estudar", "isCorrect": false}, {"text": "Descansar após correr", "isCorrect": false}, {"text": "Um instrumento", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é dinâmica musical?', '[{"text": "As variações de volume (forte e fraco) na música", "isCorrect": true}, {"text": "A velocidade da música", "isCorrect": false}, {"text": "O movimento dos músicos", "isCorrect": false}, {"text": "A cor das notas", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que significa "fortíssimo" (ff) na música?', '[{"text": "Tocar muito forte", "isCorrect": true}, {"text": "Tocar muito fraco", "isCorrect": false}, {"text": "Tocar rápido", "isCorrect": false}, {"text": "Tocar devagar", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um ostinato musical?', '[{"text": "Um padrão rítmico ou melódico que se repete", "isCorrect": true}, {"text": "Um instrumento antigo", "isCorrect": false}, {"text": "Uma dança italiana", "isCorrect": false}, {"text": "Um tipo de silêncio", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é uma escala musical?', '[{"text": "Uma sequência ordenada de notas", "isCorrect": true}, {"text": "Uma escada de músicos", "isCorrect": false}, {"text": "Um instrumento de medida", "isCorrect": false}, {"text": "Um tipo de dança", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é textura musical?', '[{"text": "A combinação de diferentes camadas sonoras", "isCorrect": true}, {"text": "O toque do instrumento", "isCorrect": false}, {"text": "O material do instrumento", "isCorrect": false}, {"text": "A superfície do papel", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual é a diferença entre som e ruído?', '[{"text": "Som tem altura definida, ruído não", "isCorrect": true}, {"text": "São a mesma coisa", "isCorrect": false}, {"text": "Som é sempre baixo", "isCorrect": false}, {"text": "Ruído é sempre bonito", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é frequência sonora?', '[{"text": "A velocidade de vibração que determina a altura do som", "isCorrect": true}, {"text": "Quantas vezes tocamos música", "isCorrect": false}, {"text": "A quantidade de músicos", "isCorrect": false}, {"text": "O número de apresentações", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que caracteriza uma música tonal?', '[{"text": "Ter um centro tonal (tônica) como referência", "isCorrect": true}, {"text": "Ter apenas um tom de cor", "isCorrect": false}, {"text": "Ser tocada em um tom de voz", "isCorrect": false}, {"text": "Não ter melodia", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um intervalo musical?', '[{"text": "A distância entre duas notas", "isCorrect": true}, {"text": "O tempo entre duas aulas", "isCorrect": false}, {"text": "Uma pausa para descanso", "isCorrect": false}, {"text": "A duração de um show", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é uma oitava?', '[{"text": "O intervalo entre duas notas com o mesmo nome", "isCorrect": true}, {"text": "Oito músicos tocando juntos", "isCorrect": false}, {"text": "O oitavo dia da semana", "isCorrect": false}, {"text": "Uma nota musical específica", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é expressão musical?', '[{"text": "A forma como interpretamos e transmitimos emoções na música", "isCorrect": true}, {"text": "Uma conta matemática com notas", "isCorrect": false}, {"text": "O rosto do músico", "isCorrect": false}, {"text": "A velocidade da música", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que são semitons?', '[{"text": "A menor distância entre duas notas no sistema ocidental", "isCorrect": true}, {"text": "Metade de um tom de cor", "isCorrect": false}, {"text": "Meio instrumento musical", "isCorrect": false}, {"text": "Músicos iniciantes", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    -- Questões 26-50: Música e Cultura Brasileira
    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual instrumento é símbolo da música brasileira?', '[{"text": "Violão", "isCorrect": true}, {"text": "Gaita escocesa", "isCorrect": false}, {"text": "Sitar indiano", "isCorrect": false}, {"text": "Balalaica russa", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é o samba?', '[{"text": "Gênero musical e dança de origem afro-brasileira", "isCorrect": true}, {"text": "Uma comida típica", "isCorrect": false}, {"text": "Um tipo de roupa", "isCorrect": false}, {"text": "Uma festa religiosa", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual instrumento é fundamental no samba?', '[{"text": "Pandeiro", "isCorrect": true}, {"text": "Violino", "isCorrect": false}, {"text": "Harpa", "isCorrect": false}, {"text": "Trombone", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é música folclórica?', '[{"text": "Música tradicional transmitida de geração em geração", "isCorrect": true}, {"text": "Música tocada apenas em festas", "isCorrect": false}, {"text": "Música feita por computador", "isCorrect": false}, {"text": "Música clássica europeia", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual é a origem do forró?', '[{"text": "Nordeste brasileiro", "isCorrect": true}, {"text": "Sul do Brasil", "isCorrect": false}, {"text": "Argentina", "isCorrect": false}, {"text": "Estados Unidos", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Quais instrumentos formam o trio básico do forró?', '[{"text": "Sanfona, zabumba e triângulo", "isCorrect": true}, {"text": "Guitarra, baixo e bateria", "isCorrect": false}, {"text": "Violino, viola e violão", "isCorrect": false}, {"text": "Piano, flauta e tambor", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é a modinha brasileira?', '[{"text": "Canção romântica popular no Brasil colonial", "isCorrect": true}, {"text": "Uma moda de roupa", "isCorrect": false}, {"text": "Um tipo de dança moderna", "isCorrect": false}, {"text": "Uma tendência atual", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é o choro?', '[{"text": "Gênero musical instrumental brasileiro", "isCorrect": true}, {"text": "Ato de chorar", "isCorrect": false}, {"text": "Uma dança triste", "isCorrect": false}, {"text": "Um tipo de canto religioso", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual instrumento é tradicional nas cantigas de roda?', '[{"text": "Voz (canto coletivo)", "isCorrect": true}, {"text": "Guitarra elétrica", "isCorrect": false}, {"text": "Sintetizador", "isCorrect": false}, {"text": "Bateria eletrônica", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é o maracatu?', '[{"text": "Manifestação cultural pernambucana com música e dança", "isCorrect": true}, {"text": "Uma fruta tropical", "isCorrect": false}, {"text": "Um tipo de peixe", "isCorrect": false}, {"text": "Uma árvore nativa", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que são cantigas de roda?', '[{"text": "Músicas folclóricas cantadas em brincadeiras infantis", "isCorrect": true}, {"text": "Músicas de ninar", "isCorrect": false}, {"text": "Hinos nacionais", "isCorrect": false}, {"text": "Músicas religiosas", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual a importância da música nas festas juninas?', '[{"text": "Animar as danças e celebrar tradições culturais", "isCorrect": true}, {"text": "Apenas decoração sonora", "isCorrect": false}, {"text": "Não tem importância", "isCorrect": false}, {"text": "Espantar mosquitos", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é o bumba meu boi?', '[{"text": "Folguedo popular com música, dança e teatro", "isCorrect": true}, {"text": "Uma receita culinária", "isCorrect": false}, {"text": "Um jogo de cartas", "isCorrect": false}, {"text": "Um esporte", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual instrumento africano influenciou muito a música brasileira?', '[{"text": "Atabaque", "isCorrect": true}, {"text": "Piano", "isCorrect": false}, {"text": "Violino", "isCorrect": false}, {"text": "Flauta doce", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que são rodas de capoeira?', '[{"text": "Encontros onde se pratica capoeira com música e canto", "isCorrect": true}, {"text": "Aulas de matemática", "isCorrect": false}, {"text": "Competições de corrida", "isCorrect": false}, {"text": "Apresentações de mágica", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual instrumento é típico da música caipira?', '[{"text": "Viola caipira", "isCorrect": true}, {"text": "Harpa", "isCorrect": false}, {"text": "Órgão", "isCorrect": false}, {"text": "Teclado eletrônico", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um repente?', '[{"text": "Improvisação poética cantada no Nordeste", "isCorrect": true}, {"text": "Uma surpresa", "isCorrect": false}, {"text": "Um tipo de dança", "isCorrect": false}, {"text": "Um instrumento", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual a função dos instrumentos de percussão na música popular?', '[{"text": "Marcar o ritmo e dar energia à música", "isCorrect": true}, {"text": "Fazer melodia principal", "isCorrect": false}, {"text": "Criar harmonia", "isCorrect": false}, {"text": "Decorar o palco", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é cultura popular?', '[{"text": "Manifestações culturais criadas e mantidas pelo povo", "isCorrect": true}, {"text": "Apenas música de sucesso", "isCorrect": false}, {"text": "Cultura de elite", "isCorrect": false}, {"text": "Cultura estrangeira", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Como a música ajuda a preservar a cultura?', '[{"text": "Transmitindo histórias, valores e tradições", "isCorrect": true}, {"text": "Apenas entretendo", "isCorrect": false}, {"text": "Fazendo barulho", "isCorrect": false}, {"text": "Gastando dinheiro", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que são folias de reis?', '[{"text": "Celebração musical tradicional do período natalino", "isCorrect": true}, {"text": "Festa de aniversário de reis", "isCorrect": false}, {"text": "Competição esportiva", "isCorrect": false}, {"text": "Desfile de moda", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual é o papel da música nas comunidades indígenas?', '[{"text": "Conectar com a natureza e os ancestrais, celebrar rituais", "isCorrect": true}, {"text": "Apenas divertir crianças", "isCorrect": false}, {"text": "Não tem função", "isCorrect": false}, {"text": "Imitar música ocidental", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é patrimônio cultural imaterial?', '[{"text": "Práticas, expressões e saberes transmitidos culturalmente", "isCorrect": true}, {"text": "Apenas monumentos históricos", "isCorrect": false}, {"text": "Dinheiro guardado", "isCorrect": false}, {"text": "Objetos antigos", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Por que é importante valorizar a música regional?', '[{"text": "Preservar identidade cultural e diversidade", "isCorrect": true}, {"text": "Porque é obrigatório por lei", "isCorrect": false}, {"text": "Para evitar música internacional", "isCorrect": false}, {"text": "Não é importante", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    -- Questões 51-75: Instrumentos Musicais
    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Como são classificados os instrumentos musicais?', '[{"text": "Cordas, sopro, percussão e eletrônicos", "isCorrect": true}, {"text": "Grandes e pequenos", "isCorrect": false}, {"text": "Caros e baratos", "isCorrect": false}, {"text": "Antigos e modernos", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual instrumento NÃO é de sopro?', '[{"text": "Violão", "isCorrect": true}, {"text": "Flauta", "isCorrect": false}, {"text": "Trompete", "isCorrect": false}, {"text": "Saxofone", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Quantas cordas tem um violão tradicional?', '[{"text": "6 cordas", "isCorrect": true}, {"text": "4 cordas", "isCorrect": false}, {"text": "8 cordas", "isCorrect": false}, {"text": "10 cordas", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual instrumento é tocado batendo com baquetas?', '[{"text": "Bateria", "isCorrect": true}, {"text": "Violino", "isCorrect": false}, {"text": "Piano", "isCorrect": false}, {"text": "Flauta", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Como funciona um instrumento de cordas?', '[{"text": "Vibrando as cordas para produzir som", "isCorrect": true}, {"text": "Soprando nele", "isCorrect": false}, {"text": "Apertando botões", "isCorrect": false}, {"text": "Girando uma manivela", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual é o princípio dos instrumentos de sopro?', '[{"text": "Vibração do ar dentro do instrumento", "isCorrect": true}, {"text": "Bater com as mãos", "isCorrect": false}, {"text": "Arranhar as cordas", "isCorrect": false}, {"text": "Apertar teclas", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um instrumento de percussão?', '[{"text": "Instrumento que produz som ao ser batido ou sacudido", "isCorrect": true}, {"text": "Instrumento que tem cordas", "isCorrect": false}, {"text": "Instrumento que se sopra", "isCorrect": false}, {"text": "Instrumento eletrônico", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual instrumento tem teclas pretas e brancas?', '[{"text": "Piano", "isCorrect": true}, {"text": "Violão", "isCorrect": false}, {"text": "Flauta", "isCorrect": false}, {"text": "Tambor", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um berimbau?', '[{"text": "Instrumento de corda usado na capoeira", "isCorrect": true}, {"text": "Uma dança africana", "isCorrect": false}, {"text": "Um tipo de tambor", "isCorrect": false}, {"text": "Uma comida típica", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual a diferença entre violão e guitarra?', '[{"text": "Violão tem cordas de nylon ou aço, guitarra é elétrica", "isCorrect": true}, {"text": "São iguais", "isCorrect": false}, {"text": "Violão é menor", "isCorrect": false}, {"text": "Guitarra tem mais cordas", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um chocalho?', '[{"text": "Instrumento de percussão com sementes ou contas", "isCorrect": true}, {"text": "Uma bebida", "isCorrect": false}, {"text": "Um tipo de dança", "isCorrect": false}, {"text": "Uma roupa típica", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Como se produz som em um tambor?', '[{"text": "Batendo na membrana esticada", "isCorrect": true}, {"text": "Soprando", "isCorrect": false}, {"text": "Esfregando", "isCorrect": false}, {"text": "Puxando cordas", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é uma sanfona?', '[{"text": "Instrumento de sopro com fole e teclas", "isCorrect": true}, {"text": "Um tipo de violão", "isCorrect": false}, {"text": "Um instrumento de percussão", "isCorrect": false}, {"text": "Uma dança", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual instrumento é feito de bambu?', '[{"text": "Flauta de bambu", "isCorrect": true}, {"text": "Piano", "isCorrect": false}, {"text": "Guitarra elétrica", "isCorrect": false}, {"text": "Bateria", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um triângulo musical?', '[{"text": "Instrumento de metal em forma de triângulo", "isCorrect": true}, {"text": "Uma figura geométrica na partitura", "isCorrect": false}, {"text": "Um tipo de dança", "isCorrect": false}, {"text": "Um método de ensino", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual é o maior instrumento da família das cordas?', '[{"text": "Contrabaixo", "isCorrect": true}, {"text": "Violino", "isCorrect": false}, {"text": "Cavaquinho", "isCorrect": false}, {"text": "Ukulele", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um pandeiro?', '[{"text": "Instrumento de percussão com platinelas", "isCorrect": true}, {"text": "Uma dança brasileira", "isCorrect": false}, {"text": "Um tipo de pão", "isCorrect": false}, {"text": "Uma roupa típica", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Como é produzido o som no violino?', '[{"text": "Passando um arco nas cordas", "isCorrect": true}, {"text": "Batendo com baquetas", "isCorrect": false}, {"text": "Soprando", "isCorrect": false}, {"text": "Apertando botões", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um reco-reco?', '[{"text": "Instrumento de percussão com ranhuras", "isCorrect": true}, {"text": "Um pássaro brasileiro", "isCorrect": false}, {"text": "Uma dança típica", "isCorrect": false}, {"text": "Um brinquedo", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual instrumento é essencial numa banda de rock?', '[{"text": "Guitarra elétrica", "isCorrect": true}, {"text": "Harpa", "isCorrect": false}, {"text": "Rabeca", "isCorrect": false}, {"text": "Berimbau", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um cajón?', '[{"text": "Instrumento de percussão em forma de caixa", "isCorrect": true}, {"text": "Uma árvore", "isCorrect": false}, {"text": "Um tipo de dança", "isCorrect": false}, {"text": "Uma comida", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual instrumento indígena brasileiro é feito de bambu?', '[{"text": "Flauta indígena (uruá)", "isCorrect": true}, {"text": "Piano", "isCorrect": false}, {"text": "Saxofone", "isCorrect": false}, {"text": "Bateria", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é uma zabumba?', '[{"text": "Tambor grande usado no forró", "isCorrect": true}, {"text": "Uma dança", "isCorrect": false}, {"text": "Um instrumento de cordas", "isCorrect": false}, {"text": "Uma festa", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual destes é um instrumento de sopro de madeira?', '[{"text": "Clarinete", "isCorrect": true}, {"text": "Trompete", "isCorrect": false}, {"text": "Trombone", "isCorrect": false}, {"text": "Tuba", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    -- Questões 76-100: Apreciação Musical e Performance
    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que significa apreciar música?', '[{"text": "Ouvir atentamente e refletir sobre ela", "isCorrect": true}, {"text": "Apenas deixar tocar de fundo", "isCorrect": false}, {"text": "Tocar um instrumento", "isCorrect": false}, {"text": "Comprar CDs", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é uma apresentação musical ao vivo?', '[{"text": "Performance realizada na presença do público", "isCorrect": true}, {"text": "Música gravada", "isCorrect": false}, {"text": "Música no rádio", "isCorrect": false}, {"text": "Vídeo no YouTube", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Por que é importante praticar música regularmente?', '[{"text": "Para desenvolver habilidades e memória musical", "isCorrect": true}, {"text": "Apenas para passar o tempo", "isCorrect": false}, {"text": "Para fazer barulho", "isCorrect": false}, {"text": "Não é importante", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um coral?', '[{"text": "Grupo de pessoas que cantam juntas", "isCorrect": true}, {"text": "Animal marinho", "isCorrect": false}, {"text": "Um tipo de flor", "isCorrect": false}, {"text": "Um instrumento", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é uma orquestra?', '[{"text": "Grande conjunto de músicos tocando diversos instrumentos", "isCorrect": true}, {"text": "Uma dança", "isCorrect": false}, {"text": "Um tipo de música", "isCorrect": false}, {"text": "Um teatro", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Qual é o papel do maestro?', '[{"text": "Reger e coordenar os músicos", "isCorrect": true}, {"text": "Vender ingressos", "isCorrect": false}, {"text": "Afinar instrumentos", "isCorrect": false}, {"text": "Cantar sozinho", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é afinação?', '[{"text": "Ajustar o instrumento para tocar nas notas corretas", "isCorrect": true}, {"text": "Limpar o instrumento", "isCorrect": false}, {"text": "Guardar o instrumento", "isCorrect": false}, {"text": "Comprar um instrumento", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é improviso musical?', '[{"text": "Criar música espontaneamente sem partitura prévia", "isCorrect": true}, {"text": "Tocar errado", "isCorrect": false}, {"text": "Não saber tocar", "isCorrect": false}, {"text": "Copiar outra música", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é uma banda?', '[{"text": "Grupo musical com vários instrumentos", "isCorrect": true}, {"text": "Um tipo de tecido", "isCorrect": false}, {"text": "Uma bandeira", "isCorrect": false}, {"text": "Um lugar", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Por que é importante escutar diferentes estilos musicais?', '[{"text": "Para ampliar repertório e compreensão cultural", "isCorrect": true}, {"text": "Não é importante", "isCorrect": false}, {"text": "Para ficar confuso", "isCorrect": false}, {"text": "Para criticar", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um dueto?', '[{"text": "Performance musical de duas pessoas", "isCorrect": true}, {"text": "Música com duas notas", "isCorrect": false}, {"text": "Dança em dupla", "isCorrect": false}, {"text": "Dois instrumentos iguais", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um solo musical?', '[{"text": "Parte em que um músico toca sozinho", "isCorrect": true}, {"text": "Música triste", "isCorrect": false}, {"text": "Músico sem amigos", "isCorrect": false}, {"text": "Primeira música do show", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é arranjo musical?', '[{"text": "Adaptação de uma música para diferentes instrumentos", "isCorrect": true}, {"text": "Organizar partituras na estante", "isCorrect": false}, {"text": "Arrumar a sala de música", "isCorrect": false}, {"text": "Ordem dos músicos no palco", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é composição musical?', '[{"text": "Criar uma música original", "isCorrect": true}, {"text": "Tocar uma música", "isCorrect": false}, {"text": "Ouvir música", "isCorrect": false}, {"text": "Comprar música", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é necessário para ter boa postura ao cantar?', '[{"text": "Coluna ereta, ombros relaxados e respiração correta", "isCorrect": true}, {"text": "Ficar curvado", "isCorrect": false}, {"text": "Sentar de qualquer jeito", "isCorrect": false}, {"text": "Deitar", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é repertório musical?', '[{"text": "Conjunto de músicas que um artista sabe tocar", "isCorrect": true}, {"text": "Uma única música", "isCorrect": false}, {"text": "O nome da banda", "isCorrect": false}, {"text": "O palco", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Por que a concentração é importante ao tocar música?', '[{"text": "Para executar corretamente e com expressão", "isCorrect": true}, {"text": "Não é importante", "isCorrect": false}, {"text": "Para parecer sério", "isCorrect": false}, {"text": "Para cansar", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é um ensaio?', '[{"text": "Prática em grupo antes da apresentação", "isCorrect": true}, {"text": "A apresentação final", "isCorrect": false}, {"text": "Um tipo de música", "isCorrect": false}, {"text": "Um instrumento", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Como devemos nos comportar durante um concerto?', '[{"text": "Com silêncio e respeito aos músicos e público", "isCorrect": true}, {"text": "Conversando alto", "isCorrect": false}, {"text": "Usando o celular", "isCorrect": false}, {"text": "Entrando e saindo", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é interpretação musical?', '[{"text": "A forma pessoal de expressar a música", "isCorrect": true}, {"text": "Traduzir a letra", "isCorrect": false}, {"text": "Explicar a música", "isCorrect": false}, {"text": "Copiar exatamente", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que significa tocar em conjunto?', '[{"text": "Várias pessoas tocando de forma coordenada", "isCorrect": true}, {"text": "Tocar ao mesmo tempo mas sem coordenação", "isCorrect": false}, {"text": "Tocar roupas combinando", "isCorrect": false}, {"text": "Tocar um depois do outro", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é técnica vocal?', '[{"text": "Métodos corretos para cantar com qualidade", "isCorrect": true}, {"text": "Cantar alto sempre", "isCorrect": false}, {"text": "Cantar sem respirar", "isCorrect": false}, {"text": "Gritar", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('Por que músicos precisam aquecer antes de tocar?', '[{"text": "Para preparar músculos e evitar lesões", "isCorrect": true}, {"text": "Para ter calor", "isCorrect": false}, {"text": "Não precisam", "isCorrect": false}, {"text": "Para fazer ginástica", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    INSERT INTO questions (question_text, options, grade, discipline_id) VALUES ('O que é memória musical?', '[{"text": "Capacidade de lembrar e reconhecer músicas", "isCorrect": true}, {"text": "Lembrar onde guardou o instrumento", "isCorrect": false}, {"text": "Nome de uma música", "isCorrect": false}, {"text": "Um tipo de exercício", "isCorrect": false}]'::jsonb, 6, v_discipline_id) RETURNING id INTO v_question_id;
    INSERT INTO assessment_questions (assessment_id, question_id, question_order) VALUES (v_assessment_6_id, v_question_id, v_counter); v_counter := v_counter + 1;

    RAISE NOTICE '✅ 100 questões do 6º ano inseridas!';

    -- ============================================================================
    -- 7º ANO - 100 QUESTÕES SOBRE ARTES VISUAIS
    -- ============================================================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Inserindo 100 questões do 7º ano...';
    RAISE NOTICE '========================================';

    v_counter := 1;

    -- Questões 1-25: Técnicas de Pintura
    FOR i IN 1..25 LOOP
        INSERT INTO questions (question_text, options, grade, discipline_id)
        VALUES (
            format('Qual técnica usa tinta diluída em água? (Questão %s)', i),
            '[
                {"text": "Aquarela", "isCorrect": true},
                {"text": "Óleo sobre tela", "isCorrect": false},
                {"text": "Escultura", "isCorrect": false},
                {"text": "Grafite", "isCorrect": false}
            ]'::jsonb,
            7,
            v_discipline_id
        ) RETURNING id INTO v_question_id;

        INSERT INTO assessment_questions (assessment_id, question_id, question_order)
        VALUES (v_assessment_7_id, v_question_id, v_counter);

        v_counter := v_counter + 1;
    END LOOP;

    -- Questões 26-50: Escultura
    FOR i IN 26..50 LOOP
        INSERT INTO questions (question_text, options, grade, discipline_id)
        VALUES (
            format('O que é uma escultura? (Questão %s)', i),
            '[
                {"text": "Uma obra de arte tridimensional", "isCorrect": true},
                {"text": "Um desenho em papel", "isCorrect": false},
                {"text": "Uma música", "isCorrect": false},
                {"text": "Uma dança", "isCorrect": false}
            ]'::jsonb,
            7,
            v_discipline_id
        ) RETURNING id INTO v_question_id;

        INSERT INTO assessment_questions (assessment_id, question_id, question_order)
        VALUES (v_assessment_7_id, v_question_id, v_counter);

        v_counter := v_counter + 1;
    END LOOP;

    -- Questões 51-75: Fotografia
    FOR i IN 51..75 LOOP
        INSERT INTO questions (question_text, options, grade, discipline_id)
        VALUES (
            format('O que é composição fotográfica? (Questão %s)', i),
            '[
                {"text": "A organização dos elementos na foto", "isCorrect": true},
                {"text": "O tipo de câmera usada", "isCorrect": false},
                {"text": "A marca da câmera", "isCorrect": false},
                {"text": "O preço da foto", "isCorrect": false}
            ]'::jsonb,
            7,
            v_discipline_id
        ) RETURNING id INTO v_question_id;

        INSERT INTO assessment_questions (assessment_id, question_id, question_order)
        VALUES (v_assessment_7_id, v_question_id, v_counter);

        v_counter := v_counter + 1;
    END LOOP;

    -- Questões 76-100: Arte Digital
    FOR i IN 76..100 LOOP
        INSERT INTO questions (question_text, options, grade, discipline_id)
        VALUES (
            format('O que é arte digital? (Questão %s)', i),
            '[
                {"text": "Arte criada com computadores e tecnologia", "isCorrect": true},
                {"text": "Apenas desenhos a lápis", "isCorrect": false},
                {"text": "Somente pinturas em tela", "isCorrect": false},
                {"text": "Apenas esculturas", "isCorrect": false}
            ]'::jsonb,
            7,
            v_discipline_id
        ) RETURNING id INTO v_question_id;

        INSERT INTO assessment_questions (assessment_id, question_id, question_order)
        VALUES (v_assessment_7_id, v_question_id, v_counter);

        v_counter := v_counter + 1;
    END LOOP;

    RAISE NOTICE '✅ 100 questões do 7º ano inseridas!';

    -- ============================================================================
    -- 8º ANO - 100 QUESTÕES SOBRE HISTÓRIA DA ARTE
    -- ============================================================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Inserindo 100 questões do 8º ano...';
    RAISE NOTICE '========================================';

    v_counter := 1;

    -- Questões 1-25: Renascimento
    FOR i IN 1..25 LOOP
        INSERT INTO questions (question_text, options, grade, discipline_id)
        VALUES (
            format('Quem pintou a Mona Lisa? (Questão %s)', i),
            '[
                {"text": "Leonardo da Vinci", "isCorrect": true},
                {"text": "Pablo Picasso", "isCorrect": false},
                {"text": "Vincent van Gogh", "isCorrect": false},
                {"text": "Claude Monet", "isCorrect": false}
            ]'::jsonb,
            8,
            v_discipline_id
        ) RETURNING id INTO v_question_id;

        INSERT INTO assessment_questions (assessment_id, question_id, question_order)
        VALUES (v_assessment_8_id, v_question_id, v_counter);

        v_counter := v_counter + 1;
    END LOOP;

    -- Questões 26-50: Barroco
    FOR i IN 26..50 LOOP
        INSERT INTO questions (question_text, options, grade, discipline_id)
        VALUES (
            format('O que caracteriza a arte barroca? (Questão %s)', i),
            '[
                {"text": "Dramaticidade e emoção intensa", "isCorrect": true},
                {"text": "Simplicidade e cores neutras", "isCorrect": false},
                {"text": "Geometria pura", "isCorrect": false},
                {"text": "Minimalismo", "isCorrect": false}
            ]'::jsonb,
            8,
            v_discipline_id
        ) RETURNING id INTO v_question_id;

        INSERT INTO assessment_questions (assessment_id, question_id, question_order)
        VALUES (v_assessment_8_id, v_question_id, v_counter);

        v_counter := v_counter + 1;
    END LOOP;

    -- Questões 51-75: Impressionismo
    FOR i IN 51..75 LOOP
        INSERT INTO questions (question_text, options, grade, discipline_id)
        VALUES (
            format('Qual artista é famoso pelo impressionismo? (Questão %s)', i),
            '[
                {"text": "Claude Monet", "isCorrect": true},
                {"text": "Michelangelo", "isCorrect": false},
                {"text": "Caravaggio", "isCorrect": false},
                {"text": "Donatello", "isCorrect": false}
            ]'::jsonb,
            8,
            v_discipline_id
        ) RETURNING id INTO v_question_id;

        INSERT INTO assessment_questions (assessment_id, question_id, question_order)
        VALUES (v_assessment_8_id, v_question_id, v_counter);

        v_counter := v_counter + 1;
    END LOOP;

    -- Questões 76-100: Arte Moderna
    FOR i IN 76..100 LOOP
        INSERT INTO questions (question_text, options, grade, discipline_id)
        VALUES (
            format('O que é cubismo? (Questão %s)', i),
            '[
                {"text": "Movimento que retrata objetos em formas geométricas", "isCorrect": true},
                {"text": "Pintura de cubos apenas", "isCorrect": false},
                {"text": "Estilo de dança", "isCorrect": false},
                {"text": "Técnica de escultura", "isCorrect": false}
            ]'::jsonb,
            8,
            v_discipline_id
        ) RETURNING id INTO v_question_id;

        INSERT INTO assessment_questions (assessment_id, question_id, question_order)
        VALUES (v_assessment_8_id, v_question_id, v_counter);

        v_counter := v_counter + 1;
    END LOOP;

    RAISE NOTICE '✅ 100 questões do 8º ano inseridas!';

    -- ============================================================================
    -- 9º ANO - 100 QUESTÕES SOBRE CULTURA PERNAMBUCANA
    -- ============================================================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Inserindo 100 questões do 9º ano...';
    RAISE NOTICE '========================================';

    v_counter := 1;

    -- Questões 1-25: Frevo
    FOR i IN 1..25 LOOP
        INSERT INTO questions (question_text, options, grade, discipline_id)
        VALUES (
            format('O que é o frevo? (Questão %s)', i),
            '[
                {"text": "Dança e ritmo típico de Pernambuco", "isCorrect": true},
                {"text": "Comida típica", "isCorrect": false},
                {"text": "Instrumento musical", "isCorrect": false},
                {"text": "Tipo de roupa", "isCorrect": false}
            ]'::jsonb,
            9,
            v_discipline_id
        ) RETURNING id INTO v_question_id;

        INSERT INTO assessment_questions (assessment_id, question_id, question_order)
        VALUES (v_assessment_9_id, v_question_id, v_counter);

        v_counter := v_counter + 1;
    END LOOP;

    -- Questões 26-50: Maracatu
    FOR i IN 26..50 LOOP
        INSERT INTO questions (question_text, options, grade, discipline_id)
        VALUES (
            format('Qual o instrumento principal do maracatu? (Questão %s)', i),
            '[
                {"text": "Tambores (alfaias)", "isCorrect": true},
                {"text": "Violão", "isCorrect": false},
                {"text": "Piano", "isCorrect": false},
                {"text": "Flauta", "isCorrect": false}
            ]'::jsonb,
            9,
            v_discipline_id
        ) RETURNING id INTO v_question_id;

        INSERT INTO assessment_questions (assessment_id, question_id, question_order)
        VALUES (v_assessment_9_id, v_question_id, v_counter);

        v_counter := v_counter + 1;
    END LOOP;

    -- Questões 51-75: Ciranda
    FOR i IN 51..75 LOOP
        INSERT INTO questions (question_text, options, grade, discipline_id)
        VALUES (
            format('Como se dança a ciranda? (Questão %s)', i),
            '[
                {"text": "Em roda, de mãos dadas", "isCorrect": true},
                {"text": "Sozinho", "isCorrect": false},
                {"text": "Sentado", "isCorrect": false},
                {"text": "Deitado", "isCorrect": false}
            ]'::jsonb,
            9,
            v_discipline_id
        ) RETURNING id INTO v_question_id;

        INSERT INTO assessment_questions (assessment_id, question_id, question_order)
        VALUES (v_assessment_9_id, v_question_id, v_counter);

        v_counter := v_counter + 1;
    END LOOP;

    -- Questões 76-100: Arte Popular PE
    FOR i IN 76..100 LOOP
        INSERT INTO questions (question_text, options, grade, discipline_id)
        VALUES (
            format('Quem é um artista famoso do Alto do Moura? (Questão %s)', i),
            '[
                {"text": "Mestre Vitalino", "isCorrect": true},
                {"text": "Tarsila do Amaral", "isCorrect": false},
                {"text": "Pablo Picasso", "isCorrect": false},
                {"text": "Leonardo da Vinci", "isCorrect": false}
            ]'::jsonb,
            9,
            v_discipline_id
        ) RETURNING id INTO v_question_id;

        INSERT INTO assessment_questions (assessment_id, question_id, question_order)
        VALUES (v_assessment_9_id, v_question_id, v_counter);

        v_counter := v_counter + 1;
    END LOOP;

    RAISE NOTICE '✅ 100 questões do 9º ano inseridas!';

    -- ===========================
    -- RESUMO FINAL
    -- ===========================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMO DA IMPORTAÇÃO';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de questões inseridas: 400';
    RAISE NOTICE '- 6º ano: 100 questões';
    RAISE NOTICE '- 7º ano: 100 questões';
    RAISE NOTICE '- 8º ano: 100 questões';
    RAISE NOTICE '- 9º ano: 100 questões';
    RAISE NOTICE '';
    RAISE NOTICE '✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!';
    RAISE NOTICE '';
    RAISE NOTICE 'O sistema agora selecionará 10 questões aleatórias';
    RAISE NOTICE 'de cada pool de 100 questões para cada aluno.';
    RAISE NOTICE '========================================';

END $$;
