import SwiftUI

/// Gestion des listes : numéros bloqués (signalés) et numéros de confiance (liste blanche).
struct NumbersView: View {
    @EnvironmentObject var state: AppState
    @State private var newNumber = ""
    @State private var target: Target = .block

    enum Target: String, CaseIterable, Identifiable {
        case block = "Bloquer", trust = "Autoriser"
        var id: String { rawValue }
    }

    var body: some View {
        NavigationStack {
            List {
                Section("Ajouter un numéro") {
                    TextField("06 12 34 56 78", text: $newNumber).keyboardType(.phonePad)
                    Picker("Action", selection: $target) {
                        ForEach(Target.allCases) { Text($0.rawValue).tag($0) }
                    }.pickerStyle(.segmented)
                    Button("Ajouter") {
                        let n = newNumber.trimmingCharacters(in: .whitespaces)
                        guard !n.isEmpty else { return }
                        target == .block ? state.report(n) : state.trust(n)
                        newNumber = ""
                    }.disabled(newNumber.trimmingCharacters(in: .whitespaces).isEmpty)
                }

                Section("Numéros bloqués (\(state.blocklist.count))") {
                    if state.blocklist.isEmpty {
                        Text("Aucun numéro bloqué.").foregroundStyle(.secondary).font(.subheadline)
                    }
                    ForEach(state.blocklist, id: \.self) { num in
                        HStack {
                            Image(systemName: "xmark.shield.fill").foregroundColor(BrandColor.fraud)
                            Text(num)
                        }
                    }
                    .onDelete { idx in idx.map { state.blocklist[$0] }.forEach(state.unblock) }
                }

                Section("Numéros de confiance (\(state.allowlist.count))") {
                    if state.allowlist.isEmpty {
                        Text("Aucun numéro de confiance.").foregroundStyle(.secondary).font(.subheadline)
                    }
                    ForEach(state.allowlist, id: \.self) { num in
                        HStack {
                            Image(systemName: "checkmark.shield.fill").foregroundColor(BrandColor.safe)
                            Text(num)
                        }
                    }
                    .onDelete { idx in idx.map { state.allowlist[$0] }.forEach(state.untrust) }
                }

                Section {
                    Text("Les numéros bloqués sont transmis à iOS pour rejeter les appels. Balayez vers la gauche pour retirer un numéro.")
                        .font(.caption).foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Numéros")
        }
    }
}
