// src/adaptive/games/sequenceMusical.js
// Sequência Musical Avançada para TEA

/**
 * Jogo de Sequência Musical - organizando períodos musicais cronologicamente
 * Baseado no demo-advanced-adaptive-games.html
 */
export class SequenceMusicalGame {
    constructor(manager) {
        this.manager = manager;
        this.currentLevel = 1;
        this.maxLevel = 3;
        this.sequences = {
            1: [
                { id: 1, text: 'Música Primitiva', period: 'Pré-História', order: 1 },
                { id: 2, text: 'Música Antiga', period: 'Antiguidade', order: 2 },
                { id: 3, text: 'Música Medieval', period: 'Idade Média', order: 3 },
                { id: 4, text: 'Música Barroca', period: 'Barroco', order: 4 }
            ],
            2: [
                { id: 1, text: 'Canto Gregoriano', period: '500-1400', order: 1 },
                { id: 2, text: 'Polifonia', period: '1300-1600', order: 2 },
                { id: 3, text: 'Ópera Barroca', period: '1600-1750', order: 3 },
                { id: 4, text: 'Sinfonia Clássica', period: '1750-1820', order: 4 },
                { id: 5, text: 'Romantismo', period: '1820-1910', order: 5 }
            ],
            3: [
                { id: 1, text: 'Bach', period: '1685-1750', order: 1 },
                { id: 2, text: 'Mozart', period: '1756-1791', order: 2 },
                { id: 3, text: 'Beethoven', period: '1770-1827', order: 3 },
                { id: 4, text: 'Chopin', period: '1810-1849', order: 4 },
                { id: 5, text: 'Debussy', period: '1862-1918', order: 5 },
                { id: 6, text: 'Stravinsky', period: '1882-1971', order: 6 }
            ]
        };
        this.currentSequence = [];
        this.playerSequence = [];
        this.shuffledItems = [];
    }

    start() {
        const content = document.getElementById('adaptive-game-area');
        content.innerHTML = `
            <div class="sequence-game-header">
                <h3>🧩 Sequência Musical Avançada</h3>
                <p>Organize os períodos musicais na ordem cronológica correta</p>
                <div class="level-info">
                    <span>Nível: ${this.currentLevel}/${this.maxLevel}</span>
                    <span class="difficulty">Dificuldade: ${this.getDifficultyName()}</span>
                </div>
            </div>

            <div class="game-instructions">
                <h4>📋 Como jogar:</h4>
                <p>Clique nos itens na ordem cronológica correta. Comece pelo mais antigo!</p>
            </div>

            <div class="sequence-puzzle" id="sequence-container">
                <!-- Itens serão criados dinamicamente -->
            </div>

            <div class="sequence-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <span class="progress-text">0/${this.getCurrentSequence().length}</span>
            </div>
        `;

        this.setupLevel();
    }

    getDifficultyName() {
        const names = { 1: 'Fácil', 2: 'Médio', 3: 'Difícil' };
        return names[this.currentLevel] || 'Fácil';
    }

    getCurrentSequence() {
        return this.sequences[this.currentLevel] || this.sequences[1];
    }

    setupLevel() {
        this.currentSequence = this.getCurrentSequence();
        this.playerSequence = [];

        // Embaralha os itens
        this.shuffledItems = [...this.currentSequence].sort(() => Math.random() - 0.5);

        this.renderItems();
        this.updateProgress();
    }

    renderItems() {
        const container = document.getElementById('sequence-container');
        container.innerHTML = '';

        // Ajusta grid baseado no número de itens
        const gridCols = Math.min(this.shuffledItems.length, 5);
        container.style.gridTemplateColumns = `repeat(${gridCols}, 1fr)`;

        this.shuffledItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'sequence-item';
            itemEl.dataset.id = item.id;
            itemEl.innerHTML = `
                <div class="item-content">
                    <div class="item-text">${item.text}</div>
                    <div class="item-period">${item.period}</div>
                </div>
            `;

            itemEl.addEventListener('click', () => this.selectItem(item));
            container.appendChild(itemEl);
        });
    }

    selectItem(item) {
        const expectedOrder = this.playerSequence.length + 1;
        const itemEl = document.querySelector(`[data-id="${item.id}"]`);

        if (item.order === expectedOrder) {
            // Seleção correta
            itemEl.classList.add('correct');
            itemEl.style.pointerEvents = 'none';
            this.playerSequence.push(item);

            this.manager.updateScore(10 * this.currentLevel);
            this.manager.showFeedback(`✅ Correto! ${item.text}`, 'success');

            this.updateProgress();

            if (this.playerSequence.length === this.currentSequence.length) {
                setTimeout(() => this.levelComplete(), 1000);
            }
        } else {
            // Seleção incorreta
            itemEl.classList.add('incorrect');
            setTimeout(() => itemEl.classList.remove('incorrect'), 500);

            this.manager.resetCombo();
            this.manager.showFeedback(`❌ Não é o próximo na sequência!`, 'error');
        }
    }

    updateProgress() {
        const progressFill = document.querySelector('.progress-fill');
        const progressText = document.querySelector('.progress-text');

        const percentage = (this.playerSequence.length / this.currentSequence.length) * 100;

        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = `${this.playerSequence.length}/${this.currentSequence.length}`;
    }

    levelComplete() {
        this.manager.updateLevel();
        this.manager.addAchievement('🎵 Sequência Musical Dominada!');

        if (this.currentLevel < this.maxLevel) {
            this.currentLevel++;
            this.manager.showFeedback(`🎉 Nível ${this.currentLevel - 1} concluído! Próximo nível...`, 'achievement');
            setTimeout(() => this.start(), 2000);
        } else {
            this.manager.addAchievement('🏆 Mestre da Cronologia Musical!');
            this.manager.finishGame();
        }
    }
}