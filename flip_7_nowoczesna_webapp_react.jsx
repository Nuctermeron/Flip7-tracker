import React, { useMemo, useState } from "react";
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
import { X, RefreshCw, Shuffle, Sparkles, Hand, Layers, Settings } from "lucide-react";

// --- Utilities ---
const numberCards = Array.from({ length: 12 }, (_, i) => String(i + 1));
const specialCards = ["+2", "+4", "+6", "+8", "+10", "x2", "freeze", "flip three", "second chance"] as const;
const allCards = ["0", ...numberCards, ...specialCards];

type CardKey = typeof allCards[number];

type DeckCounts = Record<CardKey, number>;

const makeInitialDeck = (): DeckCounts => {
  const base: Partial<DeckCounts> = { "0": 1 };
  numberCards.forEach((n, i) => {
    base[n as CardKey] = i + 1; // "1":1, ..., "12":12
  });
  const specials: Partial<DeckCounts> = {
    "+2": 1, "+4": 1, "+6": 1, "+8": 1, "+10": 1,
    "x2": 1, "freeze": 3, "flip three": 3, "second chance": 3,
  };
  return { ...(base as DeckCounts), ...(specials as DeckCounts) } as DeckCounts;
};

const sum = (obj: Record<string, number>) => Object.values(obj).reduce((a, b) => a + b, 0);

