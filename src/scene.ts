import type { ApplicationOptions } from 'pixi.js'
import { Container, Rectangle, Application } from 'pixi.js'
import { Entity } from './entity'
import { Engine, Composite, Bounds, World, Runner, Body } from 'matter-js'

export abstract class Scene {
  isPaused = false

  private app!: Application
  private engine!: Engine
  // private runner: Runner
  private isStarted = false
  private _entities = {} as Record<string, Entity>

  constructor() {
    this.app = new Application()
    this.engine = Engine.create()
    // this.runner = Runner.create()
  }

  get viewport(): Rectangle {
    return this.app.screen
  }

  get stage(): Container {
    return this.app.stage
  }

  private get entities(): Entity[] {
    return Object.values(this._entities)
  }

  async init(options?: Partial<ApplicationOptions>): Promise<void> {
    await this.app.init({
      antialias: true,
      ...options,
    })
  }

  start(): void {
    if (this.isStarted) {
      return
    }
    this.isStarted = true

    this.draw()

    this.entities.forEach((c: Entity) => {
      c.__start()
    })

    this.app.ticker.add((ticker) => {
      this.update(ticker.deltaTime)
    })

    this.app.renderer.addListener('resize', () => {
      this.resize()
    })
  }

  draw(): void {
    this.entities.forEach((e) => e.__draw(this.viewport))
  }

  update(deltaTime: number): void {
    if (!this.isStarted || this.isPaused) {
      return
    }

    Engine.update(this.engine, (deltaTime * 1000) / 60)

    this.entities.forEach((e) => {
      e.__update(deltaTime)
    })
  }

  resize(): void {
    this.entities.forEach((e) => {
      e.resize?.(this.viewport)
    })
  }

  // --------------------------------
  // ENTITIES
  // --------------------------------

  addEntity(entity: Entity) {
    this._entities[entity.id] = entity

    this.stage.addChild(entity)

    entity.__onBodyAdded = (body) => {
      this.__addBody(body)
    }

    entity.init?.()

    if (this.isStarted) {
      entity.__draw(this.viewport)
      entity.__start()
    }
  }

  removeEntity(entityId: string) {
    const entity = this._entities[entityId]
    if (entity) {
      this.stage.removeChild(entity)
      delete this._entities[entity.id]
    }
  }

  // --------------------------------
  // BODIES
  // --------------------------------

  __addBody(body: Body): void {
    Composite.add(this.engine.world, body)
  }
}
