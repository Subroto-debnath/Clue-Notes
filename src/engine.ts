import { Card, GameState } from './types'

// See README/in-code comments for algorithm summary.
// This module exposes solveExact(state, timeoutMs) which attempts exact enumeration
// and falls back to monteCarlo sampling on timeout.

type Counts = {
  total: number
  cardOwnerCounts: Map<string, Map<number | -1, number>>
}

function makeCardOwnerCounts(cards: Card[], playersCount: number) {
  const map = new Map<string, Map<number | -1, number>>()
  for (const c of cards) {
    const inner = new Map<number | -1, number>()
    for (let p = 0; p < playersCount; p++) inner.set(p, 0)
    inner.set(-1, 0)
    map.set(c.id, inner)
  }
  return map
}

export function solveExact(state: GameState, timeoutMs = 2000): Promise<{
  total: number
  probabilities: Record<string, Record<string, number>>
}> {
  return new Promise((resolve) => {
    const start = Date.now()
    const playersCount = state.players.length
    const cardMap = new Map(state.cards.map((c) => [c.id, c]))
    const suspects = state.cards.filter((c) => c.category === 'suspect')
    const weapons = state.cards.filter((c) => c.category === 'weapon')
    const rooms = state.cards.filter((c) => c.category === 'room')

    const fixedOwner = new Map<string, number>()
    for (const c of state.cards) if (c.fixedOwner !== null) fixedOwner.set(c.id, c.fixedOwner!)

    const passConstraints = new Map<number, Set<string>>()
    const existentialConstraints: { player: number; cardIds: string[] }[] = []

    for (const p of state.players) passConstraints.set(p.id, new Set())

    for (const s of state.suggestions) {
      for (const r of s.responses) {
        if (r.passed) {
          const set = passConstraints.get(r.playerIndex)!
          set.add(s.suspectId)
          set.add(s.weaponId)
          set.add(s.roomId)
        } else if (r.showed && r.shownCardId == null) {
          existentialConstraints.push({
            player: r.playerIndex,
            cardIds: [s.suspectId, s.weaponId, s.roomId]
          })
        } else if (r.showed && r.shownCardId) {
          fixedOwner.set(r.shownCardId, r.playerIndex)
        }
      }
    }

    const cardList = state.cards.map((c) => c.id)
    const envelopeCategoryLists = {
      suspect: suspects.map((c) => c.id),
      weapon: weapons.map((c) => c.id),
      room: rooms.map((c) => c.id)
    }

    const handCounts = state.players.map((p) => p.handCount)
    const counts: Counts = {
      total: 0,
      cardOwnerCounts: makeCardOwnerCounts(state.cards, playersCount)
    }

    function envelopeAllowed(envelope: [string, string, string]) {
      for (const cardId of envelope) {
        if (fixedOwner.has(cardId)) return false
      }
      return true
    }

    function initialPossibleOwners(): Map<string, number[]> {
      const map = new Map<string, number[]>()
      for (const c of state.cards) {
        if (fixedOwner.has(c.id)) {
          map.set(c.id, [fixedOwner.get(c.id)!])
          continue
        }
        const allowed: number[] = []
        for (const p of state.players) {
          const set = passConstraints.get(p.id)!
          if (set.has(c.id)) continue
          allowed.push(p.id)
        }
        map.set(c.id, allowed)
      }
      return map
    }

    const basePossible = initialPossibleOwners()

    const suspectIds = envelopeCategoryLists.suspect
    const weaponIds = envelopeCategoryLists.weapon
    const roomIds = envelopeCategoryLists.room

    function enumerateForEnvelope(envelopeSet: Set<string>) {
      const remaining = cardList.filter((id) => !envelopeSet.has(id))
      const assign = new Map<string, number | null>()
      const capacity = [...handCounts]

      for (const [cid, owner] of fixedOwner.entries()) {
        if (envelopeSet.has(cid)) return
        assign.set(cid, owner)
        capacity[owner]--
        if (capacity[owner] < 0) return
      }

      const possibleOwners = new Map<string, number[]>()
      for (const id of remaining) {
        if (assign.has(id)) continue
        const allowed = basePossible.get(id)!.filter((p) => capacity[p] > 0)
        possibleOwners.set(id, allowed)
      }

      const existForPlayer = new Map<number, string[]>()
      for (const ex of existentialConstraints) {
        existForPlayer.set(ex.player, (existForPlayer.get(ex.player) || []).concat(ex.cardIds.filter((id) => remaining.includes(id))))
      }

      function dfs() {
        if (Date.now() - start > timeoutMs) throw new Error('timeout')

        if (Array.from(assign.keys()).filter(k => !envelopeSet.has(k)).length === remaining.length) {
          for (const [player, list] of existForPlayer.entries()) {
            let ok = false
            for (const cid of list) {
              if (assign.get(cid) === player) {
                ok = true
                break
              }
            }
            if (!ok) return
          }
          counts.total++
          for (const cid of cardList) {
            if (envelopeSet.has(cid)) {
              counts.cardOwnerCounts.get(cid)!.set(-1, counts.cardOwnerCounts.get(cid)!.get(-1)! + 1)
            } else {
              const owner = assign.get(cid)!
              counts.cardOwnerCounts.get(cid)!.set(owner, counts.cardOwnerCounts.get(cid)!.get(owner)! + 1)
            }
          }
          return
        }

        let pick: string | null = null
        let best = 1e9
        for (const [cid, poss] of possibleOwners.entries()) {
          if (assign.has(cid)) continue
          const domain = poss.filter((p) => capacity[p] > 0)
          if (domain.length === 0) return
          if (domain.length < best) {
            best = domain.length
            pick = cid
            if (best === 1) break
          }
        }
        if (!pick) return
        const domain = possibleOwners.get(pick)!
        for (const player of domain) {
          assign.set(pick, player)
          capacity[player]--
          let feasible = true
          for (const [pl, list] of existForPlayer.entries()) {
            if (capacity[pl] === 0) {
              const assignedHas = list.some((cid) => assign.get(cid) === pl)
              if (!assignedHas) {
                const anyPossible = list.some((cid) => {
                  if (assign.has(cid)) return assign.get(cid) === pl
                  const poss = possibleOwners.get(cid)
                  if (!poss) return false
                  return poss.includes(pl) && capacity[pl] > 0
                })
                if (!anyPossible) {
                  feasible = false
                  break
                }
              }
            }
          }
          if (feasible) {
            dfs()
          }
          assign.delete(pick)
          capacity[player]++
          if (Date.now() - start > timeoutMs) throw new Error('timeout')
        }
      }

      dfs()
    }

    try {
      for (const sId of suspectIds) {
        for (const wId of weaponIds) {
          for (const rId of roomIds) {
            const envelopeSet = new Set([sId, wId, rId])
            if (!envelopeAllowed([sId, wId, rId])) continue
            enumerateForEnvelope(envelopeSet)
            if (Date.now() - start > timeoutMs) throw new Error('timeout')
          }
        }
      }
    } catch (e: any) {
      const sampleResult = monteCarlo(state, 10000)
      resolve(sampleResult)
      return
    }

    const probabilities: Record<string, Record<string, number>> = {}
    for (const c of state.cards) {
      const inner = counts.cardOwnerCounts.get(c.id)!
      const rec: Record<string, number> = {}
        for (let p = 0; p < playersCount; p++) {
          rec['player:' + p] = counts.total ? inner.get(p)! / counts.total : 0
        }
      rec['envelope'] = counts.total ? inner.get(-1)! / counts.total : 0
      probabilities[c.id] = rec
    }

    resolve({ total: counts.total, probabilities })
  })
}

