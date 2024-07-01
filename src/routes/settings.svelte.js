class Settings {
    _sampleRate = $state(8000);
    _sensitivity = $state(0.05);
    _silenceThresholdSecs = $state(0.75);

    constructor () {
        const state = localStorage.getItem('settings');
        if (state) {
            const { sensitivity = 0.01, silenceThresholdSecs = 0.75, sampleRate = 8000 } = JSON.parse(state);
            this._sampleRate = sampleRate;
            this._sensitivity = sensitivity;
            this._silenceThresholdSecs = silenceThresholdSecs;
        }
    }

    save () {
        localStorage.setItem('settings', JSON.stringify({
            sampleRate: this._sampleRate,
            sensitivity: this._sensitivity,
            silenceThresholdSecs: this._silenceThresholdSecs,
        }, null, 2));
    }

    get sampleRate () { return this._sampleRate; }
    set sampleRate (value ) {
        this._sampleRate = value;
        this.save();
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
