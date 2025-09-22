-- =====================================================================================
-- SISTEMA DE CONTEÚDO ADAPTADO PARA ESTUDANTES ATÍPICOS
-- =====================================================================================
--
-- Este arquivo contém:
-- 1. Textos de apoio simplificados e adaptados por necessidade
-- 2. Questões reformuladas para diferentes tipos de adaptação
-- 3. Novos formatos de jogos e atividades interativas
-- 4. Recursos visuais e materiais de apoio
--
-- Tipos de adaptação contemplados:
-- - TEA (Transtorno do Espectro Autista): Textos curtos, instruções claras, menos estímulos
-- - TDAH: Atividades dinâmicas, foco mantido, textos objetivos
-- - Síndrome de Down: Interface visual, gamificação, reforço positivo
-- - Deficiência Intelectual: Linguagem simples, conceitos concretos
-- - Deficiência Visual: Alto contraste, descrições detalhadas
-- =====================================================================================

-- =====================================================================================
-- 1. TABELA DE TEXTOS DE APOIO ADAPTADOS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS adaptive_support_texts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_assessment_id UUID REFERENCES assessments(id),
    adaptation_type VARCHAR(50) NOT NULL, -- 'tea', 'tdah', 'down', 'visual', 'intellectual'
    grade INTEGER NOT NULL,
    discipline_id UUID REFERENCES disciplines(id),
    title VARCHAR(255) NOT NULL,
    simplified_text TEXT NOT NULL,
    visual_elements JSONB, -- URLs de imagens, ícones, diagramas
    audio_description TEXT, -- Para deficiência visual
    interaction_hints JSONB, -- Dicas de como interagir
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 2. TABELA DE QUESTÕES ADAPTADAS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS adaptive_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_question_id UUID REFERENCES questions(id),
    adaptation_type VARCHAR(50) NOT NULL,
    grade INTEGER NOT NULL,
    discipline_id UUID REFERENCES disciplines(id),
    question_text TEXT NOT NULL,
    simplified_vocabulary JSONB, -- Palavras complexas → simples
    options JSONB NOT NULL,
    visual_aids JSONB, -- Imagens, ícones, diagramas para a questão
    interaction_type VARCHAR(50) DEFAULT 'multiple_choice', -- 'drag_drop', 'matching', 'visual_choice'
    difficulty_level INTEGER DEFAULT 1, -- 1=muito fácil, 5=normal
    estimated_time_seconds INTEGER DEFAULT 30,
    success_feedback TEXT,
    encouragement_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 3. TABELA DE JOGOS E ATIVIDADES INTERATIVAS
-- =====================================================================================

CREATE TABLE IF NOT EXISTS adaptive_games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_type VARCHAR(50) NOT NULL, -- 'memory', 'puzzle', 'sequence', 'match', 'story'
    adaptation_type VARCHAR(50) NOT NULL,
    grade INTEGER NOT NULL,
    discipline_id UUID REFERENCES disciplines(id),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    content JSONB NOT NULL, -- Dados específicos do jogo
    instructions TEXT NOT NULL,
    learning_objectives TEXT[],
    estimated_duration_minutes INTEGER DEFAULT 5,
    difficulty_level INTEGER DEFAULT 1,
    rewards JSONB, -- Sistema de recompensas e feedback
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- 4. INSERÇÃO DE TEXTOS DE APOIO ADAPTADOS
-- =====================================================================================

-- Textos para TEA (Transtorno do Espectro Autista)
INSERT INTO adaptive_support_texts (adaptation_type, grade, discipline_id, title, simplified_text, visual_elements, interaction_hints) VALUES
('tea', 6, '513d7548-8e41-48a2-8df1-e224e83dd8cb', 'O que é Cultura?',
'Cultura é tudo que as pessoas fazem juntas.

🏠 Exemplos de cultura:
• Como cozinhamos
• Como dançamos
• Como falamos
• Como nos vestimos

Cada grupo tem sua cultura.
Todas as culturas são importantes.',
'{"icons": ["🏠", "🍳", "💃", "👗"], "simple_diagrams": true}',
'{"reading_tips": "Leia devagar", "focus_areas": "Uma informação por vez"}'),

