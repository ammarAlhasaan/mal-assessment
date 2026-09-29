# Quickstart: Full Replay, Reporting, and Delivery

Proposed commands (HC-9, HC-10); confirmed in cycle 8.

```bash
npm start                  # replay E1–E10 and print Days 1–6
npm test                   # all passing tests (excludes the limitation test)
npm run test:limitation    # the intentionally failing test; exits 1
npm run typecheck
```
