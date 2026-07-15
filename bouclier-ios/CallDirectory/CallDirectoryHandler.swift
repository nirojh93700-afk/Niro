import Foundation
import CallKit

/// Extension « Annuaire d'appels ».
/// iOS ne permet PAS d'analyser un appel en direct : on fournit à l'avance une LISTE
/// de numéros à bloquer et/ou à étiqueter. Cette liste vient de l'App Group (SharedStore) :
/// numéros que l'utilisateur a signalés + numéros de démarchage ARCEP déjà reçus.
/// L'app recharge cette extension (`reloadExtension`) à chaque changement de liste.
class CallDirectoryHandler: CXCallDirectoryProvider {

    override func beginRequest(with context: CXCallDirectoryExtensionContext) {
        context.delegate = self

        // On fournit toujours l'ensemble complet (plus simple et robuste qu'un mode incrémental).
        if context.isIncremental {
            context.removeAllBlockingEntries()
            context.removeAllIdentificationEntries()
        }

        addBlockingAndIdentification(to: context)
        context.completeRequest()
    }

    /// Convertit un numéro national FR `0XXXXXXXXX` en E.164 numérique `33XXXXXXXXX`.
    private func e164(_ national: String) -> CXCallDirectoryPhoneNumber? {
        let n = FraudEngine.normalizeFR(national)
        guard n.hasPrefix("0"), n.count == 10 else { return nil }
        return CXCallDirectoryPhoneNumber("33" + n.dropFirst())
    }

    private func addBlockingAndIdentification(to context: CXCallDirectoryExtensionContext) {
        let store = SharedStore.shared

        // Numéros signalés → bloqués + étiquetés.
        var blocking: [(CXCallDirectoryPhoneNumber, String)] = []
        for raw in store.blocklist {
            guard let num = e164(raw) else { continue }
            blocking.append((num, "Signalé frauduleux · Bouclier"))
        }

        // Démarchage ARCEP déjà reçu (dans l'historique) → bloqué si l'option est active.
        if store.blockDemarchage {
            let demarchage = store.log
                .map { FraudEngine.normalizeFR($0.number) }
                .filter { ArcepData.telemarketingPrefixes.contains(String($0.prefix(4))) }
            for raw in Set(demarchage) {
                guard let num = e164(raw) else { continue }
                blocking.append((num, "Démarchage ARCEP · Bouclier"))
            }
        }

        // CallKit exige un ordre numérique STRICTEMENT croissant, sans doublon.
        let deduped = Dictionary(blocking.map { ($0.0, $0.1) }, uniquingKeysWith: { a, _ in a })
        let sorted = deduped.keys.sorted()

        for number in sorted {
            context.addBlockingEntry(withNextSequentialPhoneNumber: number)
            context.addIdentificationEntry(withNextSequentialPhoneNumber: number,
                                           label: deduped[number] ?? "Bouclier")
        }
    }
}

extension CallDirectoryHandler: CXCallDirectoryExtensionContextDelegate {
    func requestFailed(for extensionContext: CXCallDirectoryExtensionContext,
                       withError error: Error) {
        // iOS relancera la requête plus tard.
    }
}