('tea', 7, '513d7548-8e41-48a2-8df1-e224e83dd8cb', 'Artes Integradas',
'Artes Integradas = misturar diferentes artes.

🎭 Exemplos:
• Filme = imagem + som + história
• Musical = música + dança + teatro
• Videoclipe = música + vídeo

Misturar artes cria algo novo e interessante.',
'{"icons": ["🎭", "🎬", "🎵", "🕺"], "flow_chart": true}',
'{"step_by_step": true, "clear_structure": true}');

-- Textos para TDAH
INSERT INTO adaptive_support_texts (adaptation_type, grade, discipline_id, title, simplified_text, visual_elements, interaction_hints) VALUES
('tdah', 6, '513d7548-8e41-48a2-8df1-e224e83dd8cb', 'Cultura em Ação!',
'💡 CULTURA = o que fazemos em grupo!

🔥 FATOS RÁPIDOS:
✓ Comida típica = cultura
✓ Dança regional = cultura
✓ Jeito de falar = cultura
✓ Festas locais = cultura

🎯 MISSÃO: Encontre exemplos de cultura ao seu redor!',
'{"energetic_icons": true, "bright_colors": true, "action_arrows": true}',
'{"quick_tasks": true, "movement_breaks": true, "short_focus": true}'),

('tdah', 8, '513d7548-8e41-48a2-8df1-e224e83dd8cb', 'Música Medieval Turbo!',
'⚡ IDADE MÉDIA = época dos castelos!

🏰 MÚSICA DOS MONGES:
• Canto Gregoriano
• Sem instrumentos
• Só vozes
• Para rezar

🎵 MÚSICA DOS CASTELOS:
• Trovadores
• Com instrumentos
• Histórias de amor
• Para entreter

⚔️ BATALHA MUSICAL: Religioso VS Profano!',
'{"medieval_emojis": true, "battle_theme": true, "timeline_visual": true}',
'{"gamification": true, "competitive_element": true, "quick_transitions": true}');

-- Textos para Síndrome de Down
INSERT INTO adaptive_support_texts (adaptation_type, grade, discipline_id, title, simplified_text, visual_elements, interaction_hints) VALUES
('down', 6, '513d7548-8e41-48a2-8df1-e224e83dd8cb', 'Nossa Cultura é Linda! 🌈',
'🌟 Cultura é como nossa família vive!

👨‍👩‍👧‍👦 NA NOSSA CASA:
• Comida gostosa que mamãe faz
• Música que papai gosta
• Brincadeiras com irmãos
• Festas com parentes

🎉 CADA FAMÍLIA É ESPECIAL!
Sua cultura é importante e bonita!

💝 Você faz parte da nossa cultura!',
'{"family_photos": true, "colorful_borders": true, "heart_decorations": true, "celebration_theme": true}',
'{"positive_reinforcement": true, "personal_connection": true, "visual_rewards": true}'),

('down', 9, '513d7548-8e41-48a2-8df1-e224e83dd8cb', 'Festa Pernambucana! 🎊',
'🎭 Pernambuco tem festas lindas!

💃 FREVO:
• Dança muito alegre
• Com sombrinha colorida
• Todo mundo pula junto
• É muito divertido!

🥁 MARACATU:
• Tem rei e rainha
• Tambores grandes
• Roupas bonitas
• Cortejo real

🌊 CIRANDA:
• Dança em roda
• Todo mundo de mãos dadas
• Na beira da praia
• Cantando junto

🏆 Você pode dançar todas essas danças!',
'{"dance_gifs": true, "costume_images": true, "musical_instruments": true, "party_decorations": true}',
'{"encouragement": true, "inclusive_language": true, "achievement_focus": true}');

-- =====================================================================================
-- 5. QUESTÕES ADAPTADAS POR TIPO DE NECESSIDADE
-- =====================================================================================

-- Questões para TEA (mais diretas, menos opções)
INSERT INTO adaptive_questions (original_question_id, adaptation_type, grade, discipline_id, question_text, options, visual_aids, interaction_type, difficulty_level, success_feedback, encouragement_feedback) VALUES
('ac42a6ff-8c8c-4617-a405-5e432bdd68a4', 'tea', 6, '513d7548-8e41-48a2-8df1-e224e83dd8cb',
'O que é cultura?',
'[
    {"text": "Tudo que as pessoas fazem juntas", "isCorrect": true, "icon": "👥"},
    {"text": "Apenas leis do país", "isCorrect": false, "icon": "📋"}
]',
'{"concept_diagram": true, "simple_icons": true}',
'multiple_choice', 1,
'Correto! Cultura é o que fazemos em grupo.',
'Quase lá! Pense no que sua família faz junto.'),

