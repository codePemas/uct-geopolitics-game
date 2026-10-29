"use client";

import React, { useState, useEffect } from "react";
import { Swords, Shield, FastForward, Play, RefreshCw, LogIn, UserPlus, Trophy } from "lucide-react";
import { WORLD_COUNTRIES } from "@/lib/countriesData";

export default function GameDashboard() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ username: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");

  const [selectedHomeCountry, setSelectedHomeCountry] = useState("South Africa");
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [game, setGame] = useState<any>(null);

  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [selectedDefenderId, setSelectedDefenderId] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState(1);
  const [loadingAction, setLoadingAction] = useState(false);

  // Load active game data
  const fetchGame = async (gameId: string) => {
    try {
      const res = await fetch(`/api/games/${gameId}`);
      if (!res.ok) return;
      const data = await res.json();
      setGame(data.game || data);
    } catch (err) {
      console.error("Failed to fetch game state:", err);
    }
  };

  useEffect(() => {
    if (currentGameId) {
      fetchGame(currentGameId);
      const interval = setInterval(() => fetchGame(currentGameId), 3000);
      return () => clearInterval(interval);
    }
  }, [currentGameId]);

  // Handle Authentication
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const endpoint = authMode === "register" ? "/api/auth/register" : "/api/auth/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || data.message || "Authentication failed");

      if (authMode === "register") {
        setAuthMode("login");
        setAuthError("Registration successful! Please log in.");
      } else {
        setUser(data.user);
      }
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // Start a new single player game session
  const handleStartGame = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || 1,
          username: user?.username || "Player",
          country: selectedHomeCountry,
          playerCountryId: selectedHomeCountry,
        }),
      });
      const data = await res.json();
      
      if (res.ok) {
        const resolvedId = data.gameId || data.id || data._id || (data.game && (data.game.id || data.game._id || data.game.gameId));
        if (resolvedId) {
          const stringId = String(resolvedId);
          setCurrentGameId(stringId);
          await fetchGame(stringId);
        } else {
          console.error("No valid game ID returned in response:", data);
          alert("Campaign created, but game ID was missing in response.");
        }
      } else {
        alert(data.message || "Failed to start campaign");
      }
    } catch (err) {
      console.error("Error starting game:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleExecuteAction = async (action: "ATTACK" | "TRANSFER" | "SKIP") => {
    if (!currentGameId) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/games/${currentGameId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || 1,
          action,
          fromCountryId: selectedAttackerId,
          toCountryId: selectedDefenderId,
          transferCount: transferAmount,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGame(data.game || data);
      }
    } catch (err) {
      console.error("Action execution error:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl">
          <h1 className="text-2xl font-bold text-amber-500 mb-2">GEOPOLITICS INF4001N</h1>
          <p className="text-slate-400 text-sm mb-6">Sign in or register to launch your global conquest campaign.</p>

          {authError && <div className="bg-red-950/50 border border-red-800 text-red-300 p-3 rounded-lg text-sm mb-4">{authError}</div>}

          <form onSubmit={handleAuth} className="space-y-4">
            {authMode === "register" && (
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={authForm.username}
                  onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="Commander name"
                />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Email</label>
              <input
                type="email"
                required
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="commander@domain.com"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold py-3 rounded-lg transition duration-200"
            >
              {authMode === "login" ? "Sign In" : "Register Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setAuthMode(authMode === "login" ? "register" : "login");
                setAuthError("");
              }}
              className="text-xs text-amber-400 hover:underline"
            >
              {authMode === "login" ? "Don't have an account? Register" : "Already have an account? Sign In"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <header className="max-w-7xl mx-auto flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-amber-500">
            GEOPOLITICS <span className="text-slate-300 font-normal">INF4001N</span>
          </h1>
          <p className="text-sm text-slate-400">Single-Player Global Conquest Strategy</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-emerald-400 font-medium">Logged in as: {user.username}</span>
          <button
            onClick={() => {
              setUser(null);
              setCurrentGameId(null);
              setGame(null);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-1.5 rounded-lg text-xs font-semibold transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Control Panel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2 mb-4">
              <Play className="w-5 h-5" /> Launch New Game
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Select Your Home Country</label>
                <select
                  value={selectedHomeCountry}
                  onChange={(e) => setSelectedHomeCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-amber-500 text-sm"
                >
                  {WORLD_COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name} (Pop: {c.population})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStartGame}
                disabled={loadingAction}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-900/20 disabled:opacity-50 text-sm"
              >
                {loadingAction ? "Initializing Campaign..." : "Start Single-Player Campaign"}
              </button>
            </div>
          </div>

          {currentGameId && (
            <div className="mt-8 pt-6 border-t border-slate-800">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Turn Commands</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleExecuteAction("SKIP")}
                  disabled={loadingAction}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2"
                >
                  <FastForward className="w-4 h-4 text-amber-400" /> End Turn / Skip Phase
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Main Dashboard Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl min-h-[400px] flex flex-col justify-between">
            {!currentGameId || !game ? (
              <div className="flex flex-col items-center justify-center h-full my-auto py-20 text-center">
                <Shield className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
                <h3 className="text-xl font-bold text-slate-300 mb-1">No Active Game Session</h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Select your home country on the left control panel and start your campaign to begin global conquest strategy.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold">Active Campaign</span>
                    <h2 className="text-2xl font-bold text-slate-100">{game.homeCountry || game.home_country || selectedHomeCountry}</h2>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center">
                      <span className="block text-[10px] uppercase text-slate-500">Turn</span>
                      <span className="text-lg font-bold text-amber-400">{game.turn || 1}</span>
                    </div>
                    <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-center">
                      <span className="block text-[10px] uppercase text-slate-500">Gold</span>
                      <span className="text-lg font-bold text-emerald-400">{game.resources?.gold ?? 1000}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Swords className="w-4 h-4 text-amber-500" /> Territorial Map & Status
                    </h4>
                    <p className="text-sm text-slate-300">Status: <span className="text-emerald-400 font-medium capitalize">{game.status}</span></p>
                    <p className="text-xs text-slate-500 mt-1">Conquest engine active on PostgreSQL backend.</p>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" /> Strategic Feed
                    </h4>
                    <div className="space-y-1 max-h-24 overflow-y-auto text-xs text-slate-400">
                      {game.logs && game.logs.length > 0 ? (
                        game.logs.map((log: any, idx: number) => (
                          <p key={idx}>• {typeof log === 'string' ? log : log.message}</p>
                        ))
                      ) : (
                        <p className="text-slate-500 italic">No recent combat events recorded.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}