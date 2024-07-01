<script>
    import { TalkBack } from './talkback.js';
    import { drawAmp } from './draw.js';
    import { Waker } from './waker.js';
    import { settings } from './settings.svelte.js';
    import SettingsPanel from './SettingsPanel.svelte';

    let talkbackAudio = null;
    let waker = null;
    let mode = $state('waiting');

    let canvas;
    let canvasCtx;
    $effect(() => {
        canvasCtx = canvas.getContext('2d');
    })

    let active = $state(false);
    let needPermission = $state(false);
    async function toggleTalkback() {
        if (talkbackAudio === null) {
            try {
                talkbackAudio = new TalkBack({
                    sampleRate: settings.sampleRate,
                    threshold: settings.sensitivity,
                    silenceSecs: settings.silenceThresholdSecs,
                    timeLimitSecs: 300,
                });
                active = true;

                talkbackAudio.addEventListener('mode', e => {
                    mode = e.detail;
                });
                talkbackAudio.addEventListener('amp', ev => {
                    if (canvas) {
                        drawAmp(canvasCtx, ev.detail, canvas.width, canvas.height);
                    }
                });

                await talkbackAudio.start();

                waker = new Waker();
                await waker.request();
                mode = 'waiting';
            } catch (err) {
                console.error(err);
                needPermission = true;
                throw err;
            }
        } else {
            active = false;
            await waker.release();
            waker = null;
            await talkbackAudio.close();
            talkbackAudio = null;
            mode = 'waiting';
        }
    }

    let settingsVisible = $state(false);

    async function showSettings () {
        if (talkbackAudio !== null) {
            toggleTalkback();
        }
        
        settingsVisible = true;       
    }

    async function share () {
        const self = {
            title: 'Talk Back',
            url: 'https://talkback.kroutikov.net',
        };
        if (navigator.canShare && navigator.canShare(self)) {
            await navigator.share(self);
        }
    }
</script>
<div class="flex flex-col items-center content-center h-screen">
    <div class="flex-none h-8 flex flex-row mb-4 w-full">
        <div class="grow flex flex-row">
            <button aria-label="share" class="flex-none w-8 m-2 text-gray-700 disabled:text-gray-400 outline-none" onclick={share} >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                </svg>
            </button>
            <div class="grow text-xl md:mb-4 mb-8 mt-2 font-bold text-gray-700 text-center">
                Talk Back
            </div>
            <button aria-label="settings" class="flex-none w-8 m-2 text-gray-700 disabled:text-gray-400 outline-none" onclick={showSettings} >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 0 1 1.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.559.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.894.149c-.424.07-.764.383-.929.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 0 1-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.398.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 0 1-.12-1.45l.527-.737c.25-.35.272-.806.108-1.204-.165-.397-.506-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.108-1.204l-.526-.738a1.125 1.125 0 0 1 .12-1.45l.773-.773a1.125 1.125 0 0 1 1.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894Z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
            </button>
        </div>
    </div>

    <div class="flex-1 text-gray-700 flex flex-row">
    <button onclick={toggleTalkback} aria-label="toggle talk">
        {#if active}
        <svg class="w-36 h-36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke-width="1.5" stroke="currentColor" >
            <path stroke-linecap="round" stroke-linejoin="round"d="M6 18.4V5.6C6 5.26863 6.26863 5 6.6 5H9.4C9.73137 5 10 5.26863 10 5.6V18.4C10 18.7314 9.73137 19 9.4 19H6.6C6.26863 19 6 18.7314 6 18.4Z" />
            <path stroke-linecap="round" stroke-linejoin="round"d="M14 18.4V5.6C14 5.26863 14.2686 5 14.6 5H17.4C17.7314 5 18 5.26863 18 5.6V18.4C18 18.7314 17.7314 19 17.4 19H14.6C14.2686 19 14 18.7314 14 18.4Z" />
        </svg>
        {:else}
        <svg class="w-36 h-36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke-width="1.5" stroke="currentColor" >
            <path stroke-linecap="round" stroke-linejoin="round"d="M6.90588 4.53682C6.50592 4.2998 6 4.58808 6 5.05299V18.947C6 19.4119 6.50592 19.7002 6.90588 19.4632L18.629 12.5162C19.0211 12.2838 19.0211 11.7162 18.629 11.4838L6.90588 4.53682Z" />
        </svg>
        {/if}
    </button>
    </div>
{#if needPermission}
    <div class="flex-none text-red-700 text-2xl border border-2 border-red-700 rounded-full m-2 px-4">Please allow access to microphone</div>
{/if}

    <div class="flex-1 text-gray-400 flex flex-row items-center">
        {#if mode === 'recording'}
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

    <div class="flex-1 w-3/4 md:w-1/3 flex flex-col justify-center">
        <canvas class="w-full h-[100px] block border border-2 border-gray-500 rounded" bind:this={canvas} />
    </div>

    <div class="h-12 flex-none text-center p-2 w-full text-xs">
        <a href="https://github.com/pgmmpk/talkback">
            <svg class="inline w-5 h-5 mr-2" width="98" height="96" viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="currentColor"/>
            </svg>pgmmpk/talkback
        </a>
    </div>
</div>

<SettingsPanel bind:visible={settingsVisible} />
