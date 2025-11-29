import { type ECS, type System, Screen } from '../core'
import { InputComponent } from '../components'
import { Container, FederatedPointerEvent, Rectangle } from 'pixi.js'

export default class InputSystem implements System {
  private stage: Container
  private pointerEventQueue: FederatedPointerEvent[] = []

  constructor(stage: Container) {
    this.stage = stage
  }

  async init(): Promise<void> {
    this.stage.interactive = true
    this.stage.hitArea = new Rectangle(0, 0, Screen.width, Screen.height)

    Array('pointerdown', 'pointerup').forEach((en) => {
      this.stage.on(en, (e) => this.pointerEventQueue.push(e))
    })
  }

  update(ecs: ECS, _: number): void {
    if (!this.pointerEventQueue.length) {
      return
    }
    const ics = ecs.getComponents(InputComponent)
    for (const e of this.pointerEventQueue) {
      ics.forEach((ic) => ic.onPointerEvent?.(e))
    }
    this.pointerEventQueue.length = 0
  }
}
