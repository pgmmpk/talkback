<script>
    import { talkback } from './talkback.js';
    import { DrawOscillogramm } from './draw.js';

    let talkbackAudio = null;
    let threshold = $state(750);
    let sensitivity = $state(0.05);
    let mode = $state('waiting');
    let buffers = $state(0);

    $effect(() => {
        sensitivity;
        if (talkbackAudio !== null) {
            talkbackAudio.sensitivity = sensitivity;
        }
    });

    $effect(() => {
        threshold;
        if (talkbackAudio !== null) {
            talkbackAudio.threshold = threshold;
        }
    });

    let canvas;
    let canvasCtx;
    $effect(() => {
        canvasCtx = canvas.getContext('2d');
    })

    function onmessage(name, value) {
        if (name === 'mode') {
            mode = value.mode;
        } else if (name === 'buffer') {
            buffers = value.length;
        }
    }

    let active = $state(false);
    let needPermission = $state(false);
    let drawing;
    async function toggleTalkback() {
        if (talkbackAudio === null) {
            try {
                talkbackAudio = await talkback({ threshold, sensitivity });
                talkbackAudio.threshold = threshold;
                talkbackAudio.sensitivity = sensitivity;
                talkbackAudio.onmessage = onmessage;
                active = true;
                needPermission = false;
                drawing = new DrawOscillogramm({
                    analyser: talkbackAudio.analyser,
                    canvasCtx,
                    width: canvas.width,
                    height: canvas.height,
                });
                drawing.start();

            } catch (err) {
                console.log(err);
                needPermission = true;
                throw err;
            }
        } else {
            await talkbackAudio.close();
            talkbackAudio = null;
            active = false;
            drawing.stop();
            drawing = null;
        }
    }
</script>
<div class="flex flex-col items-center content-center h-screen justify-center">
<div class="text-xl mb-2 font-bold text-gray-700">
    Talk Back
</div>

<div class="text-gray-500">
<button onclick={toggleTalkback}>
    {#if active}
    <svg class="w-12 h-12"viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke-width="1.5" stroke="currentColor" >
        <path stroke-linecap="round" stroke-linejoin="round"d="M6 18.4V5.6C6 5.26863 6.26863 5 6.6 5H9.4C9.73137 5 10 5.26863 10 5.6V18.4C10 18.7314 9.73137 19 9.4 19H6.6C6.26863 19 6 18.7314 6 18.4Z" />
        <path stroke-linecap="round" stroke-linejoin="round"d="M14 18.4V5.6C14 5.26863 14.2686 5 14.6 5H17.4C17.7314 5 18 5.26863 18 5.6V18.4C18 18.7314 17.7314 19 17.4 19H14.6C14.2686 19 14 18.7314 14 18.4Z" />
    </svg>
    {:else}
    <svg class="w-12 h-12"viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke-width="1.5" stroke="currentColor" >
        <path stroke-linecap="round" stroke-linejoin="round"d="M6.90588 4.53682C6.50592 4.2998 6 4.58808 6 5.05299V18.947C6 19.4119 6.50592 19.7002 6.90588 19.4632L18.629 12.5162C19.0211 12.2838 19.0211 11.7162 18.629 11.4838L6.90588 4.53682Z" />
    </svg>
    {/if}
</button>
</div>
{#if needPermission}
<div class="text-red-700 text-2xl border border-2 border-red-700 rounded-full mb-2 px-4">Please allow access to microphone</div>
{/if}

<div>
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
</svg>
<input type="range" id="sensitivity" name="sensitivity" min="0.0" max="0.2" step="0.01" value={sensitivity} onchange={e => sensitivity=e.target.value} disabled={!active} />
<div class="w-12 inline-block">{sensitivity}</div>
</div>

<div>
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5" />
</svg>
<input type="range" id="silence-threshold-millis" name="silence-threshold-millis" min="100" max="5000" step="10" value={threshold} onchange={e => threshold = e.target.value} disabled={!active}/>
<div class="w-12 inline-block">{threshold}</div>
</div>

<div class="mb-2">
    {#if mode === 'listening'}
    <svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M14 21H4C2.89543 21 2 20.1046 2 19V5C2 3.89543 2.89543 3 4 3H20C21.1046 3 22 3.89543 22 5V14" stroke="#000000" stroke-width="1.5" stroke-linecap="round"></path><path d="M2 7L22 7" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5 5.01L5.01 4.99889" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 5.01L8.01 4.99889" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11 5.01L11.01 4.99889" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M19.5 22V16M19.5 16L17 18.5M19.5 16L22 18.5" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
    {:else if mode === 'playing'}
    <svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M12 21H4C2.89543 21 2 20.1046 2 19V5C2 3.89543 2.89543 3 4 3H20C21.1046 3 22 3.89543 22 5V13" stroke="#000000" stroke-width="1.5" stroke-linecap="round"></path><path d="M2 7L22 7" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5 5.01L5.01 4.99889" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 5.01L8.01 4.99889" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11 5.01L11.01 4.99889" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M20.9995 16.05C20.3643 15.402 19.4791 15 18.5 15C16.567 15 15 16.567 15 18.5C15 19.4539 15.3816 20.3187 16.0005 20.95M20.9995 16.05C21.6184 16.6813 22 17.5461 22 18.5C22 20.433 20.433 22 18.5 22C17.5209 22 16.6357 21.598 16.0005 20.95M20.9995 16.05L16.0005 20.95" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
    {:else}
    <svg width="24px" height="24px" viewBox="0 0 24 24" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="#000000"><path d="M16 21H4C2.89543 21 2 20.1046 2 19V5C2 3.89543 2.89543 3 4 3H20C21.1046 3 22 3.89543 22 5V14" stroke="#000000" stroke-width="1.5" stroke-linecap="round"></path><path d="M19 17L19 22" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M22 17L22 22" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M2 7L22 7" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M5 5.01L5.01 4.99889" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 5.01L8.01 4.99889" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M11 5.01L11.01 4.99889" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>
    {/if}
</div>

<!-- <div>{mode} ({buffers})</div> -->

<div class="border w-2/3 md:w-1/3">
    <canvas class="w-full h-[100px] block" bind:this={canvas} />
</div>
</div>
