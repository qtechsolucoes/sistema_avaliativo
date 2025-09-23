// src/adaptive/games/audioMemory.js
// Jogo de Memória Auditiva para Deficiência Visual

export class AudioMemoryGame {
    constructor(manager) {
        this.manager = manager;
        this.sequence = [];
        this.playerSequence = [];
        this.sounds = ['🔊 Beep', '🔔 Ring', '🎵 Note', '⚡ Buzz'];
        this.currentSequenceIndex = 0;
    }

    start() {
        const content = document.getElementById('adaptive-game-area');
        content.innerHTML = `
            <div class="audio-game-header">
                <h3>Memória Auditiva</h3>
                <p>Ouça com atenção e repita a sequência de sons!</p>
            </div>
            <div class="audio-controls">
                <button id="play-sequence-btn" class="game-btn">🔊 Reproduzir Sequência</button>
                <button id="restart-sequence-btn" class="game-btn">🔄 Ouvir Novamente</button>
            </div>
            <div class="audio-buttons" id="audio-buttons"></div>
        `;

        this.createSoundButtons();
        this.generateSequence();

        document.getElementById('play-sequence-btn').addEventListener('click', () => this.playSequence());
        document.getElementById('restart-sequence-btn').addEventListener('click', () => this.playSequence());
    }

    createSoundButtons() {
        const container = document.getElementById('audio-buttons');
        this.sounds.forEach((sound, index) => {
            const btn = document.createElement('button');
            btn.className = 'audio-btn';
            btn.textContent = sound;
            btn.dataset.soundIndex = index;
            btn.addEventListener('click', () => this.handleSoundClick(index));
            container.appendChild(btn);
        });
    }

    generateSequence() {
        this.sequence = [];
        const sequenceLength = Math.min(3 + this.manager.level, 7);
        for (let i = 0; i < sequenceLength; i++) {
            this.sequence.push(Math.floor(Math.random() * this.sounds.length));
        }
    }

    async playSequence() {
        this.manager.showFeedback('🎧 Ouça a sequência...', 'info');

        for (let i = 0; i < this.sequence.length; i++) {
            await this.playSound(this.sequence[i]);
            await this.delay(500);
        }

        this.manager.showFeedback('Agora repita clicando nos botões!', 'info');
        this.playerSequence = [];
    }

    async playSound(soundIndex) {
        // Simula reprodução de som com feedback visual
        const btn = document.querySelector(`[data-sound-index="${soundIndex}"]`);
        btn.classList.add('playing');

        // Aqui seria a reprodução do som real
        console.log(`Reproduzindo som: ${this.sounds[soundIndex]}`);

        setTimeout(() => {
            btn.classList.remove('playing');
        }, 300);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    handleSoundClick(soundIndex) {
        this.playerSequence.push(soundIndex);
        this.playSound(soundIndex);
        this.checkSequence();
    }

    checkSequence() {
        const currentIndex = this.playerSequence.length - 1;

        if (this.playerSequence[currentIndex] !== this.sequence[currentIndex]) {
            this.manager.showFeedback('❌ Sequência incorreta! Tente novamente.', 'error');
            this.manager.resetCombo();
            this.playerSequence = [];
            setTimeout(() => this.playSequence(), 1000);
            return;
        }

        if (this.playerSequence.length === this.sequence.length) {
            this.manager.updateScore(25);
            this.manager.showFeedback('🎧 Sequência perfeita!', 'success');
            this.levelComplete();
        }
    }

    levelComplete() {
        this.manager.updateLevel();
        this.manager.addAchievement('🎵 Ouvido Musical!');

        if (this.manager.level <= this.manager.maxLevel) {
            setTimeout(() => this.start(), 2000);
        } else {
            this.manager.finishGame();
        }
    }
}