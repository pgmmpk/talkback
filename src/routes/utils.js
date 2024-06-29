
export function sliceAudioBuffer(ctx, buffer, start, end) {
    if (start === undefined) {
        start = 0;
    }
    if (end === undefined) {
        end = buffer.length;
    }

    if (start === 0 && end === buffer.length) {
        // nothing to do
        return buffer;
    }

    if (start >= end) {
        throw `Slicing audio buffer with ${start}:${end} would return an invalid (empty) buffer`;
    }

    const { numberOfChannels, sampleRate } = buffer;
    const newBuffer = ctx.createBuffer(numberOfChannels, end - start, sampleRate);
    for (let c = 0; c < numberOfChannels; c++) {
        const data = buffer.getChannelData(c);
        newBuffer.copyToChannel(data.slice(start), c);
    }

    return newBuffer;
}

export function leadingSilenceLength(ab, threshold) {
    function lead(data) {
        for (let i = 0; i < data.length; i++) {
            if (Math.abs(data[i]) >= threshold) return i;
        }
        return data.length;
    }
    const leads = [ab.length];
    for (let c = 0; c < ab.numberOfChannels; c++) {
        const data = ab.getChannelData(c);
        leads.push(lead(data));
    }

    return Math.min(...leads);
}

export function trailingSilenceLength(ab, threshold) {
    function trail(data) {
        for (let i = data.length - 1; i >= 0; i--) {
            if (Math.abs(data[i]) >= threshold) return data.length - 1 - i;
        }
        return data.length;
    }
    const trails = [ab.length];
    for (let c = 0; c < ab.numberOfChannels; c++) {
        const data = ab.getChannelData(c);
        trails.push(trail(data));
    }

    return Math.min(...trails);
}

export function trimAudioBuffer(ctx, ab, threshold, safetySecs = 0) {
    const safetyLen = ab.sampleRate * safetySecs;
    const leadingSilence = Math.max(0, leadingSilenceLength(ab, threshold) - safetyLen);
    const trailingSilence = Math.max(0, trailingSilenceLength(ab, threshold) - safetyLen);

    if (ab.length - leadingSilence - trailingSilence <= 0) {
        return null;  // all silence!
    }

    return sliceAudioBuffer(ctx, ab, leadingSilence, ab.length - trailingSilence);
}

export function playAudioBuffer(audioContext, buffer) {  
    const src = audioContext.createBufferSource();
    src.buffer = buffer;
    src.connect(audioContext.destination);

    const { promise, resolve }  = Promise.withResolvers();
    src.onended = resolve;
    src.start();

    return promise;
}
