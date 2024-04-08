import { expect, test } from 'vitest'
import { RingBuffer } from './ring-buffer.js'

test('smoke', () => {
    const b = new RingBuffer(3);

    expect (b.length).toBe(0);
    b.push(1);
    expect (b.length).toBe(1);

    expect ([...b]).toStrictEqual([1]);
});

test('ringing', () => {
    const b = new RingBuffer(3);

    expect (b.length).toBe(0);
    b.push(1);
    b.push(2);
    b.push(3);
    b.push(4);
    expect (b.length).toBe(3);

    expect ([...b]).toStrictEqual([2, 3, 4]);
    expect ([...b.slice()]).toStrictEqual([2, 3, 4]);
    expect ([...b.slice(1)]).toStrictEqual([3, 4]);
    expect ([...b.slice(2)]).toStrictEqual([4]);
    expect ([...b.slice(3)]).toStrictEqual([]);
    expect ([...b.slice(1,2)]).toStrictEqual([3]);
    expect ([...b.slice(1,5)]).toStrictEqual([3, 4]);
});

test ('shift', () => {
    const b = new RingBuffer(3);
    b.push(1);
    b.push(2);

    expect (b.shift()).toBe(1);
    expect (b.shift()).toBe(2);
    expect (b.length).toBe(0);

    b.push(0);
    expect (b.length).toBe(1);
    expect (b.shift()).toBe(0);
});

test ('pop', () => {
    const b = new RingBuffer(3);
    b.push(1);
    b.push(2);

    expect (b.pop()).toBe(2);
    expect (b.pop()).toBe(1);
    expect (b.length).toBe(0);

    b.push(0);
    expect (b.length).toBe(1);
    expect (b.pop()).toBe(0);
});
