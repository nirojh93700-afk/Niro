import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var state: AppState

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 18) {
                    header

                    HStack(spacing: 12) {
                        StatCard(value: state.blockedCount, title: "Bloqués", color: BrandColor.fraud, icon: "xmark.shield.fill")
                        StatCard(value: state.suspectCount, title: "Suspects", color: BrandColor.suspect, icon: "exclamationmark.triangle.fill")
                        StatCard(value: state.smsAnalyzed, title: "SMS analysés", color: BrandColor.accent, icon: "text.magnifyingglass")
                    }

                    protectionStatus

                    NavigationLink {
                        ArcepInfoView()
                    } label: {
                        InfoRow(icon: "building.columns.fill",
                                title: "Comment ça marche",
                                subtitle: "Numéros ARCEP, analyse des SMS, et limites d'iOS")
                    }

                    recent
                }
                .padding()
            }
            .navigationTitle("Bouclier")
            .refreshable { state.reload() }
        }
    }

    private var header: some View {
        VStack(spacing: 8) {
            Image(systemName: "shield.lefthalf.filled")
                .font(.system(size: 48))
                .foregroundStyle(BrandColor.accent)
            Text("Protégé contre les arnaques")
                .font(.headline)
            Text("Appels de démarchage ARCEP et SMS frauduleux détectés automatiquement.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
    }

    private var protectionStatus: some View {
        VStack(spacing: 10) {
            StatusLine(on: state.filterEnabled,
                       onText: "Filtrage SMS actif",
                       offText: "Filtrage SMS désactivé")
            StatusLine(on: state.blockDemarchage,
                       onText: "Blocage démarchage ARCEP actif",
                       offText: "Blocage démarchage désactivé")
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }

    private var recent: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Activité récente").font(.headline)
            if state.log.isEmpty {
                Text("Aucune activité pour l'instant.")
                    .font(.subheadline).foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.vertical, 8)
            } else {
                ForEach(state.log.prefix(5)) { entry in
                    LogRow(entry: entry)
                }
            }
        }
    }
}

struct StatCard: View {
    let value: Int; let title: String; let color: Color; let icon: String
    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon).foregroundColor(color)
            Text("\(value)").font(.title2).bold().monospacedDigit()
            Text(title).font(.caption).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 14)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}

struct StatusLine: View {
    let on: Bool; let onText: String; let offText: String
    var body: some View {
        HStack {
            Image(systemName: on ? "checkmark.circle.fill" : "pause.circle.fill")
                .foregroundColor(on ? BrandColor.safe : .secondary)
            Text(on ? onText : offText).font(.subheadline)
            Spacer()
        }
    }
}

struct InfoRow: View {
    let icon: String; let title: String; let subtitle: String
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon).font(.title3).foregroundColor(BrandColor.accent).frame(width: 28)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline).fontWeight(.semibold).foregroundColor(.primary)
                Text(subtitle).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "chevron.right").font(.caption).foregroundStyle(.tertiary)
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 14))
    }
}
