import { Entity, type System } from '../core'
import { PhysicsComponent } from '../components'
import { Engine, Composite } from 'matter-js'

export default class PhysicsSystem implements System {
  private engine: Engine
  private bodies = {} as Record<number, boolean>

  constructor() {
    this.engine = Engine.create()
  }

  update(entities: Entity[]): void {
    for (const e of entities) {
      const pc = e.getComponent(PhysicsComponent)
      if (!pc) {
        return
      }
      if (!this.bodies[pc.body.id]) {
        Composite.add(this.engine.world, pc.body)
        this.bodies[pc.body.id] = true
      }

      pc.position.x = pc.body.position.x
      pc.position.y = pc.body.position.y
    }

    Engine.update(this.engine)
  }
}
