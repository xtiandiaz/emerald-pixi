import type { Container } from 'pixi.js'
import { System, World, type SignalBus, Vector } from '../core'
import { updateEntityCollidersShapeTransform } from '../collision'
import { calculateVelocitiesAfterCollision, detectCollisions, type Collision } from '../physics'
import { Collider, RigidBody } from '../components'
import { EntityAddedSignal } from '../signals'

export interface PhysicsSystemOptions {
  gravity: Vector
  layerMap?: Map<number, number>
}

export class PhysicsSystem extends System {
  private options: PhysicsSystemOptions

  constructor(options?: Partial<PhysicsSystemOptions>) {
    super()

    this.options = {
      ...options,
      gravity: new Vector(0, 0.981),
    }
  }

  init(world: World, hud: Container, sb: SignalBus): void {
    const ecs = world.getEntitiesWithComponent(Collider)
    for (const { e, c } of ecs) {
      e.addChild(c.createDebugGraphics())
    }

    world.getEntitiesWithComponent(RigidBody).forEach(({ e, c: rb }) => {
      e.position.copyFrom(rb.position)
      e.rotation = rb.rotation
    })

    this.connections.push(
      sb.connect(EntityAddedSignal, (s) => {
        const e = world.getEntity(s.entityId)!
        const rb = e.getComponent(RigidBody)
        if (rb) {
          e.position.copyFrom(rb.position)
          e.rotation = rb.rotation
        }
      }),
    )
  }

  update(world: World, sb: SignalBus, dt: number): void {
    const e_rbs = world.getEntitiesWithComponent(RigidBody).filter(({ c }) => !c.isStatic)
    let f = new Vector()
    let a = new Vector()

    for (const { e, c: rb } of e_rbs) {
      if (!rb.isKinematic) {
        f.x = rb.force.x + this.options.gravity.x * rb.gravityScale.x
        f.y = rb.force.y + this.options.gravity.y * rb.gravityScale.y
        rb.force.set(0, 0)

        a.x = f.x / rb.mass
        a.y = f.y / rb.mass

        rb.velocity.set(rb.velocity.x + a.x * dt, rb.velocity.y + a.y * dt)
      }
      rb.position.set(rb.position.x + rb.velocity.x * dt, rb.position.y + rb.velocity.y * dt)
    }

    updateEntityCollidersShapeTransform(world.getEntitiesWithComponent(Collider))

    const collisions = detectCollisions(
      world.getEntitiesWithComponent(Collider),
      this.options.layerMap,
    )

    this.resolveCollisions(world, collisions)

    for (const { e, c: rb } of e_rbs) {
      e.position.set(rb.position.x, rb.position.y)
      e.rotation = rb.rotation
    }
  }

  private resolveCollisions(world: World, collisions: Collision[]) {
    // console.log(collisions.length)
    for (const col of collisions) {
      const rbA = world.getEntity(col.fromId)?.getComponent(RigidBody)
      const rbB = world.getEntity(col.intoId)?.getComponent(RigidBody)
      if (!rbA || !rbB) {
        continue
      }
      const v1 = calculateVelocitiesAfterCollision(
        rbA.velocity,
        rbB.velocity,
        rbA.mass,
        rbB.mass,
        rbA.restitution,
        rbB.restitution,
        col.dir,
      )
      rbA.velocity.set(v1.a.x, v1.a.y)
      // console.log(rbA.velocity)
      rbA.position.x += col.penetration * col.dir.x
      rbA.position.y += col.penetration * col.dir.y

      if (!rbB.isStatic) {
        rbB.velocity.set(v1.b.x, v1.b.y)
      }
    }
  }
}
