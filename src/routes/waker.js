export class Waker {

    constructor () {
        this._wakeLock = null;
    }

    async request() {
        await this.release();
        try {
            this._wakeLock = await navigator.wakeLock.request("screen");
            this._wakeLock.addEventListener("release", () => {
                this._wakeLock = null;
            });    
        } catch (err) {
            console.error("Failed to request wake lock");
            await this.release();
        }
    }

    async release () {
        if (this._wakeLock !== null) {
            await this._wakeLock.release();
        }
    }

    get state () {
        return this._wakeLock ? "active" : "released";
    }
}
