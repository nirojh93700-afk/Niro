import { View, Text, StyleSheet } from "react-native";
import { colors } from "../theme";

// Pastille colorée avec les initiales de l'équipe (placeholder de logo).
export default function TeamBadge({ team, size = 44 }) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 4, backgroundColor: team.color || colors.surfaceHi },
      ]}
    >
      <Text style={[styles.txt, { fontSize: size * 0.34 }]}>{team.short}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
  },
  txt: {
    color: "#fff",
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
