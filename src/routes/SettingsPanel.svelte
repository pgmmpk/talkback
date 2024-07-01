<script>
    import { fly } from 'svelte/transition';
    import { settings } from './settings.svelte.js';

    let { visible = $bindable() } = $props();
</script>
{#if visible}
<div class="h-screen absolute top-0 left-0 w-full border bg-white border-gray-700 z-2 flex flex-col shadow-xl shadow-gray-700 p-2" transition:fly={{ duration: 400, opacity: 1.0, x: '100%' }}>
    <div class="flex flex-row">
        <div class="grow"></div>
        <button class="flex-none m-2 w-8" aria-label="Close" onclick={() => {visible = false;}}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
        </button>
    </div>
    <div class="flex flex-row items-center justify-center my-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline mr-2 flex-none">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
            <input type="range" class="accent-gray-700 grow shrink" id="sensitivity" name="sensitivity" aria-label="Sensitivity" min="0.0" max="0.1" step="0.001" bind:value={settings.sensitivity} />
            <div class="w-12 ml-2 inline-block flex-none">{settings.sensitivity}</div>
    </div>
    <div class="flex flex-row items-center justify-center my-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 inline mr-2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 0 1 0 3m0-3a1.5 1.5 0 0 0 0 3m0 9.75V10.5" />
            </svg>
            <input type="range" class="accent-gray-700 grow" id="silence-threshold-millis" name="silence-threshold-millis" aria-label="Silence Threhold" min="0" max="1" step="0.01" bind:value={settings.silenceThresholdSecs} />
            <div class="w-12 ml-2 inline-block">{settings.silenceThresholdSecs.toFixed(2)}</div>
    </div>
    <div class="my-8 ml-4 flex justify-center">
        <label class="mr-4 p-2" for="#sample-rate">Sample rate:</label>
        <select class="p-2 rounded px-4 border border-gray-700 outline-none" id="sample-rate" bind:value={settings.sampleRate} >
            <option value={8000}>{8000}</option>
            <option value={16000}>{16000}</option>
            <option value={48000}>{48000}</option>
        </select>
    </div>
    <div class="grow"></div>
    <div class="text-sm text-center text-gray-500 mb-2">build #{import.meta.env.BUILD_NUMBER ?? 'dev'}</div>
</div>
{/if}