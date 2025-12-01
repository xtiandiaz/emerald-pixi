import { Entity, type System } from './'
import { Container } from 'pixi.js'

export default abstract class Scene extends Container {
  readonly name: string
  readonly entities: Entity[] = []
  readonly systems: System[] = []

  constructor(name: string) {
    super()

    this.name = name
  }

  abstract init(): Promise<void>

  addEntity(e: Entity) {
    this.addChild(e)
    this.entities.push(e)
  }
}
