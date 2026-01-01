import { Graphics, Matrix, type Container } from 'pixi.js'
import { System, World, Vector, Collision, type SignalBus } from '../core'
import { Physics, PhysicsEngine } from '../physics'
import { Body } from '../components'
import { EntityAdded, EntityRemoved } from '../signals'
import { connectContainerEvent } from '../input'

export interface PhysicsSystemOptions {
  iterations: number
  PPM?: number // Pixels Per Meter
  gravity?: Physics.Gravity
  collisionLayerMap?: Collision.LayerMap
  rendersColliders: boolean
}

export class PhysicsSystem extends System {
  private gravity: Physics.Gravity
  private PPM: number
  private collisionLayerMap?: Collision.LayerMap
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
      this.PPM,
      this.collisionLayerMap,
    )

    if (this.options.rendersColliders) {
      this._cg = new Graphics()
      world.addChild(this._cg)
    }
    world.getEntitiesWithComponent(Body).forEach(({ e, c: rb }) => {
      e.position.copyFrom(rb.position)
      e.rotation = rb.rotation
    })

    // const player = world.getEntitiesByTag('player')![0]!
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
        // const b = player.getComponent(Body)!
        // b.position.set(e.globalX, e.globalY)
        // b.velocity.set(e.movementX, e.movementY)
      }),
    )
  }

  fixedUpdate(world: World, signalBus: SignalBus, dT: number): void {
    this.engine.step(this.options.iterations, dT)

    for (const { e, c: b } of world.getEntitiesWithComponent(Body)) {
      e.position.set(b.position.x, b.position.y)
    }
  }
}
