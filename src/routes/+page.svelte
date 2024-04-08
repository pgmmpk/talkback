<script>
    import { talkback } from './talkback.js';
    import { DrawOscillogramm } from './draw.js';
    import { Waker } from './waker.js';

    let talkbackAudio = null;
    let waker = null;
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
                talkbackAudio = await talkback({ threshold, sensitivity, bufferLimit: 100000 });
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

                waker = new Waker();
                await waker.request();
            } catch (err) {
                console.error(err);
                needPermission = true;
                throw err;
            }
        } else {
            await waker.release();
            waker = null;
            await talkbackAudio.close();
            talkbackAudio = null;
            active = false;
            drawing.stop();
            drawing = null;
            mode = 'waiting';
        }
    }
</script>
<div class="flex flex-col items-center content-center h-screen justify-center">
<div class="text-3xl md:mb-4 mb-8 font-bold text-gray-700">
    Talk Back
</div>

<div class="text-gray-700 mb-4">
<button onclick={toggleTalkback} aria-label="toggle talk">
    {#if active}
    <svg class="md:w-24 md:h-24 w-48 h-48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke-width="1.5" stroke="currentColor" >
        <path stroke-linecap="round" stroke-linejoin="round"d="M6 18.4V5.6C6 5.26863 6.26863 5 6.6 5H9.4C9.73137 5 10 5.26863 10 5.6V18.4C10 18.7314 9.73137 19 9.4 19H6.6C6.26863 19 6 18.7314 6 18.4Z" />
        <path stroke-linecap="round" stroke-linejoin="round"d="M14 18.4V5.6C14 5.26863 14.2686 5 14.6 5H17.4C17.7314 5 18 5.26863 18 5.6V18.4C18 18.7314 17.7314 19 17.4 19H14.6C14.2686 19 14 18.7314 14 18.4Z" />
    </svg>
    {:else}
    <svg class="md:w-24 md:h-24 w-48 h-48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke-width="1.5" stroke="currentColor" >
        <path stroke-linecap="round" stroke-linejoin="round"d="M6.90588 4.53682C6.50592 4.2998 6 4.58808 6 5.05299V18.947C6 19.4119 6.50592 19.7002 6.90588 19.4632L18.629 12.5162C19.0211 12.2838 19.0211 11.7162 18.629 11.4838L6.90588 4.53682Z" />
    </svg>
    {/if}
</button>
</div>
{#if needPermission}
<div class="text-red-700 text-2xl border border-2 border-red-700 rounded-full mb-8 px-4">Please allow access to microphone</div>
{/if}

<div>
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline">
    <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
</svg>
<input type="range" class="accent-gray-700" id="sensitivity" name="sensitivity" aria-label="Sensitivity" min="0.0" max="0.1" step="0.01" value={sensitivity} onchange={e => sensitivity=e.target.value} disabled={!active} />
<div class="w-12 inline-block">{sensitivity}</div>
</div>

<div class="mt-8">
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline">
    <path stroke-linecap="round" stroke-linejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5" />
</svg>
<input type="range" class="accent-gray-700" id="silence-threshold-millis" name="silence-threshold-millis" aria-label="Silence Threhold" min="100" max="1500" step="10" value={threshold} onchange={e => threshold = e.target.value} disabled={!active}/>
<div class="w-12 inline-block">{threshold}</div>
</div>

<div class="md:mb-8 mb-8 mt-8 text-gray-400">
    {#if mode === 'listening'}
    <svg class="w-16 h-16 inline" class:text-blue-700={active} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
        <path d="M 45 90 C 20.187 90 0 69.813 0 45 C 0 20.187 20.187 0 45 0 c 24.813 0 45 20.187 45 45 C 90 69.813 69.813 90 45 90 z M 45 4 C 22.393 4 4 22.393 4 45 s 18.393 41 41 41 s 41 -18.393 41 -41 S 67.607 4 45 4 z" />
        <circle cx="45" cy="45" r="40" stroke="currentColor" stroke-width="8" />
        <circle cx="31" cy="35.55" r="6" fill="currentColor" />
        <circle cx="59" cy="35.55" r="6" fill="currentColor" />
        <path d="M 45 74 c -6.197 0 -11.239 -5.042 -11.239 -11.239 S 38.803 51.521 45 51.521 s 11.239 5.042 11.239 11.239 S 51.197 74 45 74 z M 45 55.521 c -3.992 0 -7.239 3.247 -7.239 7.239 S 41.008 70 45 70 c 3.992 0 7.239 -3.247 7.239 -7.239 S 48.992 55.521 45 55.521 z" stroke="currentColor" fill="currentColor" stroke-width="3" />
    </svg>
    {:else if mode === 'playing'}
    <svg class="w-16 h-16 inline" class:text-red-700={active} viewBox="0 0 100 100" stroke-width="1.5" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
        <path d="M 45 90 C 20.187 90 0 69.813 0 45 C 0 20.187 20.187 0 45 0 c 24.813 0 45 20.187 45 45 C 90 69.813 69.813 90 45 90 z M 45 4 C 22.393 4 4 22.393 4 45 s 18.393 41 41 41 s 41 -18.393 41 -41 S 67.607 4 45 4 z" />
        <circle cx="45" cy="45" r="40" stroke="currentColor" stroke-width="8" />
        <circle cx="31" cy="35.55" r="6" fill="currentColor" />
        <circle cx="59" cy="35.55" r="6" fill="currentColor" />
        <path d="M 38.71 70.626 c -0.512 0 -1.023 -0.195 -1.414 -0.586 c -0.781 -0.781 -0.781 -2.047 0 -2.828 l 12.579 -12.579 c 0.781 -0.781 2.047 -0.781 2.828 0 s 0.781 2.047 0 2.828 L 40.125 70.04 C 39.734 70.431 39.222 70.626 38.71 70.626 z" stroke="currentColor" fill="currentColor" stroke-width="4" />
        <path d="M 51.289 70.626 c -0.512 0 -1.023 -0.195 -1.414 -0.586 L 37.296 57.461 c -0.781 -0.781 -0.781 -2.047 0 -2.828 c 0.78 -0.781 2.047 -0.781 2.828 0 l 12.579 12.579 c 0.781 0.781 0.781 2.047 0 2.828 C 52.313 70.431 51.801 70.626 51.289 70.626 z" stroke="currentColor" fill="currentColor" stroke-width="4" />
    </svg>
    {:else}
    <svg class="w-16 h-16 inline" class:text-gray-700={active} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" color="currentColor">
        <path d="M 45 90 C 20.187 90 0 69.813 0 45 C 0 20.187 20.187 0 45 0 c 24.813 0 45 20.187 45 45 C 90 69.813 69.813 90 45 90 z M 45 4 C 22.393 4 4 22.393 4 45 s 18.393 41 41 41 s 41 -18.393 41 -41 S 67.607 4 45 4 z" />
        <circle cx="45" cy="45" r="40" stroke="currentColor" stroke-width="8" />
        <circle cx="31" cy="35.55" r="6" fill="currentColor" />
        <circle cx="59" cy="35.55" r="6" fill="currentColor" />
        <path d="M 45 69.345 c -7.954 0 -15.337 -3.969 -19.751 -10.617 c -0.611 -0.92 -0.36 -2.162 0.56 -2.772 c 0.92 -0.613 2.162 -0.36 2.772 0.56 c 3.671 5.529 9.809 8.83 16.419 8.83 c 6.61 0 12.748 -3.301 16.419 -8.83 c 0.61 -0.921 1.85 -1.173 2.772 -0.56 c 0.92 0.61 1.171 1.853 0.56 2.772 C 60.337 65.376 52.953 69.345 45 69.345 z" fill="currentColor" stroke="currentColor" stroke-width="4" />
    </svg>
    {/if}
</div>

<!-- <div>{mode} ({buffers})</div> -->

<div class="border border-2 border-gray-500 rounded w-3/4 md:w-1/3">
    <canvas class="w-full h-[100px] block" bind:this={canvas} />
</div>
</div>

<div class="h-12 fixed bottom-0 text-center p-2 w-full text-xs">
    <a href="https://github.com/pgmmpk/talkback">
        <svg class="inline w-5 h-5 mr-2" width="98" height="96" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="currentColor"/>
        </svg>pgmmpk/talkback
    </a>
</div>
