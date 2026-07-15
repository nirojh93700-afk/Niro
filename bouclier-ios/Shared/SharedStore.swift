import Foundation

/// Entrée d'historique (appel ou SMS analysé).
struct LogEntry: Codable, Identifiable, Equatable {
    enum Kind: String, Codable { case call, sms }
    var id: UUID = UUID()
    var kind: Kind
    var number: String            // expéditeur / appelant
    var preview: String           // aperçu (corps du SMS tronqué, ou vide pour un appel)
    var level: RiskLevel
    var label: String
    var reasons: [String]
    var date: Date = Date()
}

/// Stockage partagé entre l'app et les extensions (Call Directory + Message Filter),
/// via un App Group. Les extensions n'ont pas d'UI : elles LISENT listes + réglages ici,
/// et l'app y ÉCRIT. L'historique SMS est écrit par l'extension de filtrage.
final class SharedStore {

    /// ⚠️ Doit correspondre à l'App Group configuré sur les 3 cibles (voir project.yml / entitlements).
    static let appGroup = "group.fr.niro.bouclier"

    static let shared = SharedStore()
    private let defaults: UserDefaults

    private init() {
        defaults = UserDefaults(suiteName: SharedStore.appGroup) ?? .standard
    }

    private enum Key {
        static let allowlist = "allowlist"
        static let blocklist = "blocklist"
        static let log = "log"
        static let blockDemarchage = "blockDemarchage"   // bloquer aussi le démarchage ARCEP
        static let filterEnabled = "filterEnabled"
    }

    // MARK: Listes

    var allowlist: [String] {
        get { defaults.stringArray(forKey: Key.allowlist) ?? [] }
        set { defaults.set(newValue, forKey: Key.allowlist) }
    }

    /// Numéros signalés frauduleux par l'utilisateur (bloqués par le Call Directory).
    var blocklist: [String] {
        get { defaults.stringArray(forKey: Key.blocklist) ?? [] }
        set { defaults.set(newValue, forKey: Key.blocklist) }
    }

    func addToBlocklist(_ number: String) {
        let n = FraudEngine.normalizeFR(number)
        guard !n.isEmpty else { return }
        var list = blocklist
        if !list.map(FraudEngine.normalizeFR).contains(n) { list.append(n); blocklist = list }
    }

    func addToAllowlist(_ number: String) {
        let n = FraudEngine.normalizeFR(number)
        guard !n.isEmpty else { return }
        var list = allowlist
        if !list.map(FraudEngine.normalizeFR).contains(n) { list.append(n); allowlist = list }
    }

    func removeFromBlocklist(_ number: String) {
        let n = FraudEngine.normalizeFR(number)
        blocklist = blocklist.filter { FraudEngine.normalizeFR($0) != n }
    }

    func removeFromAllowlist(_ number: String) {
        let n = FraudEngine.normalizeFR(number)
        allowlist = allowlist.filter { FraudEngine.normalizeFR($0) != n }
    }

    // MARK: Réglages

    /// Si vrai, le Call Directory bloque aussi les plages de démarchage ARCEP connues.
    var blockDemarchage: Bool {
        get { defaults.object(forKey: Key.blockDemarchage) as? Bool ?? true }
        set { defaults.set(newValue, forKey: Key.blockDemarchage) }
    }

    /// Si vrai, l'extension de filtrage SMS met les messages frauduleux en « Indésirable ».
    var filterEnabled: Bool {
        get { defaults.object(forKey: Key.filterEnabled) as? Bool ?? true }
        set { defaults.set(newValue, forKey: Key.filterEnabled) }
    }

    // MARK: Historique

    var log: [LogEntry] {
        get {
            guard let data = defaults.data(forKey: Key.log),
                  let items = try? JSONDecoder().decode([LogEntry].self, from: data) else { return [] }
            return items
        }
        set {
            let capped = Array(newValue.suffix(500))
            if let data = try? JSONEncoder().encode(capped) { defaults.set(data, forKey: Key.log) }
        }
    }

    func appendLog(_ entry: LogEntry) {
        var items = log
        items.append(entry)
        log = items
    }

    func clearLog() { log = [] }
}
