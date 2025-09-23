// src/adaptive/games/rhythmTurbo.js
// Ritmos PE Turbo Challenge para TDAH

/**
 * Jogo de Ritmos PE Turbo - combinação rápida de movimentos e ritmos
 * Baseado no demo-advanced-adaptive-games.html
 */
export class RhythmTurboGame {
    constructor(manager) {
        this.manager = manager;
        this.timeLimit = 60;
        this.timeLeft = this.timeLimit;
        this.timer = null;
        this.score = 0;
        this.matches = 0;
        this.currentChallenge = null;
        this.isActive = false;

        this.movements = [
            { id: 1, name: 'Corrida no Lugar', emoji: '🏃‍♂️', rhythm: '1-2-1-2' },
            { id: 2, name: 'Polichinelo', emoji: '🤸‍♀️', rhythm: '1-2-3-4' },
            { id: 3, name: 'Agachamento', emoji: '🏋️‍♀️', rhythm: '1-pause-2' },
            { id: 4, name: 'Alongamento', emoji: '🧘‍♀️', rhythm: '1-2-3-hold' },
            { id: 5, name: 'Marcha', emoji: '🚶‍♂️', rhythm: '1-2-1-2' },
            { id: 6, name: 'Dança Livre', emoji: '💃', rhythm: '1-2-3-free' }
        ];

        this.rhythmPatterns = [
            '🔥 Rápido',
            '🌊 Moderado',
            '🐌 Lento',
            '⚡ Explosivo'
        ];
    }

    start() {
        const content = document.getElementById('adaptive-game-area');
        content.innerHTML = `
            <div class="rhythm-game-header">
                <h3>⚡ Ritmos PE Turbo Challenge</h3>
                <p>Combine movimentos com ritmos o mais rápido possível!</p>
                <div class="game-stats">
                    <div class="stat">⏱️ <span id="turbo-timer">${this.timeLeft}</span>s</div>
                    <div class="stat">🎯 Acertos: <span id="turbo-score">${this.matches}</span></div>
                    <div class="stat">🔥 Combo: <span id="turbo-combo">0</span></div>
                </div>
            </div>

            <div class="rhythm-matching">
                <div class="movements-column">
                    <h4>🏃‍♂️ Movimentos</h4>
                    <div class="rhythm-cards" id="movements-cards">
                        <!-- Preenchido dinamicamente -->
                    </div>
                </div>

                <div class="vs-indicator">
                    <div class="vs-text">VS</div>
                    <div class="challenge-text" id="challenge-text">Clique para começar!</div>
                </div>

                <div class="rhythms-column">
                    <h4>🎵 Ritmos</h4>
                    <div class="rhythm-cards" id="rhythms-cards">
                        <!-- Preenchido dinamicamente -->
                    </div>
                </div>
            </div>

            <div class="turbo-controls">
                <button class="btn btn-start" onclick="this.startChallenge()" id="start-turbo-btn">🚀 Iniciar Turbo!</button>
                <button class="btn btn-pause" onclick="this.pauseGame()" id="pause-turbo-btn" style="display: none;">⏸️ Pausar</button>
            </div>
        `;

        this.setupCards();
        this.bindEvents();
    }

    setupCards() {
        this.setupMovementCards();
        this.setupRhythmCards();
    }

    setupMovementCards() {
        const container = document.getElementById('movements-cards');
        container.innerHTML = '';

        this.movements.forEach(movement => {
            const card = document.createElement('div');
            card.className = 'rhythm-card movement-card';
            card.dataset.id = movement.id;
            card.innerHTML = `
                <div class="card-emoji">${movement.emoji}</div>
                <div class="card-title">${movement.name}</div>
                <div class="card-rhythm">${movement.rhythm}</div>
            `;

            card.addEventListener('click', () => this.selectMovement(movement));
            container.appendChild(card);
        });
    }

    setupRhythmCards() {
        const container = document.getElementById('rhythms-cards');
        container.innerHTML = '';

        this.rhythmPatterns.forEach((pattern, index) => {
            const card = document.createElement('div');
            card.className = 'rhythm-card pattern-card';
            card.dataset.pattern = index;
            card.innerHTML = `
                <div class="pattern-text">${pattern}</div>
            `;

            card.addEventListener('click', () => this.selectRhythm(index));
            container.appendChild(card);
        });
    }

    bindEvents() {
        const startBtn = document.getElementById('start-turbo-btn');
        if (startBtn) {
            startBtn.onclick = () => this.startChallenge();
        }

        const pauseBtn = document.getElementById('pause-turbo-btn');
        if (pauseBtn) {
            pauseBtn.onclick = () => this.pauseGame();
        }
    }

