import { Container } from 'pixi.js'

export abstract class Component {
  readonly key: string

  constructor() {
    this.key = this.constructor.name
  }

  init?(container: Container): void
  deinit?(): void
}
