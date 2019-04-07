declare module 'ringbufferjs' {
  export default class RingBuffer<T> {
    constructor(element: T) {}
    capacity: () => number
    deq: () => T
    deqN: (count: number) => T[]
    enq: (element: T) => {}
    isEmpty: () => boolean
    isFull: () => boolean
    peek: () => T
    size: () => number
  }
}
