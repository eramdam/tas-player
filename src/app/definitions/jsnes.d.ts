declare module 'jsnes' {
  interface NESContructorOptions {
    onFrame?: (frame: number[]) => void
    sampleRate?: number
    onStatusUpdate?: (...args: any[]) => void
    onAudioSample?: (left: number, right: number) => void
  }

  export const Controller = {
    BUTTON_A: 0,
    BUTTON_B: 1,
    BUTTON_SELECT: 2,
    BUTTON_START: 3,
    BUTTON_UP: 4,
    BUTTON_DOWN: 5,
    BUTTON_LEFT: 6,
    BUTTON_RIGHT: 7,
  }

  export class NES {
    constructor(options: NESContructorOptions) {}
    loadROM: (romData: string) => void
    frame: () => void
    buttonDown: (player: number, key: number) => void
    buttonUp: (player: number, key: number) => void
    controllers: {
      1: typeof Controller
      2: typeof Controller
    }
  }
}
