const fs = require('fs');
const Promise = require('es6-promise');
const fetch = require('isomorphic-fetch');
const commandLineArgs = require('command-line-args');

const args = [
  { name: 'min-words', alias: 'w', type: Number, defaultValue: 5 },
  { name: 'letters', alias: 'l', type: Number, defaultValue: 3 },
  { name: 'query-limit', alias: 'q', type: Number, defaultValue: 15 },
  { name: 'min-freq', alias: 'f', type: Number, defaultValue: 0.4 }
];
const config = commandLineArgs(args);

const ALPHABET = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];
const numLetters = config.letters;
const minQualifyingWords = config['min-words'];
const queryLimit = config['query-limit'];
const frequencyThreshold = config['min-freq'];
const scoreThreshold = 900;
const results = [];
const knownNGrams = {};

const sortByFrequency = (words) => {
    return words.map((word) => {
        const wordFrequency = word.tags[word.tags.length-1].substring(2);
        word.frequency = parseFloat(wordFrequency, 10);
        return word;  
    }).sort((a, b) => {
        if (a.frequency > b.frequency) {
            return -1;
        } else
        if (a.frequency < b.frequency) {
            return 1;
        } else {
            return 0;
        }
    });
};
const isNotProperNoun = (word) => {
    return word.tags.indexOf('prop') === -1;
};
const isOneWord = (word) => {
    return word.word.indexOf(' ') === -1;
};
// A weak proxy for eliminating abbreviations
const containsVowels = (word) => {
    return word.word.match(/[aeiouy]/);
};

const addKnownNGram = (ngram, response) => {
    const words = response.map((entry) => {
        return entry.word;
    });
    console.log(`Top words for ngram ${ngram}: ${words.join(", ")}`);
    knownNGrams[ngram] = words;
};

const train = (resultsArr, i = 0) => {
    fetchTopWords(resultsArr[i], minQualifyingWords).then(() => {
        if (i + 1 < resultsArr.length) {
            train(resultsArr, i+1)
        } else {
            try {
                const asJSON = JSON.stringify(knownNGrams);
                fs.writeFileSync('./static/ngrams/' + numLetters + '-letters.json', asJSON);
            } catch (e) {
                console.error(e);
            }
        }
    });
};

const fetchTopWords = (ngram, minQualifyingWords) => {
    // console.log('Fetching top words for ngram "' + ngram);
    return new Promise((res, rej) => {
        fetch(`https://api.datamuse.com/words?sp=${ngram}*&max=${queryLimit}&md=fp`).then(response => {
            if (response.status >= 400) {
                // no-op
                console.log("request failed");
                res();
            }
            return response.json();
        }).then(words => {
            words = words.filter(isNotProperNoun).filter(isOneWord).filter(containsVowels);
            words = sortByFrequency(words);
            
            if (words.length >= minQualifyingWords && words[minQualifyingWords-1].frequency > frequencyThreshold) {
                addKnownNGram(ngram, words);
            } else {
                // console.log("Too few matches for ngram '" + ngram);
            }
            res();
        }, err => {
            console.error(err);
        });
    });
};

const fillLetterSpace = (key, space, depth) => {
    ALPHABET.forEach((letter) => {
        if (depth < numLetters) {
            space[key + letter] = {};
            fillLetterSpace(key + letter, space[key + letter], depth+1);
        } else {
            results.push(key + letter);
        }
    });
};
fillLetterSpace('', {}, 1);
train(results);
