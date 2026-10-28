import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Game, { ICountry, IPlayer } from "@/models/Game";
import { resolveCombatRound } from "@/lib/combat";
import { evaluateNPCTurn } from "@/lib/npc";

// GET: Fetch game state by ID (Visible to visitors & players)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const game = await Game.findById(id);
    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch game" }, { status: 500 });
  }
}

// POST: Execute turn actions (ATTACK, TRANSFER, SKIP)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { userId, action, fromCountryId, toCountryId, transferCount } = await req.json();

    await connectToDatabase();
    const game = await Game.findById(id);

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (game.status === "COMPLETED") {
      return NextResponse.json({ error: "Game is already completed" }, { status: 400 });
    }

    // Access control: Ensure user is the active player for this turn
    if (game.currentTurnPlayerId !== userId) {
      return NextResponse.json({ error: "It is not your turn" }, { status: 403 });
    }

    const currentPlayer = game.players.find((p) => p.id === userId);
    if (!currentPlayer || currentPlayer.isEliminated) {
      return NextResponse.json({ error: "Player is eliminated or invalid" }, { status: 400 });
    }

    let actionDetails = "";
    let commentary = "";
    let turnEnded = false;

    // --- ACTION 1: ATTACK ---
    if (action === "ATTACK") {
      const attacker = game.countries.find((c) => c.id === fromCountryId && c.ownerId === userId);
      const defender = game.countries.find((c) => c.id === toCountryId && c.ownerId !== userId);

      if (!attacker || !defender) {
        return NextResponse.json({ error: "Invalid target or origin country" }, { status: 400 });
      }

      if (attacker.currentSoldiers < 2) {
        return NextResponse.json({ error: "Must have at least 2 soldiers to attack" }, { status: 400 });
      }

      const combatResult = resolveCombatRound(attacker.currentSoldiers, defender.currentSoldiers, defender.baseSoldiers);

      attacker.currentSoldiers -= combatResult.attackerLosses;
      defender.currentSoldiers -= combatResult.defenderLosses;

      actionDetails = `${attacker.name} attacked ${defender.name}. Rolls -> Attacker: [${combatResult.attackerRolls.join(", ")}], Defender: [${combatResult.defenderRolls.join(", ")}]. Losses -> Attacker: ${combatResult.attackerLosses}, Defender: ${combatResult.defenderLosses}.`;

      if (combatResult.isConquered) {
        defender.ownerId = userId;
        defender.isPlayer = true;
        defender.currentSoldiers = combatResult.soldiersGained;
        actionDetails += ` ${defender.name} was conquered! Gained ${combatResult.soldiersGained} soldiers.`;
      }

      if (attacker.currentSoldiers <= 1 || combatResult.isConquered) {
        turnEnded = true;
      }

      // Fetch AI battle commentary via internal API call
      try {
        const commentaryRes = await fetch(`${new URL(req.url).origin}/api/commentary`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attackerName: attacker.name,
            defenderName: defender.name,
            attackerRolls: combatResult.attackerRolls,
            defenderRolls: combatResult.defenderRolls,
            isConquered: combatResult.isConquered,
            attackerLosses: combatResult.attackerLosses,
            defenderLosses: combatResult.defenderLosses,
          }),
        });
        const commentaryData = await commentaryRes.json();
        commentary = commentaryData.commentary;
      } catch (err) {
        commentary = `${attacker.name} clashed with ${defender.name}!`;
      }
    }

    // --- ACTION 2: TRANSFER ---
    else if (action === "TRANSFER") {
      const source = game.countries.find((c) => c.id === fromCountryId && c.ownerId === userId);
      const target = game.countries.find((c) => c.id === toCountryId && c.ownerId === userId);

      if (!source || !target) {
        return NextResponse.json({ error: "Invalid transfer countries" }, { status: 400 });
      }

      if (source.currentSoldiers - transferCount < 1) {
        return NextResponse.json({ error: "Source country must retain at least 1 soldier" }, { status: 400 });
      }

      source.currentSoldiers -= transferCount;
      target.currentSoldiers += transferCount;
      actionDetails = `Transferred ${transferCount} soldiers from ${source.name} to ${target.name}.`;
    }

    // --- ACTION 3: SKIP ---
    else if (action === "SKIP") {
      actionDetails = `${currentPlayer.name} skipped their turn.`;
      turnEnded = true;
    }

    // Log the turn activity
    game.logs.push({
      turn: game.round,
      actorName: currentPlayer.name,
      action,
      details: actionDetails,
      commentary,
      timestamp: new Date(),
    });

    // Advance turn and execute NPC turns if player's turn ended
    if (turnEnded) {
      await advanceTurnAndSimulateNPCs(game);
    }

    await game.save();
    return NextResponse.json(game);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process turn" }, { status: 500 });
  }
}

