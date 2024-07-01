import { RecorderNode } from './recorder.js';
import { trimAudioBuffer, playAudioBuffer } from './utils.js';
import { SilenceDetect } from './silence-detect.js';

export class TalkBack extends EventTarget {
    constructor ({ sampleRate = 8000, threshold = 0.01, silenceSecs = 0.75, timeLimitSecs = 300} = {}) {
        super();
        this.ctx = new AudioContext({ sampleRate, latencyHint: 'playback' });
        this.threshold = threshold;
        this.silenceSecs = silenceSecs;
        this.timeLimitSecs = timeLimitSecs;
    }

    async start () {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const src = await this.ctx.createMediaStreamSource(this.stream);
        const sampleRate = this.ctx.sampleRate;
        const channelCount = src.channelCount;

        const recorder = await RecorderNode.create({ audioContext: this.ctx, sampleRate, channelCount, prefillSecs: 0.2, timeLimitSecs: this.timeLimitSecs })

        src.connect(recorder);

        const detect = new SilenceDetect(this.ctx, src, this.threshold, this.silenceSecs);
        detect.onspeak = () => {
            recorder.start();
            this.dispatchEvent(new CustomEvent('mode', { detail: 'recording' }));
        }
        detect.onsilence = async () => {
            this.dispatchEvent(new CustomEvent('mode', { detail: 'playing' }));
            const ab = await recorder.stop();
            if (ab === null) return;
            const trimmed = trimAudioBuffer(this.ctx, ab, this.threshold, 0.1);
            if (trimmed) {
                await playAudioBuffer(this.ctx, trimmed);
            }
            detect.start();
            this.dispatchEvent(new CustomEvent('mode', { detail: 'waiting' }));
        }
        detect.onanalyser = data => {
            this.dispatchEvent(new CustomEvent('analyser', { detail: data }));
        }
        detect.start();

        this.ctx.resume();
    }

    async close () {
        if (this.stream) {
            this.stream.getAudioTracks().forEach(track => track.stop());
        }
        await this.ctx.close();
    }
}
