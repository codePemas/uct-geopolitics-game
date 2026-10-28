export function getInitialSoldiers(population: number): number {
  if (population <= 5_000_000) return 1;
  if (population <= 10_000_000) return 2;
  if (population <= 25_000_000) return 3;
  if (population <= 50_000_000) return 4;
  if (population <= 75_000_000) return 5;
  if (population <= 100_000_000) return 6;
  if (population <= 125_000_000) return 7;
  if (population <= 150_000_000) return 8;
  return 9;
}