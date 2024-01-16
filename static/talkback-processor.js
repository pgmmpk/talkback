class TalkBackProcessor extends AudioWorkletProcessor {
    constructor({ processorOptions = {} }) {
        super();
        const { sampleRate = 48000, silencePrefill=200 } = processorOptions;
        this.sampleRate = sampleRate;
        this.silencePrefill = silencePrefill;
        this.mode = 'waiting';
        this.buffer = [];
        this.silence = 0;
    }

    static get parameterDescriptors() {
        return [
            {
                name: "sensitivity",
                defaultValue: 0.1,
                minValue: 0,
                maxValue: 1,
            },
            {
                name: "silenceThresholdMillis",
                defaultValue: 500,
                minValue: 100,
                maxValue: 5000,
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
    process(inputList, outputList, parameters) {
        const sensitivity = parameters.sensitivity[0];
        const sourceLimit = Math.min(inputList.length, outputList.length);

        if (this.mode === 'waiting') {
            let silence = true;
            const batch = [];
            for (let inputNum = 0; inputNum < sourceLimit; inputNum++) {
                let input = inputList[inputNum];
                let output = outputList[inputNum];
                let channelCount = Math.min(input.length, output.length);

                // The input list and output list are each arrays of
                // Float32Array objects, each of which contains the
                // samples for one channel.
                for (let channel = 0; channel < channelCount; channel ++) {
                    batch.push(input[channel].slice());
                }

                const power = this.sourcePower(input);
                if (power > sensitivity) {
                    silence = false;
                }
            }

            if (!silence) {
                this.mode = 'listening';
                this.port.postMessage(['mode', {
                    mode: 'listening'
                }]);
                this.silence = 0;
            }
            this.buffer.push(...batch);
            if (this.buffer.length > this.silencePrefill) {
                this.buffer = this.buffer.slice(this.buffer.length - this.silencePrefill);
            }

            return true;
        } else if (this.mode == 'listening') {
            const silenceThresholdMillis = parameters.silenceThresholdMillis[0];
            let silence = true;
            const batch = [];
            for (let inputNum = 0; inputNum < sourceLimit; inputNum++) {
                let input = inputList[inputNum];
                let output = outputList[inputNum];
                let channelCount = Math.min(input.length, output.length);

                // The input list and output list are each arrays of
                // Float32Array objects, each of which contains the
                // samples for one channel.
                for (let channel = 0; channel < channelCount; channel ++) {
                    batch.push(input[channel].slice());
                }

                const power = this.sourcePower(input);
                if (power > sensitivity) {
                    silence = false;
                }
            }

            if (silence) {
                this.silence += inputList[0][0].length;
            } else {
                this.silence = 0;
            }

            if (this.silence * 1000 / this.sampleRate >= silenceThresholdMillis) {
                this.mode = 'playing';
                this.silence = 0;
                this.port.postMessage(['mode', {
                    mode: 'playing'
                }]);
            } else {
                this.buffer.push(...batch);
                if ((this.buffer.length % 100) === 0) {
                    this.port.postMessage(['buffer', {
                        length: this.buffer.length,
                    }]);
                }
            }

            return true;
        } else {
            // playback
            for (let inputNum = 0; inputNum < sourceLimit; inputNum++) {
                let input = inputList[inputNum];
                let output = outputList[inputNum];
                let channelCount = Math.min(input.length, output.length);

                for (let channel = 0; channel < channelCount; channel ++) {
                    if (this.buffer.length > 0) {
                        output[channel].set(this.buffer.shift());
                        if ((this.buffer.length % 100) === 0) {
                            this.port.postMessage(['buffer', {
                                length: this.buffer.length,
                            }]);
                        }
                    }
                }
            }

            if (this.buffer.length === 0) {
                this.mode = 'waiting';
                this.port.postMessage(['mode', {
                    mode: 'waiting',
                }]);
            }

            return true;
        }
    }

    sourcePower (source) {
        let power = 0.;
        for (let channel = 0; channel < source.length; channel++) {
            // is it silence?
            for (let i = 0; i < source[channel].length; i++) {
                let sample = source[channel][i];
                power = Math.max(Math.abs(sample), power);
            }
        }
        return power;
    }
}

registerProcessor("talkback-processor", TalkBackProcessor);