('1c3294e5-88a9-40c8-8848-bd308983ded1', 'tea', 6, '513d7548-8e41-48a2-8df1-e224e83dd8cb',
'Para que serve a cultura?',
'[
    {"text": "Para nos sentirmos parte do grupo", "isCorrect": true, "icon": "🤝"},
    {"text": "Para criar regras rígidas", "isCorrect": false, "icon": "⛔"}
]',
'{"belonging_illustration": true, "group_icons": true}',
'multiple_choice', 1,
'Perfeito! A cultura nos une.',
'Tente novamente. A cultura nos aproxima.');

-- Questões para TDAH (mais dinâmicas)
INSERT INTO adaptive_questions (original_question_id, adaptation_type, grade, discipline_id, question_text, options, visual_aids, interaction_type, difficulty_level, success_feedback, encouragement_feedback) VALUES
('188b41b0-4f5b-4a81-99b1-d7ba2f040e07', 'tdah', 6, '513d7548-8e41-48a2-8df1-e224e83dd8cb',
'⚡ DESAFIO RÁPIDO: A sombrinha do frevo é que tipo de cultura?',
'[
    {"text": "💃 Material (você pode tocar!)", "isCorrect": true, "animation": "bounce"},
    {"text": "👻 Imaterial (não pode tocar)", "isCorrect": false, "animation": "fade"}
]',
'{"frevo_umbrella_gif": true, "action_buttons": true}',
'visual_choice', 2,
'🎯 ACERTOU! A sombrinha é material!',
'💪 Quase! Material = você pode pegar!'),

('c41b4dec-3b62-4574-8e72-f668c3120eee', 'tdah', 8, '513d7548-8e41-48a2-8df1-e224e83dd8cb',
'🏰 BATALHA MEDIEVAL: Qual a diferença entre música sacra e profana?',
'[
    {"text": "⛪ Sacra = igreja | 🏰 Profana = castelo", "isCorrect": true, "style": "battle"},
    {"text": "😢 Sacra = triste | 😄 Profana = alegre", "isCorrect": false, "style": "battle"}
]',
'{"medieval_battle_scene": true, "church_vs_castle": true}',
'visual_choice', 2,
'⚔️ VITÓRIA! Você entendeu a diferença!',
'🛡️ Tente de novo, guerreiro! Pense no local.');

-- Questões para Síndrome de Down (visuais e encorajadoras)
INSERT INTO adaptive_questions (original_question_id, adaptation_type, grade, discipline_id, question_text, options, visual_aids, interaction_type, difficulty_level, success_feedback, encouragement_feedback) VALUES
('423fb995-87dc-45a1-a7de-12f15f859209', 'down', 9, '513d7548-8e41-48a2-8df1-e224e83dd8cb',
'🎵 Qual dança é rápida e usa instrumentos de sopro?',
'[
    {"text": "FREVO! 💃🎺", "isCorrect": true, "image": "frevo_dance.gif", "celebration": true},
    {"text": "Ciranda 🌊", "isCorrect": false, "image": "ciranda_calm.jpg", "gentle": true}
]',
'{"dance_videos": true, "instruments_sounds": true, "celebration_elements": true}',
'drag_drop', 1,
'🎉 PARABÉNS! Você é um expert em frevo! 🏆',
'😊 Quase acertou! O frevo é bem rápido e animado!'),

('6e1fe06f-9c33-4673-9450-2fcaf9db13bc', 'down', 9, '513d7548-8e41-48a2-8df1-e224e83dd8cb',
'🏰 Qual festa tem rei, rainha e tambores grandes?',
'[
    {"text": "MARACATU! 👑🥁", "isCorrect": true, "royal_theme": true},
    {"text": "Frevo 💃", "isCorrect": false, "dance_theme": true}
]',
'{"royal_costumes": true, "drum_sounds": true, "crown_animations": true}',
'matching', 1,
'🌟 INCRÍVEL! Você conhece o Maracatu! 👑',
'💝 Muito bem! O Maracatu tem reis e rainhas!');

