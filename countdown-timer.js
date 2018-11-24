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
