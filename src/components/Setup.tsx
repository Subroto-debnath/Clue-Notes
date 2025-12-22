import React, { useState, useMemo } from 'react'
import { GameState } from '../types'
import { defaultCards } from '../defaultCards'

export default function Setup({ game, onStart }: { game: GameState; onStart: (g: GameState) => void }) {
  const [playersCount, setPlayersCount] = useState(game.players.length || 6)
  const [names, setNames] = useState<string[]>(() => (game.players.length ? game.players.map(p => p.name) : ['You','Player 2','Player 3','Player 4','Player 5','Player 6']))

  const totalCards = defaultCards.length - 3
  const base = Math.floor(totalCards / playersCount)
  const remainder = totalCards % playersCount

  const handCounts = useMemo(() => {
    const arr: number[] = []
    for (let i = 0; i < playersCount; i++) arr.push(base + (i < remainder ? 1 : 0))
    return arr
  }, [playersCount, base, remainder])

  function start() {
    const players = []
    for (let i = 0; i < playersCount; i++) {
      players.push({
        id: i,
        name: names[i] || `Player ${i+1}`,
        isUser: i === 0,
        handCount: handCounts[i]
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

  function updateName(index: number, value: string) {
    const ns = [...names]
    ns[index] = value
    setNames(ns)
  }

  return (
    <div className="setup">
      <h2>Start Game</h2>

      <label>Players (2–6)</label>
      <input className="control" type="number" min={2} max={6} value={playersCount} onChange={(e) => setPlayersCount(Math.max(2, Math.min(6, Number(e.target.value) || 2)))} />

      <div style={{ marginTop: 8 }}>
        <strong>Hand counts</strong>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, overflowX: 'auto' }}>
          {Array.from({ length: playersCount }).map((_, i) => (
            <div key={i} style={{ minWidth: 88, background: '#fff', padding: 8, borderRadius: 8, border: '1px solid #eee' }}>
              <div style={{ fontSize: 12, color: '#666' }}>Player {i+1}</div>
              <div style={{ fontWeight: 700 }}>{handCounts[i]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        {Array.from({ length: playersCount }).map((_, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <label>Player {i+1} name</label>
            <input className="control" value={names[i] || ''} onChange={(e) => updateName(i, e.target.value)} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="btn primary" onClick={start}>Start</button>
        <button className="btn" onClick={() => { setNames(['You','Player 2','Player 3','Player 4','Player 5','Player 6']); setPlayersCount(6) }}>Reset</button>
      </div>
    </div>
  )
}
