// src/adaptive/games/speedMatching.js
// Jogo de Correspondência Rápida para TDAH

/**
 * Jogo de Correspondência Rápida - conectar itens rapidamente
 * Ideal para estudantes com TDAH, focando em velocidade e atenção dinâmica
 */
export class SpeedMatchingGame {
    constructor(manager) {
        this.manager = manager;
        this.timeLimit = 30;
        this.currentItem = null;
        this.timeLeft = this.timeLimit;
        this.timer = null;
        this.matches = 0;
    }

    start() {
        const content = document.getElementById('adaptive-game-area');
        content.innerHTML = `
            <div class="speed-game-header">
                <h3>Correspondência Rápida!</h3>
                <div class="timer">⏱️ <span id="speed-timer">${this.timeLeft}</span>s</div>
            </div>
            <div class="speed-item-display" id="speed-item"></div>
            <div class="speed-options" id="speed-options"></div>
            <div class="speed-score">Acertos: <span id="speed-matches">0</span></div>
        `;

        this.startTimer();
        this.nextItem();
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('speed-timer').textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    nextItem() {
        const items = [
            { item: '🐶', matches: ['Cachorro', 'Animal', 'Pet'] },
            { item: '🍎', matches: ['Maçã', 'Fruta', 'Vermelha'] },
            { item: '🚗', matches: ['Carro', 'Veículo', 'Transporte'] },
            { item: '🌞', matches: ['Sol', 'Estrela', 'Luz'] },
            { item: '📚', matches: ['Livro', 'Leitura', 'Estudo'] }
        ];

        this.currentItem = items[Math.floor(Math.random() * items.length)];

        document.getElementById('speed-item').innerHTML = `
            <div class="speed-main-item">${this.currentItem.item}</div>
        `;

        this.createOptions();
    }

    createOptions() {
        const optionsContainer = document.getElementById('speed-options');
        const correctAnswer = this.currentItem.matches[0];

        const wrongAnswers = ['Erro1', 'Erro2', 'Erro3', 'Erro4'];
        const allOptions = [correctAnswer, ...wrongAnswers.slice(0, 3)];
        this.shuffleArray(allOptions);

        optionsContainer.innerHTML = '';
        allOptions.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'speed-option-btn';
            btn.textContent = option;
            btn.addEventListener('click', () => this.checkAnswer(option));
            optionsContainer.appendChild(btn);
        });
    }

    checkAnswer(answer) {
        if (this.currentItem.matches.includes(answer)) {
            this.matches++;
            this.manager.updateScore(15);
            document.getElementById('speed-matches').textContent = this.matches;
            this.manager.showFeedback('✅ Correto!', 'success');
        } else {
            this.manager.resetCombo();
            this.manager.showFeedback('❌ Tente outro!', 'error');
        }

        setTimeout(() => this.nextItem(), 500);
    }

    endGame() {
        clearInterval(this.timer);
        this.manager.showFeedback(`🏁 Tempo esgotado! ${this.matches} acertos!`, 'info');

        if (this.matches >= 5) {
            this.manager.addAchievement('⚡ Velocidade Mental!');
        }

        setTimeout(() => {
            if (this.manager.level < this.manager.maxLevel) {
                this.manager.updateLevel();
                this.timeLeft = this.timeLimit;
                this.matches = 0;
                this.start();
            } else {
                this.manager.finishGame();
            }
        }, 2000);
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}