import SwiftUI

/// Testeur manuel : coller un SMS (ou saisir un numéro) pour voir le verdict et le détail.
/// Utile pour vérifier un message douteux reçu, et pour montrer comment l'analyse fonctionne.
struct SMSAnalyzerView: View {
    @EnvironmentObject var state: AppState
    @State private var sender = ""
    @State private var body_ = ""
    @State private var verdict: SMSVerdict?

    var body: some View {
        NavigationStack {
            Form {
                Section("Message à vérifier") {
                    TextField("Expéditeur (numéro ou nom)", text: $sender)
                        .keyboardType(.namePhonePad)
                    TextField("Collez le texte du SMS…", text: $body_, axis: .vertical)
                        .lineLimit(4...10)
                }

                Section {
                    Button {
                        verdict = state.testSMS(sender: sender, body: body_)
                    } label: {
                        Label("Analyser", systemImage: "text.magnifyingglass")
                            .frame(maxWidth: .infinity)
                    }
                    .disabled(body_.trimmingCharacters(in: .whitespaces).isEmpty)
                    .buttonStyle(.borderedProminent)
                }

                if let v = verdict {
                    Section("Résultat") {
                        HStack {
                            Image(systemName: v.level.icon).font(.title).foregroundColor(v.level.color)
                            VStack(alignment: .leading) {
                                Text(v.label).font(.headline)
                                Text("Score de risque : \(v.score)").font(.caption).foregroundStyle(.secondary)
                            }
                            Spacer()
                            RiskBadge(level: v.level, label: v.level.frenchTitle)
                        }
                        ForEach(v.reasons, id: \.self) { r in
                            Label(r, systemImage: "circle.fill").labelStyle(BulletLabelStyle())
                        }
                    }
                    if !sender.isEmpty {
                        Section {
                            Button(role: .destructive) {
                                state.report(sender)
                            } label: { Label("Signaler ce numéro", systemImage: "xmark.shield") }
                        }
                    }
                }

                Section {
                    Button("Exemple d'arnaque") {
                        sender = "38200"
                        body_ = "Votre colis est en attente. Réglez les frais de douane : https://colissimo-suivi.xyz/pay"
                        verdict = nil
                    }.font(.footnote)
                }
            }
            .navigationTitle("Analyser un SMS")
        }
    }
}
