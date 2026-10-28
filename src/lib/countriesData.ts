export interface CountryData {
  id: string;
  name: string;
  population: number;
}

export const WORLD_COUNTRIES: CountryData[] = [
  { id: "ZA", name: "South Africa", population: 60000000 },
  { id: "BR", name: "Brazil", population: 214000000 },
  { id: "IN", name: "India", population: 1400000000 },
  { id: "CN", name: "China", population: 1410000000 },
  { id: "US", name: "United States", population: 332000000 },
  { id: "NG", name: "Nigeria", population: 218000000 },
  { id: "DE", name: "Germany", population: 83000000 },
  { id: "JP", name: "Japan", population: 125000000 },
  { id: "AU", name: "Australia", population: 25000000 },
  { id: "AR", name: "Argentina", population: 45000000 },
  { id: "EG", name: "Egypt", population: 104000000 },
  { id: "CA", name: "Canada", population: 38000000 },
  { id: "FR", name: "France", population: 67000000 },
  { id: "GB", name: "United Kingdom", population: 67000000 },
  { id: "MX", name: "Mexico", population: 128000000 },
];