import { Entity, type System } from '../core'
import { ScreenComponent } from '../components'
import {
  autoDetectRenderer,
  Container,
  ResizePlugin,
  type ApplicationOptions,
  type Renderer,
} from 'pixi.js'

export default class RenderSystem implements System {
  private renderer!: Renderer
  private stage: Container

  constructor(stage: Container) {
    this.stage = stage
  }

  async init(options: Partial<ApplicationOptions>): Promise<void> {
    this.renderer = await autoDetectRenderer(options)

    ResizePlugin.init.call(this, options)

    this.renderer.on('resize', () => {
      this.onResize()
    })
    this.onResize()
  }

  update(_: Entity[]): void {
    this.render()
  }

  render() {
    this.renderer.render({ container: this.stage })
  }

  private onResize() {
    ScreenComponent._width = this.renderer.width
    ScreenComponent._height = this.renderer.height
  }
}
