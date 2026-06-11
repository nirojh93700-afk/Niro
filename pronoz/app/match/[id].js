import { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, radius, spacing, glow } from "../../src/theme";
import { useStore } from "../../src/lib/store";
import { competitions } from "../../src/data/matches";
import { formatKickoff } from "../../src/lib/format";
import { explainPrediction, POINTS } from "../../src/lib/scoring";
import TeamBadge from "../../src/components/TeamBadge";

export default function MatchScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { matches, predictions, setPrediction } = useStore();

  const match = matches.find((m) => m.id === id);
  const existing = predictions[id];
  const [home, setHome] = useState(existing ? existing.home : 0);
  const [away, setAway] = useState(existing ? existing.away : 0);
  const [saved, setSaved] = useState(false);

  if (!match) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.muted}>Match introuvable.</Text>
      </View>
    );
  }

  const comp = competitions[match.competitionId];
  const finished = match.status === "finished";
  const locked = finished;

  function bump(setter, value, delta) {
    Haptics.selectionAsync().catch(() => {});
    setter(Math.max(0, Math.min(20, value + delta)));
    setSaved(false);
  }

  function save() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setPrediction(id, { home, away });
    setSaved(true);
    setTimeout(() => router.back(), 550);
  }

  const detail = finished && existing ? explainPrediction(existing, match.result) : null;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <LinearGradient colors={["#0d1326", colors.bg]} style={{ paddingBottom: spacing.md }}>
        <View style={styles.topbar}>
          <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.comp}>
            {comp.emoji} {comp.name}
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={styles.kickoff}>
          {finished ? "Match terminé" : formatKickoff(match.kickoff)}
        </Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Affrontement + sélecteurs de score */}
        <View style={styles.matchup}>
          <Side team={match.home} value={home} onMinus={() => bump(setHome, home, -1)} onPlus={() => bump(setHome, home, 1)} locked={locked} />
          <View style={styles.sep}>
            <Text style={styles.sepText}>:</Text>
          </View>
          <Side team={match.away} value={away} onMinus={() => bump(setAway, away, -1)} onPlus={() => bump(setAway, away, 1)} locked={locked} />
        </View>

        {finished && (
          <View style={styles.realResult}>
            <Text style={styles.realLabel}>Résultat réel</Text>
            <Text style={styles.realScore}>
              {match.result.home} - {match.result.away}
            </Text>
            {detail && (
              <Text style={[styles.realPts, { color: detail.tone === "green" ? colors.green : detail.tone === "amber" ? colors.amber : colors.red }]}>
                {existing ? `${detail.pts > 0 ? "+" : ""}${detail.pts} pts · ${detail.label}` : "Aucun prono enregistré"}
              </Text>
            )}
          </View>
        )}

        {/* Barème */}
        <View style={styles.rules}>
          <Text style={styles.rulesTitle}>Comment gagner des points</Text>
          <Rule pts={`${POINTS.EXACT}`} text="Score exact" tone={colors.neon} />
          <Rule pts={`+${POINTS.GOAL_DIFF_BONUS}`} text="Bonne différence de buts" tone={colors.violet} />
          <Rule pts={`${POINTS.OUTCOME}`} text="Bon résultat (1 · N · 2)" tone={colors.cyan} />
          <Rule pts="0" text="Mauvais résultat" tone={colors.textFaint} />
        </View>
      </ScrollView>

      {!locked && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <Pressable
            style={({ pressed }) => [styles.save, saved && styles.saved, pressed && { transform: [{ scale: 0.99 }] }]}
            onPress={save}
          >
            <Ionicons name={saved ? "checkmark-circle" : "lock-closed"} size={18} color={colors.bgDeep} />
            <Text style={styles.saveText}>{saved ? "Prono enregistré !" : "Valider mon prono"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Side({ team, value, onMinus, onPlus, locked }) {
  return (
    <View style={styles.side}>
      <TeamBadge team={team} size={56} />
      <Text style={styles.sideName} numberOfLines={1}>
        {team.name}
      </Text>
      <View style={styles.stepper}>
        {!locked && (
          <Pressable style={styles.step} onPress={onMinus} hitSlop={8}>
            <Ionicons name="remove" size={20} color={colors.text} />
          </Pressable>
        )}
        <Text style={styles.value}>{value}</Text>
        {!locked && (
          <Pressable style={styles.step} onPress={onPlus} hitSlop={8}>
            <Ionicons name="add" size={20} color={colors.text} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function Rule({ pts, text, tone }) {
  return (
    <View style={styles.rule}>
      <View style={[styles.rulePts, { borderColor: tone }]}>
        <Text style={[styles.rulePtsText, { color: tone }]}>{pts}</Text>
      </View>
      <Text style={styles.ruleText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: "center", justifyContent: "center" },
  muted: { color: colors.textMuted },

  topbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md },
  back: { width: 24 },
  comp: { color: colors.text, fontSize: 15, fontWeight: "800" },
  kickoff: { color: colors.cyan, fontSize: 13, fontWeight: "700", textAlign: "center", marginTop: 6 },

  matchup: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  side: { flex: 1, alignItems: "center", gap: 10 },
  sideName: { color: colors.text, fontSize: 14, fontWeight: "800", maxWidth: 110, textAlign: "center" },
  sep: { paddingHorizontal: spacing.sm },
  sepText: { color: colors.textFaint, fontSize: 26, fontWeight: "900" },

  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: 4 },
  step: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceHi,
    borderWidth: 1,
    borderColor: colors.borderHi,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { color: colors.text, fontSize: 34, fontWeight: "900", minWidth: 40, textAlign: "center" },

  realResult: { alignItems: "center", marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md },
  realLabel: { color: colors.textMuted, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  realScore: { color: colors.text, fontSize: 30, fontWeight: "900", marginVertical: 4 },
  realPts: { fontSize: 14, fontWeight: "800" },

  rules: { marginTop: spacing.xl, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, gap: spacing.sm },
  rulesTitle: { color: colors.text, fontSize: 14, fontWeight: "800", marginBottom: 4 },
  rule: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rulePts: { width: 40, height: 32, borderRadius: 8, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  rulePtsText: { fontSize: 14, fontWeight: "900" },
  ruleText: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },

  footer: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border },
  save: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.neon,
    borderRadius: radius.pill,
    paddingVertical: 16,
    ...glow(colors.neon, 0.5, 16),
  },
  saved: { backgroundColor: colors.neonDim },
  saveText: { color: colors.bgDeep, fontSize: 16, fontWeight: "900" },
});
