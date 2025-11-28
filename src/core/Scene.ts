import { type ApplicationOptions, Container, Ticker } from 'pixi.js'
import { Entity, type System } from './'
import { PhysicsSystem, RenderSystem } from '../systems'
import { PhysicsComponent } from '../components'

export interface SceneState {
  isPaused: boolean
}

export default class Scene {
  state?: SceneState

  private stage = new Container()
  private entities = {} as Record<number, Entity>
  private systems: System[] = []
  private physicsSystem: PhysicsSystem

  constructor() {
    this.physicsSystem = new PhysicsSystem((id: number) => {
      return this.entities[id]
    })
    this.systems = [this.physicsSystem]
  }

  async init(options: Partial<ApplicationOptions>): Promise<void> {
    this.physicsSystem.init()

    const rs = new RenderSystem(this.stage)
    await rs.init(options)
    this.systems.push(rs)

    Ticker.shared.add((t) => {
      this.update(t.deltaTime)
    })
  }

  addEntity(entity: Entity) {
    this.entities[entity.id] = entity

    const pc = entity.getComponent(PhysicsComponent)
    if (pc) {
      this.physicsSystem.registerBody(pc.body, entity)
    }

    this.stage.addChild(entity)
  }

  removeEntity(entityId: number) {
    const e = this.entities[entityId]
    if (e) {
      this.stage.removeChild(e)
    }

    delete this.entities[entityId]
  }

  private update(deltaTime: number) {
    if (this.state?.isPaused) {
      return
    }

    const es = Object.values(this.entities)

    this.systems.forEach((s) => s.update(es))
    es.forEach((s) => s._update(deltaTime))
  }
}
