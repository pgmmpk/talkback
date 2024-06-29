const BUFF_LEN = 128;

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

class RecorderProcessor extends AudioWorkletProcessor {
    constructor({ processorOptions = {} }) {
        super();
        const { silencePrefillBuffers, numBuffers, channelCount } = processorOptions;
        if (silencePrefillBuffers !== 0 && !silencePrefillBuffers) {
            throw `bad value for silencePrefillBuffers: ${silencePrefillBuffers}`;
        }
        if (!numBuffers) {
            throw `bad value for numBuffers: ${numBuffers}`;
        }
        if (!channelCount) {
            throw `bad value for channelCount: ${channelCount}`;
        }
        this.silencePrefillBuffers = silencePrefillBuffers;
        this.numBuffers = numBuffers;
        this.channelCount = channelCount;
        this.ring = new RingBuffer(numBuffers);
        this.port.onmessage = this.handleMessage.bind(this);
        this.recording = false;
        console.log(`Recorder inited with ${JSON.stringify(processorOptions, null, 2)}`)
    }

    process(inputList) {
        // The input list and output list are each arrays of
        // Float32Array objects, each of which contains the
        // samples for one channel.
        if (this.ring.available < inputList[0].length) {
            this.ring.ltrim(inputList[0].length);
        }
        for (const inputBuffer of inputList[0]) {
            this.ring.write(inputBuffer);
        }            
        if (!this.recording) {
            this.ring.ltrim(this.ring.length - this.silencePrefillBuffers);
        }
        return true;
    }

    stop () {
        const raw = this.ring.getRawBuffers(this.channelCount);
        this.recording = false;
        this.ring.clear();

        return raw;
    }

    handleMessage ({data}) {
        if (data.cmd === 'start') {
            this.recording = true;
        } else if (data.cmd === 'stop') {
            const raw = this.stop();
            this.port.postMessage({
                cmd: 'stopped',
                raw,
            }, {
                transfer: raw,
            });    
        }
    }
}

registerProcessor("recorder", RecorderProcessor);
