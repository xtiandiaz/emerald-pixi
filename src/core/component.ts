import { Container } from 'pixi.js'

export abstract class Component {
  readonly container = new Container()
  id?: string

  abstract start(): void
  abstract update(deltaTime: number): void

  init?(): Promise<void>
  onDestroy?(): void
}
