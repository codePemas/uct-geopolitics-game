import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const id = resolvedParams?.id;

    if (!id || id === "undefined" || id === "null" || isNaN(Number(id))) {
      return NextResponse.json(
        { message: "Invalid game ID" },
        { status: 400 }
      );
    }

    const numericId = parseInt(id, 10);

    const games = await sql`
      SELECT * FROM games WHERE id = ${numericId}
    `;

    if (games.length === 0) {
      return NextResponse.json(
        { message: "Game session not found" },
        { status: 404 }
      );
    }

    const game = games[0];

    // Complete state with flags set to active/ready to release the lockup
    const fullGameState = {
      id: game.id,
      _id: game.id,
      gameId: game.id,
      userId: game.user_id,
      homeCountry: game.home_country || "China",
      home_country: game.home_country || "China",
      country: game.home_country || "China",
      status: game.status || "active",
      createdAt: game.created_at,
      turn: 1,
      isAiTurn: false,          // Unlock AI simulation lock
      simulationComplete: true, // Signal frontend simulation is done
      resources: {
        gold: 1000,
        oil: 500,
        manpower: 10000,
      },
      territories: [
        { id: 1, name: game.home_country || "China", owner: "player", strength: 100 }
      ],
      countries: [],
      players: [],
      logs: [{ message: "Campaign initialized successfully.", timestamp: new Date().toISOString() }],
      events: [],
      armies: []
    };

    return NextResponse.json(
      {
        ...fullGameState,
        game: fullGameState
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