-- =====================================================================================
-- SISTEMA DE CONTEÚDO ADAPTADO PARA ESTUDANTES ATÍPICOS - VERSÃO SIMPLIFICADA
-- =====================================================================================

-- =====================================================================================
-- 1. TABELAS DE CONTEÚDO ADAPTADO
-- =====================================================================================

CREATE TABLE IF NOT EXISTS adaptive_support_texts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adaptation_type VARCHAR(50) NOT NULL,
    grade INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    simplified_text TEXT NOT NULL,
    visual_elements TEXT,
    interaction_hints TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adaptive_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_question_id UUID,
    adaptation_type VARCHAR(50) NOT NULL,
    grade INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    options JSONB NOT NULL,
    visual_aids TEXT,
    interaction_type VARCHAR(50) DEFAULT 'multiple_choice',
    difficulty_level INTEGER DEFAULT 1,
    success_feedback TEXT,
    encouragement_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adaptive_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_type VARCHAR(50) NOT NULL,
    adaptation_type VARCHAR(50) NOT NULL,
    grade INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    instructions TEXT NOT NULL,
    learning_objectives TEXT,
    estimated_duration_minutes INTEGER DEFAULT 5,
    difficulty_level INTEGER DEFAULT 1,
    rewards TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 2. INSERÇÃO DE TEXTOS ADAPTADOS
-- =====================================================================================

-- Textos para TEA
INSERT INTO adaptive_support_texts (adaptation_type, grade, title, simplified_text, visual_elements, interaction_hints) VALUES
('tea', 6, 'O que e Cultura?',
'Cultura e tudo que as pessoas fazem juntas.

Exemplos de cultura:
• Como cozinhamos
• Como dancamos
• Como falamos
• Como nos vestimos

Cada grupo tem sua cultura.
Todas as culturas sao importantes.',
'icons: casa, comida, danca, roupa',
'Leia devagar, uma informacao por vez'),

('tea', 7, 'Artes Integradas',
'Artes Integradas = misturar diferentes artes.

Exemplos:
• Filme = imagem + som + historia
• Musical = musica + danca + teatro
• Videoclipe = musica + video

Misturar artes cria algo novo e interessante.',
'icons: teatro, filme, musica, danca',
'Estrutura clara, passo a passo');

-- Textos para TDAH
INSERT INTO adaptive_support_texts (adaptation_type, grade, title, simplified_text, visual_elements, interaction_hints) VALUES
('tdah', 6, 'Cultura em Acao!',
'CULTURA = o que fazemos em grupo!

FATOS RAPIDOS:
✓ Comida tipica = cultura
✓ Danca regional = cultura
✓ Jeito de falar = cultura
✓ Festas locais = cultura

MISSAO: Encontre exemplos de cultura ao seu redor!',
'cores vibrantes, icones energeticos',
'Tarefas rapidas, pausas para movimento'),

('tdah', 8, 'Musica Medieval Turbo!',
'IDADE MEDIA = epoca dos castelos!

MUSICA DOS MONGES:
• Canto Gregoriano
• Sem instrumentos
• So vozes
• Para rezar

MUSICA DOS CASTELOS:
• Trovadores
• Com instrumentos
• Historias de amor
• Para entreter

BATALHA MUSICAL: Religioso VS Profano!',
'tema medieval, elementos de batalha',
'Gamificacao, elemento competitivo');

-- Textos para Síndrome de Down
INSERT INTO adaptive_support_texts (adaptation_type, grade, title, simplified_text, visual_elements, interaction_hints) VALUES
('down', 6, 'Nossa Cultura e Linda!',
'Cultura e como nossa familia vive!

NA NOSSA CASA:
• Comida gostosa que mamae faz
• Musica que papai gosta
• Brincadeiras com irmaos
• Festas com parentes

CADA FAMILIA E ESPECIAL!
Sua cultura e importante e bonita!

Voce faz parte da nossa cultura!',
'fotos de familia, cores alegres, coracoes',
'Reforco positivo, conexao pessoal'),

('down', 9, 'Festa Pernambucana!',
'Pernambuco tem festas lindas!

FREVO:
• Danca muito alegre
• Com sombrinha colorida
• Todo mundo pula junto
• E muito divertido!

MARACATU:
• Tem rei e rainha
• Tambores grandes
• Roupas bonitas
• Cortejo real

CIRANDA:
• Danca em roda
• Todo mundo de maos dadas
• Na beira da praia
• Cantando junto

Voce pode dancar todas essas dancas!',
'gifs de danca, imagens de fantasias, instrumentos',
'Encorajamento, linguagem inclusiva');

-- =====================================================================================
-- 3. QUESTÕES ADAPTADAS
-- =====================================================================================