function monteCarlo(state: GameState, samples = 5000) {
  const playersCount = state.players.length
  const cardIds = state.cards.map((c) => c.id)
  const counts = makeCardOwnerCounts(state.cards, playersCount)
  let total = 0

  const fixedOwner = new Map<string, number>()
  const passConstraints = new Map<number, Set<string>>()
  const existentialConstraints: { player: number; cardIds: string[] }[] = []
  for (const p of state.players) passConstraints.set(p.id, new Set())
  for (const s of state.suggestions) {
    for (const r of s.responses) {
      if (r.passed) {
        const set = passConstraints.get(r.playerIndex)!
        set.add(s.suspectId)
        set.add(s.weaponId)
        set.add(s.roomId)
      } else if (r.showed && r.shownCardId == null) {
        existentialConstraints.push({ player: r.playerIndex, cardIds: [s.suspectId, s.weaponId, s.roomId] })
      } else if (r.showed && r.shownCardId) fixedOwner.set(r.shownCardId, r.playerIndex)
    }
  }

  const handCounts = state.players.map((p) => p.handCount)

  const suspects = state.cards.filter((c) => c.category === 'suspect').map((c) => c.id)
  const weapons = state.cards.filter((c) => c.category === 'weapon').map((c) => c.id)
  const rooms = state.cards.filter((c) => c.category === 'room').map((c) => c.id)

  function randomChoice(arr: any[]) { return arr[Math.floor(Math.random() * arr.length)] }

  for (let i = 0; i < samples; i++) {
    const eS = randomChoice(suspects)
    const eW = randomChoice(weapons)
    const eR = randomChoice(rooms)
    const envelope = new Set([eS, eW, eR])
    let conflict = false
    for (const [cid, owner] of fixedOwner.entries()) {
      if (envelope.has(cid)) conflict = true
    }
    if (conflict) continue

    const remaining = cardIds.filter((id) => !envelope.has(id))
    const assign = new Map<string, number>()
    const capacity = [...handCounts]
    for (const [cid, owner] of fixedOwner.entries()) {
      assign.set(cid, owner)
      capacity[owner]--
      if (capacity[owner] < 0) conflict = true
    }
    if (conflict) continue

    const unassigned = remaining.filter((id) => !assign.has(id))
    const order = unassigned.sort(() => Math.random() - 0.5)
    for (const cid of order) {
      const allowed = state.players.map((p) => p.id).filter((pid) => {
        const ps = passConstraints.get(pid)!
        return !ps.has(cid) && capacity[pid] > 0
      })
      if (allowed.length === 0) {
        conflict = true
        break
      }
      const pick = randomChoice(allowed)
      assign.set(cid, pick)
      capacity[pick]--
    }
    if (conflict) continue

    let exOk = true
    for (const ex of existentialConstraints) {
      const ok = ex.cardIds.some((cid) => assign.get(cid) === ex.player)
      if (!ok) {
        exOk = false
        break
      }
    }
    if (!exOk) continue

    total++
    for (const cid of cardIds) {
      if (envelope.has(cid)) counts.get(cid)!.set(-1, counts.get(cid)!.get(-1)! + 1)
      else counts.get(cid)!.set(assign.get(cid)!, counts.get(cid)!.get(assign.get(cid)!)! + 1)
    }
  }

  const probabilities: Record<string, Record<string, number>> = {}
  for (const c of state.cards) {
    const inner = counts.get(c.id)!
    const rec: Record<string, number> = {}
    for (let p = 0; p < playersCount; p++) rec['player:' + p] = total ? inner.get(p)! / total : 0
    rec['envelope'] = total ? inner.get(-1)! / total : 0
    probabilities[c.id] = rec
  }
  return { total, probabilities }
}
