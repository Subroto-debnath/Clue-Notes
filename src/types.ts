export type Category = 'suspect' | 'weapon' | 'room'

export interface Card {
  id: string
  name: string
  category: Category
  fixedOwner: number | null
  notes?: string
}

export interface Player {
  id: number
  name: string
  isUser?: boolean
  handCount: number
}

export interface Response {
  playerIndex: number
  passed: boolean
  showed: boolean
  shownCardId: string | null
}

export interface SuggestionEvent {
  id: string
  suggesterIndex: number
  suspectId: string
  weaponId: string
  roomId: string
  responses: Response[]
  timestamp: number
}

export interface GameState {
  id: string
  createdAt: number
  players: Player[]
  cards: Card[]
  suggestions: SuggestionEvent[]
  history: any[]
}
