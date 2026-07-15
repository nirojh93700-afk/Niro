import Foundation
import IdentityLookup

/// Extension de filtrage des SMS/MMS.
/// iOS transmet ici, EN TEMPS RÉEL, les messages d'expéditeurs INCONNUS (hors contacts).
/// On analyse expéditeur + contenu avec le moteur partagé et on classe le message :
///  - .junk        → onglet « Indésirables » de Messages
///  - .promotion   → onglet « Promotions »
///  - .transaction → onglet « Transactions » (codes, confirmations)
///  - .none/.allow → boîte de réception normale
class MessageFilterExtension: ILMessageFilterExtension, ILMessageFilterQueryHandling {

    func handle(_ queryRequest: ILMessageFilterQueryRequest,
                context: ILMessageFilterExtensionContext,
                completion: @escaping (ILMessageFilterQueryResponse) -> Void) {

        let response = ILMessageFilterQueryResponse()
        let store = SharedStore.shared

        guard store.filterEnabled else {
            response.action = .allow
            completion(response)
            return
        }

        let sender = queryRequest.sender ?? ""
        let body = queryRequest.messageBody ?? ""

        let verdict = FraudEngine.analyzeSMS(
            sender: sender, body: body,
            allowlist: store.allowlist, blocklist: store.blocklist
        )

        switch verdict.level {
        case .fraud:
            response.action = .junk
        case .suspect:
            response.action = .promotion
        case .info, .safe:
            // Un code 2FA / message transactionnel reste en réception normale.
            response.action = .allow
        }

        // Journalise pour l'historique de l'app (visible côté utilisateur).
        store.appendLog(LogEntry(
            kind: .sms,
            number: sender,
            preview: String(body.prefix(140)),
            level: verdict.level,
            label: verdict.label,
            reasons: verdict.reasons
        ))

        completion(response)
    }
}