// Helper: Advance turn index and simulate AI NPC turns automatically
async function advanceTurnAndSimulateNPCs(game: any) {
  let activeIndex = game.turnOrder.indexOf(game.currentTurnPlayerId);

  // Advance to next active player
  do {
    activeIndex = (activeIndex + 1) % game.turnOrder.length;
    // New round starting when turn loops back to index 0
    if (activeIndex === 0) {
      game.round += 1;
      applyRoundReinforcements(game);
    }
  } while (isPlayerEliminated(game, game.turnOrder[activeIndex]));

  game.currentTurnPlayerId = game.turnOrder[activeIndex];

  // Process NPC turn loop if next player is an NPC
  let currentActivePlayer = game.players.find((p: IPlayer) => p.id === game.currentTurnPlayerId);

  while (currentActivePlayer && currentActivePlayer.isNPC) {
    const decision = evaluateNPCTurn(currentActivePlayer.id, game.countries);

    if (decision.action === "ATTACK" && decision.fromCountryId && decision.toCountryId) {
      const attacker = game.countries.find((c: ICountry) => c.id === decision.fromCountryId);
      const defender = game.countries.find((c: ICountry) => c.id === decision.toCountryId);

      if (attacker && defender && attacker.currentSoldiers >= 2) {
        const combatResult = resolveCombatRound(attacker.currentSoldiers, defender.currentSoldiers, defender.baseSoldiers);
        attacker.currentSoldiers -= combatResult.attackerLosses;
        defender.currentSoldiers -= combatResult.defenderLosses;

        let logText = `${attacker.name} attacked ${defender.name}. Losses -> Attacker: ${combatResult.attackerLosses}, Defender: ${combatResult.defenderLosses}.`;

        if (combatResult.isConquered) {
          defender.ownerId = currentActivePlayer.id;
          defender.isPlayer = false;
          defender.currentSoldiers = combatResult.soldiersGained;
          logText += ` ${defender.name} was conquered!`;
        }

        game.logs.push({
          turn: game.round,
          actorName: currentActivePlayer.name,
          action: "ATTACK",
          details: logText,
          justification: decision.justification,
          timestamp: new Date(),
        });
      }
    } else {
      game.logs.push({
        turn: game.round,
        actorName: currentActivePlayer.name,
        action: "SKIP",
        details: `${currentActivePlayer.name} passed turn.`,
        justification: decision.justification,
        timestamp: new Date(),
      });
    }

    // Check end-game condition
    checkAndUpdateGameWinner(game);
    if (game.status === "COMPLETED") break;

    // Advance to next turn
    do {
      activeIndex = (activeIndex + 1) % game.turnOrder.length;
      if (activeIndex === 0) {
        game.round += 1;
        applyRoundReinforcements(game);
      }
    } while (isPlayerEliminated(game, game.turnOrder[activeIndex]));

    game.currentTurnPlayerId = game.turnOrder[activeIndex];
    currentActivePlayer = game.players.find((p: IPlayer) => p.id === game.currentTurnPlayerId);
  }
}

function applyRoundReinforcements(game: any) {
  game.players.forEach((player: IPlayer) => {
    if (player.isEliminated) return;

    const ownedCountries = game.countries.filter((c: ICountry) => c.ownerId === player.id);
    if (ownedCountries.length === 0) {
      player.isEliminated = true;
      return;
    }

    // Spec: Receive 2 new soldiers per controlled country from Round 2 onward
    const reinforcementCount = ownedCountries.length * 2;
    // Automatically allocate reinforcements evenly to owned countries
    let remaining = reinforcementCount;
    let idx = 0;
    while (remaining > 0) {
      ownedCountries[idx % ownedCountries.length].currentSoldiers += 1;
      remaining--;
      idx++;
    }
  });
}

function isPlayerEliminated(game: any, playerId: string): boolean {
  const ownedCount = game.countries.filter((c: ICountry) => c.ownerId === playerId).length;
  if (ownedCount === 0) {
    const player = game.players.find((p: IPlayer) => p.id === playerId);
    if (player) player.isEliminated = true;
    return true;
  }
  return false;
}

function checkAndUpdateGameWinner(game: any) {
  const activeOwners = Array.from(new Set(game.countries.map((c: ICountry) => c.ownerId)));
  if (activeOwners.length === 1) {
    game.status = "COMPLETED";
    game.winnerId = activeOwners[0];
    const winner = game.players.find((p: IPlayer) => p.id === activeOwners[0]);
    game.logs.push({
      turn: game.round,
      actorName: "System",
      action: "SKIP",
      details: `🏆 GAME OVER! ${winner ? winner.name : "A ruler"} has conquered all 10 countries and won the world!`,
      timestamp: new Date(),
    });
  }
}