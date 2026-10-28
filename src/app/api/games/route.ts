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
    const body = await req.json();
    const { country, userId } = body;

    await initGamesTable();

    const newGame = await sql`
      INSERT INTO games (user_id, home_country, status)
      VALUES (${userId || null}, ${country || "South Africa"}, 'active')
      RETURNING *;
    `;

    const game = newGame[0];

    return NextResponse.json(
      {
        message: "Campaign started successfully!",
        game: {
          ...game,
          _id: game.id, // Compatibility alias for frontend code expecting MongoDB _id
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