-- =====================================================================================
-- 6. JOGOS E ATIVIDADES INTERATIVAS ADAPTADAS
-- =====================================================================================

-- Jogo de Memória - Cultura Material e Imaterial
INSERT INTO adaptive_games (game_type, adaptation_type, grade, discipline_id, title, description, content, instructions, learning_objectives, estimated_duration_minutes, difficulty_level, rewards) VALUES
('memory', 'down', 6, '513d7548-8e41-48a2-8df1-e224e83dd8cb',
'Jogo da Memória Cultural 🧠',
'Encontre os pares entre cultura material e imaterial!',
'{
    "pairs": [
        {"material": {"image": "violao.png", "name": "Violão"},
         "imaterial": {"image": "musica.png", "name": "Música"}},
        {"material": {"image": "panela.png", "name": "Panela"},
         "imaterial": {"image": "receita.png", "name": "Receita"}},
        {"material": {"image": "fantasia.png", "name": "Fantasia"},
         "imaterial": {"image": "danca.png", "name": "Dança"}},
        {"material": {"image": "livro.png", "name": "Livro"},
         "imaterial": {"image": "historia.png", "name": "História"}}
    ],
    "card_style": "colorful",
    "animations": true,
    "sound_effects": true
}',
'🎯 Encontre os pares! Cada cultura material tem sua cultura imaterial.',
'["Distinguir cultura material de imaterial", "Desenvolver memória visual", "Associar conceitos"]',
5, 1,
'{"stars": 3, "badges": ["Detetive Cultural", "Memoria de Elefante"], "congratulations": "Voce e um expert em cultura!"}'),

-- Quebra-cabeça Sequencial - Idade Média
INSERT INTO adaptive_games (game_type, adaptation_type, grade, discipline_id, title, description, content, instructions, learning_objectives, estimated_duration_minutes, difficulty_level, rewards) VALUES
('sequence', 'tea', 8, '513d7548-8e41-48a2-8df1-e224e83dd8cb',
'Linha do Tempo Medieval ⏰',
'Coloque os eventos da música medieval em ordem.',
'{
    "events": [
        {"id": 1, "text": "Canto Gregoriano", "image": "monks.png", "period": "Início"},
        {"id": 2, "text": "Trobadores", "image": "troubadour.png", "period": "Meio"},
        {"id": 3, "text": "Polifonia", "image": "multiple_voices.png", "period": "Final"}
    ],
    "timeline_style": "medieval",
    "drag_drop": true,
    "step_by_step": true
}',
'Arraste os eventos para a ordem correta na linha do tempo.',
'["Compreender evolução musical medieval", "Desenvolver sequência lógica", "Organizar informações cronológicas"]',
4, 2,
'{"achievement": "Historiador Musical", "feedback": "Perfeito! Voce entende a evolucao da musica medieval!"}'),

-- Jogo de Correspondência - Ritmos Pernambucanos
INSERT INTO adaptive_games (game_type, adaptation_type, grade, discipline_id, title, description, content, instructions, learning_objectives, estimated_duration_minutes, difficulty_level, rewards) VALUES
('match', 'tdah', 9, '513d7548-8e41-48a2-8df1-e224e83dd8cb',
'Ritmos PE - Correspondência Turbo! ⚡',
'Conecte cada ritmo com suas características rapidamente!',
'{
    "items": [
        {"rhythm": "FREVO", "characteristics": ["Rápido", "Sombrinha", "Sopros"], "color": "orange", "energy": "high"},
        {"rhythm": "MARACATU", "characteristics": ["Tambores", "Cortejo", "Reis"], "color": "purple", "energy": "medium"},
        {"rhythm": "CIRANDA", "characteristics": ["Roda", "Praia", "Mãos dadas"], "color": "blue", "energy": "calm"}
    ],
    "time_limit": 60,
    "quick_feedback": true,
    "score_multiplier": true,
    "power_ups": ["Dica Rápida", "Tempo Extra"]
}',
'🚀 MISSÃO: Conecte o ritmo com suas características o mais rápido possível!',
'["Identificar características dos ritmos", "Desenvolver agilidade mental", "Associação rápida"]',
3, 2,
'{"speed_bonus": true, "ranks": ["Novato", "Bom", "Expert", "Mestre PE"], "final_message": "Voce e um mestre dos ritmos pernambucanos!"}'),

