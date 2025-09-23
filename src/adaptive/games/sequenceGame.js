// src/adaptive/games/sequenceGame.js
// Jogo de Sequência para TEA (Transtorno do Espectro Autista)

/**
 * Jogo de Sequência - memorizar e repetir sequências de cores
 * Ideal para estudantes com TEA, focando em padrões e estrutura
 */
export class SequenceGame {
    constructor(manager) {
        this.manager = manager;
        this.sequence = [];
        this.playerSequence = [];
        this.sequenceLength = 3;
        this.isShowingSequence = false;
    }

    start() {
        const content = document.getElementById('adaptive-game-area');
        content.innerHTML = `
            <div class="sequence-instruction">
                <h3>Memorize a sequência e repita!</h3>
                <p>Observe com atenção e clique na mesma ordem.</p>
            </div>
            <div class="sequence-grid">
                <button class="sequence-btn" data-color="red" style="background: #ef4444;"></button>
                <button class="sequence-btn" data-color="blue" style="background: #3b82f6;"></button>
                <button class="sequence-btn" data-color="green" style="background: #10b981;"></button>
                <button class="sequence-btn" data-color="yellow" style="background: #f59e0b;"></button>
            </div>
        `;

        // Adiciona event listeners
        document.querySelectorAll('.sequence-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleButtonClick(e.target));
        });

        this.generateSequence();
        setTimeout(() => this.showSequence(), 1000);
    }

    generateSequence() {
        const colors = ['red', 'blue', 'green', 'yellow'];
        this.sequence = [];
        for (let i = 0; i < this.sequenceLength; i++) {
            this.sequence.push(colors[Math.floor(Math.random() * colors.length)]);
        }
    }

    async showSequence() {
        this.isShowingSequence = true;
        this.manager.showFeedback('Observe a sequência...', 'info');

        for (let i = 0; i < this.sequence.length; i++) {
            await this.highlightButton(this.sequence[i]);
            await this.delay(200);
        }

        this.isShowingSequence = false;
        this.manager.showFeedback('Agora repita a sequência!', 'info');
    }

    highlightButton(color) {
        return new Promise(resolve => {
            const btn = document.querySelector(`[data-color="${color}"]`);
            btn.classList.add('sequence-highlight');
            setTimeout(() => {
                btn.classList.remove('sequence-highlight');
                resolve();
            }, 600);
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    handleButtonClick(button) {
        if (this.isShowingSequence) return;

        const color = button.dataset.color;
        this.playerSequence.push(color);

        // Animação de clique
        button.classList.add('sequence-click');
        setTimeout(() => button.classList.remove('sequence-click'), 200);

        this.checkSequence();
    }

    checkSequence() {
        const currentIndex = this.playerSequence.length - 1;

        if (this.playerSequence[currentIndex] !== this.sequence[currentIndex]) {
            // Erro na sequência
            this.manager.showFeedback('Ops! Tente novamente.', 'error');
            this.manager.resetCombo();
            this.playerSequence = [];
            setTimeout(() => this.showSequence(), 1000);
            return;
        }

        if (this.playerSequence.length === this.sequence.length) {
            // Sequência completa correta
            this.manager.updateScore(30);
            this.manager.showFeedback('🎯 Sequência perfeita!', 'success');
            this.levelComplete();
        }
    }

    levelComplete() {
        this.manager.updateLevel();
        this.sequenceLength++;

        if (this.manager.level <= this.manager.maxLevel) {
            setTimeout(() => {
                this.playerSequence = [];
                this.start();
            }, 2000);
        } else {
            this.manager.finishGame();
        }
    }
}