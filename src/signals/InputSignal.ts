import type { Point } from 'pixi.js'
import Signal from '../core/Signal'

export abstract class InputEvent extends Signal {}

export enum PointerInputEventState {
  Started,
  Updated,
  Ended,
}

export class PointerInputEvent extends InputEvent {
  constructor(
    public point: Point,
    // public index: number,
    // public state: PointerInputEventState,
  ) {
    super(0)
  }
}
