import React, { useState } from 'react'
import { GameState } from '../types'
import { defaultCards } from '../defaultCards'

export default function Setup({ game, onStart }: { game: GameState; onStart: (g: GameState) => void }) {
  const [playersCount, setPlayersCount] = useState(game.players.length || 6)
  const [names, setNames] = useState(game.players.map(p => p.name) || ['You','Player 2','Player 3','Player 4','Player 5','Player 6'])

  function start() {
    const totalCards = defaultCards.length - 3
    const base = Math.floor(totalCards / playersCount)
    const remainder = totalCards % playersCount
    const players = []
    for (let i = 0; i < playersCount; i++) {
      players.push({
        id: i,
        name: names[i] || `Player ${i+1}`,
        isUser: i === 0,
        handCount: base + (i < remainder ? 1 : 0)
      })
    }
    const cards = defaultCards.map(c => ({ ...c, fixedOwner: null }))
    onStart({
      id: 'g_' + Date.now(),
      createdAt: Date.now(),
      players,
      cards,
      suggestions: [],
      history: []
    })
  }

  return (
    <div className="setup">
      <h2>Start Game</h2>
      <label>Players (max 6)</label>
      <input type="number" min={2} max={6} value={playersCount} onChange={(e) => setPlayersCount(Number(e.target.value))} />
      <div className="names">
        {Array.from({ length: playersCount }).map((_, i) => (
          <div key={i}>
            <label>Player {i+1} name</label>
            <input value={names[i] || ''} onChange={(e) => { const ns = [...names]; ns[i] = e.target.value; setNames(ns) }} />
          </div>
        ))}
      </div>
      <button onClick={start}>Start</button>
    </div>
  )
}
