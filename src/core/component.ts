import { Container } from 'pixi.js'

export class Component {
  readonly container = new Container()
  id?: string

  async init?(): Promise<void>
  start?(): void
  update?(deltaTime: number): void
  onDestroy?(): void
}
