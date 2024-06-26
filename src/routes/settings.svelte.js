class Settings {
    _sensitivity = $state(0.05);
    _silenceThresholdSecs = $state(0.75);

    constructor () {
        const state = localStorage.getItem('settings');
        if (state) {
            const { sensitivity = 0.01, silenceThresholdSecs = 0.75 } = JSON.parse(state);
            this._sensitivity = sensitivity;
            this._silenceThresholdSecs = silenceThresholdSecs;
        }
    }

    save () {
        localStorage.setItem('settings', JSON.stringify({
            sensitivity: this._sensitivity,
            silenceThresholdSecs: this._silenceThresholdSecs,
        }, null, 2));
    }

    get sensitivity () { return this._sensitivity; }
    set sensitivity (value) {
        this._sensitivity = value;
        this.save()
    }

    get silenceThresholdSecs () { return this._silenceThresholdSecs; }
    set silenceThresholdSecs (value) {
        this._silenceThresholdSecs = value;
        this.save();
    }
}

export const settings = new Settings();
