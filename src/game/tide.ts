import type { Difficulty } from './engine'

export const tideLimit = 8
export const floodRates = {
  learn: [1, 1, 2, 2, 2, 3, 3, 4],
  standard: [2, 2, 3, 3, 3, 4, 4, 5],
} as const
export const floodRate = (difficulty: Difficulty, tide: number) =>
  floodRates[difficulty === 'learn' ? 'learn' : 'standard'][tide - 1] ?? 0

// Position on the supplied water artwork; the terminal stop is the red line.
export const tideStops = [.88, .795, .71, .625, .54, .455, .37, .285, .21]
