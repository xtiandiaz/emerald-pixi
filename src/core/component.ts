import type { Rectangle } from 'pixi.js'
import { Container, type ContainerChild } from 'pixi.js'

export abstract class Component extends Container<ContainerChild> {
  private __isInit = false
  private __isStarted = false

  get container(): Container<ContainerChild> {
    return this.parent!
  }

  init?(): void
  draw?(bounds: Rectangle): void
  start?(): void
  update?(deltaTime: number): void
  resize?(bounds: Rectangle): void
  end?(): void

  __init(): void {
    if (this.__isInit) {
      return
    }
    this.__isInit = true

    this.init?.()
  }

  __start(): void {
    if (this.__isStarted) {
      return
    }
    this.__isStarted = true

    this.start?.()
  }
}
