import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || id === "undefined") {
      return NextResponse.json(
        { message: "Invalid game ID" },
        { status: 400 }
      );
    }

    // Query Neon Postgres for game by numeric ID
    const games = await sql`
      SELECT * FROM games WHERE id = ${parseInt(id, 10)}
    `;

    if (games.length === 0) {
      return NextResponse.json(
        { message: "Game not found" },
        { status: 404 }
      );
    }

    const game = games[0];

    return NextResponse.json(
      {
        ...game,
        _id: game.id, // Compatibility alias
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Fetch game error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to fetch game" },
      { status: 500 }
    );
  }
}