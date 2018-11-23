const appTemplate = require('./templates');

class BrowserAdapter {
    constructor(EventEmitter) {
        this.emitter = new EventEmitter();
    }

    guess(input) {
        this.emitter.emit('guess', input.trim());
    }

    beginNewRound(renderData) {
        renderApp(renderData);
    }

    recordWin(renderData) {
        renderApp(renderData);
    }

    recordLoss(renderData) {
        renderApp(renderData);
    }

    recordCorrectGuess(renderData) {
        renderApp(renderData);
    }

    showTimeRemaining(renderData) {
        renderApp(renderData);
    }

    renderApp(renderData) {
        document.body.innerHTML = appTemplate(renderData);
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('guessInput').addEventListener('onkeydown', (e) => {
            const input = e.target.value;
            this.guess(input);
        });
    }
}

module.exports = BrowserAdapter;
