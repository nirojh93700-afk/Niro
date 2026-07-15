import SwiftUI

struct ArcepInfoView: View {
    var body: some View {
        List {
            Section("Numéros de démarchage (ARCEP)") {
                Text("Depuis 2023, l'ARCEP impose aux professionnels du démarchage téléphonique d'utiliser des plages de numéros dédiées. Un appel entrant sur l'une de ces plages est donc, très probablement, du démarchage commercial.")
                    .font(.subheadline)
                let prefixes = ArcepData.telemarketingPrefixes.sorted()
                LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 3), spacing: 8) {
                    ForEach(prefixes, id: \.self) { p in
                        Text(formatPrefix(p))
                            .font(.callout.monospaced())
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 8)
                            .background(BrandColor.suspect.opacity(0.12))
                            .foregroundColor(BrandColor.suspect)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    }
                }.padding(.vertical, 4)
            }

            Section("Analyse des SMS") {
                InfoBullet("Expéditeur", "Numéro signalé, plage de démarchage ARCEP, ou expéditeur de confiance.")
                InfoBullet("Thèmes sensibles", "Colis, banque, CPF, carte Vitale/Ameli, impôts, amendes, faux gains.")
                InfoBullet("Ton et incitation", "Urgence (« sous 24h ») et appels à cliquer / confirmer.")
                InfoBullet("Liens", "URL raccourcies, extensions douteuses, et usurpation de marques officielles.")
                InfoBullet("Codes 2FA", "Un vrai code de vérification est reconnu et laissé en réception normale.")
            }

            Section("Ce que permet iOS (et ses limites)") {
                InfoBullet("SMS : analyse en direct", "iOS transmet à l'app les SMS d'expéditeurs inconnus. L'analyse est faite en temps réel et les fraudes vont dans « Indésirables ».", ok: true)
                InfoBullet("Appels : liste seulement", "Apple interdit d'analyser un appel en direct. On bloque une LISTE de numéros (signalés + démarchage déjà reçu). C'est la même limite pour toutes les apps sur iPhone.", ok: false)
            }

            Section("Activation (une seule fois)") {
                Text("Réglages iOS → Téléphone → Blocage d'appels et identification → activer « Bouclier ».\n\nRéglages iOS → Messages → Filtrage inconnus & indésirables → activer « Bouclier ».")
                    .font(.subheadline)
            }

            Section {
                Text("Bouclier ne remplace pas la vigilance : ne communiquez jamais vos codes bancaires par SMS. En cas de doute, signalez au 33700 (spam SMS) ou sur signal-arnaques / cybermalveillance.gouv.fr.")
                    .font(.caption).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("Comment ça marche")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func formatPrefix(_ p: String) -> String {
        // "0162" -> "01 62"
        guard p.count == 4 else { return p }
        let i = p.index(p.startIndex, offsetBy: 2)
        return "\(p[..<i]) \(p[i...])"
    }
}

struct InfoBullet: View {
    let title: String; let text: String; let ok: Bool?
    init(_ title: String, _ text: String, ok: Bool? = nil) {
        self.title = title; self.text = text; self.ok = ok
    }
    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            Image(systemName: ok == nil ? "circle.fill" : (ok! ? "checkmark.circle.fill" : "exclamationmark.triangle.fill"))
                .font(ok == nil ? .system(size: 6) : .body)
                .foregroundColor(ok == nil ? .secondary : (ok! ? BrandColor.safe : BrandColor.suspect))
                .padding(.top, ok == nil ? 6 : 1)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.subheadline).fontWeight(.semibold)
                Text(text).font(.caption).foregroundStyle(.secondary)
            }
        }
    }
}
