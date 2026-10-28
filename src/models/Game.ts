import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICountry {
  id: string;
  name: string;
  population: number;
  baseSoldiers: number;
  currentSoldiers: number;
  ownerId: string;
  isPlayer: boolean;
}

export interface IPlayer {
  id: string;
  name: string;
  isNPC: boolean;
  isEliminated: boolean;
}

export interface IBattleLog {
  turn: number;
  actorName: string;
  action: "ATTACK" | "SKIP" | "TRANSFER" | "REINFORCE";
  details: string;
  justification?: string;
  commentary?: string;
  timestamp: Date;
}

export interface IGame extends Document {
  ownerId: string | Schema.Types.ObjectId;
  status: "IN_PROGRESS" | "COMPLETED";
  winnerId?: string;
  round: number;
  currentTurnPlayerId: string;
  turnOrder: string[];
  countries: ICountry[];
  players: IPlayer[];
  logs: IBattleLog[];
  createdAt: Date;
  updatedAt: Date;
}

const CountrySchema = new Schema<ICountry>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  population: { type: Number, required: true },
  baseSoldiers: { type: Number, required: true },
  currentSoldiers: { type: Number, required: true },
  ownerId: { type: String, required: true },
  isPlayer: { type: Boolean, required: true },
});

const PlayerSchema = new Schema<IPlayer>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  isNPC: { type: Boolean, required: true },
  isEliminated: { type: Boolean, default: false },
});

const BattleLogSchema = new Schema<IBattleLog>({
  turn: { type: Number, required: true },
  actorName: { type: String, required: true },
  action: { type: String, enum: ["ATTACK", "SKIP", "TRANSFER", "REINFORCE"], required: true },
  details: { type: String, required: true },
  justification: { type: String },
  commentary: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const GameSchema = new Schema<IGame>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["IN_PROGRESS", "COMPLETED"], default: "IN_PROGRESS" },
    winnerId: { type: String },
    round: { type: Number, default: 1 },
    currentTurnPlayerId: { type: String, required: true },
    turnOrder: [{ type: String, required: true }],
    countries: [CountrySchema],
    players: [PlayerSchema],
    logs: [BattleLogSchema],
  },
  { timestamps: true }
);

const Game: Model<IGame> = mongoose.models.Game || mongoose.model<IGame>("Game", GameSchema);
export default Game;