"use strict";

const CountdownTimer = require('./countdown-timer');
const AppSettings = require('./app-settings');


const nGramDataDefaults = () => {
    return {
        hash : {},
        arr : [],
        seen : {},
        count : 0
    };
};
let nGramData;

const setObjProperty = (obj, key, val) => {
    if (obj.hasOwnProperty(key)) {
        obj[key] = val;
    }
};
const setViaHashOrPair = (targetObj, key, val) => {
    if (typeof key === 'string') {
        setObjProperty(targetObj, key, val);
    } else
    if (typeof key === 'object') {
        const obj = key;
        for (let k in obj) {
            setObjProperty(targetObj, k, obj[k]);
        }
    }
};

const currentNGramDefaults = () => {
   return {
        ngram : '',
        words : [],
        hash : {},
        guessed : 0,
        recentCorrectGuess : null,
        inputValue : '',
        win : false,
        lose : false,
        editingSettings : false
    }
};

class NGramGame {
    constructor(ioAdapter, timer, settings) {
        const currentNGram = currentNGramDefaults();
        let recentGuessTimer;

        this.getCurrent = () => currentNGram;
        this.setCurrent = (...args) => {
            setViaHashOrPair(currentNGram, ...args);
        };
        this.setAsGuessed = (word) => {
            currentNGram.hash[word] = true;
            currentNGram.guessed++;
            currentNGram.recentCorrectGuess = word;
            currentNGram.inputValue = '';
            clearTimeout(recentGuessTimer);
            recentGuessTimer = setTimeout(() => {
                currentNGram.recentCorrectGuess = null;
            }, 5000);
        };

        this.ioAdapter = ioAdapter;
        this.ioAdapter.emitter.on('guess', this.guess.bind(this));
        this.ioAdapter.emitter.on('settings-change', this.changeSettings.bind(this));
        this.ioAdapter.emitter.on('edit-settings', this.launchSettingsEditor.bind(this));
        this.ioAdapter.emitter.on('cancel-edit-settings', this.closeSettingsEditor.bind(this));

        this.timer = timer;
        // this.timer.emitter.on('zero', this.loseRound.bind(this));
        this.timer.emitter.on('tick', (remaining) => {
            this.ioAdapter.showTimeRemaining(this.renderData());
            if (remaining === 0) {
                this.loseRound();
            }
        });
        
        this.settings = settings;

        return this;
    }

    winRound() {
        this.timer.pause();
        this.setCurrent('win', true);
        this.ioAdapter.recordWin(this.renderData());
        setTimeout(this.newRound.bind(this), 5000);
        return this;
    }

    loseRound() {
        this.setCurrent({
            inputValue : '',
            lose : true
        });
        this.ioAdapter.recordLoss(this.renderData());
        setTimeout(this.newRound.bind(this), 5000);
        return this;
    }

    guess(guess) {
        this.setCurrent('inputValue', guess);

        const correctAndNew = this.getCurrent().hash.hasOwnProperty(guess) && this.getCurrent().hash[guess] === false;
        if (correctAndNew) {
            this.recordCorrectGuess(guess);
        }
        return this;
    }

    recordCorrectGuess(guess) {
        this.setAsGuessed(guess);
        if (this.getCurrent().guessed === this.settings.numWords()) {
            this.winRound();
        } else {
            this.ioAdapter.recordCorrectGuess(this.renderData());
        }
        return this;
    }

    newRound() {
        const ngram = randomNGram()
        const words = nGramData.hash[ngram].slice(0, this.settings.numWords());

        this.setCurrent(Object.assign({}, currentNGramDefaults(), {
            ngram : ngram,
            words : words,
            hash : words.reduce((acc, word) => {
                acc[word] = false;
                return acc;
            }, {})
        }));
        if (this.settings.time() !== this.timer.duration) {
            this.timer.changeDuration(this.settings.time());
        }
        this.timer.clear().start();
        this.ioAdapter.beginNewRound(this.renderData());

        nGramData.seen[ngram] = true;
        this.ioAdapter.updateSeenCache(nGramData.seen);
    }

    launchSettingsEditor() {
        this.timer.pause();
        this.setCurrent('editingSettings', true);
        this.ioAdapter.launchSettingsEditor(this.renderData());
    }

    changeSettings(settings) {
        let load = false;
        if (settings.nGramLength !== this.settings.nGramLength()) {
            load = true;
        }
        this.settings.reset(settings);
        this.setCurrent('editingSettings', false);

        if (load) {
            this.ioAdapter.loadNGramData(this.settings.nGramLength()).then((data) => {
                nGramData = storeNGramData(data, nGramData.seen);
                this.newRound();
            });
        } else {
            this.newRound();
        }
    }

    closeSettingsEditor() {
        this.setCurrent('editingSettings', false);
        this.ioAdapter.closeSettingsEditor(this.renderData());
        this.timer.start();
    }

    renderData() {
        return Object.assign({}, this.getCurrent(), {
            originalTime : this.timer.duration,
            remainingTime : this.timer.remaining,
            numWords : this.settings.numWords(),
            ngramLength : this.settings.nGramLength()
        });
    }
}

const storeNGramData = (data, seen) => {
    const _nGramData = Object.assign(nGramDataDefaults(), {
        hash : data,
        arr : Object.keys(data),
        count : Object.keys(data).length,
    });
    if (seen) {
        _nGramData.seen = seen;
    }
    return _nGramData;
};

const randomNGram = (i = 0) => {
    if (i >= nGramData.count) {
        nGramData.seen = {};
        updateSeenCache({});
    }

    const index = Math.floor(
        Math.random() * (nGramData.count)
    );
    const ngram = nGramData.arr[index];
    return nGramData.seen[ngram] ? 
        randomNGram(i+1) :
        ngram;
};

const start = (EventEmitter, ioAdapter, settings) => {
    const appSettings = new AppSettings(settings);
    const timer = new CountdownTimer(appSettings.time(), new EventEmitter());

    ioAdapter.loadNGramData(appSettings.nGramLength()).then((data) => {
        nGramData = storeNGramData(data, ioAdapter.retrieveSeenCache());
        const game = new NGramGame(
            ioAdapter,
            timer,
            appSettings
        ).newRound();
    }, (err) => {
        console.log(err);
    });
};

module.exports = { start };