    startChallenge() {
        this.isActive = true;
        this.timeLeft = this.timeLimit;

        document.getElementById('start-turbo-btn').style.display = 'none';
        document.getElementById('pause-turbo-btn').style.display = 'block';

        this.generateNewChallenge();
        this.startTimer();

        this.manager.showFeedback('🔥 Turbo Mode Ativado! Seja rápido!', 'info');
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.timeLeft--;
            document.getElementById('turbo-timer').textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                this.endGame();
            } else if (this.timeLeft <= 10) {
                // Últimos 10 segundos - efeito urgência
                document.getElementById('turbo-timer').style.color = '#ef4444';
                document.getElementById('turbo-timer').style.animation = 'pulse 0.5s infinite';
            }
        }, 1000);
    }

    generateNewChallenge() {
        if (!this.isActive) return;

        // Desseleciona cartas anteriores
        document.querySelectorAll('.rhythm-card.selected').forEach(card => {
            card.classList.remove('selected');
        });

        // Gera novo desafio
        const randomMovement = this.movements[Math.floor(Math.random() * this.movements.length)];
        const randomRhythm = Math.floor(Math.random() * this.rhythmPatterns.length);

        this.currentChallenge = {
            movement: randomMovement,
            rhythm: randomRhythm
        };

        const challengeText = document.getElementById('challenge-text');
        challengeText.innerHTML = `
            <div class="challenge-prompt">
                <div>Combine:</div>
                <div class="challenge-movement">${randomMovement.emoji} ${randomMovement.name}</div>
                <div>com</div>
                <div class="challenge-rhythm">${this.rhythmPatterns[randomRhythm]}</div>
            </div>
        `;
    }

    selectMovement(movement) {
        if (!this.isActive || !this.currentChallenge) return;

        document.querySelectorAll('.movement-card.selected').forEach(card => {
            card.classList.remove('selected');
        });

        const selectedCard = document.querySelector(`[data-id="${movement.id}"]`);
        selectedCard.classList.add('selected');

        this.checkMatch('movement', movement);
    }

    selectRhythm(rhythmIndex) {
        if (!this.isActive || !this.currentChallenge) return;

        document.querySelectorAll('.pattern-card.selected').forEach(card => {
            card.classList.remove('selected');
        });

        const selectedCard = document.querySelector(`[data-pattern="${rhythmIndex}"]`);
        selectedCard.classList.add('selected');

        this.checkMatch('rhythm', rhythmIndex);
    }

    checkMatch(type, selection) {
        const isMovementSelected = document.querySelector('.movement-card.selected');
        const isRhythmSelected = document.querySelector('.pattern-card.selected');

        if (isMovementSelected && isRhythmSelected) {
            const selectedMovement = parseInt(document.querySelector('.movement-card.selected').dataset.id);
            const selectedRhythm = parseInt(document.querySelector('.pattern-card.selected').dataset.pattern);

            if (selectedMovement === this.currentChallenge.movement.id &&
                selectedRhythm === this.currentChallenge.rhythm) {

                this.matches++;
                this.manager.updateScore(15);

                document.getElementById('turbo-score').textContent = this.matches;
                document.getElementById('turbo-combo').textContent = this.manager.comboCount;

                this.manager.showFeedback('🎯 Combinação perfeita!', 'success');

                // Marca cartas como matched
                document.querySelectorAll('.rhythm-card.selected').forEach(card => {
                    card.classList.add('matched');
                });

                setTimeout(() => this.generateNewChallenge(), 800);

            } else {
                this.manager.resetCombo();
                this.manager.showFeedback('❌ Combinação errada! Tente outra!', 'error');

                // Remove seleções
                setTimeout(() => {
                    document.querySelectorAll('.rhythm-card.selected, .rhythm-card.matched').forEach(card => {
                        card.classList.remove('selected', 'matched');
                    });
                }, 500);
            }
        }
    }

    pauseGame() {
        this.isActive = false;
        clearInterval(this.timer);

        document.getElementById('start-turbo-btn').style.display = 'block';
        document.getElementById('pause-turbo-btn').style.display = 'none';

        this.manager.showFeedback('⏸️ Jogo pausado', 'info');
    }

    endGame() {
        this.isActive = false;
        clearInterval(this.timer);

        this.manager.addAchievement('⚡ Turbo Warrior!');

        if (this.matches >= 10) {
            this.manager.addAchievement('🔥 Master Combo!');
        }

        this.manager.showFeedback(`🏁 Turbo Finalizado! ${this.matches} combinações corretas!`, 'achievement');

        setTimeout(() => {
            this.manager.finishGame();
        }, 2000);
    }
}