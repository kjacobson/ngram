"use strict";

const CountdownTimer = require('./countdown-timer');
const AppSettings = require('./app-settings');
const GameplaySettings = require('./gameplay-settings');



class NGramGame {
    constructor(ioAdapter, timer, settings) {
        this.ioAdapter = ioAdapter;
        this.timer = timer;
        this.settings = settings;
        this.gameplay = new GameplaySettings();

        // this.timer.emitter.on('zero', this.loseRound.bind(this));
        this.timer.emitter.on('tick', (remaining) => {
            this.ioAdapter.showTimeRemaining(this.renderData());
            if (remaining === 0) {
                this.loseRound();
            }
        });

        this.ioAdapter.emitter.on('guess', this.guess.bind(this));
        this.ioAdapter.emitter.on('settings-change', this.changeSettings.bind(this));
        this.ioAdapter.emitter.on('edit-settings', this.launchSettingsEditor.bind(this));
        this.ioAdapter.emitter.on('cancel-edit-settings', this.closeSettingsEditor.bind(this));
        this.ioAdapter.emitter.on('skip-to-next', this.skipToNext.bind(this));
        this.ioAdapter.emitter.on('visibility-change', (hidden) => {
            this.handleVisibilityChange(hidden);
        });
        

        return this;
    }

    winRound() {
        this.timer.pause();
        this.gameplay.win();
        this.ioAdapter.recordWin(this.renderData());
        this.nextRoundCountdown = setTimeout(this.newRound.bind(this), 5000);
        return this;
    }

    loseRound() {
        this.gameplay.lose();
        this.ioAdapter.recordLoss(this.renderData());
        this.nextRoundCountdown = setTimeout(this.newRound.bind(this), 5000);
        return this;
    }

    skipToNext() {
        this.timer.pause();
        this.loseRound();
        return this;
    }

    handleVisibilityChange(hidden) {
        if (hidden) {
            if (this.nextRoundCountdown) {
                clearTimeout(this.nextRoundCountdown);
                console.log("Delaying next game until tab regains focus");
            } else {
                this.timer.pause();
                console.log("Paused game until tab regains focus");
            }
        } else {
            if (this.nextRoundCountdown) {
                this.nextRoundCountdown = setTimeout(this.newRound.bind(this), 3000);
                console.log("Starting new game in 3 seconds");
            } else {
                this.timer.start();
                console.log("Resuming game");
            }
        }
    }

    guess(guess) {
        if (this.gameplay.guess(guess)) {
            this.recordCorrectGuess(guess);
        }
        return this;
    }

    recordCorrectGuess(guess) {
        this.gameplay.setAsGuessed(guess);
        if (this.gameplay.isWon()) {
            this.winRound();
        } else {
            this.ioAdapter.recordCorrectGuess(this.renderData());
        }
        return this;
    }

    newRound() {
        const ngram = this.randomNGram()
        const words = this.settings.retrieveWordsForNGram(ngram);

        this.nextRoundCountdown = null;
        this.gameplay.newRound(ngram, words);
        
        if (this.settings.time() !== this.timer.duration) {
            this.timer.changeDuration(this.settings.time());
        }
        this.timer.clear().start();
        this.ioAdapter.beginNewRound(this.renderData());

        this.settings.nGramData.seen[ngram] = true;
        this.ioAdapter.updateSeenCache(this.settings.nGramData.seen);
    }

    launchSettingsEditor() {
        this.timer.pause();
        this.gameplay.editingSettings = true;
        this.ioAdapter.launchSettingsEditor(this.renderData());
    }

    changeSettings(settings) {
        let load = false;
        if (settings.nGramLength !== this.settings.nGramLength()) {
            load = true;
        }
        this.settings.reset(settings);
        this.gameplay.editingSettings = false;

        if (load) {
            this.ioAdapter.loadNGramData(this.settings.nGramLength()).then((data) => {
                this.settings.storeNGramData(data, this.settings.nGramData.seen);
                this.newRound();
            });
        } else {
            this.newRound();
        }
    }

    closeSettingsEditor() {
        this.gameplay.editingSettings = false;
        this.ioAdapter.closeSettingsEditor(this.renderData());
        this.timer.start();
    }

    renderData() {
        return Object.assign({}, this.gameplay.settings, {
            editingSettings : this.gameplay.editingSettings,
            originalTime : this.timer.duration,
            remainingTime : this.timer.remaining,
            numWords : this.settings.numWords(),
            ngramLength : this.settings.nGramLength()
        });
    }

    randomNGram(i = 0) {
        if (i >= this.settings.nGramData.count) {
            this.settings.nGramData.seen = {};
            this.ioAdapter.updateSeenCache({});
        }

        const index = Math.floor(
            Math.random() * (this.settings.nGramData.count)
        );
        const ngram = this.settings.nGramData.arr[index];
        return this.settings.nGramData.seen[ngram] ? 
            this.randomNGram(i+1) :
            ngram;
    }
}

const start = (EventEmitter, ioAdapter, settings) => {
    const appSettings = new AppSettings(settings);
    const timer = new CountdownTimer(appSettings.time(), new EventEmitter());

    ioAdapter.loadNGramData(appSettings.nGramLength()).then((data) => {
        appSettings.storeNGramData(data, ioAdapter.retrieveSeenCache());
        const game = new NGramGame(
            ioAdapter,
            timer,
            appSettings
        ).newRound();
    }, (err) => {
        console.log(err);
    });
};

module.exports = { start };