-- História Interativa - Artes Integradas
INSERT INTO adaptive_games (game_type, adaptation_type, grade, discipline_id, title, description, content, instructions, learning_objectives, estimated_duration_minutes, difficulty_level, rewards) VALUES
('story', 'intellectual', 7, '513d7548-8e41-48a2-8df1-e224e83dd8cb',
'Aventura das Artes Integradas 🎭',
'Ajude Ana a criar um projeto que mistura diferentes artes!',
'{
    "story_path": [
        {
            "scene": "Ana quer fazer um projeto para a escola.",
            "question": "Qual arte ela deve escolher primeiro?",
            "options": [
                {"choice": "Música 🎵", "result": "Boa! Música é uma base excelente."},
                {"choice": "Dança 💃", "result": "Perfeito! Dança é muito visual."}
            ]
        },
        {
            "scene": "Ana escolheu a primeira arte. O que mais ela pode adicionar?",
            "question": "Como misturar com outra arte?",
            "options": [
                {"choice": "Adicionar vídeo 📹", "result": "Incrível! Agora é um videoclipe!"},
                {"choice": "Fazer um teatro 🎭", "result": "Genial! Agora é um musical!"}
            ]
        }
    ],
    "characters": [{"name": "Ana", "avatar": "student_girl.png"}],
    "simple_language": true,
    "step_by_step_guidance": true
}',
'Ajude Ana a tomar decisões e criar um projeto de artes integradas!',
'["Compreender conceito de artes integradas", "Desenvolver criatividade", "Tomar decisões"]',
6, 1,
'{"story_completion": "Historia Completa!", "creative_badge": "Artista Criativo", "encouragement": "Voce ajudou Ana a criar algo incrivel!"}');

-- =====================================================================================
-- 7. ATIVIDADES DE DRAG-AND-DROP ESPECÍFICAS POR CONTEÚDO
-- =====================================================================================

-- Drag-and-drop para classificar cultura material/imaterial
INSERT INTO adaptive_games (game_type, adaptation_type, grade, discipline_id, title, description, content, instructions, learning_objectives, estimated_duration_minutes, difficulty_level, rewards) VALUES
('drag_drop', 'down', 6, '513d7548-8e41-48a2-8df1-e224e83dd8cb',
'Classificador Cultural 📦',
'Arraste cada item para a caixa correta!',
'{
    "categories": [
        {"name": "MATERIAL", "color": "blue", "icon": "📦", "description": "Coisas que voce pode tocar"},
        {"name": "IMATERIAL", "color": "purple", "icon": "💭", "description": "Ideias e tradicoes"}
    ],
    "items": [
        {"name": "Violao", "image": "guitar.png", "category": "MATERIAL", "feedback": "Voce pode tocar o violao!"},
        {"name": "Musica", "image": "musical_note.png", "category": "IMATERIAL", "feedback": "Musica e uma ideia, uma arte!"},
        {"name": "Sombrinha do Frevo", "image": "umbrella.png", "category": "MATERIAL", "feedback": "A sombrinha e um objeto!"},
        {"name": "Danca do Frevo", "image": "dancing.png", "category": "IMATERIAL", "feedback": "A danca e um movimento, uma tradicao!"},
        {"name": "Receita de Bolo", "image": "recipe.png", "category": "IMATERIAL", "feedback": "A receita e conhecimento!"},
        {"name": "Bolo Pronto", "image": "cake.png", "category": "MATERIAL", "feedback": "O bolo voce pode comer!"}
    ],
    "large_items": true,
    "clear_categories": true,
    "immediate_feedback": true
}',
'🎯 Arraste cada item para a caixa certa: Material ou Imaterial!',
'["Classificar cultura material e imaterial", "Desenvolver coordenação motora", "Compreender conceitos abstratos"]',
4, 1,
'{"completion_celebration": "Voce organizou tudo perfeitamente!", "mastery_badge": "Organizador Cultural"}');

-- =====================================================================================
-- 8. SISTEMA DE FEEDBACK ADAPTADO
-- =====================================================================================

CREATE TABLE IF NOT EXISTS adaptive_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    adaptation_type VARCHAR(50) NOT NULL,
    feedback_type VARCHAR(50) NOT NULL, -- 'success', 'encouragement', 'hint', 'celebration'
    content TEXT NOT NULL,
    visual_elements JSONB,
    audio_cue VARCHAR(255),
    animation_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback para diferentes tipos de adaptação
