import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, glow } from "../../src/theme";
import { useStore } from "../../src/lib/store";
import { competitions } from "../../src/data/matches";
import { formatKickoff } from "../../src/lib/format";
import { explainPrediction } from "../../src/lib/scoring";
import TeamBadge from "../../src/components/TeamBadge";

const FILTERS = [
  { id: "all", label: "Tous" },
  { id: "upcoming", label: "À jouer" },
  { id: "finished", label: "Terminés" },
];

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { matches, predictions, myPoints } = useStore();
  const [filter, setFilter] = useState("all");

  const list = useMemo(() => {
    if (filter === "all") return matches;
    return matches.filter((m) => m.status === filter || (filter === "upcoming" && m.status === "live"));
  }, [matches, filter]);

  const toPlay = matches.filter((m) => m.status === "upcoming" && !predictions[m.id]).length;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hello}>Salut 👋</Text>
          <Text style={styles.title}>Tes matchs</Text>
        </View>
        <View style={styles.pointsPill}>
          <Ionicons name="flash" size={14} color={colors.bgDeep} />
          <Text style={styles.pointsText}>{myPoints} pts</Text>
        </View>
      </View>

      {toPlay > 0 && (
        <View style={styles.banner}>
          <Ionicons name="alarm" size={18} color={colors.neon} />
          <Text style={styles.bannerText}>
            {toPlay} match{toPlay > 1 ? "s" : ""} à pronostiquer avant le coup d'envoi
          </Text>
        </View>
      )}

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={[styles.filter, filter === f.id && styles.filterActive]}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xl, gap: spacing.md }}
        showsVerticalScrollIndicator={false}
      >
        {list.map((m) => (
          <MatchCard
            key={m.id}
            match={m}
            pred={predictions[m.id]}
            onPress={() => router.push(`/match/${m.id}`)}
          />
        ))}
        {list.length === 0 && <Text style={styles.empty}>Aucun match dans cette catégorie.</Text>}
      </ScrollView>
    </View>
  );
}

function MatchCard({ match, pred, onPress }) {
  const comp = competitions[match.competitionId];
  const finished = match.status === "finished";
  const detail = finished && pred ? explainPrediction(pred, match.result) : null;

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]} onPress={onPress}>
      <View style={styles.cardTop}>
        <Text style={styles.comp}>
          {comp.emoji} {comp.name}
        </Text>
        {finished ? (
          <Text style={styles.statusDone}>Terminé</Text>
        ) : (
          <Text style={styles.statusLive}>{formatKickoff(match.kickoff)}</Text>
        )}
      </View>

      <View style={styles.teams}>
        <Team team={match.home} />
        <View style={styles.middle}>
          {finished ? (
            <Text style={styles.score}>
              {match.result.home} - {match.result.away}
            </Text>
          ) : (
            <Text style={styles.vs}>VS</Text>
          )}
        </View>
        <Team team={match.away} alignRight />
      </View>

      <View style={styles.cardBottom}>
        {pred ? (
          <View style={styles.predTag}>
            <Ionicons name="checkmark-circle" size={14} color={colors.neon} />
            <Text style={styles.predText}>
              Ton prono : {pred.home}-{pred.away}
            </Text>
          </View>
        ) : finished ? (
          <Text style={styles.noPred}>Pas de prono</Text>
        ) : (
          <View style={styles.cta}>
            <Text style={styles.ctaText}>Pronostiquer</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.neon} />
          </View>
        )}

        {detail && (
          <View style={[styles.result, toneStyle(detail.tone)]}>
            <Text style={[styles.resultText, { color: toneColor(detail.tone) }]}>
              {detail.pts > 0 ? `+${detail.pts} pts` : "0 pt"} · {detail.label}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function Team({ team, alignRight }) {
  return (
    <View style={[styles.team, alignRight && { alignItems: "flex-end" }]}>
      <TeamBadge team={team} size={44} />
      <Text style={styles.teamName} numberOfLines={1}>
        {team.name}
      </Text>
    </View>
  );
}

function toneColor(t) {
  return t === "green" ? colors.green : t === "amber" ? colors.amber : colors.red;
}
function toneStyle(t) {
  const c = toneColor(t);
  return { backgroundColor: c + "1a", borderColor: c + "55" };
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },

  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  hello: { color: colors.textMuted, fontSize: 14 },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  pointsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.neon,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    ...glow(colors.neon, 0.4, 10),
  },
  pointsText: { color: colors.bgDeep, fontWeight: "900", fontSize: 14 },

  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(57,255,158,0.07)",
    borderWidth: 1,
    borderColor: "rgba(57,255,158,0.25)",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bannerText: { color: colors.text, fontSize: 13, fontWeight: "600", flex: 1 },

  filters: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  filter: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.surfaceHi, borderColor: colors.neon },
  filterText: { color: colors.textMuted, fontWeight: "700", fontSize: 13 },
  filterTextActive: { color: colors.neon },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  comp: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  statusLive: { color: colors.cyan, fontSize: 12, fontWeight: "700" },
  statusDone: { color: colors.textFaint, fontSize: 12, fontWeight: "700" },

  teams: { flexDirection: "row", alignItems: "center" },
  team: { flex: 1, gap: 8 },
  teamName: { color: colors.text, fontSize: 13, fontWeight: "700" },
  middle: { paddingHorizontal: spacing.md },
  vs: { color: colors.textFaint, fontWeight: "900", fontSize: 14 },
  score: { color: colors.text, fontWeight: "900", fontSize: 22 },

  cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.md },
  predTag: { flexDirection: "row", alignItems: "center", gap: 6 },
  predText: { color: colors.text, fontSize: 13, fontWeight: "700" },
  noPred: { color: colors.textFaint, fontSize: 13 },
  cta: { flexDirection: "row", alignItems: "center", gap: 6 },
  ctaText: { color: colors.neon, fontSize: 14, fontWeight: "800" },

  result: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm, borderWidth: 1 },
  resultText: { fontSize: 12, fontWeight: "800" },

  empty: { color: colors.textFaint, textAlign: "center", marginTop: spacing.xl },
});
