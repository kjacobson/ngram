const readline = require('readline');
const path = require('path');
// const fs = require('fs');

const NGRAM_DATA_DIR = './ngrams/';
const NGRAM_FILE_SUFFIX = '-letters.json';

class CliAdapter {
    constructor(EventEmitter) {
        this.emitter = new EventEmitter();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        }); 
        this.rl.on('line', this.guess.bind(this));
    }

    guess(line) {
        this.emitter.emit('guess', line.trim());
    }

    beginNewRound({numWords, ngram, words}) {
        console.log(words);
        this.rl.setPrompt(`What are the top ${numWords} words beginning with ${ngram}?`);
        this.rl.prompt();
        console.log("\n\n");
    }

    recordWin() {
        this.rl.pause();
        console.log('You win!');
    }

    recordLoss() {
        this.rl.pause();
        console.log('You lose :-\(');
    }

    recordCorrectGuess({recentCorrectGuess, numWords, guessed, hash}) {
        console.log("Correct guess: " + recentCorrectGuess);
        console.log((numWords - guessed) + " words to go");
        this.showProgress(hash);
    }

    showTimeRemaining({remainingTime}) {
        if (remainingTime % 5 === 0) {
            console.log(remainingTime);
        }
    }

    showProgress(guesses) {
        let i = 1;
        console.log('  ___');
        for (let word in guesses) {
            if (guesses[word]) {
                console.log(i + '| ' + word);
            } else {
                console.log(i + '|');
            }
            i++;
        }
        console.log('  ‾‾‾');
    }


    loadNGramData(ngramLength) {
        return new Promise((resolve, reject) => {
            try {
                const data = require(
                    path.resolve(NGRAM_DATA_DIR, ngramLength + NGRAM_FILE_SUFFIX)
                );
                resolve(data);
            }
            catch(e) {
                console.log(e);
                reject(e);
            }
        });
    }
}


// const loadNGramData = (ngramLength) => {
//     return new Promise((resolve, reject) => {
//         fs.readFile(
//             path.resolve(NGRAM_DATA_DIR, ngramLength + NGRAM_FILE_SUFFIX)
//         , (err, data) => {
//             if (err) {
//                 console.log(err);
//                 reject(err);
//             }
//             resolve(JSON.parse(data));
//         });
//     });
// };

module.exports = CliAdapter;
