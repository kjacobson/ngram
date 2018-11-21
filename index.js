"use strict";

require('es6-promise').polyfill();
require('isomorphic-fetch');

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const CliAdapter = require('./cli-adapter');
const CountdownTimer = require('./countdown-timer');

const NGRAM_DATA_DIR = './ngrams/';
const NGRAM_FILE_SUFFIX = '-letters.json';

const fetchSettings = () => {};

const appSettings = {
    numWords : 5,
    numLetters : 3,
    time : 60
};
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

class NGramGame {
    constructor(ioAdapter, timer) {
        const currentNGram = {
            ngram : '',
            words : [],
            hash : {},
            count : 0,
            guessed : 0
        };
        this.getCurrent = () => currentNGram;
        this.setCurrent = (key, val) => {
            if (typeof key === 'string') {
                setObjProperty(currentNGram, key, val);
            } else
            if (typeof key === 'object') {
                const obj = key;
                for (let k in obj) {
                    setObjProperty(currentNGram, k, obj[k]);
                }
            }
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
        if (this.getCurrent().guessed === this.getCurrent().count) {
            this.winRound();
        } else {
            this.ioAdapter.recordCorrectGuess(guess, this.getCurrent().count - this.getCurrent().guessed);
            this.ioAdapter.showProgress(this.getCurrent().hash);
        }
        return this;
    }

    newRound() {
        const ngram = randomNGram()
        const words = nGramData.hash[ngram];
        this.setCurrent({
            ngram : ngram,
            words : words,
            count : words.length,
            guessed : 0,
            hash : words.reduce((acc, word) => {
                acc[word] = false;
                return acc;
            }, {})
        });
        this.ioAdapter.beginNewRound(words.length, ngram, words);
        this.timer.clear().start();
    }
}

const storeNGramData = (data) => {
    nGramData.hash = data;
    nGramData.arr = Object.keys(data);
    nGramData.count = nGramData.arr.length;
};

const loadNGramData = () => {
    return new Promise((resolve, reject) => {
        fs.readFile(
            path.resolve(NGRAM_DATA_DIR, appSettings.numLetters + NGRAM_FILE_SUFFIX)
        , (err, data) => {
            if (err) {
                console.log(err);
                reject(err);
            }
            resolve(data);
        });
    });
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

loadNGramData().then((data) => {
    storeNGramData(JSON.parse(data));

    const timer = new CountdownTimer(appSettings.time, new EventEmitter());
    const game = new NGramGame(
        new CliAdapter(),
        timer
    ).newRound();
});
