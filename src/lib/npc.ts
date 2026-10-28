import { ICountry } from "@/models/Game";

export interface NPCDecision {
  action: "ATTACK" | "SKIP";
  fromCountryId?: string;
  toCountryId?: string;
  justification: string;
}

export function evaluateNPCTurn(npcId: string, countries: ICountry[]): NPCDecision {
  const myCountries = countries.filter((c) => c.ownerId === npcId);
  const enemyCountries = countries.filter((c) => c.ownerId !== npcId);

  if (myCountries.length === 0 || enemyCountries.length === 0) {
    return { action: "SKIP", justification: "No operational bases or remaining targets." };
  }

  // Find strongest attacker with > 2 soldiers
  const sortedAttackers = [...myCountries].sort((a, b) => b.currentSoldiers - a.currentSoldiers);
  const bestAttacker = sortedAttackers[0];

  if (!bestAttacker || bestAttacker.currentSoldiers < 3) {
    return {
      action: "SKIP",
      justification: "Holding position to preserve forces; no territory has sufficient offensive strength.",
    };
  }

  // Find weakest enemy country
  const sortedTargets = [...enemyCountries].sort((a, b) => a.currentSoldiers - b.currentSoldiers);
  const weakestTarget = sortedTargets[0];

  // Only attack if attacker has numerical advantage over defender
  if (bestAttacker.currentSoldiers > weakestTarget.currentSoldiers) {
    return {
      action: "ATTACK",
      fromCountryId: bestAttacker.id,
      toCountryId: weakestTarget.id,
      justification: `Launching offensive from ${bestAttacker.name} (${bestAttacker.currentSoldiers} soldiers) against ${weakestTarget.name} (${weakestTarget.currentSoldiers} soldiers) to capitalize on numerical advantage.`,
    };
  }

  return {
    action: "SKIP",
    justification: "Enemy positions are heavily fortified. Consolidating forces for next round.",
  };
}