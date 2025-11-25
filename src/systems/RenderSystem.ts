import { Entity, type System } from '../core'
import { PhysicsComponent, GraphicsComponent } from '../components'
import { Application, type ApplicationOptions } from 'pixi.js'

export default class RenderSystem extends Application implements System {
  async init(options?: Partial<ApplicationOptions>): Promise<void> {
    await super.init(options)
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
