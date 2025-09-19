// src/ui.js

// Importa os objetos de estado e DOM para saber com quais elementos interagir.
import { state, dom } from './state.js';

/**
 * Exibe o modal de confirmação, preenchendo-o com os dados do aluno atual.
 */
function showConfirmationModal() {
    // CORREÇÃO: Usar 'grade' e 'className' em vez de 'year' e 'class'.
    dom.modal.studentInfo.innerHTML = `
        <p><strong>Nome:</strong> ${state.currentStudent.name}</p>
        <p><strong>Ano:</strong> ${state.currentStudent.grade}º Ano</p>
        <p><strong>Turma:</strong> ${state.currentStudent.className}</p>
    `;
    dom.modal.overlay.classList.remove('hidden');
    dom.modal.overlay.classList.add('flex');
}

/**
 * Esconde o modal de confirmação.
 */
function hideConfirmationModal() {
    dom.modal.overlay.classList.add('hidden');
    dom.modal.overlay.classList.remove('flex');
}

/**
 * Configura os event listeners para os botões do modal de confirmação.
 * @param {Function} onConfirm - A função a ser executada quando o botão "Finalizar" é clicado.
 */
export function setupModalListeners(onConfirm) {
    dom.modal.confirmBtn.addEventListener('click', () => {
        hideConfirmationModal();
        onConfirm(); // Chama a função de finalizar a prova
    });
    dom.modal.cancelBtn.addEventListener('click', hideConfirmationModal);
}

/**
 * Configura os event listeners para a sidebar de texto no modo mobile.
 */
export function setupSidebarListeners() {
    const closeSidebar = () => {
        dom.quiz.mobileSidebar.classList.add('-translate-x-full');
        dom.quiz.mobileSidebarOverlay.classList.add('hidden');
    };

    dom.quiz.openSidebarBtn.addEventListener('click', () => {
        dom.quiz.mobileSidebar.classList.remove('-translate-x-full');
        dom.quiz.mobileSidebarOverlay.classList.remove('hidden');
    });

    dom.quiz.closeSidebarBtn.addEventListener('click', closeSidebar);
    dom.quiz.mobileSidebarOverlay.addEventListener('click', closeSidebar);
}

/**
 * Exibe uma mensagem de alerta ao sair da tela da prova.
 */
export function handleVisibilityChange() {
    // A classe 'hidden' do Tailwind faz 'display: none'. 'toggle' adiciona se não tiver, e remove se tiver.
    // A segunda expressão (document.visibilityState !== 'hidden') resulta em true ou false.
    // Se for true (a página está visível), a classe 'hidden' é adicionada ao alerta.
    // Se for false (a página está oculta), a classe 'hidden' é removida do alerta.
    dom.quiz.warningMessage.classList.toggle('hidden', document.visibilityState !== 'hidden');
}

// Exporta a função que será chamada pelo módulo do quiz.
export { showConfirmationModal };