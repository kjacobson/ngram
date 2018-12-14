'use strict';

const DEFAULTS = {
    ngram : '',
    words : [],
    hash : {},
    guessed : 0,
    recentCorrectGuess : null,
    inputValue : '',
    win : false,
    lose : false
}

const gameplayValidators = {
    ngram: (value) => {
        return typeof value === "string";
    },
    words: (value) => {
        return Array.isArray(value);
    },
    hash : (value) => {
        return typeof value === "object";
    },
    guessed : (value) => {
        return typeof value === "number" && Number.isInteger(value);
    },
    recentCorrectGuess : (value, obj) => {
        return value === null ||
            (typeof value === "string" && obj.hash.hasOwnProperty(value));
    },
    inputValue: (value) => {
        return typeof value === "string";
    },
    win: (value) => {
        return typeof value === "boolean";
    },
    lose: (value) => {
        return typeof value === "boolean";
    }
}

const gameplayValidator = {
    set : (obj, prop, value) => {
        if (gameplayValidators.hasOwnProperty(prop) && gameplayValidators[prop](value, obj)) {
            obj[prop] = value;
            return true;
        } else {
            obj[prop] = DEFAULTS[prop];
            return false;
        }
    }
}

class GameplaySettings {
    constructor() {
        this.settings = new Proxy(Object.assign({}, DEFAULTS), gameplayValidator);
        this.editing = false;
        return this;
    }

    setAsGuessed(word) {
        this.settings.hash[word] = true;
        this.settings.guessed++;
        this.settings.recentCorrectGuess = word;
        this.settings.inputValue = '';
        clearTimeout(this.recentGuessTimer);
        this.recentGuessTimer = setTimeout(() => {
            this.settings.recentCorrectGuess = null;
        }, 5000);
    }

    win() {
        this.settings.win = true;
    }

    lose() {
        this.settings.inputValue = DEFAULTS.inputValue;
        this.settings.lose = true;
    }

    guess(guess) {
        this.settings.inputValue = guess;
        return this.isCorrectAndNewGuess(guess);
    }

    newRound(ngram, words) {
        Object.assign(this.settings, DEFAULTS, {
            ngram : ngram,
            words : words,
            hash : words.reduce((acc, word) => {
                acc[word] = false;
                return acc;
            }, {})
        });
    }

    isCorrectAndNewGuess(guess) {
        return this.settings.hash.hasOwnProperty(guess) &&
            this.settings.hash[guess] === false;
    }

    isWon() {
        return this.settings.guessed === this.settings.words.length;
    }
}

module.exports = GameplaySettings;
