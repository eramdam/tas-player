import * as t from 'io-ts';
import {reporter} from 'io-ts-reporters';
import {Controller} from 'jsnes';
import {chain, partition} from 'lodash';

import {makeEnumRuntimeType} from './typeHelpers';

/**
 * Types.
 */
const RFM2Headers = t.type({
  FDS: t.number,
  NewPPU: t.number,
  emuVersion: t.string,
  fourscore: t.number,
  guid: t.string,
  microphone: t.number,
  palFlag: t.number,
  port0: t.number,
  port1: t.number,
  port2: t.number,
  rerecordCount: t.number,
  romChecksum: t.string,
  romFilename: t.string,
  version: t.string,
})

enum FM2FrameCommandsEnum {
  NULL = 'NULL',
  SOFT_RESET = 'SOFT_RESET',
  HARD_RESET = 'HARD_RESET',
  FDS_DISK_INSERT = 'FDS_DISK_INSERT',
  FDS_DISK_SELECT = 'FDS_DISK_SELECT',
  VS_INSERT_COIN = 'VS_INSERT_COIN',
}

function parseCommand(n: number) {
  switch (n) {
    case 1:
      return FM2FrameCommandsEnum.SOFT_RESET
    case 2:
      return FM2FrameCommandsEnum.HARD_RESET
    case 4:
      return FM2FrameCommandsEnum.FDS_DISK_INSERT
    case 8:
      return FM2FrameCommandsEnum.FDS_DISK_SELECT
    case 16:
      return FM2FrameCommandsEnum.VS_INSERT_COIN
    default:
      return FM2FrameCommandsEnum.NULL
  }
}

enum FM2GamePadInputsEnum {
  RIGHT = 'R',
  LEFT = 'L',
  DOWN = 'D',
  UP = 'U',
  START = 'T',
  SELECT = 'S',
  B = 'B',
  A = 'A',
}

const RFM2GamePadInputs = t.readonlyArray(
  makeEnumRuntimeType<FM2GamePadInputsEnum>(FM2GamePadInputsEnum)
)

const RFM2Frame = t.type({
  command: makeEnumRuntimeType<FM2FrameCommandsEnum>(FM2FrameCommandsEnum),
  port0: RFM2GamePadInputs,
  port1: RFM2GamePadInputs,
  port2: RFM2GamePadInputs,
})

const RFM2Movie = t.type({
  headers: RFM2Headers,
  frames: t.readonlyArray(RFM2Frame),
})

export interface FM2Movie extends t.TypeOf<typeof RFM2Movie> {}

export function parseTasFile(data: string): FM2Movie {
  const lines = data.split('\n')
  const [headers, frames] = partition(lines, l => {
    return !l.startsWith('|')
  })

  const headersObject = chain(headers)
    .compact()
    .map(line => {
      const [key, ...values] = line.split(' ')

      return [key, values.join(' ')]
    })
    .compact()
    .keyBy(([key]) => key)
    .mapValues(([key, val]) => formatValues(key, val))
    .value()

  const value = {
    headers: headersObject,
    frames: frames.map(f => parseFrameLine(f)),
  }

  const decoded = RFM2Movie.decode(value)

  if (!decoded.isRight()) {
    reporter(decoded).forEach(err => {
      throw err
    })
    throw new Error('TAS file invalid')
  }

  return decoded.value
}

const numbersFields = [
  'FDS',
  'NewPPU',
  'fourscore',
  'microphone',
  'palFlag',
  'port0',
  'port1',
  'port2',
  'rerecordCount',
]

function formatValues(key: string, val: any) {
  if (numbersFields.includes(key)) return Number(val)

  return String(val)
}

function parseFrameLine(line: string): t.TypeOf<typeof RFM2Frame> {
  const [, command, port0, port1, port2] = line.split('|')

  return {
    command: parseCommand(Number(command)),
    port0: port0
      .split('')
      .filter(i => i !== '' && i !== '.') as FM2GamePadInputsEnum[],
    port1: port1
      .split('')
      .filter(i => i !== '' && i !== '.') as FM2GamePadInputsEnum[],
    port2: port2
      .split('')
      .filter(i => i !== '' && i !== '.') as FM2GamePadInputsEnum[],
  }
}

const fm2ToJSNESMap = {
  [FM2GamePadInputsEnum.A]: Controller.BUTTON_A,
  [FM2GamePadInputsEnum.B]: Controller.BUTTON_B,
  [FM2GamePadInputsEnum.SELECT]: Controller.BUTTON_SELECT,
  [FM2GamePadInputsEnum.START]: Controller.BUTTON_START,
  [FM2GamePadInputsEnum.UP]: Controller.BUTTON_UP,
  [FM2GamePadInputsEnum.DOWN]: Controller.BUTTON_DOWN,
  [FM2GamePadInputsEnum.LEFT]: Controller.BUTTON_LEFT,
  [FM2GamePadInputsEnum.RIGHT]: Controller.BUTTON_RIGHT,
}
export function FM2GamePadtoJSNESControllers(input: FM2GamePadInputsEnum) {
  return fm2ToJSNESMap[input]
}
