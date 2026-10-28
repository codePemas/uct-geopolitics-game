export interface CombatRoundResult {
  attackerRolls: number[];
  defenderRolls: number[];
  attackerLosses: number;
  defenderLosses: number;
  isConquered: boolean;
  soldiersGained: number;
}

export function resolveCombatRound(
  attackerCurrentSoldiers: number,
  defenderCurrentSoldiers: number,
  defenderBaseValue: number
): CombatRoundResult {
  if (attackerCurrentSoldiers < 2) {
    throw new Error("Attacker must have at least 2 soldiers to fight.");
  }

  // Attacker leaves at least 1 soldier behind
  const maxAttackingDice = attackerCurrentSoldiers - 1;
  const diceCount = Math.min(maxAttackingDice, defenderCurrentSoldiers);

  const attackerRolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
  const defenderRolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);

  let attackerLosses = 0;
  let defenderLosses = 0;

  for (let i = 0; i < diceCount; i++) {
    if (attackerRolls[i] > defenderRolls[i]) {
      defenderLosses++;
    } else if (defenderRolls[i] > attackerRolls[i]) {
      attackerLosses++;
    }
    // Ties: no losses for either side
  }

  const remainingDefender = defenderCurrentSoldiers - defenderLosses;
  const isConquered = remainingDefender <= 0;

  // Formula: Max(2, floor(baseSoldiers / 2))
  const soldiersGained = isConquered ? Math.max(2, Math.floor(defenderBaseValue / 2)) : 0;

  return {
    attackerRolls,
    defenderRolls,
    attackerLosses,
    defenderLosses,
    isConquered,
    soldiersGained,
  };
}