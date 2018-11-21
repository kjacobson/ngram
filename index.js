"use strict";

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Promise = require('es6-promise');
const EventEmitter = require('events');
const fetch = require('isomorphic-fetch');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
const currentNGram = {
    ngram : '',
    words : [],
    hash : {},
    count : 0,
    correct : 0
};
let timer;

const winRound = (timer) => {
    timer.pause(); 
    rl.pause();
    console.log('You win!');
    newRound();
};

const loseRound = () => {
    rl.pause();
    console.log('You lose :-\(');
    newRound();
};

const testGuess = (guess, timer) => {
    const correctAndNew = currentNGram.hash.hasOwnProperty(guess) && currentNGram.hash[guess] === false;
    if (correctAndNew) {
        currentNGram.hash[guess] = true;
        currentNGram.correct++;
        console.log("Correct guess: " + guess);
        console.log((currentNGram.count - currentNGram.correct) + " words to go");
        if (currentNGram.correct === currentNGram.count) {
            winRound(timer);
        }
    }
    return correctAndNew;
};

const newRound = () => {
    const ngram = randomNGram()
    currentNGram.ngram = ngram;
    currentNGram.words = nGramData.hash[ngram];
    currentNGram.count = currentNGram.words.length;
    currentNGram.correct = 0;
    currentNGram.hash = currentNGram.words.reduce((acc, word) => {
        acc[word] = false;
        return acc;
    }, {});
    console.log(currentNGram.hash);
    rl.setPrompt(`What are the top ${appSettings.numWords} words beginning with ${currentNGram.ngram}?`);
    rl.prompt();
    timer.clear().start();
};

const storeNGramData = (data) => {
    nGramData.hash = data;
    nGramData.arr = Object.keys(data);
    nGramData.count = nGramData.arr.length;
};

class CountdownTimer {
    constructor(duration) {
        this.duration = duration;
        this.remaining = duration;
        this.running = false;
        this.emitter = new EventEmitter();
        this._tick = this._tick.bind(this);
        return this;
    }
    tick() {
        if (this.remaining % 5 === 0) {
            console.log(this.formattedTime());
        }
        setTimeout(this._tick, 1000);
        return this;
    }
    _tick() {
        if (this.running) {
            this.remaining--;
            if (this.remaining) {
                this.tick();
            } else {
                this.running = false;
                this.emitter.emit('zero');
            }
        }
        return this;
    }
    start() {
        this.running = true;
        this.tick();
        return this;
    }
    pause () {
        this.running = false;
        return this;
    }
    clear () {
        this.running = false;
        this.remaining = this.duration;
        return this;
    }
    changeDuration (duration) {
        if (!this.running) {
            this.duration = duration;
            this.clear();
        }
        return this;
    }
    formattedTime () {
        const showMinutes = this.duration / 60 > 1;
        const minutes = this.remaining / 60;
        const minutesInt = Math.floor(minutes);
        let seconds = this.remaining % 60;
        if (seconds < 10) {
            seconds = '0' + seconds;
        }
        return showMinutes || minutesInt ?
            minutesInt + ':' + seconds :
            seconds + '';
    }
}

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
        Math.random(nGramData.count) * 100
    );
    const ngram = nGramData.arr[index];
    return nGramData.seen[ngram] ? 
        randomNGram() :
        ngram;
};

loadNGramData().then((data) => {
    timer = new CountdownTimer(appSettings.time)
    timer.emitter.on('zero', () => {
        loseRound();
    });
    storeNGramData(JSON.parse(data));
    newRound();
    rl.on('line', (line) => {
        line = line.trim();
        if (testGuess(line, timer)) {
        }
    });
});
