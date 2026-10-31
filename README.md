# Community Knowledge Bank

Turn open learning material into a swipeable feed of short cards and quizzes, free for every learner. Every card quotes its source and links back to it.

## Quickstart

```sh
git clone https://github.com/JeraldLoh/G.O.A.T.git && cd G.O.A.T
cp .env.example .env.local
npm install
npm run dev
```

Open http://localhost:3000. `DEMO_MODE=1` serves the banks in `/seed`, so no database or LLM key is needed.

Run `npm run check:seed` to confirm every seed quote exists verbatim in its source.

## License

Code is released under the [MIT License](LICENSE). Seed banks are original text released as CC0-1.0. Each bank shows its own content license.
