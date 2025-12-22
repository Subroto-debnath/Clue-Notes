import React, { useEffect, useState } from 'react'
import { GameState } from '../types'

export default function SuggestionModal({ game, onClose, onSubmit }: { game: GameState; onClose: () => void; onSubmit: (s: any) => void }) {
  const [suggester, setSuggester] = useState(0)
  const suspects = game.cards.filter(c => c.category === 'suspect')
  const weapons = game.cards.filter(c => c.category === 'weapon')
  const rooms = game.cards.filter(c => c.category === 'room')
  const [suspect, setSuspect] = useState(suspects[0]?.id || '')
  const [weapon, setWeapon] = useState(weapons[0]?.id || '')
  const [room, setRoom] = useState(rooms[0]?.id || '')

  const orderedPlayers = (sIdx: number) => {
    const ids = game.players.map(p => p.id)
    const out: number[] = []
    for (let i = 1; i < ids.length; i++) {
      out.push(ids[(sIdx + i) % ids.length])
    }
    return out
  }

  const [noOneShow, setNoOneShow] = useState(false)
  const [responses, setResponses] = useState<{ playerIndex: number; passed: boolean; showed: boolean; shownCardId: string | null }[]>(() => orderedPlayers(0).map(pid => ({ playerIndex: pid, passed: true, showed: false, shownCardId: null })))

  useEffect(() => {
    // recompute response order when suggester changes
    const ids = orderedPlayers(suggester)
    setResponses(ids.map(pid => ({ playerIndex: pid, passed: true, showed: false, shownCardId: null })))
    setNoOneShow(false)
  }, [suggester, game.players.length])

  useEffect(() => {
    // keep shown-card choices in-sync when cards change
    setResponses(rs => rs.map(r => ({ ...r, shownCardId: r.shownCardId })))
  }, [suspect, weapon, room])

  function updateResponse(idx: number, changes: Partial<typeof responses[0]>) {
    const copy = [...responses]
    copy[idx] = { ...copy[idx], ...changes }
    setResponses(copy)
  }

  function submit() {
    const ev: any = {
      suggesterIndex: suggester,
      suspectId: suspect,
      weaponId: weapon,
      roomId: room,
      responses: noOneShow ? responses.map(r => ({ ...r, passed: true, showed: false, shownCardId: null })) : responses
    }
    onSubmit(ev)
  }

  function cardNameById(id: string) {
    return game.cards.find(c => c.id === id)?.name || id
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>New Suggestion</h3>
        <label>Suggester</label>
        <select className="control" value={suggester} onChange={(e) => setSuggester(Number(e.target.value))}>
          {game.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <label>Suspect</label>
        <select className="control" value={suspect} onChange={(e) => setSuspect(e.target.value)}>{suspects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <label>Weapon</label>
        <select className="control" value={weapon} onChange={(e) => setWeapon(e.target.value)}>{weapons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        <label>Room</label>
        <select className="control" value={room} onChange={(e) => setRoom(e.target.value)}>{rooms.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>

        <h4>Responses (in order)</h4>
        <label style={{ display: 'block', marginBottom: 8 }}><input type="checkbox" checked={noOneShow} onChange={(e) => setNoOneShow(e.target.checked)} /> No one showed a card</label>
        {responses.map((resp, idx) => {
          return (
            <div key={resp.playerIndex} className="response-row">
              <div style={{ minWidth: 120 }}>{game.players.find(p => p.id === resp.playerIndex)?.name}</div>
              <label><input type="checkbox" checked={resp.passed} disabled={noOneShow} onChange={(e) => updateResponse(idx, { passed: e.target.checked, showed: !e.target.checked ? resp.showed : false })} /> Passed</label>
              <label><input type="checkbox" checked={resp.showed} disabled={noOneShow} onChange={(e) => updateResponse(idx, { showed: e.target.checked, passed: !e.target.checked ? resp.passed : false })} /> Showed</label>
              <select className="control" value={resp.shownCardId || ''} disabled={noOneShow || !resp.showed} onChange={(e) => updateResponse(idx, { shownCardId: e.target.value || null })}>
                <option value="">Unknown</option>
                <option value={suspect}>Suspect: {cardNameById(suspect)}</option>
                <option value={weapon}>Weapon: {cardNameById(weapon)}</option>
                <option value={room}>Room: {cardNameById(room)}</option>
              </select>
            </div>
          )
        })}

        <div className="modal-actions" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn primary" onClick={submit}>Add Suggestion</button>
          <button className="btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}
