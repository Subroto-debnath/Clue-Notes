import React, { useEffect, useState } from 'react'
import { GameState, Card } from '../types'
import { solveExact } from '../engine'
import SuggestionModal from './SuggestionModal'
import RevealedModal from './RevealedModal'
import AcquisitionModal from './AcquisitionModal'

export default function Notebook({ game, setGame, backToSetup }: { game: GameState; setGame: (g: GameState) => void; backToSetup: () => void }) {
  const [probabilities, setProbabilities] = useState<Record<string, Record<string, number>>>({})
  const [totalSolutions, setTotalSolutions] = useState(0)
  const [showSuggest, setShowSuggest] = useState(false)
  const [showRevealed, setShowRevealed] = useState(false)
  const [showAcquisition, setShowAcquisition] = useState(false)

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
    const g = { ...game, suggestions: [...game.suggestions, s], history: [...game.history, { type: 'addSuggestion', payload: s }] }
    setGame(g)
    setShowSuggest(false)
  }

  function undoLast() {
    const last = game.history[game.history.length - 1]
    if (!last) return
    let g = { ...game }
    // handle known undoable types
    if (last.type === 'addSuggestion') {
      g.suggestions = g.suggestions.filter(s => s.id !== last.payload.id)
    } else if (last.type === 'revealed' || last.type === 'acquisition') {
      // payload should be { cardId, playerIndex }
      const cardId = last.payload?.cardId
      if (cardId) {
        g = { ...g, cards: g.cards.map(c => c.id === cardId ? { ...c, fixedOwner: null } : c) }
      }
    }
    g.history = game.history.slice(0, -1)
    setGame(g)
  }

  function onRevealedSubmit(payload: { cardId: string; playerIndex: number }) {
    const cards = game.cards.map(c => c.id === payload.cardId ? { ...c, fixedOwner: payload.playerIndex } : c)
    const entry = { type: 'revealed', payload }
    setGame({ ...game, cards, history: [...game.history, entry] })
    setShowRevealed(false)
  }

  function onAcquisitionSubmit(payload: { cardId: string; playerIndex: number }) {
    const cards = game.cards.map(c => c.id === payload.cardId ? { ...c, fixedOwner: payload.playerIndex } : c)
    const entry = { type: 'acquisition', payload }
    setGame({ ...game, cards, history: [...game.history, entry] })
    setShowAcquisition(false)
  }

  const CERTAIN_THRESHOLD = 0.99

  return (
    <div className="notebook">
      <div className="players-bar">
        {game.players.map(p => <div key={p.id} className="player-pill">{p.name} ({p.handCount})</div>)}
      </div>
      <div className="actions">
        <button className="primary" onClick={() => setShowSuggest(true)}>New Suggestion</button>
        <button onClick={() => setShowRevealed(true)}>Revealed</button>
        <button onClick={() => setShowAcquisition(true)}>New Acquisition</button>
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
                const playersProb = game.players.map(p => ({ player: p, pval: probs['player:' + p.id] ?? 0 }))
                // determine if any owner is (nearly) certain
                const fixedOwner = c.fixedOwner
                let certainOwner: string | null = null
                if (fixedOwner !== null) certainOwner = game.players.find(p => p.id === fixedOwner)!.name
                else {
                  const best = playersProb.concat([{ player: null as any, pval: envelopeP }]).reduce((a, b) => a.pval > b.pval ? a : b)
                  if (best.pval >= CERTAIN_THRESHOLD) {
                    certainOwner = best.player ? best.player.name : 'Envelope'
                  }
                }

                const tileClass = certainOwner ? 'card-tile card-done' : 'card-tile'

                return (
                  <div key={c.id} className={tileClass} onClick={() => toggleOwned(c)}>
                    <div className="card-name">{c.name}</div>
                    {certainOwner ? (
                      <div className="certain-row">{certainOwner}</div>
                    ) : (
                      <div className="prob-list">
                        {playersProb.map(pp => (
                          <div key={pp.player.id} className="prob-line">{pp.player.name}: {(pp.pval*100).toFixed(0)}%</div>
                        ))}
                        <div className="prob-line">Envelope: {(envelopeP*100).toFixed(0)}%</div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
      <div className="footer" style={{ marginTop: 12, paddingBottom: 56 }}>
        <div style={{ fontSize: 13, color: '#666', textAlign: 'center' }}>© {new Date().getFullYear()} Subroto Debnath</div>
      </div>

      <div className="actions-bottom">
        <button className="primary" onClick={() => setShowSuggest(true)}>Suggest</button>
        <button onClick={() => setShowRevealed(true)}>Revealed</button>
        <button onClick={() => setShowAcquisition(true)}>Acquire</button>
        <button onClick={undoLast}>Undo</button>
        <button onClick={backToSetup}>Setup</button>
      </div>

      {showSuggest && <SuggestionModal game={game} onClose={() => setShowSuggest(false)} onSubmit={addSuggestion} />}
      {showRevealed && <RevealedModal game={game} onClose={() => setShowRevealed(false)} onSubmit={onRevealedSubmit} />}
      {showAcquisition && <AcquisitionModal game={game} onClose={() => setShowAcquisition(false)} onSubmit={onAcquisitionSubmit} />}
    </div>
  )
}
