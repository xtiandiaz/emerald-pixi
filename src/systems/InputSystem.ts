import type { Entity, System } from '../core'
import { Point } from 'pixi.js'

export default class InputSystem implements System {
  constructor() {
    window.addEventListener('click', (e: MouseEvent) => {
      this.onClick(new Point(e.x, e.y))
    })
  }

  update(entities: Entity[]): void {}

  private onClick(pos: Point) {}
}
