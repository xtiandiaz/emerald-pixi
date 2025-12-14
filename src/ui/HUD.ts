import { Container } from 'pixi.js'

export class HUD extends Container {
  constructor() {
    super()

    this.interactive = true
    this.eventMode = 'passive'
  }
}
