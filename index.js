"use strict";

require('es6-promise').polyfill();
require('isomorphic-fetch');

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const EventEmitter = require('events');

const CountdownTimer = require('./countdown-timer');

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
    timer = new CountdownTimer(appSettings.time, EventEmitter);
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
