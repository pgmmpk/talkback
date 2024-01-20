export async function talkback(options = {}) {
    const { sensitivity = 0.05, threshold = 750 } = options;
    const audioContext = new AudioContext();

    const processorOptions = { sampleRate: audioContext.sampleRate };
    await audioContext.audioWorklet.addModule("talkback-processor.js");
    const talkbackNode = new AudioWorkletNode(audioContext, "talkback-processor",  { processorOptions });
    await audioContext.resume();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const src =  await audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    src
        .connect(talkbackNode)
        .connect(analyser)
        .connect(audioContext.destination);

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
