import type { Point } from 'pixi.js'

export abstract class InputEvent {}

export enum PointerInputEventState {
  Started,
  Updated,
  Ended,
}

export class PointerInputEvent extends InputEvent {
  constructor(
    public point: Point,
    public index: number,
    public state: PointerInputEventState,
  ) {
    super()
  }
}
