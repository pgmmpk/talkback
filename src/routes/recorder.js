
const BUFFER_LEN = 128;

export class RecorderNode extends AudioWorkletNode {

    static async create ({ audioContext, sampleRate, channelCount, prefillSecs = 0, timeLimitSecs = 300 }) {
        await audioContext.audioWorklet.addModule("recorder.js");
        return new RecorderNode({ audioContext, sampleRate, channelCount, prefillSecs, timeLimitSecs });
    }

    constructor ({ audioContext, sampleRate, channelCount, prefillSecs = 0, timeLimitSecs = 300 }) {
        if (!sampleRate) throw `sampleRate param is required`;
        if (!channelCount) throw `channelCount param is required`;
        const numBuffers = Math.ceil(sampleRate * timeLimitSecs / BUFFER_LEN) * channelCount;
        const silencePrefillBuffers = Math.ceil(sampleRate * prefillSecs / BUFFER_LEN) * channelCount;
        const processorOptions = {
            numBuffers, silencePrefillBuffers, channelCount,
        };

        super(audioContext, "recorder", { numberOfOutputs: 0, processorOptions });
        this.port.onmessage = this._handleMessage.bind(this);
        this._ctx = audioContext;
        this._sampleRate = sampleRate;
        this._channelCount = channelCount;
        this._resolve = null;
    }

    start () {
        this.port.postMessage({ cmd: 'start' });
    }

    stop () {
        const { promise, resolve } = Promise.withResolvers();
        this._resolve = resolve;
        this.port.postMessage({ cmd: 'stop' });
        return promise;
    }

    _handleMessage ({ data }) {
        if (data.cmd === 'stopped' && this._resolve) {
            // convert raw to AudioBuffer
            const { raw } = data;
            if (raw[0].length === 0) {
                console.log({comment: `Recorder.stop() returns`, ab: null});
                return this._resolve(null);
            }
            const channels = raw.map(x => new Float32Array(x))
            const ab = this._ctx.createBuffer(this._channelCount, channels[0].length, this._sampleRate);
            for (let c = 0; c < this._channelCount; c++) {
                ab.copyToChannel(channels[c], c);
            }

            console.log({comment: `Recorder.stop() returns`, ab});
            this._resolve(ab);
        }
    }
}