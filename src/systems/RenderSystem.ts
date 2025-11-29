import { ECS, type System, Screen, type RenderOptions } from '../core'
import {
  autoDetectRenderer,
  Container,
  ResizePlugin,
  type ApplicationOptions,
  type Renderer,
} from 'pixi.js'

export default class RenderSystem implements System {
  stage?: Container
  private renderer!: Renderer
  private options: RenderOptions

  constructor(options: Partial<ApplicationOptions>) {
    this.options = options
  }

  async init(): Promise<void> {
    this.renderer = await autoDetectRenderer(this.options)

    ResizePlugin.init.call(this, this.options)

    this.renderer.on('resize', () => {
      this.onResize()
    })
    this.onResize()
  }

  update(_: ECS, __: number): void {
    this.render()
  }

  render() {
    if (this.stage) {
      this.renderer.render(this.stage)
    }
  }

  private onResize() {
    Screen._width = this.renderer.width
    Screen._height = this.renderer.height
  }
}
