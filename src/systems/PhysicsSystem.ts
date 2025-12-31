import { Graphics, Matrix, type Container } from 'pixi.js'
import { System, World, type SignalBus, Vector } from '../core'
import {} from '../geometry'
import {
  calculateVelocitiesAfterCollision,
  PENETRATION_ALLOWANCE,
  PENETRATION_PERCENTAGE_TO_CORRECT,
  type Contact,
  type Collision,
  type Gravity,
  type CollisionLayerMap,
} from '../physics'
import { Body } from '../components'
import { CollisionSensorTriggered, EntityAdded, EntityRemoved } from '../signals'
import { connectContainerEvent } from '../input'
import { Game } from '../game'
import { PhysicsEngine } from '../physics/PhysicsEngine'

export interface PhysicsSystemOptions {
  iterations: number
  PPM?: number // Pixels Per Meter
  gravity?: Gravity
  collisionLayerMap?: CollisionLayerMap
  rendersColliders: boolean
}

export class PhysicsSystem extends System {
  private gravity: Gravity
  private PPM: number
  private collisionLayerMap?: CollisionLayerMap
  private options: PhysicsSystemOptions
  private engine!: PhysicsEngine
  private _cg?: Graphics

  constructor(options?: Partial<PhysicsSystemOptions>) {
    super()

    this.gravity = options?.gravity ?? {
      vector: new Vector(0, 1),
      value: 9.81, // m/s^2
    }
    this.PPM = options?.PPM ?? 10
    this.collisionLayerMap = options?.collisionLayerMap

    this.options = {
      iterations: 12,
      rendersColliders: false,
      ...options,
    }
  }

  init(world: World, hud: Container, sb: SignalBus): void {
    this.engine = new PhysicsEngine(
      world.getEntitiesWithComponent(Body).map(({ e, c }) => [e.id, c]),
      this.gravity,
      this.collisionLayerMap,
      this.PPM,
    )

    if (this.options.rendersColliders) {
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
        const b = world.getComponent(s.entityId, Body)
        if (b) {
          this.engine.addBody(s.entityId, b)
          // e.position.copyFrom(b.position)
          // e.rotation = b.rotation
        }
      }),
      sb.connect(EntityRemoved, (s) => {
        this.engine.removeBody(s.entityId)
      }),
      connectContainerEvent('globalmousemove', world, (e) => {
        const b = player.getComponent(Body)!
        // b.position.set(e.globalX, e.globalY)
        // b.velocity.set(e.movementX, e.movementY)
      }),
    )
  }

  fixedUpdate(world: World, signalBus: SignalBus, dT: number): void {
    const e_bs = world.getEntitiesWithComponent(Body)
    const collisions: Collision[] = []

    this.engine.step(this.options.iterations, dT)

    // const bodies = world.getComponents(Body)
    // for (let i = 0; i < this.options.iterations; i++) {
    //   collisions.length = 0

    //   for (let i = 0; i < e_bs.length; i++) {
    //     const { c: A } = e_bs[i]!

    //     for (let j = i + 1; j < e_bs.length; j++) {
    //       const { c: B } = e_bs[j]!
    //       const collision = A.testForCollision(B)
    //       // TODO Add check of collision-ness according to layer-map
    //       if (collision) {
    //         collisions.push(collision)
    //       }
    //     }
    //   }
    //   this.resolveCollisions(collisions)
    //   this.separateBodies(collisions)

    // }
    // Reflect body positions on entities for rendering
    for (const { e, c: b } of e_bs) {
      e.position.set(b.position.x, b.position.y)
    }
  }

  private resolveCollisions(collisions: Collision[]) {
    for (const { A, B, ...collision } of collisions) {
      for (const cP of collision.points) {
        // Relative vel. (missing angular vel.)
        const relV = B.velocity.subtract(A.velocity)
        // Contact vel. (missing angular vel.)
        const conV = relV.dot(collision.normal)
        if (conV > 0) {
          // Already separating...
          return
        }
        const sumInvMasses = A.invMass + B.invMass
        // Impulse scalar
        let j = -(1 + collision.restitution) * conV
        // TODO: this f*ck's up the restitution, find out why!
        // j /= sumInvMasses
        // Impulse
        const I = collision.normal.multiplyScalar(j)
        if (!A.isStatic) {
          A.velocity.x -= I.x * A.invMass
          A.velocity.y -= I.y * A.invMass
        }
        if (!B.isStatic) {
          B.velocity.x += I.x * B.invMass
          B.velocity.y += I.y * B.invMass
        }
      }
    }
  }

  private separateBodies(collisions: Collision[]) {
    for (const { A, B, depth: penetration, normal, sumInvMasses } of collisions) {
      // Account for the masses in the correction (https://timallanwheeler.com/blog/2024/08/01/2d-collision-detection-and-resolution/)
      const relCorrection = normal.multiplyScalar(
        -penetration * sumInvMasses * (A.isStatic || B.isStatic ? 1 : 0.5),
      )
      if (!A.isStatic) {
        A.position.x -= relCorrection.x * B.mass
        A.position.y -= relCorrection.y * B.mass
      }
      if (!B.isStatic) {
        B.position.x += relCorrection.x * A.mass
        B.position.y += relCorrection.y * A.mass
      }
    }
  }
}
