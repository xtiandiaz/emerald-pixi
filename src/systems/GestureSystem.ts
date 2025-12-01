import { type EntityProvider, type SignalEmitter, type System, Screen } from '../core'
import { Container, FederatedPointerEvent, Rectangle } from 'pixi.js'

export default class GestureSystem implements System {
  private eventNames = ['pointerdown', 'pointerup', 'pointermove']

  constructor(private stage: Container) {}

  init(): void {
    this.stage.interactive = true

    this.eventNames.forEach((en) => this.stage.on(en, this.onEvent, this))
  }

  deinit(): void {
    this.eventNames.forEach((en) => this.stage.off(en, this.onEvent, this))
  }

  update(ec: EntityProvider, se: SignalEmitter, dt: number): void {}

  private onEvent(e: FederatedPointerEvent) {
    console.log(e.global)
  }
}
