import type { FederatedPointerEvent } from 'pixi.js'

export default class InputComponent {
  onPointerEvent?: (e: FederatedPointerEvent) => void
}
