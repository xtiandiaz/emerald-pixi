import { FederatedEvent, Point, type Container } from 'pixi.js'

export interface InputEvent {}

export class PointerEvent implements InputEvent {
  // constructor(location: Point)
}

export default class Input {
  _eventQueue: InputEvent[] = []

  init(stage: Container) {
    stage.on('pointerdown', (e: FederatedEvent) => {
      // e.target.x
    })
  }
}
