// src/adaptive/games/clickSequence.js
// Jogo de Sequência de Cliques para Deficiência Motora

export class ClickSequenceGame {
    constructor(manager) {
        this.manager = manager;
        this.targets = [];
        this.currentTargetIndex = 0;
        this.totalTargets = 5;
        this.successfulClicks = 0;
    }

    start() {
        const content = document.getElementById('adaptive-game-area');
        content.innerHTML = `
            <div class="click-game-header">
                <h3>Sequência de Cliques</h3>
                <p>Clique nos alvos na ordem correta!</p>
                <div class="progress">Progresso: <span id="click-progress">0</span>/${this.totalTargets}</div>
            </div>
            <div class="click-targets" id="click-targets"></div>
        `;

        this.createTargets();
        this.highlightCurrentTarget();
    }

    createTargets() {
        const container = document.getElementById('click-targets');
        container.innerHTML = '';

        for (let i = 0; i < this.totalTargets; i++) {
            const target = document.createElement('button');
            target.className = 'click-target';
            target.dataset.index = i;
            target.textContent = i + 1;
            target.style.left = Math.random() * 70 + '%';
            target.style.top = Math.random() * 60 + '%';

            target.addEventListener('click', () => this.handleTargetClick(i));
            container.appendChild(target);
            this.targets.push(target);
        }
    }

    highlightCurrentTarget() {
        // Remove highlight anterior
        this.targets.forEach(target => target.classList.remove('current-target'));

        // Adiciona highlight ao alvo atual
        if (this.currentTargetIndex < this.targets.length) {
            this.targets[this.currentTargetIndex].classList.add('current-target');
        }
    }

    handleTargetClick(clickedIndex) {
        if (clickedIndex === this.currentTargetIndex) {
            // Clique correto
            this.targets[clickedIndex].classList.add('clicked-correct');
            this.successfulClicks++;
            this.currentTargetIndex++;

            document.getElementById('click-progress').textContent = this.successfulClicks;

            this.manager.updateScore(20);
            this.manager.showFeedback('🎯 Alvo acertado!', 'success');

            if (this.currentTargetIndex >= this.totalTargets) {
                this.levelComplete();
            } else {
                this.highlightCurrentTarget();
            }
        } else {
            // Clique errado
            this.targets[clickedIndex].classList.add('clicked-wrong');
            setTimeout(() => {
                this.targets[clickedIndex].classList.remove('clicked-wrong');
            }, 500);

            this.manager.resetCombo();
            this.manager.showFeedback('❌ Clique no alvo destacado!', 'error');
        }
    }

    levelComplete() {
        this.manager.updateLevel();
        this.manager.addAchievement('🎯 Precisão Cirúrgica!');

        if (this.manager.level <= this.manager.maxLevel) {
            setTimeout(() => {
                this.currentTargetIndex = 0;
                this.successfulClicks = 0;
                this.totalTargets++;
                this.start();
            }, 2000);
        } else {
            this.manager.finishGame();
        }
    }
}