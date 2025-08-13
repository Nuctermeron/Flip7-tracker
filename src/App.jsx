import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, RefreshCw, Shuffle, Sparkles, Hand, Layers, Settings, RotateCcw, DownloadCloud, MoonStar, Sun } from "lucide-react";

// --- Utilities (pure JS) ---
const numberCards = Array.from({ length: 12 }, (_, i) => String(i + 1));
const specialCards = ["+2", "+4", "+6", "+8", "+10", "x2", "freeze", "flip three", "second chance"];
const allCards = ["0", ...numberCards, ...specialCards];

function makeInitialDeck() {
  const base = { "0": 1 };
  numberCards.forEach((n, i) => {
    base[n] = i + 1; // "1":1 ... "12":12
  });
  const specials = {
    "+2": 1, "+4": 1, "+6": 1, "+8": 1, "+10": 1,
    "x2": 1, "freeze": 3, "flip three": 3, "second chance": 3,
  };
  return { ...base, ...specials };
}

function sum(obj) {
  return Object.values(obj).reduce((a, b) => a + b, 0);
}

const LS_KEY = "flip7-tracker-state-v1";

// --- Main App ---
export default function Flip7App() {
  const [deck, setDeck] = useState(() => makeInitialDeck());
  const [hand, setHand] = useState([]); // array of card strings
  const [sortByProb, setSortByProb] = useState(true);
  const [history, setHistory] = useState([]); // { type: "played"|"hand", card: string }
  const [dark, setDark] = useState(false);

  // Load state once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.deck) setDeck(parsed.deck);
        if (parsed.hand) setHand(parsed.hand);
        if (typeof parsed.sortByProb === "boolean") setSortByProb(parsed.sortByProb);
        if (Array.isArray(parsed.history)) setHistory(parsed.history);
        if (typeof parsed.dark === "boolean") setDark(parsed.dark);
      }
    } catch {}
  }, []);

  // Persist state
  useEffect(() => {
    const payload = { deck, hand, sortByProb, history, dark };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
  }, [deck, hand, sortByProb, history, dark]);

  // Derived values
  const totalInitial = useMemo(() => sum(makeInitialDeck()), []);
  const totalLeft = useMemo(() => sum(deck), [deck]);
  const playedCount = totalInitial - totalLeft;

  const stats = useMemo(() => {
    const rows = allCards.map((c) => ({
      card: c,
      left: deck[c] || 0,
      prob: totalLeft > 0 ? ((deck[c] || 0) / totalLeft) * 100 : 0,
    }));
    return sortByProb
      ? rows.sort((a, b) => b.prob - a.prob)
      : rows.sort((a, b) => allCards.indexOf(a.card) - allCards.indexOf(b.card));
  }, [deck, totalLeft, sortByProb]);

  const numericStats = useMemo(() => stats.filter(s => numberCards.includes(s.card)), [stats]);
  const top5 = useMemo(() => numericStats.slice(0, 5), [numericStats]);

  const dangerProb = useMemo(() => {
    const uniques = hand.filter((c, i, arr) => arr.indexOf(c) === arr.lastIndexOf(c));
    return numericStats
      .filter(s => uniques.includes(s.card))
      .reduce((acc, s) => acc + s.prob, 0);
  }, [hand, numericStats]);

  const recommendation = useMemo(() => {
    return dangerProb > 25
      ? { level: "warn", text: "Better pass" }
      : { level: "ok", text: "You can draw" };
  }, [dangerProb]);

  // Actions
  const playCard = (card) => {
    if ((deck[card] || 0) > 0) {
      setDeck((d) => ({ ...d, [card]: d[card] - 1 }));
      setHistory((h) => [{ type: "played", card }, ...h]);
    }
  };

  const addToHand = (card) => {
    if ((deck[card] || 0) > 0) {
      setDeck((d) => ({ ...d, [card]: d[card] - 1 }));
      setHand((h) => [...h, card]);
      setHistory((h) => [{ type: "hand", card }, ...h]);
    }
  };

  const removeFromHand = (idx) => {
    const card = hand[idx];
    if (!card) return;
    setHand((h) => h.filter((_, i) => i !== idx));
  };

  const returnHandToDeck = () => {
    const counts = {};
    hand.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
    setDeck((d) => {
      const nd = { ...d };
      Object.entries(counts).forEach(([c, k]) => {
        nd[c] = (nd[c] || 0) + k;
      });
      return nd;
    });
    setHand([]);
  };

  const clearHand = () => setHand([]);

  const resetAll = () => {
    setDeck(makeInitialDeck());
    setHand([]);
    setSortByProb(true);
    setHistory([]);
  };

  const undo = () => {
    const last = history[0];
    if (!last) return;
    setHistory((h) => h.slice(1));
    if (last.type === "played") {
      setDeck((d) => ({ ...d, [last.card]: (d[last.card] || 0) + 1 }));
    } else if (last.type === "hand") {
      let removed = false;
      setHand((h) => {
        const copy = [...h];
        const idx = copy.findIndex((c) => !removed && c === last.card);
        if (idx !== -1) { copy.splice(idx, 1); removed = true; }
        return copy;
      });
      setDeck((d) => ({ ...d, [last.card]: (d[last.card] || 0) + 1 }));
    }
  };

  const restoreSession = () => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.deck) setDeck(parsed.deck);
      if (parsed.hand) setHand(parsed.hand);
      if (typeof parsed.sortByProb === "boolean") setSortByProb(parsed.sortByProb);
      if (Array.isArray(parsed.history)) setHistory(parsed.history);
      if (typeof parsed.dark === "boolean") setDark(parsed.dark);
    } catch {}
  };

  // Small UI helper
  function CardPill({ label, onPlay, onHand, left }) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-white/10 backdrop-blur bg-white/5 dark:bg-black/20 px-3 py-2 gap-2 transition">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm px-2 py-1 rounded-xl">{label}</Badge>
          <span className="text-xs opacity-70">{left} left</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onPlay} className="rounded-xl">
            <Layers className="h-4 w-4 mr-1"/>Played
          </Button>
          <Button size="sm" onClick={onHand} className="rounded-xl">
            <Hand className="h-4 w-4 mr-1"/>To hand
          </Button>
        </div>
      </div>
    );
  }

  // Dark mode class on <html>
  useEffect(() => {
    const el = document.documentElement;
    if (dark) el.classList.add("dark");
    else el.classList.remove("dark");
  }, [dark]);

  // Build tag for sanity-checking deployments
  const buildTag = new Date().toISOString();

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="sticky top-0 z-20 -mt-6 -mx-4 px-4 py-3 mb-6 backdrop-blur bg-black/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300">
              Flip 7 — Tracker & Assistant
            </h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="rounded-xl" onClick={undo} aria-label="Undo last action">
                <Shuffle className="h-4 w-4 mr-2"/>Undo
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={restoreSession} aria-label="Restore saved session">
                <DownloadCloud className="h-4 w-4 mr-2"/>Restore
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={resetAll} aria-label="Reset everything">
                <RefreshCw className="h-4 w-4 mr-2"/>Reset
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => setDark(v => !v)} aria-label="Toggle dark mode">
                {dark ? <Sun className="h-4 w-4 mr-2"/> : <MoonStar className="h-4 w-4 mr-2"/>}
                {dark ? "Light" : "Dark"}
              </Button>
            </div>
          </div>
        </header>

        <Tabs defaultValue="play" className="space-y-6">
          <TabsList className="grid grid-cols-3 max-w-md rounded-2xl">
            <TabsTrigger value="play">Play</TabsTrigger>
            <TabsTrigger value="stats">Statistics</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2"/>Settings</TabsTrigger>
          </TabsList>

          {/* Play Tab */}
          <TabsContent value="play" className="space-y-6">
            <div className="grid md:grid-cols-5 gap-6">
              {/* Left: Deck actions */}
              <div className="md:col-span-3 space-y-6">
                <Card className="rounded-3xl border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Deck & Moves</span>
                      <div className="text-sm opacity-80">
                        Left {totalLeft} / {totalInitial} &middot; Played {playedCount}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={(totalLeft / totalInitial) * 100} className="h-2 rounded-full mb-4" />
                    <ScrollArea className="h-[420px] pr-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
                        {allCards.map((c) => (
                          <CardPill
                            key={c}
                            label={c}
                            left={deck[c]}
                            onPlay={() => playCard(c)}
                            onHand={() => addToHand(c)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle>Your Hand</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hand.length === 0 ? (
                      <p className="text-sm opacity-70">No cards in hand. Add cards from the list above.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {hand.map((c, i) => (
                          <Badge key={`${c}-${i}`} className="rounded-xl text-sm flex items-center gap-2">
                            {c}
                            <button aria-label="Remove from hand" onClick={() => removeFromHand(i)} className="opacity-70 hover:opacity-100">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="rounded-xl" onClick={clearHand}>Clear hand</Button>
                      <Button className="rounded-xl" onClick={returnHandToDeck}>Return cards to deck</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Assistant */}
              <div className="md:col-span-2 space-y-6">
                <Card className="rounded-3xl border-white/10 bg-gradient-to-br from-white/10 to-white/5">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Decision Assistant</span>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="rounded-xl">
                            <Sparkles className="h-4 w-4 mr-2"/>Recommendation
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl">
                          <DialogHeader>
                            <DialogTitle>Top draw chances</DialogTitle>
                            <DialogDescription>Calculated from current deck composition.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3">
                            {top5.length === 0 ? (
                              <p className="text-sm opacity-70">No numeric cards left in the deck.</p>
                            ) : (
                              <ul className="text-sm list-disc pl-5">
                                {top5.map((s) => (
                                  <li key={s.card}>{s.card}: {s.prob.toFixed(2)}%</li>
                                ))}
                              </ul>
                            )}
                            <div className="pt-2 text-sm">
                              Chance to hit a second identical (uniques in hand): <strong>{dangerProb.toFixed(2)}%</strong>
                            </div>
                            <div
                              className={
                                "text-base font-semibold " +
                                (recommendation.level === "warn" ? "text-red-300" : "text-emerald-300")
                              }
                            >
                              {recommendation.text}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                  </CardHeader>

                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch id="sort-prob" checked={sortByProb} onCheckedChange={setSortByProb} />
                          <label htmlFor="sort-prob" className="text-sm select-none">Sort by probability</label>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-white/10 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Card</TableHead>
                              <TableHead>Left</TableHead>
                              <TableHead>Chance</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stats.map((s) => (
                              <TableRow key={s.card}>
                                <TableCell className="font-medium">{s.card}</TableCell>
                                <TableCell className="tabular-nums">{s.left}</TableCell>
                                <TableCell className="tabular-nums">{s.prob.toFixed(2)}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
              </div>
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <Card className="rounded-3xl border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Deck overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {allCards.map((c) => (
                    <div key={c} className="rounded-2xl p-3 border border-white/10 bg-black/20">
                      <div className="text-sm opacity-70">{c}</div>
                      <div className="text-2xl font-semibold tabular-nums">{deck[c]}</div>
                      <div className="mt-2">
                        <Progress value={(totalLeft > 0 ? (deck[c] / totalLeft) * 100 : 0)} className="h-2 rounded-full" />
                      </div>
                      <div className="mt-2 text-xs opacity-70 tabular-nums">
                        {totalLeft > 0 ? ((deck[c] / totalLeft) * 100).toFixed(2) : "0.00"}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="rounded-3xl border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle>Custom deck</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm opacity-80">
                  You can override the number of each card (for different Flip 7 variants). Negative values are blocked.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {allCards.map((c) => (
                    <div key={c} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                      <span className="text-sm w-20 truncate" title={c}>{c}</span>
                      <Input
                        type="number"
                        min={0}
                        value={deck[c]}
                        onChange={(e) => {
                          const v = Math.max(0, Number(e.target.value || 0));
                          setDeck((d) => ({ ...d, [c]: v }));
                        }}
                        className="h-8 rounded-xl"
                        aria-label={`Set count for ${c}`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setDeck(makeInitialDeck())}>
                    <RotateCcw className="h-4 w-4 mr-2" />Restore default deck
                  </Button>
                  <Button className="rounded-xl" onClick={resetAll}>
                    <RefreshCw className="h-4 w-4 mr-2" />Full reset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="mt-10 text-center text-xs opacity-60">
          Build: {buildTag} · Made for Flip 7 game nights. Minimal glass UI so your brain does the math, not your eyes.
        </footer>
      </div>
    </div>
  );
}
