const BUFFER_LEN = 128;

export async function talkback ({
    timeLimitSecs = 300,  // limit max recording time
    silencePrefillSecs = 0.25,  // that long to keep before talk detected
    silenceThresholdSecs = 0.75, // pause of that long indicates end of talk
    sensitivity = 0.01,  // how loud our silence is :)
} = {}) {
    const audioContext = new AudioContext();
    audioContext.suspend();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const src =  await audioContext.createMediaStreamSource(stream);
    const sampleRate = audioContext.sampleRate;
    const channelCount = src.channelCount;
    
    const numBuffers = Math.ceil(timeLimitSecs * sampleRate / BUFFER_LEN ) * channelCount;
    const silencePrefill = Math.floor(silencePrefillSecs * sampleRate / BUFFER_LEN) * channelCount;
    const silenceThreshold = Math.floor(silenceThresholdSecs * sampleRate / BUFFER_LEN) * channelCount;
    const processorOptions = {
        numBuffers, channelCount, silencePrefill, silenceThreshold, sensitivity
    };
    await audioContext.audioWorklet.addModule("talkback-processor.js");
    const talkbackNode = new AudioWorkletNode(audioContext, "talkback-processor",  { processorOptions });

    const analyser = audioContext.createAnalyser();
    const merger = audioContext.createChannelMerger(2);

    const tmp = src.connect(talkbackNode);

    src.connect(merger, 0, 0);
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(2.5, audioContext.currentTime);
    merger.connect(gain).connect(analyser)

    async function close() {
        for (const track of stream.getTracks()) {
            track.stop();
        }
        await audioContext.close();
    }

    await audioContext.resume();

    const out = {
        close,
        analyser,
        onmessage: () => null,
    };

    talkbackNode.port.onmessage = async ({data}) => {
        const [cmd, opts] = data;

        out.onmessage(opts.mode);
        if (cmd === 'mode' && opts.mode == 'playing') {
            const pcms = opts.raw.map(b => new Float32Array(b));
            const audioBuffer = audioContext.createBuffer(pcms.length, pcms[0].length, sampleRate);
            for (let c = 0; c < pcms.length; c++) {
                audioBuffer.copyToChannel(pcms[c], c)
            }
            await playAudioFromBuffer(audioContext, audioBuffer, merger)

            await talkbackNode.port.postMessage('reset')
            out.onmessage('waiting');
        }
    };


    return out;
}

function playAudioFromBuffer(audioContext, buffer, merger) {
    const src = audioContext.createBufferSource();
    src.buffer = buffer;
    src.connect(audioContext.destination);
    src.connect(merger, 0, 1);

    const { promise, resolve }  = Promise.withResolvers();
    src.onended = resolve;
    src.start();

    return promise;
}
