const readline = require('readline');
const EventEmitter = require('events');

class CliAdapter {
    constructor() {
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

    beginNewRound(numWords, ngram, answers) {
        console.log(answers);
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

    recordCorrectGuess(guess, wordsToGo) {
        console.log("Correct guess: " + guess);
        console.log(wordsToGo + " words to go");
    }

    showTimeRemaining(timeRemaining) {
        console.log(timeRemaining);
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
}

module.exports = CliAdapter;
