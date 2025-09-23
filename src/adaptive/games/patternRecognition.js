// src/adaptive/games/patternRecognition.js
// Reconhecimento de Padrões para desenvolvimento cognitivo

export class PatternRecognitionGame {
    constructor(manager) {
        this.manager = manager;
        this.patterns = [];
        this.currentPattern = null;
        this.correctAnswers = 0;
    }

    start() {
        const content = document.getElementById('adaptive-game-area');
        content.innerHTML = `
            <div class="pattern-game-header">
                <h3>🧩 Reconhecimento de Padrões</h3>
                <p>Complete o padrão escolhendo a opção correta!</p>
            </div>
            <div class="pattern-display" id="pattern-display"></div>
            <div class="pattern-options" id="pattern-options"></div>
            <div class="pattern-score">Acertos: <span id="pattern-score">0</span></div>
        `;

        this.generatePattern();
        this.showPattern();
    }

    generatePattern() {
        const patterns = [
            {
                sequence: ['🔴', '🔵', '🔴', '🔵', '🔴', '?'],
                options: ['🔵', '🔴', '🟡', '🟢'],
                correct: '🔵'
            },
            {
                sequence: ['⭐', '⭐', '🌙', '⭐', '⭐', '?'],
                options: ['🌙', '⭐', '☀️', '🌟'],
                correct: '🌙'
            },
            {
                sequence: ['🔺', '🔵', '🔺', '🔺', '🔵', '?'],
                options: ['🔺', '🔵', '🟥', '🟦'],
                correct: '🔺'
            }
        ];

        this.currentPattern = patterns[Math.floor(Math.random() * patterns.length)];
    }

    showPattern() {
        const displayEl = document.getElementById('pattern-display');
        const optionsEl = document.getElementById('pattern-options');

        // Mostra o padrão
        displayEl.innerHTML = `
            <div class="pattern-sequence">
                ${this.currentPattern.sequence.map(item =>
                    `<span class="pattern-item">${item}</span>`
                ).join('')}
            </div>
        `;

        // Mostra as opções
        optionsEl.innerHTML = '';
        this.currentPattern.options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'pattern-option-btn';
            btn.textContent = option;
            btn.addEventListener('click', () => this.checkAnswer(option));
            optionsEl.appendChild(btn);
        });
    }

    checkAnswer(selectedOption) {
        if (selectedOption === this.currentPattern.correct) {
            this.correctAnswers++;
            this.manager.updateScore(30);
            this.manager.showFeedback('🧩 Padrão correto!', 'success');
            document.getElementById('pattern-score').textContent = this.correctAnswers;

            if (this.correctAnswers >= 5) {
                this.levelComplete();
            } else {
                setTimeout(() => {
                    this.generatePattern();
                    this.showPattern();
                }, 1000);
            }
        } else {
            this.manager.resetCombo();
            this.manager.showFeedback('❌ Padrão incorreto! Tente novamente.', 'error');
        }
    }

    levelComplete() {
        this.manager.updateLevel();
        this.manager.addAchievement('🧩 Mestre dos Padrões!');

        if (this.manager.level <= this.manager.maxLevel) {
            setTimeout(() => {
                this.correctAnswers = 0;
                this.start();
            }, 2000);
        } else {
            this.manager.finishGame();
        }
    }
}