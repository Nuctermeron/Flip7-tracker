import React, { useMemo, useState } from 'react'

const numberCards = Array.from({ length: 12 }, (_, i) => String(i + 1));
const specialCards = ["+2", "+4", "+6", "+8", "+10", "x2", "freeze", "flip three", "second chance"];
const allCards = ["0", ...numberCards, ...specialCards];

const makeInitialDeck = () => {
  const base = { "0": 1 };
  numberCards.forEach((n, i) => { base[n] = i + 1; });
  const specials = { "+2": 1, "+4": 1, "+6": 1, "+8": 1, "+10": 1, "x2": 1, "freeze": 3, "flip three": 3, "second chance": 3 };
  return { ...base, ...specials };
};

const sum = (obj) => Object.values(obj).reduce((a, b) => a + b, 0);

export default function App() {
  const [deck, setDeck] = useState(() => makeInitialDeck());
  const [hand, setHand] = useState([]);
  const [sortByProb, setSortByProb] = useState(true);
  const [history, setHistory] = useState([]); // {type:'played'|'hand', card}

  const totalInitial = useMemo(() => sum(makeInitialDeck()), []);
  const totalLeft = useMemo(() => sum(deck), [deck]);
  const playedCount = totalInitial - totalLeft;

  const stats = useMemo(() => {
    const list = allCards.map((c) => ({
      card: c,
      left: deck[c] || 0,
      prob: totalLeft > 0 ? ((deck[c] || 0) / totalLeft) * 100 : 0
    }));
    if (sortByProb) return list.sort((a,b)=>b.prob - a.prob);
    return list.sort((a,b)=> allCards.indexOf(a.card) - allCards.indexOf(b.card));
  }, [deck, totalLeft, sortByProb]);

  const numericStats = useMemo(() => stats.filter(s => numberCards.includes(s.card)), [stats]);
  const top5 = useMemo(() => numericStats.slice(0,5), [numericStats]);

  const dangerProb = useMemo(() => {
    const uniques = hand.filter((c,i,arr)=>arr.indexOf(c)===arr.lastIndexOf(c));
    return numericStats.filter(s => uniques.includes(s.card)).reduce((acc,s)=>acc+s.prob,0);
  }, [hand, numericStats]);

  const recommendation = dangerProb > 25 ? {level:'warn', text:'🛑 Lepiej pasuj'} : {level:'ok', text:'✅ Możesz ciągnąć'};

  const playCard = (card) => {
    if ((deck[card]||0) > 0) {
      setDeck(d => ({...d, [card]: d[card]-1}));
      setHistory(h => [{type:'played', card}, ...h]);
    }
  };

  const addToHand = (card) => {
    if ((deck[card]||0) > 0) {
      setDeck(d => ({...d, [card]: d[card]-1}));
      setHand(h => [...h, card]);
      setHistory(h => [{type:'hand', card}, ...h]);
    }
  };

  const removeFromHand = (idx) => {
    setHand(h => h.filter((_,i)=>i!==idx));
  };

  const returnHandToDeck = () => {
    const counts = {};
    hand.forEach(c => { counts[c] = (counts[c]||0)+1; });
    setDeck(d => {
      const nd = {...d};
      Object.entries(counts).forEach(([c,k]) => { nd[c] = (nd[c]||0) + k; });
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
    setHistory(h => h.slice(1));
    if (last.type === 'played') {
      setDeck(d => ({...d, [last.card]: (d[last.card]||0)+1}));
    } else if (last.type === 'hand') {
      let removed = false;
      setHand(h => {
        const copy = [...h];
        const idx = copy.findIndex(c => !removed && c === last.card);
        if (idx !== -1) { copy.splice(idx,1); removed = true; }
        return copy;
      });
      setDeck(d => ({...d, [last.card]: (d[last.card]||0)+1}));
    }
  };

  return (
    <div className="min-h-screen w-full">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-cyan-300 to-emerald-300">
            Flip 7 – Tracker i Asystent
          </h1>
          <div className="flex gap-2">
            <button onClick={undo} className="rounded-xl border px-3 py-2 hover:bg-white/10">Cofnij</button>
            <button onClick={resetAll} className="rounded-xl border px-3 py-2 hover:bg-white/10">Reset</button>
          </div>
        </header>

        <div className="grid gap-6 md:grid-cols-5">
          {/* Left: Deck & Hand */}
          <div className="md:col-span-3 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">Talia i ruchy</div>
                <div className="text-sm opacity-80">Pozostało {totalLeft} / {totalInitial} · Zagrane {playedCount}</div>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-4">
                <div className="h-2 bg-white/40" style={{width: `${(totalLeft/totalInitial)*100}%`}} />
              </div>
              <div className="h-[420px] pr-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allCards.map((c)=> (
                  <div key={c} className="flex items-center justify-between rounded-2xl border backdrop-blur bg-white/5 px-3 py-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm px-2 py-1 rounded-xl bg-white/10">{c}</span>
                      <span className="text-xs opacity-70">{deck[c]||0} left</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={()=>playCard(c)} className="rounded-xl border px-2 py-1 text-sm hover:bg-white/10">Zagrana</button>
                      <button onClick={()=>addToHand(c)} className="rounded-xl border px-2 py-1 text-sm hover:bg-white/10">Na rękę</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="font-medium mb-3">Twoja ręka</div>
              {hand.length === 0 ? (
                <p className="text-sm opacity-70">Brak kart na ręce. Dodaj karty z listy powyżej.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {hand.map((c,i)=>(
                    <span key={c+'-'+i} className="rounded-xl bg-white/10 px-2 py-1 text-sm flex items-center gap-2">
                      {c}
                      <button aria-label="Usuń" onClick={()=>removeFromHand(i)} className="opacity-70 hover:opacity-100">✕</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={clearHand} className="rounded-xl border px-3 py-2 hover:bg-white/10">Reset ręki</button>
                <button onClick={returnHandToDeck} className="rounded-xl border px-3 py-2 hover:bg-white/10">Oddaj karty do talii</button>
              </div>
            </div>
          </div>

          {/* Right: Assistant */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">Asystent decyzji</div>
                <button onClick={()=>alert(
                  'Top szanse dociągu:\n' +
                  (top5.length? top5.map(s=>`${s.card}: ${s.prob.toFixed(2)}%`).join('\n'): 'Brak dostępnych kart numerycznych') +
                  `\n\nSzansa na drugą identyczną kartę: ${dangerProb.toFixed(2)}%\n` +
                  (dangerProb>25? '🛑 Lepiej pasuj':'✅ Możesz ciągnąć')
                )} className="rounded-xl border px-3 py-2 hover:bg-white/10">Rekomendacja</button>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <label className="text-sm select-none flex items-center gap-2">
                  <input type="checkbox" checked={sortByProb} onChange={e=>setSortByProb(e.target.checked)} />
                  Sortuj wg szansy
                </label>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left p-2">Karta</th>
                      <th className="text-left p-2">Pozostało</th>
                      <th className="text-left p-2">Szansa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.map((s)=>(
                      <tr key={s.card} className="odd:bg-white/0 even:bg-white/5">
                        <td className="p-2 font-medium">{s.card}</td>
                        <td className="p-2">{s.left}</td>
                        <td className="p-2">{s.prob.toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-10 text-center text-xs opacity-60">
          Zrobione z ♥ dla stołu Flip 7. Tailwind + Vite, bez zależności ciężkich jak troll pod mostem.
        </footer>
      </div>
    </div>
  );
}
