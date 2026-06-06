This is a large request (10 distinct features, ~3000+ lines of new code across new files, games, dashboards, and Supabase wiring). To keep quality high and avoid breaking the existing VibeSpace, I'll ship it in 3 phases. Each phase is independently working and testable in preview.

I'll preserve: Supabase setup, music player, AI + Sarvam TTS, password locks (`qwer@$()` and `qwer123@$()`), language toggle, visitor counter, entry screen, all existing sections, Special Thanks footer, dark purple/violet theme, mobile responsiveness.

---

## Phase 1 — Identity foundation (this turn)

Goal: every visitor has a persistent profile before they ever see the site, AI knows their name, popup is gone, sections are reordered.

1. **Remove Welcome popup**
   - Strip the `showWelcome` modal (lines ~260–267, 340–409) from `src/routes/index.tsx`. Keep `NotesSection` 100% intact.

2. **Visitor profile system** (new file `src/lib/visitorProfile.ts`)
   - `getStoredProfile()`, `saveProfile()`, `createProfile(name)`, `recoverProfile(username)`, `bumpVisit()`, `incrementMessages()`, `incrementGames()`.
   - UUID via `crypto.randomUUID()`. Username = slug(name) + 3 random digits, retry on Supabase unique-conflict.
   - All Supabase calls wrapped in try/catch; localStorage is source of truth so offline still works.

3. **Onboarding modal** (new component `src/components/VisitorOnboarding.tsx`)
   - Premium dark-violet modal triggered by Enter VibeSpace button when no localStorage profile exists.
   - Required name field, Continue button, "Already have a profile? Recover it →" link → username recovery flow.
   - On success: save profile, close modal, start music, mark entered.

4. **Returning visitors**
   - On mount, if profile in localStorage: skip onboarding, sonner toast `Welcome back, {Name} 👋`, auto-enter, fire-and-forget `bumpVisit()`.

5. **Personalized Piyush AI**
   - `src/components/PiyushAI.tsx`: read profile from localStorage, include `visitorName` + `username` + last 5 messages in every POST to `/api/piyush-ai`.
   - On reply: insert row into `ai_conversations` (visitor_id, visitor_name, username, user_message, ai_response) and call `incrementMessages()`. All wrapped in try/catch.
   - `src/routes/api/piyush-ai.ts`: accept `visitor` + `history` in body, inject `You are talking to {Name}. Recent context: …` into system prompt. Greeting message in the chat references the name.

6. **Section reorder** — move Games placeholder above Leave a Note (real Games section ships in Phase 2; Phase 1 just lays the section anchor so nothing else shifts).

---

## Phase 2 — Games arcade + leaderboards (next turn)

7. **Games section** (`src/components/games/` directory)
   - `GamesSection.tsx` (grid of 5 cards), `GameModal.tsx` (fullscreen wrapper).
   - 5 self-contained game components, all canvas/DOM, mobile + keyboard:
     - `SnakeGame.tsx` — grid 20×20, arrow keys + swipe.
     - `FlappyBirdGame.tsx` — tap/click, requestAnimationFrame physics.
     - `TicTacToeGame.tsx` — minimax-lite vs computer.
     - `MemoryMatchGame.tsx` — 4×4 emoji grid, timer-based score.
     - `RockPaperScissorsGame.tsx` — best of N vs computer.
   - On game over → `submitScore(gameName, score)` writes to `game_scores` + bumps `games_played`.

8. **Anti-cheat caps in `submitScore`**
   - snake ≤ 400, flappy ≤ 999, memory time ≥ 5s, rps/ttt ≤ reasonable.
   - Suspicious rows: set `flagged=true` (or include `⚠️` in client display) — uses an existing column or stores client-side flag if column doesn't exist.

9. **Leaderboards** (`Leaderboard.tsx`)
   - Tabs per game, top 10 from Supabase, highlight current visitor's row, podium emojis 🥇🥈🥉.

---

## Phase 3 — Admin analytics dashboard (final turn)

10. **Analytics button + dashboard** (`src/components/AnalyticsDashboard.tsx`)
    - Floating 📊 button next to AI button, password `qwer123@$()` gate.
    - Tabs: Overview (totals + most active), Conversations (search/view/delete/export CSV), Visitors (sortable table, click for profile drawer).
    - Flagged scores indicator.

---

## Files touched / created

Phase 1:
- edit `src/routes/index.tsx` (remove popup, wire onboarding, reorder sections)
- new `src/lib/visitorProfile.ts`
- new `src/components/VisitorOnboarding.tsx`
- edit `src/components/PiyushAI.tsx` (personalization + persistence)
- edit `src/routes/api/piyush-ai.ts` (accept visitor context)

Phase 2:
- new `src/components/games/{GamesSection,GameModal,SnakeGame,FlappyBirdGame,TicTacToeGame,MemoryMatchGame,RockPaperScissorsGame,Leaderboard}.tsx`
- new `src/lib/gameScores.ts`

Phase 3:
- new `src/components/AnalyticsDashboard.tsx`

---

## Technical notes

- All Supabase reads/writes wrapped in `try/catch`; failures degrade gracefully (localStorage stays authoritative).
- All browser-only state (localStorage, audio, canvas) initialized inside `useEffect` to avoid the SSR hydration mismatch you hit earlier.
- All new UI uses existing tokens (`--primary`, `--primary-glow`, gradients in `src/styles.css`) — no hard-coded white/black.
- Mobile: every game tested at 360px, 44px tap targets, swipe handlers for Snake.
- No new dependencies needed.

---

**Confirm to proceed with Phase 1 now**, or tell me to re-prioritize (e.g. "do games first" or "ship everything in one pass and accept a longer turn").