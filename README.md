# Flappy Aviator 🐦✈️

A casino-style crash game built with JavaScript & HTML Canvas.

## 🎮 How to Play

1. Set your **bet amount** (←→ keys)
2. Set **auto cash out** target (↑↓ keys) or leave at OFF
3. **Tap/Click** or press **Space** to start
4. Watch the multiplier rise!
5. **Tap to cash out** before the bird crashes
6. If you don't cash out in time, you lose your bet

## ✨ Features

- 💰 **Betting System** - Start with $1000 balance
- 🎯 **Auto Cash Out** - Set target multiplier to auto-win
- 📊 **Round History** - See last 8 crash multipliers
- 📈 **Statistics** - Track wins, losses, profit
- 👥 **Multiplayer Feel** - See other players cashing out
- 🎨 **Visual Effects**:
  - Neon glow trajectory
  - Color-changing multiplier (green → yellow → orange → red)
  - Speed lines at high multipliers
  - Screen shake on crash
  - Confetti on win
  - Milestone flash at 1.5x, 2x, 2.5x
- 🔊 **Dynamic Audio**:
  - Rising tension sound
  - Heartbeat at high multipliers
  - Cash out celebration
  - Countdown beeps

## 🎛️ Controls

| Key | Action |
|-----|--------|
| Space / W | Start / Cash Out |
| ← → | Adjust bet amount |
| ↑ ↓ | Adjust auto cash out |
| M | Toggle sound |

## 🚀 Run Locally

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`

## 📱 Mobile

Touch-friendly! Tap to start and cash out.

## 🛠️ Tech Stack

- Vanilla JavaScript
- HTML5 Canvas
- Web Audio API

## 📜 License

MIT
