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
        setTimeout(this._tick, 1000);
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

module.exports = CountdownTimer;
