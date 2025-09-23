// src/adaptive/games/memoryGame.js
// Jogo de Memória Adaptativo

/**
 * Jogo de Memória Enhanced para estudantes com Síndrome de Down e Deficiência Intelectual
 */
export class MemoryGame {
    constructor(manager, enhanced = false) {
        this.manager = manager;
        this.enhanced = enhanced;
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.totalPairs = 4;
        this.canFlip = true;
        this.gameData = manager.getGameDataFromBank('memory') || manager.getGameDataFromBank('memory_enhanced');
    }

    start() {
        const content = document.getElementById('adaptive-game-area');
        content.innerHTML = '';

        // Se há dados do banco, exibe informações do jogo
        if (this.gameData) {
            console.log('MEMORY_GAME: Usando dados do banco:', this.gameData);

            // Adiciona título e descrição do banco
            const gameHeader = document.createElement('div');
            gameHeader.className = 'game-custom-header';
            gameHeader.innerHTML = `
                <h3>${this.gameData.title}</h3>
                <p>${this.gameData.description}</p>
                <div class="game-instructions">${this.gameData.instructions}</div>
            `;
            content.appendChild(gameHeader);

            // Usa conteúdo específico do banco se disponível
            if (this.gameData.content) {
                this.parseGameContent(this.gameData.content);
            }
        }

        // Determina símbolos baseado na adaptação ou dados do banco
        const symbols = this.getSymbolsForLevel();
        this.totalPairs = symbols.length;

        // Cria cartas
        const cardPairs = [...symbols, ...symbols];
        this.shuffleArray(cardPairs);

        const grid = document.createElement('div');
        grid.className = 'memory-grid';

        cardPairs.forEach((symbol, index) => {
            const card = document.createElement('div');
            card.className = 'memory-card';
            card.dataset.symbol = symbol;
            card.dataset.index = index;

            const cardInner = document.createElement('div');
            cardInner.className = 'memory-card-inner';

            const cardFront = document.createElement('div');
            cardFront.className = 'memory-card-front';
            cardFront.textContent = '?';

            const cardBack = document.createElement('div');
            cardBack.className = 'memory-card-back';
            cardBack.innerHTML = symbol;

            cardInner.appendChild(cardFront);
            cardInner.appendChild(cardBack);
            card.appendChild(cardInner);

            card.addEventListener('click', () => this.flipCard(card));
            grid.appendChild(card);
            this.cards.push(card);
        });

        content.appendChild(grid);

        // Se enhanced, adiciona dicas visuais
        if (this.enhanced) {
            this.addEnhancedFeatures();
        }
    }

    /**
     * Processa conteúdo específico do jogo do banco de dados
     * @param {string} content - Conteúdo do jogo
     */
    parseGameContent(content) {
        try {
            // Exemplo: "Pares: Violão-Música, Panela-Receita, Fantasia-Dança, Livro-História"
            if (content.includes('Pares:')) {
                const pairsText = content.split('Pares:')[1].trim();
                const pairs = pairsText.split(',').map(pair => pair.trim());

                console.log('MEMORY_GAME: Pares encontrados no banco:', pairs);

                // Pode ser usado para customizar o jogo baseado no conteúdo do banco
                this.customPairs = pairs;
            }
        } catch (error) {
            console.warn('Erro ao processar conteúdo do jogo:', error);
        }
    }

    getSymbolsForLevel() {
        const diagnosis = this.manager.adaptationDetails?.originalData?.diagnosis?.join(' ').toLowerCase() || '';

        if (diagnosis.includes('síndrome de down') || diagnosis.includes('down')) {
            // Símbolos mais familiares e emocionais
            return ['😊', '❤️', '🌟', '🎈'];
        }

        if (diagnosis.includes('tea') || diagnosis.includes('autis')) {
            // Símbolos geométricos simples
            return ['🔵', '🔺', '⭐', '❤️'];
        }

        // Padrão
        return ['🐶', '🐱', '🐰', '🐸'];
    }

    addEnhancedFeatures() {
        // Adiciona bordas coloridas e animações suaves
        const style = document.createElement('style');
        style.textContent = `
            .memory-card {
                border: 3px solid #10b981;
                border-radius: 15px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            .memory-card:hover {
                transform: scale(1.05);
                transition: transform 0.2s;
            }
        `;
        document.head.appendChild(style);
    }

    flipCard(card) {
        if (!this.canFlip || card.classList.contains('flipped') || card.classList.contains('matched')) {
            return;
        }

        card.classList.add('flipped');
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.canFlip = false;
            setTimeout(() => this.checkMatch(), 1000);
        }
    }

    checkMatch() {
        const [card1, card2] = this.flippedCards;

        if (card1.dataset.symbol === card2.dataset.symbol) {
            // Par encontrado
            card1.classList.add('matched');
            card2.classList.add('matched');
            this.matchedPairs++;
            this.manager.updateScore(20);
            this.manager.showFeedback('🎉 Par encontrado!', 'success');

            if (this.matchedPairs === this.totalPairs) {
                setTimeout(() => this.levelComplete(), 500);
            }
        } else {
            // Não é par
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            this.manager.resetCombo();
            this.manager.showFeedback('Tente novamente!', 'error');
        }

        this.flippedCards = [];
        this.canFlip = true;
    }

    levelComplete() {
        this.manager.updateLevel();
        this.manager.addAchievement('🧠 Memória Excelente!');

        if (this.manager.level <= this.manager.maxLevel) {
            setTimeout(() => this.start(), 2000);
        } else {
            this.manager.finishGame();
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}