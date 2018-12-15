'use strict';

const CHOICES = {
    numWords : {
        3 : 3,
        5 : 5
    },
    nGramLength : {
        2 : 2,
        3 : 3
    },
    time : {
        30 : 30,
        45 : 45,
        60 : 60,
        120 : 120
    }
};

const DEFAULTS = {
    numWords : CHOICES.numWords[5],
    nGramLength : CHOICES.nGramLength[3],
    time : CHOICES.time[60]
};

const validator = {
    set : (obj, prop, value) => {
        obj[prop] = CHOICES[prop].hasOwnProperty(value) ? 
            value :
            DEFAULTS[prop];

        return true;
    }
};

const nGramDataDefaults = () => {
    return {
        hash : {},
        arr : [],
        seen : {},
        count : 0
    };
};


class AppSettings {
    constructor(settings = {}) {
        this.settings = new Proxy(Object.assign({}, DEFAULTS), validator);
        this.reset(settings);

        this.nGramData = nGramDataDefaults();
        return this;
    }

    reset(settings = {}) {
        const { numWords, nGramLength, time  } = settings;
        this.settings.numWords = numWords;
        this.settings.nGramLength = nGramLength;
        this.settings.time = time;
        return this;
    }

    storeNGramData(data, seen) {
        this.nGramData = Object.assign(nGramDataDefaults(), {
            hash : data,
            arr : Object.keys(data),
            count : Object.keys(data).length,
            seen : seen || {}
        });
        return this;
    }

    retrieveWordsForNGram(ngram) {
        return this.nGramData.hash[ngram].slice(0, this.numWords());
    }

    numWords() {
        return this.settings.numWords;
    }

    nGramLength() {
        return this.settings.nGramLength;
    }

    time() {
        return this.settings.time;
    }
}

module.exports = AppSettings;
