import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, glow } from "../../src/theme";
import { useStore } from "../../src/lib/store";

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { leaderboard } = useStore();
  const podium = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <Text style={styles.title}>Classement</Text>
      <Text style={styles.subtitle}>Ligue « Les potes » · saison 2026</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {/* Podium */}
        <View style={styles.podium}>
          {podium[1] && <PodiumSpot player={podium[1]} place={2} />}
          {podium[0] && <PodiumSpot player={podium[0]} place={1} />}
          {podium[2] && <PodiumSpot player={podium[2]} place={3} />}
        </View>

        {/* Reste du classement */}
        <View style={styles.list}>
          {rest.map((p, i) => (
            <View key={p.id} style={[styles.row, p.isMe && styles.rowMe]}>
              <Text style={styles.rank}>{i + 4}</Text>
              <Text style={styles.avatar}>{p.avatar}</Text>
              <Text style={[styles.name, p.isMe && { color: colors.neon }]}>{p.name}</Text>
              <Text style={[styles.pts, p.isMe && { color: colors.neon }]}>{p.points} pts</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function PodiumSpot({ player, place }) {
  const heights = { 1: 130, 2: 100, 3: 84 };
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };
  const accent = place === 1 ? colors.neon : place === 2 ? colors.cyan : colors.violet;

  return (
    <View style={styles.spot}>
      <Text style={styles.medal}>{medals[place]}</Text>
      <Text style={styles.spotAvatar}>{player.avatar}</Text>
      <Text style={[styles.spotName, player.isMe && { color: accent }]} numberOfLines={1}>
        {player.name}
      </Text>
      <View
        style={[
          styles.pillar,
          { height: heights[place], borderColor: accent, ...(place === 1 ? glow(accent, 0.4, 14) : null) },
        ]}
      >
        <Text style={[styles.spotPts, { color: accent }]}>{player.points}</Text>
        <Text style={styles.spotPtsLabel}>pts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },
  title: { color: colors.text, fontSize: 28, fontWeight: "900" },
  subtitle: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.lg },

  podium: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: spacing.sm, marginBottom: spacing.lg },
  spot: { flex: 1, alignItems: "center" },
  medal: { fontSize: 22 },
  spotAvatar: { fontSize: 30, marginVertical: 4 },
  spotName: { color: colors.text, fontSize: 13, fontWeight: "800", marginBottom: 8 },
  pillar: {
    width: "100%",
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  spotPts: { fontSize: 22, fontWeight: "900" },
  spotPtsLabel: { color: colors.textMuted, fontSize: 11 },

  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  rowMe: { borderColor: colors.neon, backgroundColor: "rgba(57,255,158,0.05)" },
  rank: { color: colors.textMuted, fontWeight: "900", width: 24, fontSize: 15 },
  avatar: { fontSize: 22 },
  name: { color: colors.text, fontSize: 15, fontWeight: "700", flex: 1 },
  pts: { color: colors.text, fontSize: 15, fontWeight: "900" },
});
