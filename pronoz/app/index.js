import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useRouter, Redirect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { colors, radius, spacing, glow } from "../src/theme";
import { useStore } from "../src/lib/store";

// Écran d'accueil / connexion — design original sombre & néon.
export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, ready, signIn } = useStore();

  // Déjà connecté → direct à l'app.
  if (ready && user) return <Redirect href="/(tabs)/matches" />;

  function start(provider) {
    Haptics.selectionAsync().catch(() => {});
    signIn({ name: "Toi", provider });
    router.replace("/(tabs)/matches");
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }]}>
      <LinearGradient
        colors={["#0d1326", colors.bg, colors.bgDeep]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Halos néon en fond */}
      <View style={[styles.halo, styles.haloGreen]} />
      <View style={[styles.halo, styles.haloViolet]} />

      {/* Marque */}
      <View style={styles.brandRow}>
        <View style={styles.logoBox}>
          <Ionicons name="flash" size={20} color={colors.bgDeep} />
        </View>
        <Text style={styles.brand}>
          Prono<Text style={{ color: colors.neon }}>z</Text>
        </Text>
      </View>

      {/* Bloc central */}
      <View style={styles.center}>
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>Saison 2026 ouverte</Text>
        </View>

        <Text style={styles.h1}>
          Pronostique.{"\n"}
          <Text style={{ color: colors.neon }}>Domine</Text> tes potes.
        </Text>
        <Text style={styles.sub}>
          Prédis les scores des matchs, marque des points et grimpe au sommet du classement de ta team.
        </Text>

        {/* Mini stats déco */}
        <View style={styles.stats}>
          <Stat value="3 pts" label="Score exact" tone={colors.neon} />
          <Stat value="1 pt" label="Bon résultat" tone={colors.violet} />
          <Stat value="∞" label="Bracelet d'amis" tone={colors.cyan} />
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
          onPress={() => start("guest")}
        >
          <Text style={styles.ctaText}>Commencer à jouer</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.bgDeep} />
        </Pressable>

        <Text style={styles.or}>ou continuer avec</Text>

        <View style={styles.socials}>
          <Pressable style={[styles.social]} onPress={() => start("apple")}>
            <Ionicons name="logo-apple" size={20} color={colors.text} />
            <Text style={styles.socialText}>Apple</Text>
          </Pressable>
          <Pressable style={[styles.social]} onPress={() => start("facebook")}>
            <FontAwesome name="facebook" size={18} color="#4f8cff" />
            <Text style={styles.socialText}>Facebook</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function Stat({ value, label, tone }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color: tone }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg, backgroundColor: colors.bg, overflow: "hidden" },

  halo: { position: "absolute", width: 320, height: 320, borderRadius: 160, opacity: 0.25 },
  haloGreen: { backgroundColor: colors.neon, top: -120, right: -100 },
  haloViolet: { backgroundColor: colors.violet, bottom: 40, left: -130 },

  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: spacing.sm },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.neon,
    alignItems: "center",
    justifyContent: "center",
    ...glow(colors.neon, 0.8, 14),
  },
  brand: { color: colors.text, fontSize: 22, fontWeight: "900", letterSpacing: 0.5 },

  center: { flex: 1, justifyContent: "center" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: "rgba(57,255,158,0.08)",
    borderWidth: 1,
    borderColor: "rgba(57,255,158,0.3)",
    marginBottom: spacing.lg,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.neon, ...glow(colors.neon, 1, 6) },
  badgeText: { color: colors.neon, fontSize: 13, fontWeight: "700" },

  h1: { color: colors.text, fontSize: 38, fontWeight: "900", lineHeight: 44, letterSpacing: -0.5 },
  sub: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: spacing.md, paddingRight: spacing.md },

  stats: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xl },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  statValue: { fontSize: 18, fontWeight: "900" },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 4 },

  actions: { gap: spacing.md },
  cta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.neon,
    borderRadius: radius.pill,
    paddingVertical: 17,
    ...glow(colors.neon, 0.55, 18),
  },
  ctaPressed: { backgroundColor: colors.neonDim, transform: [{ scale: 0.99 }] },
  ctaText: { color: colors.bgDeep, fontSize: 16, fontWeight: "900" },

  or: { color: colors.textFaint, fontSize: 12, textAlign: "center", textTransform: "uppercase", letterSpacing: 1 },

  socials: { flexDirection: "row", gap: spacing.sm },
  social: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
  },
  socialText: { color: colors.text, fontSize: 14, fontWeight: "700" },
});
