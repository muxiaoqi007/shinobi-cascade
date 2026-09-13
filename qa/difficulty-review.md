# Difficulty verification — 2026-09-13

48 deterministic simulations: 8 seeds × 3 starter teams × 2 card-selection policies. Both policies use the same strategic shop and redraw heuristic, so this compares card selection, not random purchases. Planned play samples 190 candidate orders with 1–5 cards; random play samples one full hand. This is a regression signal, not a human win-rate estimate.

```json
{
  "random": {
    "runs": 24,
    "wins": 0,
    "median_battles": 5.0
  },
  "planned": {
    "runs": 24,
    "wins": 16,
    "median_battles": 42.0
  }
}
```

All three starting teams have a successful planned run. The new final chapters require changing card counts and role composition. Strong combinations still achieve very large damage. Engine tests cover rule penalties, ordered combinations, boss layers, and returning home during battle, shop, and animation without duplicating rewards. Browser tests cover desktop, 360/390/768px layouts, offline loading, home/resume, and touch emulation. Actual mobile hardware and human completion time were not measured.
