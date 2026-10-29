"use client";

import React, { useState, useEffect } from "react";
import { Swords, Shield, FastForward, Play, Trophy, Volume2, VolumeX, Sparkles } from "lucide-react";
import { WORLD_COUNTRIES } from "@/lib/countriesData";

export default function GameDashboard() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [authForm, setAuthForm] = useState({ username: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");

  const [selectedHomeCountry, setSelectedHomeCountry] = useState("South Africa");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [game, setGame] = useState<any>(null);

  const [selectedAttackerId, setSelectedAttackerId] = useState<string>("t1");
  const [selectedDefenderId, setSelectedDefenderId] = useState<string>("t2");
  const [loadingAction, setLoadingAction] = useState(false);

  // Web Audio API Sound Synthesizer
  const playSound = (type: "victory" | "attack" | "skip" | "win_campaign") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === "attack") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "skip") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.setValueAtTime(500, now + 0.1);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "win_campaign") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.2);
        osc.frequency.setValueAtTime(659.25, now + 0.4);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.7);
      }
    } catch (e) {
      console.warn("Audio synthesis ignored:", e);
    }
  };

  const fetchGame = async (gameId: string) => {
    try {
      const res = await fetch(`/api/games/${gameId}`);
      if (!res.ok) return;
      const data = await res.json();
      const updatedGame = data.game || data;
      setGame(updatedGame);

      if (updatedGame.status === "completed") {
        playSound("win_campaign");
      }
    } catch (err) {
      console.error("Failed to fetch game state:", err);
    }
  };

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

  const handleStartGame = async () => {
    setLoadingAction(true);
    try {
      const res = await fetch("/api/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id || 1,
          country: selectedHomeCountry,
          difficulty,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const resolvedId = data.gameId || data.id || data._id || (data.game && data.game.id);
        if (resolvedId) {
          setCurrentGameId(String(resolvedId));
          await fetchGame(String(resolvedId));
          playSound("skip");
        }
      }
    } catch (err) {
      console.error("Error starting game:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleExecuteAction = async (action: "ATTACK" | "SKIP") => {
    if (!currentGameId) return;
    setLoadingAction(true);
    playSound(action === "ATTACK" ? "attack" : "skip");

    try {
      const res = await fetch(`/api/games/${currentGameId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          fromCountryId: selectedAttackerId,
          toCountryId: selectedDefenderId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setGame(data.game || data);
      }
    } catch (err) {
      console.error("Action error:", err);
    } finally {
      setLoadingAction(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 bg-cover bg-center bg-no-repeat relative">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl z-10">
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
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
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
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
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
                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500"
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
              onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 bg-[url('/bg-war.jpg')] bg-cover bg-center bg-no-repeat bg-fixed relative">
      {/* Dark tint overlay for Pinterest war wallpaper */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6 backdrop-blur-sm">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-amber-500">
              GEOPOLITICS <span className="text-slate-300 font-normal">INF4001N</span>
            </h1>
            <p className="text-sm text-slate-400">Single-Player Global Conquest Strategy</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 p-2 rounded-lg transition border border-slate-700/50"
              title={soundEnabled ? "Mute SFX" : "Enable SFX"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
            </button>
            <span className="text-sm text-emerald-400 font-medium">Logged in as: {user.username}</span>
            <button
              onClick={() => { setUser(null); setCurrentGameId(null); setGame(null); }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-1.5 rounded-lg text-xs font-semibold transition border border-slate-700"
            >
              Sign Out
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Control Panel */}
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2 mb-4">
                <Play className="w-5 h-5" /> Launch Campaign
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">Home Nation</label>
                  <select
                    value={selectedHomeCountry}
                    onChange={(e) => setSelectedHomeCountry(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:border-amber-500 text-sm"
                  >
                    {WORLD_COUNTRIES.map((c) => (
                      <option key={c.name} value={c.name}>{c.name} (Pop: {c.population})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">AI Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e: any) => setDifficulty(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                  >
                    <option value="easy">Easy (Weaker AI Garrisons)</option>
                    <option value="medium">Medium (Balanced Strategy)</option>
                    <option value="hard">Hard (Reinforced AI Defenses)</option>
                  </select>
                </div>

                <button
                  onClick={handleStartGame}
                  disabled={loadingAction}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-900/20 disabled:opacity-50 text-sm"
                >
                  {loadingAction ? "Setting up Database..." : "Start Conquest Campaign"}
                </button>
              </div>
            </div>

            {currentGameId && game && (
              <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-4">
                <h3 className="text-sm font-semibold text-slate-300">Strategic Command Orders</h3>
                
                <div>
                  <label className="block text-xs text-slate-400 uppercase mb-1">Attacking Territory</label>
                  <select
                    value={selectedAttackerId}
                    onChange={(e) => setSelectedAttackerId(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                  >
                    {game.territories?.filter((t: any) => t.owner === "player").map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} (Strength: {t.strength})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 uppercase mb-1">Target Territory</label>
                  <select
                    value={selectedDefenderId}
                    onChange={(e) => setSelectedDefenderId(e.target.value)}
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
                  >
                    {game.territories?.filter((t: any) => t.owner !== "player").map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name} ({t.owner} - Str: {t.strength})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleExecuteAction("ATTACK")}
                    disabled={loadingAction || game.status === "completed"}
                    className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-lg text-xs transition flex items-center justify-center gap-1"
                  >
                    <Swords className="w-4 h-4" /> Attack
                  </button>
                  <button
                    onClick={() => handleExecuteAction("SKIP")}
                    disabled={loadingAction || game.status === "completed"}
                    className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 py-2.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1"
                  >
                    <FastForward className="w-4 h-4 text-amber-400" /> End Turn
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Main Dashboard Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 shadow-2xl backdrop-blur-md min-h-[450px] flex flex-col justify-between relative overflow-hidden">
              {!currentGameId || !game ? (
                <div className="flex flex-col items-center justify-center h-full my-auto py-24 text-center">
                  <Shield className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
                  <h3 className="text-xl font-bold text-slate-300 mb-1">No Active Campaign</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Select your home country on the left and start your campaign to command territorial conquests.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div>
                      <span className="text-xs uppercase tracking-widest text-amber-500 font-semibold">Active Campaign</span>
                      <h2 className="text-2xl font-bold text-slate-100">{game.homeCountry}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="bg-slate-950/90 px-4 py-2 rounded-xl border border-slate-800 text-center">
                        <span className="block text-[10px] uppercase text-slate-500">Turn</span>
                        <span className="text-lg font-bold text-amber-400">{game.turn}</span>
                      </div>
                      <div className="bg-slate-950/90 px-4 py-2 rounded-xl border border-slate-800 text-center">
                        <span className="block text-[10px] uppercase text-slate-500">Gold</span>
                        <span className="text-lg font-bold text-emerald-400">{game.resources?.gold}</span>
                      </div>
                    </div>
                  </div>

                  {/* Territorial Map Grid */}
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Swords className="w-4 h-4 text-amber-500" /> Global Territorial Grid
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {game.territories?.map((t: any) => (
                        <div key={t.id} className={`p-4 rounded-xl border ${t.owner === 'player' ? 'bg-emerald-950/30 border-emerald-800/60' : 'bg-slate-950/80 border-slate-800'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-sm text-slate-200">{t.name}</span>
                            <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-semibold ${t.owner === 'player' ? 'bg-emerald-900 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
                              {t.owner}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">Garrison Strength: <span className="text-amber-400 font-bold">{t.strength}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strategic Feed */}
                  <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" /> AI Battle Commentary & Feed
                    </h4>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto text-xs text-slate-300">
                      {game.logs?.map((log: any, idx: number) => (
                        <p key={idx} className="border-l-2 border-amber-500/50 pl-2 py-0.5">• {log.message}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Victory Modal Overlay */}
              {game && game.status === "completed" && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
                  <Sparkles className="w-16 h-16 text-amber-400 mb-4 animate-bounce" />
                  <h2 className="text-3xl font-extrabold text-amber-400 mb-2">GLOBAL VICTORY!</h2>
                  <p className="text-slate-300 text-sm max-w-md mb-6">
                    Congratulations Commander! You have conquered all rival territories and established total hegemony in Turn {game.turn} with {game.resources?.gold} Gold.
                  </p>
                  <button
                    onClick={handleStartGame}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-3 rounded-xl transition shadow-lg shadow-emerald-900/40"
                  >
                    Launch New Global Conquest
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}