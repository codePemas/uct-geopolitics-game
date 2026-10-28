"use client";

import React, { useState, useEffect } from "react";
import { Swords, Shield, FastForward, Play, RefreshCw, LogIn, UserPlus, Trophy, Eye } from "lucide-react";
import { WORLD_COUNTRIES } from "@/lib/countriesData";

export default function GameDashboard() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ username: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");

  const [selectedHomeCountry, setSelectedHomeCountry] = useState("ZA");
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [game, setGame] = useState<any>(null);

  const [selectedAttackerId, setSelectedAttackerId] = useState<string | null>(null);
  const [selectedDefenderId, setSelectedDefenderId] = useState<string | null>(null);
  const [transferAmount, setTransferAmount] = useState(1);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);

  // Load active game data
  const fetchGame = async (gameId: string) => {
    try {
      const res = await fetch(`/api/games/${gameId}`);
      if (!res.ok) return;
      const data = await res.json();
      setGame(data);
    } catch (err) {
      console.error(err);
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

      if (!res.ok) throw new Error(data.error || "Authentication failed");

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

  // Start a new single-player game session
  const handleStartGame = async () => {
    if (!user) return;
    setLoadingAction(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
          playerCountryId: selectedHomeCountry,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentGameId(data.gameId);
        fetchGame(data.gameId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  // Execute Turn Action (ATTACK, TRANSFER, SKIP)
  const handleExecuteAction = async (action: "ATTACK" | "TRANSFER" | "SKIP") => {
    if (!currentGameId || !user) return;
    setLoadingAction(true);
    try {
      const res = await fetch(`/api/games/${currentGameId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          action,
          fromCountryId: selectedAttackerId,
          toCountryId: selectedDefenderId,
          transferCount: transferAmount,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setGame(data);
        if (action === "ATTACK") {
          setSelectedAttackerId(null);
          setSelectedDefenderId(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const isMyTurn = game && user && game.currentTurnPlayerId === user.id;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-amber-500">
            GEOPOLITICS <span className="text-slate-300 font-normal">INF4001N</span>
          </h1>
          <p className="text-sm text-slate-400">Single-Player Global Conquest Strategy</p>
        </div>

        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm text-emerald-400 font-medium">Logged in as: {user.username}</span>
            <button
              onClick={() => {
                setUser(null);
                setGame(null);
                setCurrentGameId(null);
              }}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded text-slate-300"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="text-sm text-amber-400 font-medium flex items-center gap-2">
            <Eye className="w-4 h-4" /> Spectator View Mode (Log in to Play)
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANEL: Auth / Game Creation Controls */}
        <div className="lg:col-span-4 space-y-6">
          {!user && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {authMode === "login" ? <LogIn className="w-5 h-5 text-amber-500" /> : <UserPlus className="w-5 h-5 text-amber-500" />}
                  {authMode === "login" ? "Player Login" : "Register Player"}
                </h2>
                <button
                  onClick={() => setAuthMode(authMode === "login" ? "register" : "login")}
                  className="text-xs text-amber-400 underline"
                >
                  Switch to {authMode === "login" ? "Register" : "Login"}
                </button>
              </div>

              {authError && <p className="text-xs text-rose-400 mb-3 bg-rose-950/40 p-2 rounded">{authError}</p>}

              <form onSubmit={handleAuth} className="space-y-3">
                {authMode === "register" && (
                  <div>
                    <label className="text-xs text-slate-400">Username</label>
                    <input
                      type="text"
                      required
                      value={authForm.username}
                      onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-400">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Password</label>
                  <input
                    type="password"
                    required
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold py-2 rounded transition-all text-sm mt-2"
                >
                  {authMode === "login" ? "Sign In" : "Create Account"}
                </button>
              </form>
            </div>
          )}

          {user && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-amber-400">
                <Play className="w-5 h-5" /> Launch New Game
              </h2>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Select Your Home Country</label>
                <select
                  value={selectedHomeCountry}
                  onChange={(e) => setSelectedHomeCountry(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm"
                >
                  {WORLD_COUNTRIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Pop: {(c.population / 1_000_000).toFixed(1)}M)
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStartGame}
                disabled={loadingAction}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold py-2 rounded transition-all text-sm disabled:opacity-50"
              >
                {loadingAction ? "Initializing..." : "Start Single-Player Campaign"}
              </button>
            </div>
          )}

          {/* TURN COMMAND CONTROLS */}
          {game && user && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-bold text-slate-200">Turn Commands</h3>
                <button
                  onClick={() => setIsFastForwarding(!isFastForwarding)}
                  className={`text-xs px-2.5 py-1 rounded flex items-center gap-1 font-semibold border ${
                    isFastForwarding ? "bg-amber-500/20 border-amber-500 text-amber-400" : "bg-slate-800 border-slate-700 text-slate-400"
                  }`}
                >
                  <FastForward className="w-3.5 h-3.5" /> Fast-Forward
                </button>
              </div>

              {!isMyTurn ? (
                <p className="text-xs text-amber-400 animate-pulse bg-amber-950/30 p-2 rounded border border-amber-900/50">
                  Simulating AI Turns... Please wait for your turn.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-slate-400">
                    <p>Attacker: <span className="text-emerald-400 font-bold">{selectedAttackerId || "Select Country"}</span></p>
                    <p>Target: <span className="text-rose-400 font-bold">{selectedDefenderId || "Select Target"}</span></p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleExecuteAction("ATTACK")}
                      disabled={!selectedAttackerId || !selectedDefenderId || loadingAction}
                      className="bg-rose-700 hover:bg-rose-600 text-white font-bold py-2 rounded text-xs flex items-center justify-center gap-1 disabled:opacity-40"
                    >
                      <Swords className="w-4 h-4" /> Attack
                    </button>

                    <button
                      onClick={() => handleExecuteAction("SKIP")}
                      disabled={loadingAction}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded text-xs"
                    >
                      Skip Turn
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <label className="text-xs text-slate-400">Transfer Soldiers</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="number"
                        min="1"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(parseInt(e.target.value) || 1)}
                        className="w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() => handleExecuteAction("TRANSFER")}
                        disabled={!selectedAttackerId || !selectedDefenderId || loadingAction}
                        className="flex-1 bg-sky-700 hover:bg-sky-600 text-white text-xs font-bold py-1 rounded disabled:opacity-40"
                      >
                        Transfer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Game Board Grid & Dynamic Battle Feed */}
        <div className="lg:col-span-8 space-y-6">
          {game ? (
            <>
              {/* BOARD STATE GRID */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-xs text-amber-500 font-bold uppercase tracking-wider">Round {game.round}</span>
                    <h2 className="text-xl font-bold">Territorial Map (10 Nations)</h2>
                  </div>
                  {game.status === "COMPLETED" && (
                    <span className="bg-emerald-950 border border-emerald-500 text-emerald-400 text-xs px-3 py-1 rounded-full flex items-center gap-1 font-bold">
                      <Trophy className="w-4 h-4" /> Game Completed
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {game.countries.map((c: any) => {
                    const isAttacker = selectedAttackerId === c.id;
                    const isDefender = selectedDefenderId === c.id;

                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          if (c.ownerId === user?.id) {
                            setSelectedAttackerId(c.id);
                          } else {
                            setSelectedDefenderId(c.id);
                          }
                        }}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          c.isPlayer
                            ? "bg-slate-950 border-emerald-500/50 hover:border-emerald-400"
                            : "bg-slate-950 border-slate-800 hover:border-rose-500/50"
                        } ${isAttacker ? "ring-2 ring-emerald-500 bg-emerald-950/20" : ""} ${
                          isDefender ? "ring-2 ring-rose-500 bg-rose-950/20" : ""
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-sm text-slate-200">{c.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-900 text-slate-400">
                            {c.id}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5 text-sky-400" /> Forces:
                          </span>
                          <span className="font-extrabold text-amber-400 text-sm">{c.currentSoldiers}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* DYNAMIC BATTLE LOG & AI COMMENTARY FEED */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-md font-bold mb-3 flex items-center gap-2 text-slate-200">
                  <Swords className="w-4 h-4 text-amber-500" /> Dynamic Battle Feed & AI Commentary
                </h3>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {game.logs
                    .slice()
                    .reverse()
                    .map((log: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800/80 p-3 rounded text-xs space-y-1">
                        <div className="flex justify-between text-slate-400">
                          <span className="font-bold text-amber-400">{log.actorName}</span>
                          <span>Round {log.turn}</span>
                        </div>
                        <p className="text-slate-300">{log.details}</p>

                        {log.justification && (
                          <p className="text-amber-300/80 italic bg-amber-950/20 p-1.5 rounded mt-1">
                            💡 AI Tactical Reason: {log.justification}
                          </p>
                        )}

                        {log.commentary && (
                          <p className="text-emerald-300 font-medium bg-emerald-950/20 p-2 rounded mt-1 border border-emerald-900/40">
                            🎙️ AI Commentary: {log.commentary}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl shadow-lg text-center space-y-3">
              <Shield className="w-12 h-12 text-amber-500/50 mx-auto" />
              <h3 className="text-lg font-bold text-slate-300">No Active Game Session</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Log in and launch a campaign from the left control panel to begin your global conquest strategy.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}