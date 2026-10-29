import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;

    if (!id || id === "undefined" || isNaN(Number(id))) {
      return NextResponse.json({ message: "Invalid game ID" }, { status: 400 });
    }

    const games = await sql`SELECT * FROM games WHERE id = ${parseInt(id, 10)}`;
    if (games.length === 0) {
      return NextResponse.json({ message: "Game session not found" }, { status: 404 });
    }

    const game = games[0];

    // Initial default state if fresh
    const gameState = {
      id: game.id,
      gameId: game.id,
      homeCountry: game.home_country,
      status: game.status || "active",
      turn: game.turn || 1,
      resources: {
        gold: game.gold || 1200,
        manpower: game.manpower || 10000,
      },
      territories: game.territories || [
        { id: "t1", name: game.home_country, owner: "player", strength: 150 },
        { id: "t2", name: "Neighboring Rival Alpha", owner: "AI", strength: 100 },
        { id: "t3", name: "Strategic Oil Fields", owner: "Neutral", strength: 80 },
        { id: "t4", name: "Western Wasteland", owner: "AI", strength: 120 },
      ],
      logs: game.logs || [
        { message: `Campaign successfully launched for ${game.home_country}. Global conquest initiated.` }
      ],
    };

    return NextResponse.json({ game: gameState }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;
    const body = await req.json().catch(() => ({}));
    const { action, fromCountryId, toCountryId, transferCount } = body;

    const games = await sql`SELECT * FROM games WHERE id = ${parseInt(id, 10)}`;
    if (games.length === 0) {
      return NextResponse.json({ message: "Game not found" }, { status: 404 });
    }

    const game = games[0];
    let turn = (game.turn || 1) + 1;
    let gold = (game.gold || 1200) + 150; // Economic growth per turn
    let manpower = (game.manpower || 10000) + 500;
    
    let territories = game.territories || [
      { id: "t1", name: game.home_country, owner: "player", strength: 150 },
      { id: "t2", name: "Neighboring Rival Alpha", owner: "AI", strength: 100 },
      { id: "t3", name: "Strategic Oil Fields", owner: "Neutral", strength: 80 },
      { id: "t4", name: "Western Wasteland", owner: "AI", strength: 120 },
    ];

    let logs = game.logs || [];

    if (action === "ATTACK" && fromCountryId && toCountryId) {
      const attacker = territories.find((t: any) => t.id === fromCountryId);
      const defender = territories.find((t: any) => t.id === toCountryId);

      if (attacker && defender) {
        if (attacker.strength > defender.strength) {
          defender.owner = "player";
          defender.strength = Math.floor(attacker.strength / 2);
          logs.unshift({ message: `Victory! ${attacker.name} successfully conquered ${defender.name}!` });
        } else {
          attacker.strength = Math.max(10, attacker.strength - 30);
          logs.unshift({ message: `Defeat! Assault on ${defender.name} was repelled. Forces diminished.` });
        }
      }
    } else if (action === "SKIP") {
      logs.unshift({ message: `Turn ${turn}: Consolidated regional defenses and gathered resources.` });
    }

    // Persist to Postgres
    await sql`
      UPDATE games 
      SET turn = ${turn}, gold = ${gold}, manpower = ${manpower}, territories = ${JSON.stringify(territories)}::jsonb, logs = ${JSON.stringify(logs)}::jsonb
      WHERE id = ${game.id}
    `;

    return NextResponse.json({
      game: {
        id: game.id,
        gameId: game.id,
        homeCountry: game.home_country,
        status: game.status,
        turn,
        resources: { gold, manpower },
        territories,
        logs,
      }
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}