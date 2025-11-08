import { Container, Rectangle, type ContainerChild } from 'pixi.js'

export class Component extends Container<ContainerChild> {
  private static nextId = 0

  private readonly _id = Component.nextId++
  private _isInit = false
  private _isStarted = false

  get id(): string {
    return this._id.toString()
  }

  get isInit(): boolean {
    return this._isInit
  }

  get isStarted(): boolean {
    return this._isStarted
  }

  init(): void {
    this._isInit = true
  }

  start(): void {
    this._isStarted = true
  }

  draw?(rect: Rectangle): void
  update?(deltaTime: number): void

  async onDestroy?(): Promise<void>
}
