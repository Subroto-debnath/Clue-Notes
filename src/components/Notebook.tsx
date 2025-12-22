import React, { useEffect, useState } from 'react'
import { GameState, Card } from '../types'
import { solveExact } from '../engine'
import SuggestionModal from './SuggestionModal'

export default function Notebook({ game, setGame, backToSetup }: { game: GameState; setGame: (g: GameState) => void; backToSetup: () => void }) {
  const [probabilities, setProbabilities] = useState<Record<string, Record<string, number>>>({})
  const [totalSolutions, setTotalSolutions] = useState(0)
  const [showSuggest, setShowSuggest] = useState(false)

  async function recompute() {
    const res = await solveExact(game, 1500)
    setProbabilities(res.probabilities)
    setTotalSolutions(res.total)
  }
  useEffect(() => {
    recompute()
  }, [game])

  function toggleOwned(card: Card) {
    const g = { ...game, cards: game.cards.map(c => c.id === card.id ? { ...c, fixedOwner: c.fixedOwner === 0 ? null : 0 } : c) }
    setGame(g)
  }

  function addSuggestion(ev: any) {
    const s = { ...ev, id: 's' + Date.now(), timestamp: Date.now() }
    const g = { ...game, suggestions: [...game.suggestions, s], history: [{ type: 'addSuggestion', payload: s }] }
    setGame(g)
    setShowSuggest(false)
  }

  function undoLast() {
    const last = game.history[game.history.length - 1]
    if (!last) return
    let g = { ...game }
    if (last.type === 'addSuggestion') {
      g.suggestions = g.suggestions.filter(s => s.id !== last.payload.id)
    }
    g.history = game.history.slice(0, -1)
    setGame(g)
  }

  return (
    <div className="notebook">
      <div className="players-bar">
        {game.players.map(p => <div key={p.id} className="player-pill">{p.name} ({p.handCount})</div>)}
      </div>
      <div className="actions">
        <button onClick={() => setShowSuggest(true)}>New Suggestion</button>
        <button onClick={undoLast}>Undo</button>
        <button onClick={backToSetup}>Setup</button>
      </div>

      <div className="cards-list">
        {(['suspect','weapon','room'] as const).map(cat => (
          <section key={cat}>
            <h3>{cat.toUpperCase()}</h3>
            <div className="grid">
              {game.cards.filter(c => c.category === cat).map(c => {
                const probs = probabilities[c.id] || {}
                const envelopeP = probs['envelope'] ?? 0
                const userP = probs['player:0'] ?? 0
                const sure = c.fixedOwner !== null
                return (
                  <div key={c.id} className="card-tile" onClick={() => toggleOwned(c)}>
                    <div className="card-name">{c.name}</div>
                    <div className="badges">
                      {sure ? <span className="badge green">You</span> : <span className="badge">You: {(userP*100).toFixed(0)}%</span>}
                      <span className="badge">Env: {(envelopeP*100).toFixed(0)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      <div className="footer">
        <small>Solutions enumerated: {totalSolutions}</small>
      </div>

      {showSuggest && <SuggestionModal game={game} onClose={() => setShowSuggest(false)} onSubmit={addSuggestion} />}
    </div>
  )
}
