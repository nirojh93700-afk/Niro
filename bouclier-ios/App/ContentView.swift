import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            DashboardView()
                .tabItem { Label("Accueil", systemImage: "shield.lefthalf.filled") }
            HistoryView()
                .tabItem { Label("Historique", systemImage: "clock.arrow.circlepath") }
            SMSAnalyzerView()
                .tabItem { Label("Analyser", systemImage: "text.magnifyingglass") }
            NumbersView()
                .tabItem { Label("Numéros", systemImage: "person.crop.circle.badge.xmark") }
            SettingsView()
                .tabItem { Label("Réglages", systemImage: "gearshape") }
        }
    }
}

/// Bandeau de niveau réutilisable.
struct RiskBadge: View {
    let level: RiskLevel
    let label: String
    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: level.icon)
            Text(label).fontWeight(.semibold)
        }
        .font(.footnote)
        .padding(.horizontal, 10).padding(.vertical, 5)
        .background(level.color.opacity(0.15))
        .foregroundColor(level.color)
        .clipShape(Capsule())
    }
}