// --- Main App ---
export default function Flip7App() {
  const [deck, setDeck] = useState<DeckCounts>(() => makeInitialDeck());
  const [hand, setHand] = useState<CardKey[]>([]);
  const [sortByProb, setSortByProb] = useState(true);
  const [history, setHistory] = useState<{ type: "played" | "hand"; card: CardKey }[]>([]);

  const totalInitial = useMemo(() => sum(makeInitialDeck()), []);
  const totalLeft = useMemo(() => sum(deck), [deck]);
  const playedCount = totalInitial - totalLeft;

  const stats = useMemo(() => {
    return allCards.map((c) => ({
      card: c as CardKey,
      left: deck[c as CardKey] || 0,
      prob: totalLeft > 0 ? ((deck[c as CardKey] || 0) / totalLeft) * 100 : 0,
    })).sort((a, b) => (sortByProb ? b.prob - a.prob : allCards.indexOf(a.card) - allCards.indexOf(b.card)));
  }, [deck, totalLeft, sortByProb]);

  const numericStats = useMemo(() => stats.filter(s => numberCards.includes(s.card)), [stats]);

  const top5 = useMemo(() => numericStats.slice(0, 5), [numericStats]);

  const dangerProb = useMemo(() => {
    const uniques = hand.filter((c, i, arr) => arr.indexOf(c) === arr.lastIndexOf(c));
    return numericStats
      .filter(s => uniques.includes(s.card as CardKey))
      .reduce((acc, s) => acc + s.prob, 0);
  }, [hand, numericStats]);

  const recommendation = useMemo(() => {
    return dangerProb > 25 ? { level: "warn" as const, text: "🛑 Lepiej pasuj" } : { level: "ok" as const, text: "✅ Możesz ciągnąć" };
  }, [dangerProb]);

  // --- Actions ---
  const playCard = (card: CardKey) => {
    if (deck[card] > 0) {
      setDeck((d) => ({ ...d, [card]: d[card] - 1 }));
      setHistory((h) => [{ type: "played", card }, ...h]);
    }
  };

  const addToHand = (card: CardKey) => {
    if (deck[card] > 0) {
      setDeck((d) => ({ ...d, [card]: d[card] - 1 }));
      setHand((h) => [...h, card]);
      setHistory((h) => [{ type: "hand", card }, ...h]);
    }
  };

  const removeFromHand = (idx: number) => {
    const card = hand[idx];
    setHand((h) => h.filter((_, i) => i !== idx));
    // do not auto-return to deck to mirror original; provide explicit action below
  };

  const returnHandToDeck = () => {
    const counts: Partial<DeckCounts> = {};
    hand.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
    setDeck((d) => {
      const nd = { ...d };
      Object.entries(counts).forEach(([c, k]) => { nd[c as CardKey] = (nd[c as CardKey] || 0) + (k as number); });
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
      // remove one occurrence from hand and return to deck
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

  // --- UI helpers ---
  const CardPill: React.FC<{ label: string; onPlay?: () => void; onHand?: () => void; left?: number }>
    = ({ label, onPlay, onHand, left }) => (
    <div className="flex items-center justify-between rounded-2xl border backdrop-blur bg-white/5 dark:bg-black/20 px-3 py-2 gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-sm px-2 py-1 rounded-xl">{label}</Badge>
        <span className="text-xs opacity-70">{left} left</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onPlay} className="rounded-xl"><Layers className="h-4 w-4 mr-1"/>Zagrana</Button>
        <Button size="sm" onClick={onHand} className="rounded-xl"><Hand className="h-4 w-4 mr-1"/>Na rękę</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-zinc-900 to-black text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300">
            Flip 7 – Tracker i Asystent
          </h1>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl" onClick={undo}><Shuffle className="h-4 w-4 mr-2"/>Cofnij</Button>
            <Button variant="outline" className="rounded-xl" onClick={resetAll}><RefreshCw className="h-4 w-4 mr-2"/>Reset</Button>
          </div>
        </header>

        <Tabs defaultValue="play" className="space-y-6">
          <TabsList className="grid grid-cols-3 max-w-md rounded-2xl">
            <TabsTrigger value="play">Gra</TabsTrigger>
            <TabsTrigger value="stats">Statystyki</TabsTrigger>
            <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-2"/>Ustawienia</TabsTrigger>
          </TabsList>

          {/* Play Tab */}
          <TabsContent value="play" className="space-y-6">
            <div className="grid md:grid-cols-5 gap-6">
              {/* Left: Deck actions */}
              <div className="md:col-span-3 space-y-6">
                <Card className="rounded-3xl border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Talia i ruchy</span>
                      <div className="text-sm opacity-80">Pozostało {totalLeft} / {totalInitial} &middot; Zagrane {playedCount}</div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={(totalLeft / totalInitial) * 100} className="h-2 rounded-full mb-4" />
                    <ScrollArea className="h-[420px] pr-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-3">
                        {allCards.map((c) => (
                          <CardPill key={c} label={c} left={deck[c as CardKey]} onPlay={() => playCard(c as CardKey)} onHand={() => addToHand(c as CardKey)} />
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="rounded-3xl border-white/10 bg-white/5">
                  <CardHeader>
                    <CardTitle>Twoja ręka</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hand.length === 0 ? (
                      <p className="text-sm opacity-70">Brak kart na ręce. Dodaj karty z listy powyżej.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {hand.map((c, i) => (
                          <Badge key={`${c}-${i}`} className="rounded-xl text-sm flex items-center gap-2">
                            {c}
                            <button aria-label="Usuń" onClick={() => removeFromHand(i)} className="opacity-70 hover:opacity-100">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="rounded-xl" onClick={clearHand}>Reset ręki</Button>
                      <Button className="rounded-xl" onClick={returnHandToDeck}>Oddaj karty do talii</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Assistant */}
              <div className="md:col-span-2 space-y-6">
                <Card className="rounded-3xl border-white/10 bg-gradient-to-br from-white/10 to-white/5">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Asystent decyzji</span>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" className="rounded-xl"><Sparkles className="h-4 w-4 mr-2"/>Rekomendacja</Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-3xl">
                          <DialogHeader>
                            <DialogTitle>Top szanse dociągu</DialogTitle>
                            <DialogDescription>Kalkulacja na podstawie aktualnej talii.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-3">
                            {top5.length === 0 ? (
                              <p className="text-sm opacity-70">Brak dostępnych kart numerycznych w talii.</p>
                            ) : (
                              <ul className="text-sm list-disc pl-5">
                                {top5.map((s) => (
                                  <li key={s.card}>{s.card}: {s.prob.toFixed(2)}%</li>
                                ))}
                              </ul>
                            )}
                            <div className="pt-2 text-sm">
                              Szansa na drugą identyczną kartę (unikaty w ręce): <strong>{dangerProb.toFixed(2)}%</strong>
                            </div>
                            <div className={"text-base font-semibold " + (recommendation.level === "warn" ? "text-red-300" : "text-emerald-300")}>{recommendation.text}</div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Switch id="sort-prob" checked={sortByProb} onCheckedChange={setSortByProb} />
                        <label htmlFor="sort-prob" className="text-sm select-none">Sortuj wg szansy</label>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Karta</TableHead>
                            <TableHead>Pozostało</TableHead>
                            <TableHead>Szansa</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.map((s) => (
                            <TableRow key={s.card}>
                              <TableCell className="font-medium">{s.card}</TableCell>
                              <TableCell>{s.left}</TableCell>
                              <TableCell>{s.prob.toFixed(2)}%</TableCell>
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
                <CardTitle>Przegląd talii</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {allCards.map((c) => (
                    <div key={c} className="rounded-2xl p-3 border border-white/10 bg-black/20">
                      <div className="text-sm opacity-70">{c}</div>
                      <div className="text-2xl font-semibold">{deck[c as CardKey]}</div>
                      <div className="mt-2">
                        <Progress value={(totalLeft > 0 ? (deck[c as CardKey] / totalLeft) * 100 : 0)} className="h-2 rounded-full" />
                      </div>
                      <div className="mt-2 text-xs opacity-70">{totalLeft > 0 ? ((deck[c as CardKey] / totalLeft) * 100).toFixed(2) : "0.00"}%</div>
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
                <CardTitle>Niestandardowa talia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm opacity-80">Możesz nadpisać liczebność poszczególnych kart (dla różnych wariantów Flip 7). Wartości ujemne są zablokowane.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {allCards.map((c) => (
                    <div key={c} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                      <span className="text-sm w-20 truncate" title={c}>{c}</span>
                      <Input
                        type="number"
                        min={0}
                        value={deck[c as CardKey]}
                        onChange={(e) => {
                          const v = Math.max(0, Number(e.target.value || 0));
                          setDeck((d) => ({ ...d, [c]: v } as DeckCounts));
                        }}
                        className="h-8 rounded-xl"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-xl" onClick={() => setDeck(makeInitialDeck())}>Przywróć domyślną talię</Button>
                  <Button className="rounded-xl" onClick={resetAll}>Pełny reset</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <footer className="mt-10 text-center text-xs opacity-60">
          Zrobione z ♥ dla stołu Flip 7. UI: szkło, gradienty i minimalizm – żeby liczyć karty w stylu.
        </footer>
      </div>
    </div>
  );
}
