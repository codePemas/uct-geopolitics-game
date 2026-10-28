import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function POST(req: Request) {
  let attackerName = "Attacker";
  let defenderName = "Defender";

  try {
    const body = await req.json();
    attackerName = body.attackerName || "Attacker";
    defenderName = body.defenderName || "Defender";
    const { attackerRolls = [], defenderRolls = [], isConquered = false, attackerLosses = 0, defenderLosses = 0 } = body;

    // Fallback commentary if API key is not configured yet
    if (!ai) {
      const fallbackMsg = isConquered
        ? `${attackerName} launched a decisive assault and completely conquered ${defenderName}!`
        : `${attackerName} attacked ${defenderName}. Attacker lost ${attackerLosses} soldier(s), defender lost ${defenderLosses} soldier(s).`;
      return NextResponse.json({ commentary: fallbackMsg });
    }

    const prompt = `You are an energetic, sports-style battle commentator for a global strategy game. 
    Summarize this turn's battle in 1-2 short, thrilling sentences:
    - Attacker: ${attackerName} (Rolled: ${attackerRolls.join(", ")})
    - Defender: ${defenderName} (Rolled: ${defenderRolls.join(", ")})
    - Outcome: Attacker lost ${attackerLosses} soldier(s), Defender lost ${defenderLosses} soldier(s).
    - Conquered: ${isConquered ? "Yes, territory fell to the attacker!" : "No, defender held ground."}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const commentaryText = response.text || `${attackerName} clashed with ${defenderName}!`;

    return NextResponse.json({ commentary: commentaryText.trim() });
  } catch (error: any) {
    // Graceful fallback on API error or quota issues
    return NextResponse.json({
      commentary: `${attackerName} engaged ${defenderName} in heavy combat!`,
    });
  }
}