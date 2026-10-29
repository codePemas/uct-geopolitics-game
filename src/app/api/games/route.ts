import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

async function initGamesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS games (
      id SERIAL PRIMARY KEY,
      user_id INT,
      home_country VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );
  `;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { country, userId } = body;

    await initGamesTable();

    const newGame = await sql`
      INSERT INTO games (user_id, home_country, status)
      VALUES (${userId ? parseInt(userId, 10) : null}, ${country || "South Africa"}, 'active')
      RETURNING *;
    `;

    const game = newGame[0];
    const gameId = game.id;

    // Return every possible ID variant so the frontend captures it instantly
    return NextResponse.json(
      {
        message: "Campaign started successfully!",
        id: gameId,
        _id: gameId,
        gameId: gameId,
        game: {
          ...game,
          id: gameId,
          _id: gameId,
          gameId: gameId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Game creation error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to start campaign" },
      { status: 500 }
    );
  }
}