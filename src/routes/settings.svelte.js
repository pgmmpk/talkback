class Settings {
    _sampleRate = $state(16000);
    _autoGainControl = $state(true);
    _sensitivity = $state(0.05);
    _silenceThresholdSecs = $state(0.75);

    constructor () {
        const state = localStorage.getItem('settings');
        if (state) {
            const {
                sensitivity = 0.01,
                silenceThresholdSecs = 0.75,
                sampleRate = 16000,
                autoGainControl = true,
            } = JSON.parse(state);
            this._sampleRate = sampleRate;
            this._sensitivity = sensitivity;
            this._silenceThresholdSecs = silenceThresholdSecs;
            this._autoGainControl = autoGainControl;
        }
    }

    save () {
        localStorage.setItem('settings', JSON.stringify({
            sampleRate: this._sampleRate,
            sensitivity: this._sensitivity,
            silenceThresholdSecs: this._silenceThresholdSecs,
            autoGainControl: this._autoGainControl,
        }, null, 2));
    }

    get sampleRate () { return this._sampleRate; }
    set sampleRate (value ) {
        this._sampleRate = value;
        this.save();
    }

    get autoGainControl () { return this._autoGainControl; }
    set autoGainControl (value) {
        this._autoGainControl = value;
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
