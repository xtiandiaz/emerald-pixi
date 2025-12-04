import { Signal } from '../core'

export default class ScreenResizeSignal extends Signal {
  constructor(
    public width: number,
    public height: number,
  ) {
    super()
  }
}
