// src/adaptive/games/storyAdventure.js
// Aventura com História para engajamento geral

export class StoryAdventureGame {
    constructor(manager) {
        this.manager = manager;
        this.currentScene = 0;
        this.story = this.generateStory();
    }

    start() {
        const content = document.getElementById('adaptive-game-area');
        content.innerHTML = `
            <div class="story-game-header">
                <h3>📖 Aventura Interativa</h3>
                <p>Faça suas escolhas e viva a história!</p>
            </div>
            <div class="story-scene" id="story-scene"></div>
            <div class="story-choices" id="story-choices"></div>
        `;

        this.showCurrentScene();
    }

    generateStory() {
        return [
            {
                text: "Você está em uma floresta mágica e encontra uma bifurcação no caminho...",
                choices: [
                    { text: "Seguir pela trilha da esquerda", points: 10, next: 1 },
                    { text: "Seguir pela trilha da direita", points: 15, next: 2 }
                ]
            },
            {
                text: "Você encontra um riacho cristalino. O que você faz?",
                choices: [
                    { text: "Beber a água", points: 20, next: 3 },
                    { text: "Continuar caminhando", points: 10, next: 3 }
                ]
            },
            {
                text: "Uma ponte antiga aparece à sua frente. Como você atravessa?",
                choices: [
                    { text: "Atravessar com cuidado", points: 25, next: 3 },
                    { text: "Procurar outro caminho", points: 15, next: 3 }
                ]
            },
            {
                text: "🏆 Parabéns! Você chegou ao tesouro da floresta!",
                choices: []
            }
        ];
    }

    showCurrentScene() {
        const scene = this.story[this.currentScene];
        const sceneEl = document.getElementById('story-scene');
        const choicesEl = document.getElementById('story-choices');

        sceneEl.innerHTML = `
            <div class="scene-text">${scene.text}</div>
        `;

        choicesEl.innerHTML = '';

        if (scene.choices.length === 0) {
            // Final da história
            this.levelComplete();
            return;
        }

        scene.choices.forEach((choice, index) => {
            const btn = document.createElement('button');
            btn.className = 'story-choice-btn';
            btn.textContent = choice.text;
            btn.addEventListener('click', () => this.makeChoice(choice));
            choicesEl.appendChild(btn);
        });
    }

    makeChoice(choice) {
        this.manager.updateScore(choice.points);
        this.manager.showFeedback('📚 Ótima escolha!', 'success');

        this.currentScene = choice.next;
        setTimeout(() => this.showCurrentScene(), 1000);
    }

    levelComplete() {
        this.manager.updateLevel();
        this.manager.addAchievement('📖 Contador de Histórias!');

        if (this.manager.level <= this.manager.maxLevel) {
            setTimeout(() => {
                this.currentScene = 0;
                this.story = this.generateStory();
                this.start();
            }, 2000);
        } else {
            this.manager.finishGame();
        }
    }
}