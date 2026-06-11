// État global de l'app (pronostics, amis, utilisateur) via Context + AsyncStorage.
// Persistance locale pour la démo ; à brancher sur Firestore plus tard.
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { seedMatches } from "../data/matches";
import { seedFriends } from "../data/users";
import { scorePrediction } from "./scoring";

const KEY = "scorecast:v1";
const Ctx = createContext(null);

const initialState = {
  user: null, // { name, provider }
  predictions: {}, // { [matchId]: { home, away } }
  matches: seedMatches,
  friends: seedFriends,
};

export function StoreProvider({ children }) {
  const [state, setState] = useState(initialState);
  const [ready, setReady] = useState(false);

  // Chargement initial
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setState((s) => ({ ...s, ...saved, matches: seedMatches, friends: seedFriends }));
        }
      } catch (e) {
        // ignore, on repart de zéro
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Sauvegarde à chaque changement utile
  const persist = useCallback((next) => {
    const slim = { user: next.user, predictions: next.predictions };
    AsyncStorage.setItem(KEY, JSON.stringify(slim)).catch(() => {});
  }, []);

  const signIn = useCallback((user) => {
    setState((s) => {
      const next = { ...s, user };
      persist(next);
      return next;
    });
  }, [persist]);

  const signOut = useCallback(() => {
    setState((s) => {
      const next = { ...s, user: null };
      persist(next);
      return next;
    });
  }, [persist]);

  const setPrediction = useCallback((matchId, pred) => {
    setState((s) => {
      const next = { ...s, predictions: { ...s.predictions, [matchId]: pred } };
      persist(next);
      return next;
    });
  }, [persist]);

  // Points gagnés par l'utilisateur sur les matchs terminés
  const myPoints = useMemo(() => {
    return state.matches.reduce((sum, m) => {
      if (m.status !== "finished") return sum;
      const pred = state.predictions[m.id];
      return sum + scorePrediction(pred, m.result);
    }, 0);
  }, [state.matches, state.predictions]);

  // Classement : amis + total dynamique de l'utilisateur
  const leaderboard = useMemo(() => {
    return state.friends
      .map((f) => (f.isMe ? { ...f, points: myPoints } : f))
      .sort((a, b) => b.points - a.points);
  }, [state.friends, myPoints]);

  const value = useMemo(
    () => ({ ...state, ready, myPoints, leaderboard, signIn, signOut, setPrediction }),
    [state, ready, myPoints, leaderboard, signIn, signOut, setPrediction]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore doit être utilisé dans <StoreProvider>");
  return ctx;
}