-- Questões para TEA (mais diretas, menos opções)
INSERT INTO adaptive_questions (adaptation_type, grade, question_text, options, visual_aids, interaction_type, difficulty_level, success_feedback, encouragement_feedback) VALUES
('tea', 6, 'O que e cultura?',
'[
    {"text": "Tudo que as pessoas fazem juntas", "isCorrect": true},
    {"text": "Apenas leis do pais", "isCorrect": false}
]',
'diagrama simples de conceitos',
'multiple_choice', 1,
'Correto! Cultura e o que fazemos em grupo.',
'Quase la! Pense no que sua familia faz junto.'),

('tea', 6, 'Para que serve a cultura?',
'[
    {"text": "Para nos sentirmos parte do grupo", "isCorrect": true},
    {"text": "Para criar regras rigidas", "isCorrect": false}
]',
'ilustracao de pertencimento',
'multiple_choice', 1,
'Perfeito! A cultura nos une.',
'Tente novamente. A cultura nos aproxima.');

-- Questões para TDAH (mais dinâmicas)
INSERT INTO adaptive_questions (adaptation_type, grade, question_text, options, visual_aids, interaction_type, difficulty_level, success_feedback, encouragement_feedback) VALUES
('tdah', 6, 'DESAFIO RAPIDO: A sombrinha do frevo e que tipo de cultura?',
'[
    {"text": "Material (voce pode tocar!)", "isCorrect": true},
    {"text": "Imaterial (nao pode tocar)", "isCorrect": false}
]',
'gif de sombrinha do frevo',
'visual_choice', 2,
'ACERTOU! A sombrinha e material!',
'Quase! Material = voce pode pegar!'),

('tdah', 8, 'BATALHA MEDIEVAL: Qual a diferenca entre musica sacra e profana?',
'[
    {"text": "Sacra = igreja | Profana = castelo", "isCorrect": true},
    {"text": "Sacra = triste | Profana = alegre", "isCorrect": false}
]',
'cena de batalha medieval',
'visual_choice', 2,
'VITORIA! Voce entendeu a diferenca!',
'Tente de novo, guerreiro! Pense no local.');

-- Questões para Síndrome de Down (visuais e encorajadoras)
INSERT INTO adaptive_questions (adaptation_type, grade, question_text, options, visual_aids, interaction_type, difficulty_level, success_feedback, encouragement_feedback) VALUES
('down', 9, 'Qual danca e rapida e usa instrumentos de sopro?',
'[
    {"text": "FREVO!", "isCorrect": true},
    {"text": "Ciranda", "isCorrect": false}
]',
'videos de danca, sons de instrumentos',
'drag_drop', 1,
'PARABENS! Voce e um expert em frevo!',
'Quase acertou! O frevo e bem rapido e animado!'),

('down', 9, 'Qual festa tem rei, rainha e tambores grandes?',
'[
    {"text": "MARACATU!", "isCorrect": true},
    {"text": "Frevo", "isCorrect": false}
]',
'fantasias reais, sons de tambores',
'matching', 1,
'INCRIVEL! Voce conhece o Maracatu!',
'Muito bem! O Maracatu tem reis e rainhas!');

-- =====================================================================================
-- 4. JOGOS ADAPTATIVOS
-- =====================================================================================

-- Jogo de Memória para Síndrome de Down
INSERT INTO adaptive_games (game_type, adaptation_type, grade, title, description, content, instructions, learning_objectives, estimated_duration_minutes, difficulty_level, rewards) VALUES
('memory', 'down', 6,
'Jogo da Memoria Cultural',
'Encontre os pares entre cultura material e imaterial!',
'Pares: Violao-Musica, Panela-Receita, Fantasia-Danca, Livro-Historia',
'Encontre os pares! Cada cultura material tem sua cultura imaterial.',
'Distinguir cultura material de imaterial, Desenvolver memoria visual',
5, 1,
'3 estrelas, Badge: Detetive Cultural');

-- Linha do Tempo para TEA
INSERT INTO adaptive_games (game_type, adaptation_type, grade, title, description, content, instructions, learning_objectives, estimated_duration_minutes, difficulty_level, rewards) VALUES
('sequence', 'tea', 8,
'Linha do Tempo Medieval',
'Coloque os eventos da musica medieval em ordem.',
'Eventos: 1-Canto Gregoriano, 2-Trovadores, 3-Polifonia',
'Arraste os eventos para a ordem correta na linha do tempo.',
'Compreender evolucao musical medieval, Desenvolver sequencia logica',
4, 2,
'Badge: Historiador Musical');

-- Correspondência Rápida para TDAH
INSERT INTO adaptive_games (game_type, adaptation_type, grade, title, description, content, instructions, learning_objectives, estimated_duration_minutes, difficulty_level, rewards) VALUES
('match', 'tdah', 9,
'Ritmos PE - Correspondencia Turbo!',
'Conecte cada ritmo com suas caracteristicas rapidamente!',
'FREVO: Rapido, Sombrinha, Sopros | MARACATU: Tambores, Cortejo, Reis | CIRANDA: Roda, Praia, Maos dadas',
'MISSAO: Conecte o ritmo com suas caracteristicas o mais rapido possivel!',
'Identificar caracteristicas dos ritmos, Desenvolver agilidade mental',
3, 2,
'Bonus de velocidade, Ranks: Novato, Bom, Expert, Mestre PE');

