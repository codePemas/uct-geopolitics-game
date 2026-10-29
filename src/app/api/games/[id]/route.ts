import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

async function ensureTableColumns() {
  await sql`
    CREATE TABLE IF NOT EXISTS games (
      id SERIAL PRIMARY KEY,
      user_id INT,
      home_country VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      turn INT DEFAULT 1,
      gold INT DEFAULT 1200,
      manpower INT DEFAULT 10000,
      territories JSONB,
      logs JSONB,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try { await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS turn INT DEFAULT 1;`; } catch (_) {}
  try { await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS gold INT DEFAULT 1200;`; } catch (_) {}
  try { await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS manpower INT DEFAULT 10000;`; } catch (_) {}
  try { await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS territories JSONB;`; } catch (_) {}
  try { await sql`ALTER TABLE games ADD COLUMN IF NOT EXISTS logs JSONB;`; } catch (_) {}
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await ensureTableColumns();
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;

    if (!id || id === "undefined" || isNaN(Number(id))) {
      return NextResponse.json({ message: "Invalid game ID" }, { status: 400 });
    }

    const numericId = parseInt(id, 10);
    const games = await sql`SELECT * FROM games WHERE id = ${numericId}`;

    if (games.length === 0) {
      return NextResponse.json({ message: "Game session not found" }, { status: 404 });
    }

    const game = games[0];

    const gameState = {
      id: game.id,
      gameId: game.id,
      homeCountry: game.home_country,
      status: game.status || "active",
      turn: game.turn ?? 1,
      resources: {
        gold: game.gold ?? 1200,
        manpower: game.manpower ?? 10000,
      },
      territories: game.territories || [
        { id: "t1", name: game.home_country, owner: "player", strength: 180 },
        { id: "t2", name: "Neighboring Rival Alpha", owner: "AI", strength: 100 },
        { id: "t3", name: "Strategic Oil Fields", owner: "Neutral", strength: 70 },
        { id: "t4", name: "Western Wasteland", owner: "AI", strength: 130 },
      ],
      logs: game.logs || [
        { message: `Campaign successfully launched for ${game.home_country}. Global conquest initiated.` }
      ],
    };

    return NextResponse.json({ game: gameState }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Server Error" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    await ensureTableColumns();
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;
    const body = await req.json().catch(() => ({}));
    const { action, fromCountryId, toCountryId } = body;

    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ message: "Invalid game ID" }, { status: 400 });
    }

    const numericId = parseInt(id, 10);
    const games = await sql`SELECT * FROM games WHERE id = ${numericId}`;

    if (games.length === 0) {
      return NextResponse.json({ message: "Game not found" }, { status: 404 });
    }

    const game = games[0];
    let turn = (game.turn ?? 1) + 1;
    let gold = (game.gold ?? 1200) + 200;
    let manpower = (game.manpower ?? 10000) + 600;
    let status = game.status || "active";

    let territories = game.territories || [
      { id: "t1", name: game.home_country, owner: "player", strength: 180 },
      { id: "t2", name: "Neighboring Rival Alpha", owner: "AI", strength: 100 },
      { id: "t3", name: "Strategic Oil Fields", owner: "Neutral", strength: 70 },
      { id: "t4", name: "Western Wasteland", owner: "AI", strength: 130 },
    ];

    let logs = game.logs || [];

    if (action === "ATTACK" && fromCountryId && toCountryId) {
      const attacker = territories.find((t: any) => t.id === fromCountryId);
      const defender = territories.find((t: any) => t.id === toCountryId);

      if (attacker && defender) {
        if (defender.owner === "player") {
          logs.unshift({ message: `⚠️ Invalid target: You already control ${defender.name}!` });
        } else if (attacker.strength > defender.strength) {
          defender.owner = "player";
          defender.strength = Math.floor(attacker.strength * 0.7);
          gold += 350;
          logs.unshift({ message: `🏆 VICTORY! ${attacker.name} successfully conquered ${defender.name}! Acquired +350 Gold.` });
        } else {
          attacker.strength = Math.max(20, attacker.strength - 40);
          logs.unshift({ message: `❌ DEFEAT: Assault on ${defender.name} was repelled by enemy garrison.` });
        }
      }
    } else if (action === "SKIP") {
      logs.unshift({ message: `Turn ${turn}: Consolidated regional defenses, reinforced garrisons, and gathered economic yields.` });
    }

    // Check Global Conquest Win Condition
    const allConquered = territories.every((t: any) => t.owner === "player");
    if (allConquered) {
      status = "completed";
      logs.unshift({ message: `👑 GLOBAL DOMINATION ACHIEVED! All territories have been unified under your nation's banner!` });
    }

    const territoriesJson = JSON.stringify(territories);
    const logsJson = JSON.stringify(logs);

    await sql`
      UPDATE games 
      SET turn = ${turn}, 
          gold = ${gold}, 
          manpower = ${manpower}, 
          status = ${status},
          territories = ${territoriesJson}::jsonb, 
          logs = ${logsJson}::jsonb
      WHERE id = ${numericId}
    `;

    return NextResponse.json({
      game: {
        id: game.id,
        gameId: game.id,
        homeCountry: game.home_country,
        status,
        turn,
        resources: { gold, manpower },
        territories,
        logs,
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to execute action" }, { status: 500 });
  }
}