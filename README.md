# Interview Scheduling Agent

A small, independent scheduling demo by Nat Pisco. It turns synthetic candidate replies into an explicit confirmation flow and handles repeated delivery without creating a second booking.

**[Try the interactive demo](https://nath-d3v.github.io/ai-scheduling-agent/)** · [See my applied AI case studies](https://natpisco.xyz/#work)

## One-minute walkthrough

1. Send **Either day might work**. The agent asks the candidate to choose an offered slot and the calendar stays empty.
2. Send **Book A**. The agent reserves Tuesday at 10:00 AM.
3. Replay the booking webhook. It returns the original result and the calendar still has one booking.
4. Try to book the same slot for another candidate. The agent reports that the slot is taken.

## Run locally

Use Node.js 22 or later. There are no dependencies to install.

```sh
npm test
npm run demo
npm start
```

Open `http://127.0.0.1:4173` for the browser demo. It runs in the browser with no accounts, API keys, or live calendar.

For optional local model suggestions, start Ollama and use the name of an installed model from `ollama list`.

```sh
OLLAMA_MODEL=your-installed-model npm run demo
```

In PowerShell, run `$env:OLLAMA_MODEL = 'your-installed-model'; npm run demo`.

## How it works

- **Reply handling.** Explicit replies such as `Book A` enter the reservation path. Other replies can go to Ollama, which proposes an offered slot or returns null. A proposal prompts for explicit confirmation. An ambiguous reply or failed model request prompts for clarification.
- **Duplicate delivery.** The scheduler records the reply fingerprint and pending result by event ID. Concurrent repeats share the same outcome. Reusing an ID with different reply data is an error.
- **Calendar.** Reservation checks and writes happen synchronously in one process. Each slot can be reserved once and each candidate can have one reservation.

The mock calendar and event log are in memory. Refreshing the browser or restarting the CLI clears the state. This demo uses synthetic data and does not integrate with live recruiting systems.
