"use strict";

require('es6-promise').polyfill();
require('isomorphic-fetch');

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const CountdownTimer = require('./countdown-timer');
const AppSettings = require('./app-settings');

const NGRAM_DATA_DIR = './ngrams/';
const NGRAM_FILE_SUFFIX = '-letters.json';

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
            guessed : 0
        };
        this.getCurrent = () => currentNGram;
        this.setCurrent = (...args) => {
            setViaHashOrPair(currentNGram, ...args);
        };
        this.setAsGuessed = (word) => {
            currentNGram.hash[word] = true;
            currentNGram.guessed++;
        };

        this.ioAdapter = ioAdapter;
        this.ioAdapter.emitter.on('guess', this.guess.bind(this));

        this.timer = timer;
        this.timer.emitter.on('zero', this.loseRound.bind(this));
        this.timer.emitter.on('tick', (remaining) => {
            if (remaining % 5 === 0) {
                this.ioAdapter.showTimeRemaining(this.timer.formattedTime());
            }
        });
        
        this.settings = settings;

        return this;
    }

    winRound() {
        this.timer.pause();
        this.ioAdapter.recordWin();
        this.newRound();
        return this;
    }

    loseRound() {
        this.ioAdapter.recordLoss();
        this.newRound();
        return this;
    }

    guess(guess) {
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
            this.ioAdapter.recordCorrectGuess(guess, this.settings.numWords() - this.getCurrent().guessed);
            this.ioAdapter.showProgress(this.getCurrent().hash);
        }
        return this;
    }

    newRound() {
        const ngram = randomNGram()
        const words = nGramData.hash[ngram].slice(0, this.settings.numWords());
        this.setCurrent({
            ngram : ngram,
            words : words,
            guessed : 0,
            hash : words.reduce((acc, word) => {
                acc[word] = false;
                return acc;
            }, {})
        });
        this.ioAdapter.beginNewRound(this.settings.numWords(), ngram, words);
        this.timer.clear().start();
    }
}

const storeNGramData = (data) => {
    nGramData.hash = data;
    nGramData.arr = Object.keys(data);
    nGramData.count = nGramData.arr.length;
};

const loadNGramData = (ngramLength) => {
    return new Promise((resolve, reject) => {
        fs.readFile(
            path.resolve(NGRAM_DATA_DIR, ngramLength + NGRAM_FILE_SUFFIX)
        , (err, data) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            resolve(data);
        });
    });
};

// const loadNGramData = () => {
//     return new Promise((resolve, reject) => {
//         fetch('https://localhost:3000/' + appSettings.numLetters + NGRAM_FILE_SUFFIX).then((response) => {
//             if (response.status >= 400) {
//                 // no-op
//                 console.log("request failed");
//                 reject();
//             }
//             return response.json();
//         }).then(data => {
//             resolve(data);
//         });
//     });
// };

const randomNGram = () => {
    const index = Math.floor(
        Math.random() * (nGramData.count)
    );
    const ngram = nGramData.arr[index];
    return nGramData.seen[ngram] ? 
        randomNGram() :
        ngram;
};

const start = (uiAdapter, settings) => {
    const appSettings = new AppSettings(settings);
    const timer = new CountdownTimer(appSettings.time(), new EventEmitter());

    loadNGramData(appSettings.nGramLength()).then((data) => {
        storeNGramData(JSON.parse(data));
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
