const { appTemplate, timerTemplate } = require('./templates');

// This verbose syntax is so the cache-busting script notices these URLs
const NGRAM_FILES = {
    2 : './build/ngrams/2-letters.json',
    3 : './build/ngrams/3-letters.json'
};

const SEEN_STORAGE_KEY = 'seenNGrams';

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

    launchSettingsEditor(renderData) {
        this.renderApp(renderData);
        document.getElementById('settingsForm').addEventListener('submit', this.saveSettings.bind(this));
        document.getElementById('cancelEditSettings').addEventListener('click', this.handleSettingsCancel.bind(this));
    }

    closeSettingsEditor(renderData) {
        document.getElementById('settingsForm').removeEventListener('submit', this.saveSettings.bind(this));
        document.getElementById('cancelEditSettings').removeEventListener('click', this.handleSettingsCancel.bind(this));
        this.renderApp(renderData);
    }

    showTimeRemaining({remainingTime, originalTime}) {
        this.updateTimer(remainingTime, (originalTime / 60 >= 1));
    }

    updateTimer(remainingTime, showMinutes) {
        document.getElementById('timerContainer').innerHTML =
            timerTemplate(remainingTime, showMinutes);
    }

    handleSettingsOpen(e) {
        e.preventDefault();
        this.emitter.emit('edit-settings');
    }

    handleSettingsCancel(e) {
        e.preventDefault();
        this.emitter.emit('cancel-edit-settings');
    }

    handleSkip(e) {
        e.preventDefault();
        this.emitter.emit('skip-to-next');
    }

    saveSettings(e) {
        e.preventDefault();

        const form = e.target;
        const nGramLength = parseInt(
            document.getElementById('numberOfLettersSelector').value
        );
        const numWords = parseInt(
            document.getElementById('numberOfWordsSelector').value
        );
        const time = parseInt(
            document.getElementById('timeLimitSelector').value
        );
        this.emitter.emit('settings-change', {
            nGramLength,
            numWords,
            time
        });
    }

    renderApp(renderData) {
        document.body.innerHTML = appTemplate(renderData);
        this.bindEvents();
        moveCursorToEnd(document.getElementById('guessInput'));
    }

    guessHandler(e) {
        const input = e.target.value.trim().toLowerCase();
        this.guess(input);
    };

    bindEvents() {
        document.getElementById('guessInput').addEventListener('keyup', debounce(this.guessHandler, 50, this));
        document.getElementById('settingsLink').addEventListener('click', this.handleSettingsOpen.bind(this));
        document.getElementById('skipToNext').addEventListener('click', this.handleSkip.bind(this));
        document.addEventListener('keypress', (e) => {
            if ((e.keyCode === 13 || e.code === "Enter") && e.target.id === 'guessInput') {
                e.preventDefault();
            }
        });
    }

    retrieveSeenCache() {
        let seenNGrams = localStorage.getItem(SEEN_STORAGE_KEY);
        if (seenNGrams) {
            try {
                seenNGrams = Object.assign({}, JSON.parse(seenNGrams));
            }
            catch(err) {
                console.log(err);
                seenNGrams = {};
            }
        } else {
            seenNGrams = {};
        }
        return seenNGrams;
    }

    updateSeenCache(seenData) {
        try {
            let data = JSON.stringify(seenData);
            localStorage.setItem(SEEN_STORAGE_KEY, data);
        }
        catch(err) {
            console.log(err);
        }
    }

    loadNGramData(ngramLength) {
        return new Promise((resolve, reject) => {
            fetch(NGRAM_FILES[ngramLength]).then((response) => {
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
