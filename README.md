Clue Note — mobile-friendly Clue notebook (MVP)

Live demo: https://clue-note.vercel.app/

Clue Note helps you record suggestions, reveals, and computes per-card probabilities during Clue games. Mobile-first and privacy-focused.

Run locally:
1. Install dependencies:
   npm install

2. Run dev server:
   npm run dev

Overview:
- Mobile-first React + Vite app.
- Setup players, mark your initial cards.
- Add suggestions (who passed, who showed, optionally which card).
- Engine enumerates consistent deals and shows probabilities for each card being in each player's hand or in the envelope.
- Undo undoes only last action.
