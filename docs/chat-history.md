# Chat History — Clue Notes

**Date:** 2025-12-21

## Summary
This document captures the key decisions and milestones from the planning chat for the Clue Notes mobile-friendly PWA (MVP).

**Key decisions:**
- Game: Classic Clue (6 suspects, 6 weapons, 9 rooms).
- Max players: 6 (default). For 6 players each has 3 cards; if the card count doesn't divide evenly the app asks for per-player hand counts.
- Offline-first mobile PWA (no server sync in MVP).
- Primary actions: **New Suggestion**, **Revealed**, **New Acquisition** (end-of-game update).
- App records passes as exclusions and recording who showed (or unknown shown card).
- Undo only the last action (single-step undo).
- No export in MVP; include a Restart button.

## Implementation decisions
- **Stack:** React + Vite + TypeScript for a mobile-first PWA.
- **Solver:** Exact constrained enumeration with pruning and hand-count enforcement; fallback to Monte Carlo sampling on timeout.
- **Data model:** Game, Player, Card, SuggestionEvent, Response, History (for undo).

## Milestones completed in chat
- Agreed requirements and acceptance criteria.
- Created a scaffolding plan for the project and sample file list.
- Agreed on the solver approach and how to treat passes/shows/reveals.

## Links
- See `docs/requirements.md` for the full, structured feature & algorithm spec.

---

*This file is a concise capture of decisions made during an interactive planning session. For full chronological chat, see the internal chat logs.*
