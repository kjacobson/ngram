"use strict";

const CountdownTimer = require('./countdown-timer');
const AppSettings = require('./app-settings');

const nGramData = {
    hash : {},
    arr : [],
    seen : {},
    count : 0
};

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

class NGramGame {
    constructor(ioAdapter, timer, settings) {
        const currentNGram = {
            ngram : '',
            words : [],
            hash : {},
            guessed : 0,
            recentCorrectGuess : null,
            inputValue : ''
        };
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
        this.ioAdapter.recordWin(this.renderData());
        setTimeout(this.newRound.bind(this), 5000);
        return this;
    }

    loseRound() {
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

        nGramData.seen[ngram] = true;
        this.setCurrent({
            ngram : ngram,
            words : words,
            guessed : 0,
            recentCorrectGuess : null,
            inputValue : '',
            hash : words.reduce((acc, word) => {
                acc[word] = false;
                return acc;
            }, {})
        });
        this.timer.clear().start();
        this.ioAdapter.beginNewRound(this.renderData());
    }

    renderData() {
        return Object.assign({}, this.getCurrent(), {
            remainingTime : this.timer.formattedTime(),
            numWords : this.settings.numWords()
        });
    }
}

const storeNGramData = (data) => {
    nGramData.hash = data;
    nGramData.arr = Object.keys(data);
    nGramData.count = nGramData.arr.length;
};

const randomNGram = () => {
    const index = Math.floor(
        Math.random() * (nGramData.count)
    );
    const ngram = nGramData.arr[index];
    return nGramData.seen[ngram] ? 
        randomNGram() :
        ngram;
};

const start = (EventEmitter, uiAdapter, settings) => {
    const appSettings = new AppSettings(settings);
    const timer = new CountdownTimer(appSettings.time(), new EventEmitter());

    uiAdapter.loadNGramData(appSettings.nGramLength()).then((data) => {
        storeNGramData(data);
        const game = new NGramGame(
            uiAdapter,
            timer,
            appSettings
        ).newRound();
    }, (err) => {
        console.log(err);
    });
};

module.exports = { start };