-- Classificador para Deficiência Intelectual
INSERT INTO adaptive_games (game_type, adaptation_type, grade, title, description, content, instructions, learning_objectives, estimated_duration_minutes, difficulty_level, rewards) VALUES
('drag_drop', 'intellectual', 6,
'Classificador Cultural',
'Arraste cada item para a caixa correta!',
'MATERIAL: Violao, Sombrinha, Bolo | IMATERIAL: Musica, Danca, Receita',
'Arraste cada item para a caixa certa: Material ou Imaterial!',
'Classificar cultura material e imaterial, Desenvolver coordenacao motora',
4, 1,
'Badge: Organizador Cultural');

-- =====================================================================================
-- 5. SISTEMA DE FEEDBACK SIMPLIFICADO
-- =====================================================================================

CREATE TABLE IF NOT EXISTS adaptive_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adaptation_type VARCHAR(50) NOT NULL,
    feedback_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    visual_style VARCHAR(50),
    animation_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO adaptive_feedback (adaptation_type, feedback_type, content, visual_style, animation_type) VALUES
-- TEA
('tea', 'success', 'Correto! Voce entendeu.', 'green_check', 'simple_check'),
('tea', 'encouragement', 'Tente novamente. Voce consegue.', 'blue_support', 'gentle_pulse'),
('tea', 'hint', 'Dica: Leia a pergunta devagar.', 'yellow_hint', 'soft_glow'),

-- TDAH
('tdah', 'success', 'ACERTOU! Voce e rapido!', 'orange_burst', 'energetic_bounce'),
('tdah', 'encouragement', 'Quase la! Tente de novo!', 'red_spark', 'quick_shake'),
('tdah', 'celebration', 'MISSAO CUMPRIDA! Voce e incrivel!', 'rainbow_confetti', 'celebration_burst'),

-- Síndrome de Down
('down', 'success', 'Parabens! Voce e muito inteligente!', 'hearts_stars', 'warm_celebration'),
('down', 'encouragement', 'Muito bem! Continue tentando!', 'smile_thumbs', 'encouraging_bounce'),
('down', 'celebration', 'VOCE CONSEGUIU! Estamos muito orgulhosos!', 'party_balloons', 'grand_celebration'),

-- Deficiência Intelectual
('intellectual', 'success', 'Muito bem! Voce aprendeu!', 'simple_positive', 'clear_confirmation'),
('intellectual', 'encouragement', 'Continue assim! Voce esta indo bem!', 'progress_motivational', 'progress_animation'),
('intellectual', 'hint', 'Vamos pensar juntos...', 'thinking_step', 'thoughtful_guide');

-- =====================================================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================================================

CREATE INDEX IF NOT EXISTS idx_adaptive_texts_type_grade ON adaptive_support_texts(adaptation_type, grade);
CREATE INDEX IF NOT EXISTS idx_adaptive_questions_type_grade ON adaptive_questions(adaptation_type, grade);
CREATE INDEX IF NOT EXISTS idx_adaptive_games_type_grade ON adaptive_games(adaptation_type, grade);
CREATE INDEX IF NOT EXISTS idx_adaptive_feedback_type ON adaptive_feedback(adaptation_type, feedback_type);

-- =====================================================================================
-- COMENTÁRIOS FINAIS
-- =====================================================================================

/*
COMO USAR ESTE SISTEMA:

1. BUSCAR TEXTO ADAPTADO:
   SELECT * FROM adaptive_support_texts
   WHERE adaptation_type = 'tea' AND grade = 6;

2. BUSCAR QUESTÕES ADAPTADAS:
   SELECT * FROM adaptive_questions
   WHERE adaptation_type = 'down' AND grade = 9;

3. CARREGAR JOGO ESPECÍFICO:
   SELECT * FROM adaptive_games
   WHERE game_type = 'memory' AND adaptation_type = 'down';

4. OBTER FEEDBACK PERSONALIZADO:
   SELECT * FROM adaptive_feedback
   WHERE adaptation_type = 'tdah' AND feedback_type = 'success';

EXEMPLO DE IMPLEMENTAÇÃO NO JAVASCRIPT:

// Buscar conteúdo adaptado
async function getAdaptiveContent(adaptationType, grade) {
    const { data: text } = await supabase
        .from('adaptive_support_texts')
        .select('*')
        .eq('adaptation_type', adaptationType)
        .eq('grade', grade);

    const { data: questions } = await supabase
        .from('adaptive_questions')
        .select('*')
        .eq('adaptation_type', adaptationType)
        .eq('grade', grade);

    return { text: text[0], questions };
}

// Buscar jogo adaptado
async function getAdaptiveGame(gameType, adaptationType, grade) {
    const { data } = await supabase
        .from('adaptive_games')
        .select('*')
        .eq('game_type', gameType)
        .eq('adaptation_type', adaptationType)
        .eq('grade', grade);

    return data[0];
}
*/