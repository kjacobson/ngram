(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

class AppSettings {
    constructor(settings = {}) {
        this.settings = new Proxy(Object.assign({}, DEFAULTS), validator);
        this.reset(settings);
        return this;
    }

    reset(settings = {}) {
        const { numWords, nGramLength, time } = settings;
        this.settings.numWords = numWords;
        this.settings.nGramLength = nGramLength;
        this.settings.time = time;
        return this;
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

},{}],2:[function(require,module,exports){
const { appTemplate, timerTemplate } = require('./templates');

const NGRAM_DATA_DIR = './ngrams/';
const NGRAM_FILE_SUFFIX = '-letters.json';


const debounce = (fn, time, thisContext) => {
    let timeout;

    return function() {
        const withContext = fn.apply(thisContext || this, arguments);
        clearTimeout(timeout);
        timeout = window.setTimeout(withContext, time);
    }
};

const moveCursorToEnd = (el) => {
	if (typeof el.selectionStart == "number") {
		el.selectionStart = el.selectionEnd = el.value.length;
        el.focus();
	} else if (typeof el.createTextRange != "undefined") {
		el.focus();
		const range = el.createTextRange();
		range.collapse(false);
		range.select();
	}
}

class BrowserAdapter {
    constructor(EventEmitter) {
        this.emitter = new EventEmitter();
    }

    guess(input) {
        this.emitter.emit('guess', input);
    }

    beginNewRound(renderData) {
        this.renderApp(renderData);
    }

    recordWin(renderData) {
        this.renderApp(renderData);
    }

    recordLoss(renderData) {
        this.renderApp(renderData);
    }

    recordCorrectGuess(renderData) {
        this.renderApp(renderData);
    }

    launchSettingsEditor(renderData) {
        this.renderApp(renderData);
        document.getElementById('settingsForm').addEventListener('submit', this.saveSettings.bind(this));
        document.getElementById('cancelEditSettings').addEventListener('click', this.handleSettingsCancel.bind(this));
    }

    closeSettingsEditor(renderData) {
        document.getElementById('settingsForm').removeEventListener('submit', this.saveSettings.bind(this));
        document.getElementById('cancelEditSettings').removeEventListener('click', this.handleSettingsCancel.bind(this));
        this.renderApp(renderData);
    }

    showTimeRemaining({remainingTime, originalTime}) {
        this.updateTimer(remainingTime, (originalTime / 60 >= 1));
    }

    updateTimer(remainingTime, showMinutes) {
        document.getElementById('timerContainer').innerHTML =
            timerTemplate(remainingTime, showMinutes);
    }

    handleSettingsOpen(e) {
        e.preventDefault();
        this.emitter.emit('edit-settings');
    }

    handleSettingsCancel(e) {
        e.preventDefault();
        this.emitter.emit('cancel-edit-settings');
    }

    saveSettings(e) {
        e.preventDefault();

        const form = e.target;
        const nGramLength = parseInt(
            document.getElementById('numberOfLettersSelector').value
        );
        const numWords = parseInt(
            document.getElementById('numberOfWordsSelector').value
        );
        const time = parseInt(
            document.getElementById('timeLimitSelector').value
        );
        this.emitter.emit('settings-change', {
            nGramLength,
            numWords,
            time
        });
    }

    renderApp(renderData) {
        document.body.innerHTML = appTemplate(renderData);
        this.bindEvents();
        moveCursorToEnd(document.getElementById('guessInput'));
    }

    guessHandler(e) {
        const input = e.target.value.trim();
        this.guess(input);
    };

    bindEvents() {
        document.getElementById('guessInput').addEventListener('keyup', debounce(this.guessHandler, 50, this));
        document.getElementById('settingsLink').addEventListener('click', this.handleSettingsOpen.bind(this));
    }

    loadNGramData(ngramLength) {
        return new Promise((resolve, reject) => {
            fetch('http://localhost:9000/' + NGRAM_DATA_DIR + ngramLength + NGRAM_FILE_SUFFIX).then((response) => {
                if (response.status >= 400) {
                    // no-op
                    console.log("request failed");
                    reject();
                }
                return response.json();
            }).then(data => {
                resolve(data);
            });
        });
    }
}

module.exports = BrowserAdapter;

},{"./templates":8}],3:[function(require,module,exports){
const EventEmitter = require('emittery');
const BrowserAdapter = require('./browser-adapter');
const index = require('./index');

index.start(EventEmitter, new BrowserAdapter(EventEmitter));


},{"./browser-adapter":2,"./index":6,"emittery":7}],4:[function(require,module,exports){
class CountdownTimer {
    constructor(duration, eventEmitter) {
        this.duration = duration;
        this.remaining = duration;
        this.running = false;
        this.emitter = eventEmitter;
        this._tick = this._tick.bind(this);
        return this;
    }
    tick() {
        this.nextTick = setTimeout(this._tick, 1000);
        return this;
    }
    _tick() {
        if (this.running) {
            this.remaining--;
            this.emitter.emit('tick', this.remaining);
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
        clearTimeout(this.nextTick);
        this.running = false;
        return this;
    }
    clear () {
        clearTimeout(this.nextTick);
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
}

module.exports = CountdownTimer;

},{}],5:[function(require,module,exports){
module.exports = formattedTime = (remaining, showMinutes = false) => {
    const minutes = remaining / 60;
    const minutesInt = Math.floor(minutes);
    let seconds = remaining % 60;
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    return showMinutes || minutesInt ?
        minutesInt + ':' + seconds :
        seconds + '';
};

},{}],6:[function(require,module,exports){
"use strict";

const CountdownTimer = require('./countdown-timer');
const AppSettings = require('./app-settings');

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

const currentNGramDefaults = () => {
   return {
        ngram : '',
        words : [],
        hash : {},
        guessed : 0,
        recentCorrectGuess : null,
        inputValue : '',
        win : false,
        lose : false,
        editingSettings : false
    }
};

class NGramGame {
    constructor(ioAdapter, timer, settings) {
        const currentNGram = currentNGramDefaults();
        let recentGuessTimer;

        this.getCurrent = () => currentNGram;
        this.setCurrent = (...args) => {
            setViaHashOrPair(currentNGram, ...args);
        };
        this.setAsGuessed = (word) => {
            currentNGram.hash[word] = true;
            currentNGram.guessed++;
            currentNGram.recentCorrectGuess = word;
            currentNGram.inputValue = '';
            clearTimeout(recentGuessTimer);
            recentGuessTimer = setTimeout(() => {
                currentNGram.recentCorrectGuess = null;
            }, 5000);
        };

        this.ioAdapter = ioAdapter;
        this.ioAdapter.emitter.on('guess', this.guess.bind(this));
        this.ioAdapter.emitter.on('settings-change', this.changeSettings.bind(this));
        this.ioAdapter.emitter.on('edit-settings', this.launchSettingsEditor.bind(this));
        this.ioAdapter.emitter.on('cancel-edit-settings', this.closeSettingsEditor.bind(this));

        this.timer = timer;
        // this.timer.emitter.on('zero', this.loseRound.bind(this));
        this.timer.emitter.on('tick', (remaining) => {
            this.ioAdapter.showTimeRemaining(this.renderData());
            if (remaining === 0) {
                this.loseRound();
            }
        });
        
        this.settings = settings;

        return this;
    }

    winRound() {
        this.timer.pause();
        this.setCurrent('win', true);
        this.ioAdapter.recordWin(this.renderData());
        setTimeout(this.newRound.bind(this), 5000);
        return this;
    }

    loseRound() {
        this.setCurrent({
            inputValue : '',
            lose : true
        });
        this.ioAdapter.recordLoss(this.renderData());
        setTimeout(this.newRound.bind(this), 5000);
        return this;
    }

    guess(guess) {
        this.setCurrent('inputValue', guess);

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
            this.ioAdapter.recordCorrectGuess(this.renderData());
        }
        return this;
    }

    newRound() {
        const ngram = randomNGram()
        const words = nGramData.hash[ngram].slice(0, this.settings.numWords());

        nGramData.seen[ngram] = true;
        this.setCurrent(Object.assign({}, currentNGramDefaults(), {
            ngram : ngram,
            words : words,
            hash : words.reduce((acc, word) => {
                acc[word] = false;
                return acc;
            }, {})
        }));
        if (this.settings.time() !== this.timer.duration) {
            this.timer.changeDuration(this.settings.time());
        }
        this.timer.clear().start();
        this.ioAdapter.beginNewRound(this.renderData());
    }

    launchSettingsEditor() {
        this.timer.pause();
        this.setCurrent('editingSettings', true);
        this.ioAdapter.launchSettingsEditor(this.renderData());
    }

    changeSettings(settings) {
        let load = false;
        if (settings.ngramLength !== this.settings.nGramLength()) {
            load = true;
        }
        this.settings.reset(settings);
        this.setCurrent('editingSettings', false);

        if (load) {
            this.ioAdapter.loadNGramData(this.settings.nGramLength()).then((data) => {
                storeNGramData(data);
                this.newRound();
            });
        } else {
            this.newRound();
        }
    }

    closeSettingsEditor() {
        this.setCurrent('editingSettings', false);
        this.ioAdapter.closeSettingsEditor(this.renderData());
        this.timer.start();
    }

    renderData() {
        return Object.assign({}, this.getCurrent(), {
            originalTime : this.timer.duration,
            remainingTime : this.timer.remaining,
            numWords : this.settings.numWords(),
            ngramLength : this.settings.nGramLength()
        });
    }
}

const storeNGramData = (data) => {
    nGramData.hash = data;
    nGramData.arr = Object.keys(data);
    nGramData.count = nGramData.arr.length;
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

const start = (EventEmitter, uiAdapter, settings) => {
    const appSettings = new AppSettings(settings);
    const timer = new CountdownTimer(appSettings.time(), new EventEmitter());

    uiAdapter.loadNGramData(appSettings.nGramLength()).then((data) => {
        storeNGramData(data);
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

},{"./app-settings":1,"./countdown-timer":4}],7:[function(require,module,exports){
'use strict';

const anyMap = new WeakMap();
const eventsMap = new WeakMap();
const resolvedPromise = Promise.resolve();

function assertEventName(eventName) {
	if (typeof eventName !== 'string') {
		throw new TypeError('eventName must be a string');
	}
}

function assertListener(listener) {
	if (typeof listener !== 'function') {
		throw new TypeError('listener must be a function');
	}
}

function getListeners(instance, eventName) {
	const events = eventsMap.get(instance);
	if (!events.has(eventName)) {
		events.set(eventName, new Set());
	}

	return events.get(eventName);
}

class Emittery {
	constructor() {
		anyMap.set(this, new Set());
		eventsMap.set(this, new Map());
	}

	on(eventName, listener) {
		assertEventName(eventName);
		assertListener(listener);
		getListeners(this, eventName).add(listener);
		return this.off.bind(this, eventName, listener);
	}

	off(eventName, listener) {
		assertEventName(eventName);
		assertListener(listener);
		getListeners(this, eventName).delete(listener);
	}

	once(eventName) {
		return new Promise(resolve => {
			assertEventName(eventName);
			const off = this.on(eventName, data => {
				off();
				resolve(data);
			});
		});
	}

	async emit(eventName, eventData) {
		assertEventName(eventName);

		const listeners = getListeners(this, eventName);
		const anyListeners = anyMap.get(this);
		const staticListeners = [...listeners];
		const staticAnyListeners = [...anyListeners];

		await resolvedPromise;
		return Promise.all([
			...staticListeners.map(async listener => {
				if (listeners.has(listener)) {
					return listener(eventData);
				}
			}),
			...staticAnyListeners.map(async listener => {
				if (anyListeners.has(listener)) {
					return listener(eventName, eventData);
				}
			})
		]);
	}

	async emitSerial(eventName, eventData) {
		assertEventName(eventName);

		const listeners = getListeners(this, eventName);
		const anyListeners = anyMap.get(this);
		const staticListeners = [...listeners];
		const staticAnyListeners = [...anyListeners];

		await resolvedPromise;
		/* eslint-disable no-await-in-loop */
		for (const listener of staticListeners) {
			if (listeners.has(listener)) {
				await listener(eventData);
			}
		}

		for (const listener of staticAnyListeners) {
			if (anyListeners.has(listener)) {
				await listener(eventName, eventData);
			}
		}
		/* eslint-enable no-await-in-loop */
	}

	onAny(listener) {
		assertListener(listener);
		anyMap.get(this).add(listener);
		return this.offAny.bind(this, listener);
	}

	offAny(listener) {
		assertListener(listener);
		anyMap.get(this).delete(listener);
	}

	clearListeners(eventName) {
		if (typeof eventName === 'string') {
			getListeners(this, eventName).clear();
		} else {
			anyMap.get(this).clear();
			for (const listeners of eventsMap.get(this).values()) {
				listeners.clear();
			}
		}
	}

	listenerCount(eventName) {
		if (typeof eventName === 'string') {
			return anyMap.get(this).size + getListeners(this, eventName).size;
		}

		if (typeof eventName !== 'undefined') {
			assertEventName(eventName);
		}

		let count = anyMap.get(this).size;

		for (const value of eventsMap.get(this).values()) {
			count += value.size;
		}

		return count;
	}
}

// Subclass used to encourage TS users to type their events.
Emittery.Typed = class extends Emittery {};
Object.defineProperty(Emittery.Typed, 'Typed', {
	enumerable: false,
	value: undefined
});

module.exports = Emittery;

},{}],8:[function(require,module,exports){
const formattedTime = require('./formatted-time');

const app = ({numWords, ngramLength, ngram, inputValue, hash, words, remainingTime, originalTime, win, lose, editingSettings}) => {
    const showMinutes = originalTime / 60 >= 1;
    return (
        nav() +
        h1(numWords, ngram) +
        form(inputValue) +
        scoreBoard(words, hash, win, lose) +
        timerContainer(remainingTime, showMinutes) +
        (win ? winNotification() : '') +
        (editingSettings ? settingsEditor(ngramLength, numWords, originalTime) : '')
    );
};

const nav = () => {
    return `<nav>
        <a href="/">TopWords.me</a>
        <a href="#settings" id="settingsLink" class="settings-link">Settings</a>
    </nav>`;
};

const h1 = (numWords, ngram) => {
    return `<h1>
      Top ${numWords} words starting with
      <var>${ngram}</var>
    </h1>`;
};

const scoreBoard = (words, hash, win, lose) => {
    return `<ol>
        ${words.map(wordBlank(hash, win, lose)).join('\n')}
    </ol>`;
};

const wordBlank = (hash, win, lose) => (word) => {
    const guessed = hash[word];
    return `<li class="${guessed ? 'correct recent' : (lose ? 'incorrect' : '')}">${guessed || win || lose ? word : '&nbsp'}</li>`;
};

const form = (inputValue) => {
    return `<form class="guess-word">
        <input type="text"
            id="guessInput"
            value="${inputValue}"
            placeholder="Type your guess"
            autocapitalize="off" 
            autocomplete="off"
            spellcheck="false" 
            autocorrect="off" />
    </form>`;
};

const timerContainer = (remaining, showMinutes) => {
    return `<div id="timerContainer">
        ${timer(remaining, showMinutes)}
    </div>`;
};

const timer = (remaining, showMinutes) => {
    return `<time id="remainingTime" class="${remaining < 10 ? 'low-remainder' : ''}">${formattedTime(remaining, showMinutes)}</time>`;
};

const winNotification = () => {
    return '<h2 id="winNotification">🎉 You won! 🎉</h2>';
};

const settingsEditor = (ngramLength, numWords, originalTime) => {
    return `<aside id="settingsEditor">
        <h2>Edit settings</h2>
        <form id="settingsForm" class="settings-editor">
            <label for="numberOfLettersSelector">Number of letters</label>
            <select id="numberOfLettersSelector" name="ngramLength">
                <option value="2" ${ngramLength === 2 ? 'selected' : ''}>2</option>
                <option value="3" ${ngramLength === 3 ? 'selected' : ''}>3</option>
            </select>

            <label for="numberOfWordsSelector">Number of words</label>
            <select id="numberOfWordsSelector" name="numWords">
                <option value="3" ${numWords === 3 ? 'selected' : ''}>3</option>
                <option value="5" ${numWords === 5 ? 'selected' : ''}>5</option>
            </select>

            <label for="timeLimitSelector">Time limit</label>
            <select id="timeLimitSelector" name="time">
                <option value="30" ${originalTime === 30 ? 'selected' : ''}>30 seconds</option>
                <option value="45" ${originalTime === 45 ? 'selected' : ''}>45 seconds</option>
                <option value="60" ${originalTime === 60 ? 'selected' : ''}>1 minute</option>
                <option value="120" ${originalTime === 120 ? 'selected' : ''}>2 minutes</option>
            </select>

            <button type="submit">
                Play
            </button>
            <a href="#" id="cancelEditSettings">Cancel</a>
        </form>
    </aside>`;
};

module.exports = { appTemplate : app, timerTemplate : timer };

},{"./formatted-time":5}]},{},[3]);
