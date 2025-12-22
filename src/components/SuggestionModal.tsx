import React, { useState } from 'react'
import { GameState } from '../types'

export default function SuggestionModal({ game, onClose, onSubmit }: { game: GameState; onClose: () => void; onSubmit: (s: any) => void }) {
  const [suggester, setSuggester] = useState(0)
  const suspects = game.cards.filter(c => c.category === 'suspect')
  const weapons = game.cards.filter(c => c.category === 'weapon')
  const rooms = game.cards.filter(c => c.category === 'room')
  const [suspect, setSuspect] = useState(suspects[0].id)
  const [weapon, setWeapon] = useState(weapons[0].id)
  const [room, setRoom] = useState(rooms[0].id)

  const [responses, setResponses] = useState(() => game.players.filter(p => p.id !== suggester).map(p => ({ playerIndex: p.id, passed: true, showed: false, shownCardId: null })))

  function submit() {
    const ev: any = {
      suggesterIndex: suggester,
      suspectId: suspect,
      weaponId: weapon,
      roomId: room,
      responses
    }
    onSubmit(ev)
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>New Suggestion</h3>
        <label>Suggester</label>
        <select value={suggester} onChange={(e) => setSuggester(Number(e.target.value))}>
          {game.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label>Suspect</label>
        <select value={suspect} onChange={(e) => setSuspect(e.target.value)}>{suspects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <label>Weapon</label>
        <select value={weapon} onChange={(e) => setWeapon(e.target.value)}>{weapons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <label>Room</label>
        <select value={room} onChange={(e) => setRoom(e.target.value)}>{rooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>

        <h4>Responses (in order)</h4>
        {game.players.filter(p => p.id !== suggester).map((p, idx) => {
          const resp = responses[idx]
          function update(changes: Partial<typeof resp>) {
            const copy = [...responses]
            copy[idx] = { ...resp, ...changes }
            setResponses(copy)
          }
          return (
            <div key={p.id} className="response-row">
              <div>{p.name}</div>
              <label><input type="checkbox" checked={resp.passed} onChange={(e) => update({ passed: e.target.checked, showed: !e.target.checked ? resp.showed : false })} /> Passed</label>
              <label><input type="checkbox" checked={resp.showed} onChange={(e) => update({ showed: e.target.checked, passed: !e.target.checked ? resp.passed : false })} /> Showed</label>
              <select value={resp.shownCardId || ''} onChange={(e) => update({ shownCardId: e.target.value || null })}>
                <option value="">Unknown</option>
                <option value={suspect}>Suspect: {suspect}</option>
                <option value={weapon}>Weapon: {weapon}</option>
                <option value={room}>Room: {room}</option>
              </select>
            </div>
          )
        })}

        <div className="modal-actions">
          <button onClick={submit}>Add Suggestion</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
