// src/adaptive/games/classification.js
// Jogo de Classificação para Deficiência Intelectual

export class ClassificationGame {
    constructor(manager) {
        this.manager = manager;
        this.categories = ['Animais', 'Frutas', 'Veículos'];
        this.currentCategory = 0;
        this.correctClassifications = 0;
    }

    start() {
        const content = document.getElementById('adaptive-game-area');
        content.innerHTML = `
            <div class="classification-header">
                <h3>Coloque cada item na categoria correta!</h3>
                <p>Arraste os itens para as caixas certas.</p>
            </div>
            <div class="classification-categories" id="categories-container"></div>
            <div class="classification-items" id="items-container"></div>
        `;

        this.setupCategories();
        this.createItems();
    }

    setupCategories() {
        const container = document.getElementById('categories-container');
        this.categories.forEach(category => {
            const categoryBox = document.createElement('div');
            categoryBox.className = 'category-box';
            categoryBox.dataset.category = category;
            categoryBox.innerHTML = `
                <h4>${category}</h4>
                <div class="category-drop-zone"></div>
            `;

            categoryBox.addEventListener('dragover', (e) => e.preventDefault());
            categoryBox.addEventListener('drop', (e) => this.handleDrop(e, category));
            container.appendChild(categoryBox);
        });
    }

    createItems() {
        const items = [
            { name: '🐶', category: 'Animais' },
            { name: '🍎', category: 'Frutas' },
            { name: '🚗', category: 'Veículos' },
            { name: '🐱', category: 'Animais' },
            { name: '🍌', category: 'Frutas' },
            { name: '🚌', category: 'Veículos' }
        ];

        const container = document.getElementById('items-container');
        const shuffledItems = [...items].sort(() => Math.random() - 0.5);

        shuffledItems.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'classification-item';
            itemEl.draggable = true;
            itemEl.dataset.category = item.category;
            itemEl.innerHTML = `<span class="item-emoji">${item.name}</span>`;

            itemEl.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify(item));
            });

            container.appendChild(itemEl);
        });
    }

    handleDrop(e, category) {
        e.preventDefault();
        const itemData = JSON.parse(e.dataTransfer.getData('text/plain'));

        if (itemData.category === category) {
            this.correctClassifications++;
            this.manager.updateScore(15);
            this.manager.showFeedback('✅ Classificação correta!', 'success');

            // Remove item da lista
            const draggedElement = document.querySelector(`[data-category="${itemData.category}"]`);
            if (draggedElement) draggedElement.remove();

            if (this.correctClassifications >= 6) {
                this.levelComplete();
            }
        } else {
            this.manager.resetCombo();
            this.manager.showFeedback('❌ Categoria errada! Tente novamente.', 'error');
        }
    }

    levelComplete() {
        this.manager.updateLevel();
        this.manager.addAchievement('🗂️ Mestre da Organização!');

        if (this.manager.level <= this.manager.maxLevel) {
            setTimeout(() => {
                this.correctClassifications = 0;
                this.start();
            }, 2000);
        } else {
            this.manager.finishGame();
        }
    }
}