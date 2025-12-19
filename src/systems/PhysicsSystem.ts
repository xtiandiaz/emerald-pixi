import { System, World, Entity, type SignalBus } from '../core'
import { RigidBody } from '../components'
import { EntityAddedSignal } from '../signals'
import type { Container } from 'pixi.js'

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

  init(world: World, hud: Container, sb: SignalBus): void {
    world.getEntitiesWithComponent(RigidBody).forEach(({ e, c }) => {
      e.position.copyFrom(c.position)
    })

    this.connections.push(
      sb.connect(EntityAddedSignal, (s) => {
        const e = world.getEntity(s.entityId)
        const rb = e?.getComponent(RigidBody)
        if (rb) {
          e!.position.copyFrom(rb.position)
        }
      }),
    )
  }

  update(world: World, sb: SignalBus, dt: number): void {
    const ecs = world.getEntitiesWithComponent(RigidBody).filter(({ c }) => !c.isStatic)

    for (const { e, c } of ecs) {
      c.force.x = (c.force.x + c.gravity.x * this.options.gravityScale) * 0.5
      c.force.y = (c.force.y + c.gravity.y * this.options.gravityScale) * 0.5

      const aX = c.force.x / c.mass
      const aY = c.force.y / c.mass

      const halfDtSqrd = 0.5 * dt * dt
      c.velocity.set(c.velocity.x + aX * halfDtSqrd, c.velocity.y + aY * halfDtSqrd)
      c.position.set(c.x + c.velocity.x * dt, c.y + c.velocity.y * dt)
      e.position.copyFrom(c.position)
      e.rotation = c.rotation
    }
  }
}
