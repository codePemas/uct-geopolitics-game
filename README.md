# GEOPOLITICS INF4001N – Single-Player Global Conquest Strategy

An interactive, turn-based geopolitical strategy web application built for academic assessment and full-stack demonstration. Command your home nation, execute tactical territorial assaults, manage gold and military resources, and establish global hegemony against adaptive AI opponents.

**Live Application:** [https://uct-geopolitics-game-mu.vercel.app](https://uct-geopolitics-game-mu.vercel.app)

---

## Key Features

* **Global Campaign System**: Launch strategy campaigns with custom home nation selection and adjustable AI difficulty levels (Easy, Medium, Hard).
* **Interactive Territorial Grid**: Command garrisons across a dynamic global grid with real-time status tracking (Player, AI, Neutral).
* **Strategic Command Orders**:
  * **Tactical Conquest**: Engage enemy or neutral garrisons with deterministic army strength calculations.
  * **Resource Management**: Accumulate gold yields and reinforce garrisons turn-by-turn.
* **Persistent Game State**: Hosted on Neon PostgreSQL utilizing JSONB column structures for persistent game state recovery and seamless multi-turn campaigns.
* **AI Battle Commentary & Feed**: Live event feed logging battle results, economic yields, and strategic alerts.
* **Global Victory Modal**: Triggers when total global domination is achieved, complete with campaign metrics and victory sound effects.
* **Audio & Atmospheric Polish**: Built-in Web Audio API synthetic sound effects engine alongside custom military glassmorphism styling.

---

## Tech Stack

* **Frontend**: [Next.js](https://nextjs.org/) (App Router), React, TypeScript, Tailwind CSS
* **Icons & UI Components**: [Lucide React](https://lucide.dev/), Custom Glassmorphism
* **Database**: [Neon PostgreSQL](https://neon.tech/) with dynamic column migration handlers
* **Audio**: Browser-native Web Audio API synthesizer
* **Deployment**: [Vercel](https://vercel.app)

---

## Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/uct-geopolitics-game.git](https://github.com/your-username/uct-geopolitics-game.git)
   cd uct-geopolitics-game

2. **Install Dependencies:**
    '''bash 
    npm install
    **Configure environmeb=nt variables**
    DATABASE_URL=postgres://user:password@endpoint.neon.tech/neondb?sslmode=require

    npm run dev

## Step 3: Commit and Clean Repository