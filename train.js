const fs = require('fs');
const Promise = require('es6-promise');
const fetch = require('isomorphic-fetch');
const commandLineArgs = require('command-line-args');
const stemmer = require('stemmer');

const config = require('./config.json');
const top5k = require('./top-5000-words.json');

const args = [
  { name: 'min-words', alias: 'w', type: Number, defaultValue: 5 },
  { name: 'letters', alias: 'l', type: Number, defaultValue: 3 },
  { name: 'query-limit', alias: 'q', type: Number, defaultValue: 15 },
  { name: 'min-freq', alias: 'f', type: Number, defaultValue: 0.5 }
];
const settings = commandLineArgs(args);
const previousData = require(`./static/ngrams/${settings.letters}-letters.json`);

const ALPHABET = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];
const OXFORD_API_KEY = config.oxford.key;
const OXFORD_APP_ID = config.oxford.app_id;

const numLetters = settings.letters;
const minQualifyingWords = settings['min-words'];
const queryLimit = settings['query-limit'];
const frequencyThreshold = settings['min-freq'];
const scoreThreshold = 900;
const knownNGrams = {};

const getOxfordFrequencies = (words) => {
    const wordString = words.map(entry => entry.word).join(',');
    return new Promise((resolve, reject) => {
        fetch(`https://od-api.oxforddictionaries.com/api/v2/stats/frequency/words/en/?corpus=nmc&wordforms=${wordString}&limit=100&sort=frequency`, {
            headers : {
                'Accept': 'application/json',
                'app_id': OXFORD_APP_ID,
                'app_key': OXFORD_API_KEY
            }
        }).then(response => {
            if (response.status >= 400) {
                // no-op
                console.log("request failed");
                reject();
            }
            return response.json();
        }).then(data => {
            if (data && data.results) {
                const wordFrequencies = data.results.reduce((acc, result) => {
                    let word = result.trueCase,
                        frequency = result.frequency;
                    delete acc[word];
                    acc[word] = frequency;
                    return acc;
                }, {});
                resolve(wordFrequencies);
            } else {
                reject(data);
            }
        });
    });
};

const sortByFrequency = (words, frequencies) => {
    console.log(frequencies);
    return words.map((word) => {
        const wordFrequency = word.tags[word.tags.length-1].substring(2);
        word.frequency = parseFloat(wordFrequency, 10);
        word.frequencyRank = parseInt(top5k[word.word] || 5001, 10);
        if (frequencies) {
            word.oxfordFrequency = frequencies[word.word];
        }
        return word;  
    }).sort((a, b) => {
        if (a.frequencyRank === b.frequencyRank) {
            if (a.frequency > b.frequency) {
                return -1;
            } else
            if (a.frequency < b.frequency) {
                return 1;
            } else {
                return 0;
            }
        } else
        if (a.frequencyRank < b.frequencyRank) {
            return -1;
        } else
        if (b.frequencyRank < a.frequencyRank) {
            return 1;
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

const addStem = (word) => {
    word.stem = stemmer(word.word);
    return word;
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
            getOxfordFrequencies(words).then((frequencies) => {
                words = sortByFrequency(words, frequencies);
                words = words.map(addStem);
                console.log(words);
                if (words.length >= minQualifyingWords && words[minQualifyingWords-1].frequency > frequencyThreshold) {
                    addKnownNGram(ngram, words);
                } else {
                    // console.log("Too few matches for ngram '" + ngram);
                }
                res();
            }, (err) => {
                console.error(err);
                res();
            });
        }, err => {
            res();
            console.error(err);
        });
    });
};

const fillLetterSpace = (results, key, space, depth) => {
    ALPHABET.forEach((letter) => {
        if (depth < numLetters) {
            space[key + letter] = {};
            fillLetterSpace(results, key + letter, space[key + letter], depth+1);
        } else {
            results.push(key + letter);
        }
    });
    return results;
};
train(previousData ? Object.keys(previousData) : fillLetterSpace([], '', {}, 1));
