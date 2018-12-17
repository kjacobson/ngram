if (typeof Symbol !== 'function') {
    const Symbol = (input) => {
        return input;
    };
}
const { appTemplate, timerTemplate } = require('./templates');

// This verbose syntax is so the cache-busting script notices these URLs
const NGRAM_FILES = {
    2 : './public/ngrams/2-letters.json',
    3 : './public/ngrams/3-letters.json'
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


/* PRIVATE INSTANCE METHOD SETUP */
const 
    listenForUpdate = Symbol('listenForUpdate'),
    guess = Symbol('guess'),
    handleSettingsOpen = Symbol('handleSettingsOpen'),
    handleSettingsCancel = Symbol('handleSettingsCancel'),
    handleSkip = Symbol('handleSkip'),
    guessHandler = Symbol('guessHandler'),
    saveSettings = Symbol('saveSettings'),
    renderApp = Symbol('renderApp'),
    updateTimer = Symbol('updateTimer'),
    bindEvents = Symbol('bindEvents');

class BrowserAdapter {
    constructor(EventEmitter) {
        this.emitter = new EventEmitter();

        this[listenForUpdate]();
        document.onvisibilitychange = () => {
            this.emitter.emit('visibility-change', document.hidden);
        };
    }

    /* *
     *
     * PUBLIC INTERFACE 
     *
     * */

    /* SETUP*/
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

    /* LOCAL STORAGE CACHE */
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

    /* RENDERING */

    beginNewRound(renderData) {
        this[renderApp](renderData);
    }

    recordWin(renderData) {
        this[renderApp](renderData);
    }

    recordLoss(renderData) {
        this[renderApp](renderData);
    }

    recordCorrectGuess(renderData) {
        this[renderApp](renderData);
    }

    showTimeRemaining({remainingTime, originalTime}) {
        this[updateTimer](remainingTime, (originalTime / 60 >= 1));
    }

    launchSettingsEditor(renderData) {
        this[renderApp](renderData);
        document.getElementById('settingsForm').addEventListener('submit', this[saveSettings].bind(this));
        document.getElementById('cancelEditSettings').addEventListener('click', this[handleSettingsCancel].bind(this));
    }

    closeSettingsEditor(renderData) {
        document.getElementById('settingsForm').removeEventListener('submit', this[saveSettings].bind(this));
        document.getElementById('cancelEditSettings').removeEventListener('click', this[handleSettingsCancel].bind(this));
        this[renderApp](renderData);
    }


    /* *
     *
     * PRIVATE METHODS
     *
     * */

    [listenForUpdate]() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if (message.etag && localStorage && localStorage.getItem('indexETag') !== message.etag) {
                    console.log(message.url + " has changed");
                    localStorage.setItem('indexETag', message.etag);

                    if (message.type === 'refresh') {
                        document.body.classList.add('update-available');
                    }
                }
            };
        }
    }

    [guess](input) {
        this.emitter.emit('guess', input);
    }


    /* EVENT HANDLING */
    [handleSettingsOpen](e) {
        e.preventDefault();
        this.emitter.emit('edit-settings');
    }

    [handleSettingsCancel](e) {
        e.preventDefault();
        this.emitter.emit('cancel-edit-settings');
    }

    [handleSkip](e) {
        e.preventDefault();
        this.emitter.emit('skip-to-next');
    }

    [guessHandler](e) {
        const input = e.target.value.trim().toLowerCase();
        this[guess](input);
    };

    [saveSettings](e) {
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

    /* RENDERING */
    [renderApp](renderData) {
        document.getElementById('appContainer').innerHTML = appTemplate(renderData);
        this[bindEvents]();
        moveCursorToEnd(document.getElementById('guessInput'));
    }

    [updateTimer](remainingTime, showMinutes) {
        document.getElementById('timerContainer').innerHTML =
            timerTemplate(remainingTime, showMinutes);
    }

    [bindEvents]() {
        document.getElementById('guessInput').addEventListener('keyup', debounce(this[guessHandler], 50, this));
        document.getElementById('settingsLink').addEventListener('click', this[handleSettingsOpen].bind(this));
        document.getElementById('skipToNext').addEventListener('click', this[handleSkip].bind(this));
        document.addEventListener('keypress', (e) => {
            if ((e.keyCode === 13 || e.code === "Enter") && e.target.id === 'guessInput') {
                e.preventDefault();
            }
        });
    }
}

module.exports = BrowserAdapter;
