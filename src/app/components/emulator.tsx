import {Controller, NES} from 'jsnes';
import React, {Component} from 'react';

import {FM2GamePadToJSNESControllers, FM2Movie} from '../helpers/fm2Helpers';
import {FrameTimer} from '../helpers/frameTimer';
import Speakers from '../helpers/speakers';

const SCREEN_WIDTH = 256
const SCREEN_HEIGHT = 240
const FRAMEBUFFER_SIZE = SCREEN_WIDTH * SCREEN_HEIGHT

const SAMPLE_COUNT = 4 * 1024

interface EmulatorProps {
  romData: string
  tasData: FM2Movie
}

function keyboard(callback: Function, event: KeyboardEvent) {
  var player = 1
  switch (event.keyCode) {
    case 38: // UP
      callback(player, Controller.BUTTON_UP)
      break
    case 40: // Down
      callback(player, Controller.BUTTON_DOWN)
      break
    case 37: // Left
      callback(player, Controller.BUTTON_LEFT)
      break
    case 39: // Right
      callback(player, Controller.BUTTON_RIGHT)
      break
    case 65: // 'a' - qwerty, dvorak
    case 81: // 'q' - azerty
      callback(player, Controller.BUTTON_A)
      break
    case 83: // 's' - qwerty, azerty
    case 79: // 'o' - dvorak
      callback(player, Controller.BUTTON_B)
      break
    case 9: // Tab
      callback(player, Controller.BUTTON_SELECT)
      break
    case 13: // Return
      callback(player, Controller.BUTTON_START)
      break
    default:
      break
  }
}

export class Emulator extends Component<EmulatorProps> {
  constructor(props: any) {
    super(props)

    this.speakers = new Speakers({
      onBufferUnderrun: (actualSize, desiredSize) => {
        // Skip a video frame so audio remains consistent. This happens for
        // a variety of reasons:
        // - Frame rate is not quite 60fps, so sometimes buffer empties
        // - Page is not visible, so requestAnimationFrame doesn't get fired.
        //   In this case emulator still runs at full speed, but timing is
        //   done by audio instead of requestAnimationFrame.
        // - System can't run emulator at full speed. In this case it'll stop
        //    firing requestAnimationFrame.
        console.log(
          'Buffer underrun, running another frame to try and catch up'
        )

        this.frameTimer.generateFrame()
        // desiredSize will be 2048, and the NES produces 1468 samples on each
        // frame so we might need a second frame to be run. Give up after that
        // though -- the system is not catching up
        if (this.speakers.buffer.size() < desiredSize) {
          console.log('Still buffer underrun, running a second frame')
          this.frameTimer.generateFrame()
        }
      },
    })

    this.nes = new NES({
      onAudioSample: this.speakers.writeSample,
      onStatusUpdate: console.log,
      sampleRate: this.speakers.getSampleRate(),
      onFrame: frame => {
        if (!this.framebuffer32) return

        for (var i = 0; i < FRAMEBUFFER_SIZE; i++)
          this.framebuffer32[i] = 0xff000000 | frame[i]
      },
    })

    this.frameTimer = new FrameTimer({
      onGenerateFrame: async () => {
        this.maybePressButtons()
        this.nes.frame()

        if (this.frameCounterRef.current) {
          this.frameCounterRef.current.innerHTML = String(
            this.nes.fpsFrameCount
          )
        }
      },
      onWriteFrame: () => {
        const ctx = this.getCtx()

        if (!this.imageData || !this.framebuffer8 || !ctx) return

        this.imageData.data.set(this.framebuffer8)
        ctx.putImageData(this.imageData, 0, 0)
      },
    })

    window.nes = this.nes
  }

  private speakers: Speakers
  private frameTimer: FrameTimer
  private canvasRef = React.createRef<HTMLCanvasElement>()
  private frameCounterRef = React.createRef<HTMLDivElement>()
  private nes: NES
  private framebuffer32?: Uint32Array
  private framebuffer8?: Uint8ClampedArray
  private imageData?: ImageData
  private rAFID?: number

  /**
   * VIDEO.
   */
  private getCtx = () => {
    return (
      this.canvasRef.current &&
      (this.canvasRef.current.getContext('2d') as CanvasRenderingContext2D)
    )
  }

  private initCanvas = () => {
    const canvas = this.canvasRef.current

    if (!canvas) return

    const ctx = this.getCtx()

    if (!ctx) return

    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
    this.imageData = ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

    const buffer = new ArrayBuffer(this.imageData.data.length)
    this.framebuffer32 = new Uint32Array(buffer)
    this.framebuffer8 = new Uint8ClampedArray(buffer)
  }

  /**
   * DISCO.
   */

  private maybePressButtons = async () => {
    // @ts-ignore
    if (this.nes.ppu.f_spVisibility === 0) {
      return
    }
    const { tasData } = this.props
    const commands = tasData.frames[this.nes.fpsFrameCount]
    if (!commands) return
    const buttonsToPress = commands.port0.map(i =>
      FM2GamePadToJSNESControllers(i)
    )
    // Button down
    for (const b of buttonsToPress) {
      if (b >= 0) {
        this.nes.buttonDown(1, b)
      }
    }
    await wait(10)
    // Button up
    for (const i of commands.port0) {
      const buttonToPress = FM2GamePadToJSNESControllers(i)
      if (buttonToPress >= 0) {
        this.nes.buttonUp(1, buttonToPress)
      }
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', event => {
      console.log('keydown', Date.now())
      keyboard(this.nes.buttonDown, event)
    })
    document.addEventListener('keyup', event => {
      console.log('keyup', Date.now())
      keyboard(this.nes.buttonUp, event)
    })
  }

  componentDidUpdate() {
    if (!this.props.romData || !this.props.tasData) return

    this.initCanvas()
    this.nes.loadROM(this.props.romData)

    this.speakers.start()
    this.frameTimer.start()
  }

  componentWillUnmount() {
    window.cancelAnimationFrame(this.rAFID || 0)
  }

  render() {
    return (
      <>
        <canvas ref={this.canvasRef} width="256" height="240" />
        {/* <div
          ref={this.frameCounterRef}
          id="framecount"
          style={{
            position: 'absolute',
            background: 'pink',
            color: 'black',
          }}
        /> */}
      </>
    )
  }
}

function wait(n: number) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, n)
  })
}
