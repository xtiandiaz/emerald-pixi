import { Signal } from '../core'

export class ScreenResized extends Signal {
  constructor(
    public width: number,
    public height: number,
  ) {
    super()
  }
}
