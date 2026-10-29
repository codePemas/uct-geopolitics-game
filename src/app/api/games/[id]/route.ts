import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Await params if it's a promise (Next.js 14/15 standard), or use directly if synchronous
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;

    if (!id || id === "undefined" || id === "null") {
      return NextResponse.json(
        { message: "Invalid game ID received" },
        { status: 400 }
      );
    }

    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json(
        { message: `Invalid numeric game ID: ${id}` },
        { status: 400 }
      );
    }

    // Query Neon Postgres
    const games = await sql`
      SELECT * FROM games WHERE id = ${numericId}
    `;

    if (games.length === 0) {
      return NextResponse.json(
        { message: `Game session ${numericId} not found` },
        { status: 404 }
      );
    }

    const game = games[0];

    return NextResponse.json(
      {
        id: game.id,
        _id: game.id,
        gameId: game.id,
        userId: game.user_id,
        homeCountry: game.home_country,
        country: game.home_country,
        status: game.status || "active",
        createdAt: game.created_at,
        turn: 1,
        resources: {
          gold: 1000,
          oil: 500,
          manpower: 10000,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("GET /api/games/[id] error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to retrieve game state" },
      { status: 500 }
    );
  }
}