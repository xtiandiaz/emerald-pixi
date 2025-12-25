import { Signal } from '../core'

export class ScreenResizedSignal extends Signal {
  constructor(
    public width: number,
    public height: number,
  ) {
    super()
  }
}
