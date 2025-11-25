import { Entity, type System } from '../core'
import { BodyComponent, PhysicsComponent } from '../components'
import { Engine, Composite, Runner } from 'matter-js'

export default class PhysicsSystem implements System {
  private engine!: Engine

  init(): void {
    this.engine = Engine.create()
  }

  update(entities: Entity[]): void {
    for (const e of entities) {
      const bc = e.getComponent(BodyComponent)
      if (!bc) {
        return
      }
      if (bc.body && !bc.isAdded) {
        Composite.add(this.engine.world, bc.body)
        bc.isAdded = true
      }

      const pc = e.getComponent(PhysicsComponent)
      if (!pc || !bc.body) {
        return
      }
      pc.position.x = bc.body.position.x
      pc.position.y = bc.body.position.y
    }

    Engine.update(this.engine)
  }
}
