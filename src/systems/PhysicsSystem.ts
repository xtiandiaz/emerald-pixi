import { System, World, Vector, type SignalBus } from '../core'
import { Physics } from '../'
import { Skin } from '../components'

export interface PhysicsSystemOptions extends Physics.Options {
  rendersColliders: boolean
}

export class PhysicsSystem extends System {
  private options: PhysicsSystemOptions

  constructor(options?: Partial<PhysicsSystemOptions>) {
    super()

    this.options = {
      gravity: {
        vector: new Vector(0, 1),
        value: 9.81, // m/s^2
      },
      PPM: 10,
      iterations: 12,
      rendersColliders: false,
      ...options,
    }
  }

  fixedUpdate(world: World, signalBus: SignalBus, dT: number): void {
    const eBodies = world.eBodies

    Physics.step(eBodies, this.options, dT)

    for (const [entityId, b] of eBodies) {
      world.getComponent(entityId, Skin)?.position.set(b.position.x, b.position.y)
    }
  }
}
