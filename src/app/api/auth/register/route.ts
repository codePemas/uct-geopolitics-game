import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });

    return NextResponse.json({ message: "User registered successfully", userId: user._id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 });
  }
}