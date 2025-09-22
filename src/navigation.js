// src/navigation.js

import { dom } from './state.js';

/**
 * Controla qual tela da aplicação está visível para o usuário.
 * @param {string} screenName - O nome da tela a ser exibida (ex: 'login', 'quiz', 'results').
 */
export function showScreen(screenName) {
    // Esconde todas as outras telas
    Object.values(dom.screens).forEach(screen => {
        if (screen) {
            screen.classList.add('hidden');
        }
    });

    const body = document.body;

    // LÓGICA DE LAYOUT CORRIGIDA:
    // Remove classe quiz-active de todas as telas
    body.classList.remove('quiz-active');

    if (screenName === 'quiz') {
        // Para a tela do quiz, aplica layout especial
        body.classList.remove('flex', 'items-center', 'justify-center');
        body.classList.add('quiz-active');
    } else if (screenName === 'teacherDashboard') {
        // Se a tela for o painel, remove as classes de centralização para permitir a rolagem.
        body.classList.remove('flex', 'items-center', 'justify-center');
    } else {
        // Para todas as outras telas, garante que o conteúdo esteja centralizado.
        body.classList.add('flex', 'items-center', 'justify-center');
    }

    // Mostra a tela solicitada
    if (dom.screens[screenName]) {
        dom.screens[screenName].classList.remove('hidden');
    } else {
        console.error(`A tela "${screenName}" não foi encontrada.`);
    }
}