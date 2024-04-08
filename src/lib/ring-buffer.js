export class RingBuffer {
    constructor (size) {
        this.size = size;
        this.data = new Array(size);
        this.head = 0;
        this.tail = 0;
        this.empty = true;
    }

    push (data) {
        this.data[this.tail] = data;
        if (!this.empty) {
            // discard oldest
            if (this.head === this.tail) {
                this.head = (this.head + 1) % this.size;
            }    
        } else {
            this.empty = false;
        }
        this.tail = (this.tail + 1) % this.size;
    }

    get length () {
        if (this.empty) return 0;
        if (this.tail === this.head) return this.size;
        return (this.size + this.tail - this.head) % this.size;
    }

    get (index) {
        if (index < 0 || index >= this.length) return undefined;
        return this.data[(this.head + index) % this.size];
    }

    *[Symbol.iterator] () {
        yield * this.slice(0);
    }

    *slice (start, end) {
        if (start === undefined) {
            start = 0;
        }
        if (end === undefined) {
            end = this.length;
        } else if (end > this.length) {
            end = this.length;
        }

        if (start >= end) {
            return;
        }

        let h = (this.head + start) % this.size;
        let t = (this.head + end) % this.size;
        do {
            yield this.data[h];
            h = (h + 1) % this.size;
        } while (h !== t);
    }

    shift () {
        if (this.empty) return undefined;
        const data = this.data[this.head];
        this.head  = (this.head + 1) % this.size;
        if (this.head === this.tail) this.empty = true;
        return data;
    }

    pop () {
        if (this.empty) return undefined;
        const data = this.data[(this.tail - 1 + this.size) % this.size];
        this.tail  = (this.tail - 1 + this.size) % this.size;
        if (this.head === this.tail) this.empty = true;
        return data;
    }
}

