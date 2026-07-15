import SwiftUI

struct HistoryView: View {
    @EnvironmentObject var state: AppState
    @State private var filter: Filter = .all

    enum Filter: String, CaseIterable, Identifiable {
        case all = "Tout", fraud = "Frauduleux", suspect = "Suspects"
        var id: String { rawValue }
    }

    private var filtered: [LogEntry] {
        switch filter {
        case .all: return state.log
        case .fraud: return state.log.filter { $0.level == .fraud }
        case .suspect: return state.log.filter { $0.level == .suspect }
        }
    }

    var body: some View {
        NavigationStack {
            Group {
                if state.log.isEmpty {
                    ContentUnavailableView("Aucune activité",
                                           systemImage: "clock.arrow.circlepath",
                                           description: Text("Les SMS analysés et appels détectés apparaîtront ici."))
                } else {
                    List {
                        ForEach(filtered) { entry in
                            NavigationLink { LogDetailView(entry: entry) } label: { LogRow(entry: entry) }
                        }
                    }
                }
            }
            .navigationTitle("Historique")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Picker("Filtre", selection: $filter) {
                        ForEach(Filter.allCases) { Text($0.rawValue).tag($0) }
                    }.pickerStyle(.menu)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    if !state.log.isEmpty {
                        Button("Effacer", role: .destructive) { state.clearHistory() }
                    }
                }
            }
        }
    }
}

struct LogRow: View {
    let entry: LogEntry
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: entry.kind == .sms ? "message.fill" : "phone.fill")
                .foregroundColor(entry.level.color)
                .frame(width: 24)
            VStack(alignment: .leading, spacing: 3) {
                Text(entry.number).font(.subheadline).fontWeight(.semibold)
                if !entry.preview.isEmpty {
                    Text(entry.preview).font(.caption).foregroundStyle(.secondary).lineLimit(1)
                }
            }
            Spacer()
            RiskBadge(level: entry.level, label: entry.label)
        }
        .padding(.vertical, 2)
    }
}

struct LogDetailView: View {
    let entry: LogEntry
    @EnvironmentObject var state: AppState

    var body: some View {
        List {
            Section {
                HStack {
                    Image(systemName: entry.level.icon).font(.title).foregroundColor(entry.level.color)
                    VStack(alignment: .leading) {
                        Text(entry.label).font(.headline)
                        Text(entry.number).font(.subheadline).foregroundStyle(.secondary)
                    }
                }
            }
            if !entry.preview.isEmpty {
                Section("Contenu") { Text(entry.preview) }
            }
            Section("Pourquoi ce verdict") {
                ForEach(entry.reasons, id: \.self) { reason in
                    Label(reason, systemImage: "circle.fill")
                        .labelStyle(BulletLabelStyle())
                }
            }
            Section {
                Button {
                    state.report(entry.number)
                } label: {
                    Label("Signaler et bloquer ce numéro", systemImage: "xmark.shield")
                }.foregroundColor(BrandColor.fraud)
                Button {
                    state.trust(entry.number)
                } label: {
                    Label("Marquer comme sûr (liste blanche)", systemImage: "checkmark.shield")
                }.foregroundColor(BrandColor.safe)
            }
        }
        .navigationTitle("Détail")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct BulletLabelStyle: LabelStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 8) {
            Image(systemName: "circle.fill").font(.system(size: 5)).foregroundStyle(.secondary)
            configuration.title
        }
    }
}
