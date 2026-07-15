import SwiftUI
import CallKit

/// État observable de l'app, adossé au stockage partagé (App Group).
@MainActor
final class AppState: ObservableObject {
    private let store = SharedStore.shared

    @Published var log: [LogEntry] = []
    @Published var allowlist: [String] = []
    @Published var blocklist: [String] = []
    @Published var blockDemarchage: Bool = true
    @Published var filterEnabled: Bool = true

    /// Identifiant de l'extension Call Directory (doit matcher le bundle id dans project.yml).
    static let callDirectoryIdentifier = "fr.niro.bouclier.CallDirectory"

    init() { reload() }

    func reload() {
        log = store.log.sorted { $0.date > $1.date }
        allowlist = store.allowlist
        blocklist = store.blocklist
        blockDemarchage = store.blockDemarchage
        filterEnabled = store.filterEnabled
    }

    // MARK: Actions listes

    func report(_ number: String) {
        store.addToBlocklist(number)
        store.removeFromAllowlist(number)
        reload()
        reloadCallDirectory()
    }

    func trust(_ number: String) {
        store.addToAllowlist(number)
        store.removeFromBlocklist(number)
        reload()
        reloadCallDirectory()
    }

    func unblock(_ number: String) {
        store.removeFromBlocklist(number)
        reload()
        reloadCallDirectory()
    }

    func untrust(_ number: String) {
        store.removeFromAllowlist(number)
        reload()
        reloadCallDirectory()
    }

    func setBlockDemarchage(_ on: Bool) {
        store.blockDemarchage = on
        blockDemarchage = on
        reloadCallDirectory()
    }

    func setFilterEnabled(_ on: Bool) {
        store.filterEnabled = on
        filterEnabled = on
    }

    func clearHistory() {
        store.clearLog()
        reload()
    }

    /// Analyse manuelle (bouton « Tester ») + journalisation.
    func testSMS(sender: String, body: String) -> SMSVerdict {
        let verdict = FraudEngine.analyzeSMS(sender: sender, body: body,
                                             allowlist: allowlist, blocklist: blocklist)
        store.appendLog(LogEntry(kind: .sms, number: sender.isEmpty ? "Inconnu" : sender,
                                 preview: String(body.prefix(140)),
                                 level: verdict.level, label: verdict.label, reasons: verdict.reasons))
        reload()
        return verdict
    }

    // MARK: Rechargement de l'annuaire d'appels

    /// Demande à iOS de recharger l'extension Call Directory avec les listes à jour.
    func reloadCallDirectory() {
        CXCallDirectoryManager.sharedInstance
            .reloadExtension(withIdentifier: Self.callDirectoryIdentifier) { _ in }
    }

    // MARK: Statistiques (tableau de bord)

    var blockedCount: Int { log.filter { $0.level == .fraud }.count }
    var suspectCount: Int { log.filter { $0.level == .suspect }.count }
    var smsAnalyzed: Int { log.filter { $0.kind == .sms }.count }
}
