export interface FixedTimeStep {
  step: number
  accTime: number // accumulated time
}

export interface GameState {
  isPaused: boolean
}
