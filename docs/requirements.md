# Requirements — Clue Notes (MVP)

## 🎯 Goal
A mobile-first, offline-friendly note-taking PWA to help a single physical Clue player track cards, record suggestions, and compute probabilistic inferences about which player (or the envelope) holds each card.

---

## ✅ MVP Feature Summary
- Player setup: choose 2–6 players, default to 6 with 3 cards each.
- Player ordering: collected left-to-right starting from the user.
- Mark initial dealt cards (user-owned cards).
- Core actions: **New Suggestion**, **Revealed (fix owner)**, **New Acquisition (end-of-game adjustment)**.
- Suggestion flow: record suggester, suspect+weapon+room, and responses in turn order (Passed / Showed [Unknown or Specific card] / None).
- Constraint handling:
  - A "pass" means that player does **not** have any of the three suggested cards.
  - A "show" without a specific card means the responder has at least one of those three.
  - A reveal fixes a card's owner.
- Solver: compute P(player has card) and P(card in envelope) after each action.
- Undo: single-step undo of last action with full recomputation.
- Local persistence: save games to browser storage (IndexedDB/localStorage); Restart resets to setup.
- Mobile-first UI: large touch targets, responsive layout.

---

## 📦 Data Model (concise)
- Game: id, createdAt, players[], cards[], suggestions[], history[]
- Player: id, name, handCount, isUser
- Card: id, name, category (suspect | weapon | room), fixedOwner | null, notes
- SuggestionEvent: id, suggesterIndex, suspectId, weaponId, roomId, responses[], timestamp
- Response: playerIndex, passed (bool), showed (bool), shownCardId | null

---

## 🧠 Inference & Probability Algorithm
**Primary approach:** exact constrained enumeration with aggressive pruning and forward-checking to compute exact marginals (P(player has card), P(card in envelope)) while respecting:
- fixed owners (revealed cards),
- pass exclusions,
- existential constraints (player showed but unknown which card),
- per-player hand counts,
- envelope must contain exactly one suspect, one weapon, and one room.

**Fallback:** if enumeration exceeds a runtime threshold, use Monte Carlo sampling to produce approximate probabilities.

**Display rules:**
- Show percent (1 decimal or integer for compact UI); mark as **certain** when P >= 99% and **eliminated** when P <= 1%.
- Show both "has" and "not-have" probabilities (not-have = 1 − P(has)).

---

## 📱 UI / UX Flows (mobile-first)
1. Start → enter player count (2–6) → enter player names (left-to-right starting with user) → start.
2. Setup screen: show card lists; user taps to mark initial owned cards.
3. Main screen (Notebook): grouped card list (Suspects / Weapons / Rooms); per-card quick badges: user %, envelope %; tap card for full detail (full probability distribution across players + envelope, notes, lock to owner).
4. Actions bar: `New Suggestion`, `Revealed`, `New Acquisition`, `Undo`, `History`.
5. New Suggestion modal: select suggester, pick three cards, record responses in turn order (passed/showed/unknown shown card). Submit to record event and recompute.
6. Revealed modal: pick a card and assign player as owner (fix).
7. Undo: removes last action and recomputes.

---

## ✅ Acceptance Criteria
- Must support up to 6 players and default hand counts (derived for equal distribution).
- User can add Suggestion events (passes and shows) and optionally specify shown card.
- Solver returns per-card probabilities for every player and envelope and UI displays them.
- Single-step undo works correctly and updates probabilities.
- App is responsive and usable on mobile browsers.

---

## 🛠️ Implementation Plan / Next Tasks
1. Scaffold PWA (React + Vite + TypeScript). Create basic routing and persistence.
2. Implement core data model and storage.
3. Implement solver module (exact enumeration + Monte Carlo fallback) with unit tests.
4. Implement UI screens: Setup, Notebook (card list & detail), Suggestion modal, Revealed modal, History & Undo.
5. Integrate solver and show progress/approximate status when solver is running long.
6. Playtest with typical Clue scenarios and confirm solver outputs match expectations.

---

## ⚠️ Edge cases & UX rules
- If constraints are inconsistent (no valid deals), show an explicit conflict error and highlight conflicting inputs.
- Allow the user to "Lock" (force) an assignment when they are certain (acts like fixedOwner).
- If fallback sampling is used, label results as approximate.

---

## 📌 Notes
- No export functionality for MVP (per product decision). If requested later, add JSON/QR or encrypted sync.
- README should include quick-start and a link to these docs.

---

*If you'd like, I can create GitHub issues from the \"Next Tasks\" list and start implementing the solver module and the Setup screen.*
