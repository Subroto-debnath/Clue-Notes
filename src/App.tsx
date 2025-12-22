import React, { useEffect, useState } from 'react'
import Setup from './components/Setup'
import Notebook from './components/Notebook'
import { GameState, Player, Card } from './types'
import { defaultCards } from './defaultCards'

function makeInitialGame(): GameState {
  const players: Player[] = []
  for (let i = 0; i < 6; i++) {
    players.push({ id: i, name: i === 0 ? 'You' : `Player ${i+1}`, isUser: i === 0, handCount: 3 })
  }
  const cards: Card[] = defaultCards.map((c) => ({ ...c, fixedOwner: null }))
  return {
    id: 'game1',
    createdAt: Date.now(),
    players,
    cards,
    suggestions: [],
    history: []
  }
}

export default function App() {
  const [game, setGame] = useState<GameState | null>(() => {
    const raw = localStorage.getItem('clue-game')
    if (raw) {
      try {
        return JSON.parse(raw) as GameState
      } catch {
        return makeInitialGame()
      }
    }
    return makeInitialGame()
  })
  const [inSetup, setInSetup] = useState(game ? game.players.length === 0 : true)

  useEffect(() => {
    if (game) localStorage.setItem('clue-game', JSON.stringify(game))
  }, [game])

  if (!game) return null

  return (
    <div className="app">
      <header className="topbar">
        <h1>Clue Notes</h1>
        <button onClick={() => {
          localStorage.removeItem('clue-game')
          const g = makeInitialGame()
          setGame(g)
        }}>Restart</button>
      </header>
      {inSetup ? (
        <Setup game={game} onStart={(g) => { setGame(g); setInSetup(false) }} />
      ) : (
        <Notebook game={game} setGame={setGame} backToSetup={() => setInSetup(true)} />
      )}
    </div>
  )
}
