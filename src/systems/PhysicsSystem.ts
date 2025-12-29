import { Graphics, Matrix, type Container } from 'pixi.js'
import { System, World, type SignalBus, Vector } from '../core'
import {} from '../geometry'
import {
  calculateVelocitiesAfterCollision,
  detectCollisions,
  PENETRATION_ALLOWANCE,
  PENETRATION_PERCENTAGE_TO_CORRECT,
  type Collision,
} from '../physics'
import { Body } from '../components'
import { CollisionSensorTriggered, EntityAdded } from '../signals'
import { connectContainerEvent } from '../input'

export interface PhysicsSystemOptions {
  gravity: Vector
  layerMap?: Map<number, number>
  _rendersColliders: boolean
}

export class PhysicsSystem extends System {
  private options: PhysicsSystemOptions
  private _cg?: Graphics

  constructor(options?: Partial<PhysicsSystemOptions>) {
    super()

    this.options = {
      gravity: new Vector(0, 0.981),
      _rendersColliders: false,
      ...options,
    }
  }

  init(world: World, hud: Container, sb: SignalBus): void {
    if (this.options._rendersColliders) {
      this._cg = new Graphics()
      world.addChild(this._cg)
    }
    world.getEntitiesWithComponent(Body).forEach(({ e, c: rb }) => {
      e.position.copyFrom(rb.position)
      e.rotation = rb.rotation
    })

    const player = world.getEntitiesByTag('player')![0]!
    world.interactive = true
    this.connections.push(
      sb.connect(EntityAdded, (s) => {
        const e = world.getEntity(s.entityId)!
        const rb = e.getComponent(Body)
        if (rb) {
          e.position.copyFrom(rb.position)
          e.rotation = rb.rotation
        }
      }),
      connectContainerEvent('globalmousemove', world, (e) => {
        player.getComponent(Body)!.position.set(e.globalX, e.globalY)
      }),
    )
  }

  fixedUpdate(world: World, sb: SignalBus, dt: number): void {
    const e_bs = world.getEntitiesWithComponent(Body)
    const collisions: Collision[] = []

    for (let i = 0; i < e_bs.length; i++) {
      const { e: eA, c: A } = e_bs[i]!

      for (let j = i + 1; j < e_bs.length; j++) {
        const { e: eB, c: B } = e_bs[j]!
        const col = A.testForCollision(B)
        if (col) {
          collisions.push(col)
        }
      }
    }
    for (const { e, c: b } of e_bs) {
      e.position.set(b.position.x, b.position.y)
    }
  }

  update(world: World, sb: SignalBus, dt: number): void {
    // let force = new Vector()
    // let acc = new Vector()
    // const e_bs = world.getEntitiesWithComponent(Body)
    // for (const { c: b } of e_bs) {
    //   if (b.isStatic) {
    //     continue
    //   }
    //   if (!b.isKinematic) {
    //     force.x = b.force.x + this.options.gravity.x * b.gravityScale.x
    //     force.y = b.force.y + this.options.gravity.y * b.gravityScale.y
    //     b.force.set(0, 0)
    //     acc.x = force.x / b.mass
    //     acc.y = force.y / b.mass
    //     b.velocity.set(b.velocity.x + acc.x * dt, b.velocity.y + acc.y * dt)
    //   }
    //   b.position.set(b.position.x + b.velocity.x * dt, b.position.y + b.velocity.y * dt)
    // }
    // const collisions = detectCollisions(world.getEntitiesWithComponent(Body), this.options.layerMap)
    // this.resolveCollisions(world, sb, collisions)
    // for (const { e, c: b } of e_bs) {
    //   b.position.set(b.position.x + b.velocity.x * dt, b.position.y + b.velocity.y * dt)
    //   e.position.set(b.position.x, b.position.y)
    //   e.rotation = b.rotation
    // }
    // if (this._cg) {
    //   this._cg.clear()
    // const e_cs = world.getEntitiesWithComponent(Collider)
    // for (const { c } of e_cs) {
    //   c._draw(this._cg)
    // }
    // this._cg.stroke({ width: 1, color: 0x00ffff })
    // }
  }

  private resolveCollisions(world: World, sb: SignalBus, collisions: Collision[]) {
    // for (const col of collisions) {
    // const sensor = col.actors.find((a) => a.isSensor)
    // if (sensor) {
    //   sb.emit(new CollisionSensorTriggered(sensor, col.actors.find((a) => a.id != sensor.id)!))
    //   continue
    // }
    //   const A = world.getEntity(col.actors[0].id)!.getComponent(Body)
    //   const B = world.getEntity(col.actors[1].id)!.getComponent(Body)
    //   if (!A || !B) {
    //     continue
    //   }
    //   const relV = B.velocity.subtract(A.velocity)
    //   const velAlongN = relV.dot(col.normal)
    //   // console.log(velAlongN, col.normal)
    //   if (velAlongN > 0) {
    //     // Bodies are already separating
    //     continue
    //   }
    //   // Coefficient of restitution:
    //   const e = Math.min(A.restitution, B.restitution)
    //   // Impulse scalar:
    //   const j = (-(1 + e) * velAlongN) / (A.iMass + B.iMass)
    //   // Impulse (change in momentum; https://en.wikipedia.org/wiki/Momentum):
    //   const I = col.normal.multiplyScalar(j)
    //   const correction = col.normal.multiplyScalar(
    //     (Math.max(col.penetration - PENETRATION_ALLOWANCE, 0) * PENETRATION_PERCENTAGE_TO_CORRECT) /
    //       (A.iMass + B.iMass),
    //   )
    //   if (!A.isStatic) {
    //     A.velocity.set(A.velocity.x - I.x / A.mass, A.velocity.y - I.y / A.mass)
    //     A.position.set(A.position.x - correction.x * A.iMass, A.position.y - correction.y * A.iMass)
    //   }
    //   if (!B.isStatic) {
    //     B.velocity.set(B.velocity.x + I.x / B.mass, B.velocity.y + I.y / B.mass)
    //     B.position.set(B.position.x + correction.x * B.iMass, B.position.y + correction.y * B.iMass)
    //   }
    // }
  }
}
