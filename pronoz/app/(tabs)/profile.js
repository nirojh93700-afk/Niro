import { View, Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius, spacing, glow } from "../../src/theme";
import { useStore } from "../../src/lib/store";
import { scorePrediction } from "../../src/lib/scoring";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, matches, predictions, myPoints, leaderboard, signOut } = useStore();

  const finished = matches.filter((m) => m.status === "finished");
  const played = finished.filter((m) => predictions[m.id]);
  const exact = played.filter((m) => scorePrediction(predictions[m.id], m.result) >= 3).length;
  const rank = leaderboard.findIndex((p) => p.isMe) + 1;

  function logout() {
    Alert.alert("Se déconnecter", "Tu veux vraiment quitter ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Déconnexion",
        style: "destructive",
        onPress: () => {
          signOut();
          router.replace("/");
        },
      },
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.sm }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={styles.head}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 34 }}>🦊</Text>
          </View>
          <Text style={styles.name}>{user?.name || "Joueur"}</Text>
          <Text style={styles.via}>
            Connecté via {user?.provider === "apple" ? "Apple" : user?.provider === "facebook" ? "Facebook" : "invité"}
          </Text>
          <View style={styles.rankPill}>
            <Ionicons name="trophy" size={14} color={colors.neon} />
            <Text style={styles.rankText}>{rank}ᵉ au classement</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard value={myPoints} label="Points" tone={colors.neon} />
          <StatCard value={played.length} label="Pronos joués" tone={colors.cyan} />
          <StatCard value={exact} label="Scores exacts" tone={colors.violet} />
        </View>

        <Text style={styles.section}>Réglages</Text>
        <View style={styles.menu}>
          <MenuItem icon="notifications" label="Notifications" />
          <MenuItem icon="people" label="Inviter des amis" />
          <MenuItem icon="shield-checkmark" label="Confidentialité" />
          <MenuItem icon="help-circle" label="Aide & règles" />
        </View>

        <Pressable style={styles.logout} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color={colors.red} />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </Pressable>

        <Text style={styles.version}>Pronoz v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function StatCard({ value, label, tone }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuItem({ icon, label }) {
  return (
    <Pressable style={styles.menuItem}>
      <Ionicons name={icon} size={20} color={colors.textMuted} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.lg },

  head: { alignItems: "center", marginBottom: spacing.lg },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.neon,
    alignItems: "center",
    justifyContent: "center",
    ...glow(colors.neon, 0.3, 14),
  },
  name: { color: colors.text, fontSize: 22, fontWeight: "900", marginTop: spacing.md },
  via: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  rankPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rankText: { color: colors.text, fontSize: 13, fontWeight: "700" },

  statsGrid: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  statValue: { fontSize: 24, fontWeight: "900" },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },

  section: { color: colors.textMuted, fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: spacing.sm },
  menu: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: 15, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  menuLabel: { color: colors.text, fontSize: 15, fontWeight: "600", flex: 1 },

  logout: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: spacing.lg, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.red + "55" },
  logoutText: { color: colors.red, fontSize: 15, fontWeight: "800" },

  version: { color: colors.textFaint, fontSize: 12, textAlign: "center", marginTop: spacing.lg },
});
