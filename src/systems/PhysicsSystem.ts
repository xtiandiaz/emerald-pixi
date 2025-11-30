import { Entity, System, type EntityProvider, type SignalEmitter } from '../core'
import { PhysicsComponent } from '../components'
import { Engine, Events, Composite, Pair } from 'matter-js'
import { CollisionSignal, Signal } from '../signals'

export default class PhysicsSystem extends System {
  private engine = Engine.create()
  private bodyEntities = new Map<number, number>()
  private signalQueue: Signal[] = []

  init(): void {
    Events.on(this.engine, 'collisionStart', (e) => {
      this.processCollisionPairs(e.pairs, e.name)
    })
    // Events.on(this.engine, 'collisionActive', (e) => {
    //   this.processPairs(e.pairs, e.name)
    // })
    // Events.on(this.engine, 'collisionEnd', (e) => {
    //   this.processCollisionPairs(e.pairs, e.name)
    // })
  }

  deinit(): void {
    Events.off(this.engine, 'collisionStart')
    this.bodyEntities.clear()
    this.signalQueue.length = 0

    Engine.clear(this.engine)
  }

  update(ec: EntityProvider, se: SignalEmitter, _: number): void {
    const entities = ec.getEntitiesWithComponent(PhysicsComponent)
    for (const e of entities) {
      const pc = e.getComponent(PhysicsComponent)!
      e.position.set(pc.body.position.x, pc.body.position.y)
      e.angle = pc.body.angle
    }

    Engine.update(this.engine)

    this.signalQueue.forEach((s) => se.emit(s))
    this.signalQueue.length = 0
  }

  onEntityAdded(entity: Entity): void {
    const pc = entity.getComponent(PhysicsComponent)
    if (pc) {
      Composite.add(this.engine.world, pc.body)
      this.bodyEntities.set(pc.body.id, entity.id)
    }
  }

  onEntityRemoved(entity: Entity): void {
    const pc = entity.getComponent(PhysicsComponent)
    if (pc) {
      Composite.remove(this.engine.world, pc.body)
      this.bodyEntities.delete(pc.body.id)
    }
  }

  private processCollisionPairs(pairs: Pair[], _: string) {
    for (const pair of pairs) {
      const eIdA = this.bodyEntities.get(pair.bodyA.id)
      const eIdB = this.bodyEntities.get(pair.bodyB.id)
      if (!eIdA || !eIdB) {
        console.error('missing entity Id', eIdA, eIdB)
        return
      }
      if (!pair.bodyA.isStatic) {
        this.signalQueue.push(new CollisionSignal(eIdA, eIdB))
      }
      if (!pair.bodyB.isStatic) {
        this.signalQueue.push(new CollisionSignal(eIdB, eIdA))
      }
    }
  }
}
