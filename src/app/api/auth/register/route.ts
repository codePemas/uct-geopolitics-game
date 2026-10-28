import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 });
    }

    const existingUsers = await sql`
      SELECT id FROM users WHERE email = ${email} OR username = ${username}
    `;

    if (existingUsers.length > 0) {
      return NextResponse.json({ message: "User or Email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO users (username, email, password)
      VALUES (${username}, ${email}, ${hashedPassword})
    `;

    return NextResponse.json({ message: "User registered successfully!" }, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: error.message || "Failed to register user" },
      { status: 500 }
    );
  }
}