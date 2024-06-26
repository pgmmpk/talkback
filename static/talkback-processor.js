
const BUFF_LEN = 128;

const MODE_WAITING = 'waiting';
const MODE_RECORDING = 'recording';
const MODE_PLAYING = 'playing';

class RingBuffer {
    constructor (size) {
        this.size = size;
        this.data = Array.from({ length: size }).map(() => new Float32Array(BUFF_LEN));
        this.seek = 0;
        this.offset = 0;
    }

    get length () {
        if (this.seek <= this.offset) {
            return this.offset - this.seek;
        } else {
            return this.size + this.offset - this.seek;
        }
    }

    get available () {
        return this.size - this.length - 1;
    }

    write (buffer) {
        if (!this.available) return false
        this.data[this.offset].set(buffer);
        this.offset = (this.offset + 1) % this.size;
        return true;
    }

    ltrim (num) {
        if (num > this.length) throw 'Attempt to ltrim more than we have';
        if (num <= 0) return;
        this.seek = (this.seek + num) % this.size;
    }

    rtrim (num) {
        if (num > this.length) throw 'Attempt to rtrim more than we have';
        if (num <= 0) return;
        this.offset = (this.offset - num + this.size) % this.size;
    }

    clear () {
        this.seek = 0;
        this.offset = 0;
    }

    getRawBuffers(channelCount) {
        let buffers;
        if (this.seek <= this.offset) {
            buffers = this.data.slice(this.seek, this.offset);
        } else {
            buffers = this.data.slice(this.seek)
            buffers.push(...this.data.slice(0, this.offset))
        }

        const numBuffersPerChannel = Math.floor(buffers.length / channelCount);
        const out = Array.from({ length: channelCount }).map(() => new Float32Array(numBuffersPerChannel * BUFF_LEN));
        for (let i = 0; i < numBuffersPerChannel; i++) {
            for (let c = 0; c < channelCount; c++) {
                const b = buffers[i*channelCount + c];
                out[c].set(b, i*BUFF_LEN)
            }
        }
        return out.map(x => x.buffer);
    }
}

class TalkBackProcessor extends AudioWorkletProcessor {
    constructor({ processorOptions = {} }) {
        super();
        const { silencePrefill, numBuffers, channelCount, silenceThreshold, sensitivity } = processorOptions;
        if (!silencePrefill) throw 'required option "silencePrefill" not set';
        if (!numBuffers) throw 'required option "numBufers" not set';
        if (!channelCount) throw 'required option "channelCount" not set';
        if (!silenceThreshold) throw 'required option "silenceThreshold" not set';
        if (!sensitivity) throw 'required option "sensitivity" not set';
        this.silencePrefill = silencePrefill;
        this.channelCount = channelCount;
        this.silenceThreshold = silenceThreshold;
        this.sensitivity = sensitivity;
        this.ring = new RingBuffer(numBuffers);
        this.mode = MODE_WAITING;
        this.silence = 0;
        this.port.onmessage = this._handleRequest.bind(this)
    }

    reset () {
        this.silence = 0;
        this.ring.clear();
        this.mode = MODE_WAITING;
    }

    static get parameterDescriptors() {
        return [
            {
                name: "sensitivity",  // mic amplitude threshold
                defaultValue: 0.1,
                minValue: 0,
                maxValue: 1,
            },
            {
                name: "numSilenceBuffers",  // silence that long triggers mode change
                defaultValue: 400,
                minValue: 100,
                maxValue: 4000,
            },
            {
                name: "silencePrefillBuffers", 
                defaultValue: 200,
                minValue: 0,
                maxValue: 4000,
            },
        ];
    }

    /**
     * Called by the browser's audio subsystem with
     * packets of audio data to be processed.
     *
     * @param[in] inputList    Array of inputs
     * @param[in] outputList   Array of outputs
     * @param[in] parameters   Parameters object
     *
     * `inputList` and `outputList` are each arrays of inputs
     * or outputs, each of which is in turn an array of `Float32Array`s,
     * each of which contains the audio data for one channel (left/right/etc)
     * for the current sample packet.
     *
     * `parameters` is an object containing the `AudioParam` values
     * for the current block of audio data.
     **/
    process(inputList) {
        // The input list and output list are each arrays of
        // Float32Array objects, each of which contains the
        // samples for one channel.
        if (this.mode === MODE_WAITING) {
            const amp = amplitude(...inputList[0]);  // spread over channels
            if (amp > this.sensitivity) {
                this.mode = MODE_RECORDING;
                this.port.postMessage(['mode', {
                    mode: MODE_RECORDING,
                }]);
            }

            for (const inputBuffer of inputList[0]) {
                this.ring.write(inputBuffer);
            }            
            this.ring.ltrim(this.ring.length - this.silencePrefill);
        } else if (this.mode == MODE_RECORDING) {
            for (const inputBuffer of inputList[0]) {
                this.ring.write(inputBuffer);
            }

            if (this.ring.available === 0) {
                this._shipout('buffer overflow');
                this.mode = MODE_PLAYING;
                return true;
            }

            const amp = amplitude(...inputList[0]);  // spread channels
            if (amp < this.sensitivity) {
                this.silence += inputList[0].length;
                if (this.silence > this.silenceThreshold) {
                    this.ring.rtrim(this.silenceThreshold);
                    this._shipout('silence detected');
                    this.mode = MODE_PLAYING;
                    return true;
                }
            } else {
                this.silence = 0;
            }
        } else {
        }
        return true;
    }

    _shipout(reason) {
        const raw = this.ring.getRawBuffers(this.channelCount);

        this.port.postMessage(['mode', {
            mode: MODE_PLAYING,
            reason,
            raw,
        }], raw);
    }

    _handleRequest ({data}) {
        if (data === 'reset') {
            this.reset();
        }
    }
}

function amplitude (...buffers) {
    let amp = 0.0;
    for (const buffer of buffers) {
        amp = buffer.reduce( (p, c) => Math.max(p, Math.abs(c)), amp);
    }
    return amp;
}

registerProcessor("talkback-processor", TalkBackProcessor);