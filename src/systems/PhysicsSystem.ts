import { System, World, Entity, type SignalBus } from '../core'
import { RigidBody } from '../components'
import { CollisionSignal, EntityAddedSignal, EntityRemovedSignal } from '../signals'

export interface PhysicsSystemOptions {
  gravityScale: number
}

export class PhysicsSystem extends System {
  private options: PhysicsSystemOptions

  constructor(options?: Partial<PhysicsSystemOptions>) {
    super()

    this.options = {
      ...options,
      gravityScale: 0.1,
    }
  }

  init(world: World, sb: SignalBus): void {}

  update(world: World, sb: SignalBus, dt: number): void {
    const ecs = world.getEntitiesWithComponent(RigidBody)

    for (const { e, c } of ecs) {
      let fX = c.force.x
      let fY = c.force.y
      c.force.set(0, 0)

      if (!c.isStatic) {
        fX += c.gravity.x * this.options.gravityScale
        fY += c.gravity.y * this.options.gravityScale
      }
      const aX = fX / c.mass
      const aY = fY / c.mass

      const halfDtSqrd = 0.5 * dt * dt
      c.velocity.set(c.velocity.x + aX * halfDtSqrd, c.velocity.y + aY * halfDtSqrd)
      c.position.set(c.x + c.velocity.x * dt, c.y + c.velocity.y * dt)
      e.position.set(c.position.x, c.position.y)
      // e.angle = (c.angle * 180) / Math.PI
    }
  }
}
