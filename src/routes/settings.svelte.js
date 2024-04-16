class Settings {
    _sensitivity = $state(0.05);
    _threshold = $state(750);

    constructor () {
        const state = localStorage.getItem('settings');
        if (state) {
            const { sensitivity = 0.05, threshold = 750 } = JSON.parse(state);
            this._sensitivity = sensitivity;
            this._threshold = threshold;
        }
    }

    save () {
        localStorage.setItem('settings', JSON.stringify({
            sensitivity: this._sensitivity,
            threshold: this._threshold,
        }, null, 2));
    }

    get sensitivity () { return this._sensitivity; }
    set sensitivity (value) {
        this._sensitivity = value;
        this.save()
    }

    get threshold () { return this._threshold; }
    set threshold (value) {
        this._threshold = value;
        this.save();
    }
}

export const settings = new Settings();
