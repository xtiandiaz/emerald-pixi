import { Signal } from '../core'

export class ScreenResizeSignal extends Signal {
  constructor(
    public width: number,
    public height: number,
  ) {
    super()
  }
}
