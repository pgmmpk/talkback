export async function talkback(options = {}) {
    const { sensitivity = 0.05, threshold = 750, bufferLimit = 100000 } = options;
    const audioContext = new AudioContext();

    const processorOptions = { sampleRate: audioContext.sampleRate, bufferLimit };
    await audioContext.audioWorklet.addModule("talkback-processor.js");
    const talkbackNode = new AudioWorkletNode(audioContext, "talkback-processor",  { processorOptions });
    await audioContext.resume();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const src =  await audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    const merger = audioContext.createChannelMerger(2);

    const tmp = src.connect(talkbackNode);
    tmp.connect(audioContext.destination);

    src.connect(merger, 0, 0);
    tmp.connect(merger, 0, 1);
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(2.0, audioContext.currentTime);
    merger.connect(gain).connect(analyser)
    
    const karrrtSensitivity = talkbackNode.parameters.get("sensitivity");
    karrrtSensitivity.setValueAtTime(sensitivity, audioContext.currentTime);

    const karrrtSilenceThresholdMillis = talkbackNode.parameters.get("silenceThresholdMillis");
    karrrtSilenceThresholdMillis.setValueAtTime(threshold, audioContext.currentTime);

    async function close() {
        for (const track of stream.getTracks()) {
            track.stop();
        }
        await audioContext.close();
    }

    const out = {
        close,
        get analyser() { return analyser; },
        get sensitivity() { return karrrtSensitivity.value; },
        set sensitivity(value) { karrrtSensitivity.setValueAtTime(value, audioContext.currentTime); },
        get threshold() { return karrrtSilenceThresholdMillis.value; },
        set threshold(value) { karrrtSilenceThresholdMillis.setValueAtTime(value, audioContext.currentTime); },
        onmessage() {},
    };

    talkbackNode.port.onmessage = ev => {
        out.onmessage(...ev.data);
    };

    return out;
}
