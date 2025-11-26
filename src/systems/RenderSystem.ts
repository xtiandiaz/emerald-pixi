import { Entity, type System } from '../core'
import { PhysicsComponent, GraphicsComponent } from '../components'
import type { Container, Renderer } from 'pixi.js'

export default class RenderSystem implements System {
  private renderer: Renderer
  private stage: Container

  constructor(renderer: Renderer, stage: Container) {
    this.renderer = renderer
    this.stage = stage
  }

  update(entities: Entity[]): void {
    for (const e of entities) {
      const gc = e.getComponent(GraphicsComponent)
      if (gc && gc.parent == undefined) {
        this.stage.addChild(gc)
      }
      const pc = e.getComponent(PhysicsComponent)
      if (pc) {
        gc?.position.set(pc.position.x, pc.position.y)
      }
    }

    this.renderer.render(this.stage)
  }
}