INSERT INTO adaptive_feedback (adaptation_type, feedback_type, content, visual_elements, animation_type) VALUES
-- TEA
('tea', 'success', 'Correto! Você entendeu.', '{"icon": "✅", "color": "green"}', 'simple_check'),
('tea', 'encouragement', 'Tente novamente. Você consegue.', '{"icon": "💪", "color": "blue"}', 'gentle_pulse'),
('tea', 'hint', 'Dica: Leia a pergunta devagar.', '{"icon": "💡", "color": "yellow"}', 'soft_glow'),

-- TDAH
('tdah', 'success', '🎯 ACERTOU! Você é rápido!', '{"icon": "🚀", "color": "orange", "effects": "burst"}', 'energetic_bounce'),
('tdah', 'encouragement', '💪 Quase lá! Tente de novo!', '{"icon": "⚡", "color": "red", "effects": "spark"}', 'quick_shake'),
('tdah', 'celebration', '🏆 MISSÃO CUMPRIDA! Você é incrível!', '{"confetti": true, "fireworks": true}', 'celebration_burst'),

-- Síndrome de Down
('down', 'success', '🌟 Parabéns! Você é muito inteligente!', '{"hearts": true, "stars": true, "rainbow": true}', 'warm_celebration'),
('down', 'encouragement', '😊 Muito bem! Continue tentando!', '{"smile": true, "thumbs_up": true}', 'encouraging_bounce'),
('down', 'celebration', '🎉 VOCÊ CONSEGUIU! Estamos muito orgulhosos!', '{"party": true, "balloons": true, "applause": true}', 'grand_celebration'),

-- Deficiência Intelectual
('intellectual', 'success', 'Muito bem! Você aprendeu!', '{"simple_check": true, "positive_color": true}', 'clear_confirmation'),
('intellectual', 'encouragement', 'Continue assim! Você está indo bem!', '{"progress_bar": true, "motivational": true}', 'progress_animation'),
('intellectual', 'hint', 'Vamos pensar juntos: [explicação simples]', '{"thinking_icon": true, "step_by_step": true}', 'thoughtful_guide');

-- =====================================================================================
-- 9. INSTRUÇÕES PARA IMPLEMENTAÇÃO
-- =====================================================================================

/*
INSTRUÇÕES PARA USAR ESTE SISTEMA:

1. TEXTOS DE APOIO ADAPTADOS:
   - Use adaptive_support_texts para substituir textos longos
   - Cada adaptação tem linguagem e estrutura específica
   - Inclua elementos visuais (ícones, diagramas, cores)

2. QUESTÕES ADAPTADAS:
   - Reformule questões existentes para cada tipo de necessidade
   - Reduza opções para TEA e DI (2 opções)
   - Use linguagem dinâmica para TDAH
   - Inclua elementos visuais para Down

3. JOGOS INTERATIVOS:
   - Implemente os jogos da tabela adaptive_games
   - Use diferentes mecânicas: memória, sequência, correspondência
   - Adapte dificuldade e feedback para cada necessidade

4. SISTEMA DE FEEDBACK:
   - Use adaptive_feedback para respostas personalizadas
   - Adapte celebrações e encorajamento por tipo
   - Inclua elementos visuais e sonoros

5. ELEMENTOS VISUAIS NECESSÁRIOS:
   - Ícones para cada conceito cultural
   - Imagens de instrumentos musicais medievais
   - Fotos de danças pernambucanas
   - Diagramas simplificados
   - Animações de celebração

6. IMPLEMENTAÇÃO NO CÓDIGO:
   - Modifique src/adaptation.js para usar estas tabelas
   - Crie componentes para cada tipo de jogo
   - Implemente sistema de feedback adaptado
   - Adicione suporte a elementos visuais

EXEMPLO DE USO NO CÓDIGO:

// Buscar texto adaptado
const adaptedText = await getAdaptiveText(assessmentId, 'tea', grade);

// Buscar questões adaptadas
const adaptedQuestions = await getAdaptiveQuestions(originalQuestions, 'down', grade);

// Carregar jogo específico
const game = await getAdaptiveGame('memory', 'down', grade, disciplineId);

// Aplicar feedback personalizado
const feedback = await getAdaptiveFeedback('tdah', 'success');
*/