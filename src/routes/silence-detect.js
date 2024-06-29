
export class SilenceDetect {

    constructor (audioContext, input, threshold = 0.01, silenceSecs = 0.75) {
        this.threshold = threshold;
        this.silenceSecs = silenceSecs;
    
        this.audioContext = audioContext;
        this.analyser = audioContext.createAnalyser();
        this.analyser.fftSize = 32;
        input.connect(this.analyser);
    }

    start () {
        const data = new Float32Array(this.analyser.fftSize);
        const self = this;

        const STATE = {
            detectSpeak: 0,
            detectSilence: 1,
        };

        let state = STATE.detectSpeak;
        let silenceStartedAt = 0;
        
        function onEveryFrame () {
            self.analyser.getFloatTimeDomainData(data);
            const amp = Math.max(...data.map(x => Math.abs(x)));

            if (state === STATE.detectSpeak) {
                if (amp >= self.threshold) {
                    state = STATE.detectSilence;
                    silenceStartedAt = self.audioContext.currentTime;
                    self.onspeak();
                }
            } else if (state === STATE.detectSilence) {
                if (amp >= self.threshold) {
                    silenceStartedAt = self.audioContext.currentTime;
                } else if (self.audioContext.currentTime - silenceStartedAt > self.silenceSecs) {
                    state = STATE.paused;
                    self.onsilence();
                    return;  // this breaks the anumation frame loop
                }
            }

            requestAnimationFrame(onEveryFrame);
        }

        requestAnimationFrame(onEveryFrame);
    }

    onspeak () {}

    onsilence () {}
}