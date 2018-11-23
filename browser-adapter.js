const { appTemplate, timerTemplate } = require('./templates');

const NGRAM_DATA_DIR = './ngrams/';
const NGRAM_FILE_SUFFIX = '-letters.json';


const debounce = (fn, time, thisContext) => {
    let timeout;

    return function() {
        const withContext = fn.apply(thisContext || this, arguments);
        clearTimeout(timeout);
        timeout = window.setTimeout(withContext, time);
    }
};

const moveCursorToEnd = (el) => {
	if (typeof el.selectionStart == "number") {
		el.selectionStart = el.selectionEnd = el.value.length;
        el.focus();
	} else if (typeof el.createTextRange != "undefined") {
		el.focus();
		const range = el.createTextRange();
		range.collapse(false);
		range.select();
	}
}

class BrowserAdapter {
    constructor(EventEmitter) {
        this.emitter = new EventEmitter();
    }

    guess(input) {
        this.emitter.emit('guess', input);
    }

    beginNewRound(renderData) {
        this.renderApp(renderData);
    }

    recordWin(renderData) {
        this.renderApp(renderData);
    }

    recordLoss(renderData) {
        this.renderApp(renderData);
    }

    recordCorrectGuess(renderData) {
        this.renderApp(renderData);
    }

    showTimeRemaining({remainingTime, originalTime}) {
        this.updateTimer(remainingTime, (originalTime / 60 >= 1));
    }

    updateTimer(remainingTime, showMinutes) {
        document.getElementById('timerContainer').innerHTML =
            timerTemplate(remainingTime, showMinutes);
    }

    renderApp(renderData) {
        document.body.innerHTML = appTemplate(renderData);
        this.bindEvents();
        moveCursorToEnd(document.getElementById('guessInput'));
    }

    guessHandler(e) {
        const input = e.target.value.trim();
        this.guess(input);
    };

    bindEvents() {
        document.getElementById('guessInput').addEventListener('keyup', debounce(this.guessHandler, 50, this));
    }

    loadNGramData(ngramLength) {
        return new Promise((resolve, reject) => {
            fetch('http://localhost:9000/' + NGRAM_DATA_DIR + ngramLength + NGRAM_FILE_SUFFIX).then((response) => {
                if (response.status >= 400) {
                    // no-op
                    console.log("request failed");
                    reject();
                }
                return response.json();
            }).then(data => {
                resolve(data);
            });
        });
    }
}

module.exports = BrowserAdapter;
