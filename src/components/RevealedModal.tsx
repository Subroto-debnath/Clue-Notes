import React, { useState } from 'react'
import { GameState } from '../types'

export default function RevealedModal({ game, onClose, onSubmit }: { game: GameState; onClose: () => void; onSubmit: (p: { cardId: string; playerIndex: number }) => void }) {
  const [cardId, setCardId] = useState(game.cards[0]?.id || '')
  const [playerIndex, setPlayerIndex] = useState(game.players[0]?.id || 0)

  function submit() {
    if (!cardId) return
    onSubmit({ cardId, playerIndex })
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Revealed (Assign card to a player)</h3>
        <label>Card</label>
        <select className="control" value={cardId} onChange={(e) => setCardId(e.target.value)}>
          {game.cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label>Player</label>
        <select className="control" value={playerIndex} onChange={(e) => setPlayerIndex(Number(e.target.value))}>
          {game.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <button className="btn primary" onClick={submit}>Assign</button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
