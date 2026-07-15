import SwiftUI
import UIKit

struct SettingsView: View {
    @EnvironmentObject var state: AppState

    var body: some View {
        NavigationStack {
            Form {
                Section("Protection") {
                    Toggle(isOn: Binding(get: { state.filterEnabled },
                                         set: { state.setFilterEnabled($0) })) {
                        Label("Filtrage des SMS", systemImage: "message.badge.filled.fill")
                    }
                    Toggle(isOn: Binding(get: { state.blockDemarchage },
                                         set: { state.setBlockDemarchage($0) })) {
                        Label("Bloquer le démarchage ARCEP", systemImage: "phone.down.fill")
                    }
                }

                Section("Activer dans iOS") {
                    Link(destination: URL(string: UIApplication.openSettingsURLString)!) {
                        Label("Ouvrir les réglages de Bouclier", systemImage: "gearshape")
                    }
                    Text("Téléphone → Blocage d'appels et identification → Bouclier\nMessages → Filtrage indésirables → Bouclier")
                        .font(.caption).foregroundStyle(.secondary)
                }

                Section("Annuaire d'appels") {
                    Button {
                        state.reloadCallDirectory()
                    } label: {
                        Label("Recharger la liste de blocage", systemImage: "arrow.clockwise")
                    }
                    Text("À faire si les numéros bloqués ne sont pas pris en compte.")
                        .font(.caption).foregroundStyle(.secondary)
                }

                Section("Données") {
                    Button(role: .destructive) { state.clearHistory() } label: {
                        Label("Effacer l'historique", systemImage: "trash")
                    }
                }

                Section {
                    NavigationLink { ArcepInfoView() } label: {
                        Label("Comment ça marche", systemImage: "info.circle")
                    }
                } footer: {
                    Text("Bouclier — protection anti-arnaque. Toutes les analyses sont faites localement sur votre iPhone ; aucun message n'est envoyé sur Internet.")
                }
            }
            .navigationTitle("Réglages")
        }
    }
}
