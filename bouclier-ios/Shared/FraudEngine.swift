import Foundation

/// Niveau de risque attribué à un numéro ou un SMS.
enum RiskLevel: String, Codable {
    case safe = "SAFE"       // Aucun indicateur
    case info = "INFO"       // À titre informatif (ex. international)
    case suspect = "SUSPECT" // Démarchage / signaux modérés
    case fraud = "FRAUD"     // Fraude très probable
}

/// Verdict d'analyse d'un numéro entrant.
struct NumberVerdict {
    let level: RiskLevel
    let label: String
    let number: String
    let reasons: [String]
}

/// Verdict d'analyse d'un SMS.
struct SMSVerdict {
    let level: RiskLevel
    let label: String
    let score: Int
    let reasons: [String]
}

/// Moteur d'analyse anti-fraude — logique pure, sans dépendance iOS (donc testable).
/// Miroir exact de `reference/engine.mjs` (validé par la suite Node).
enum FraudEngine {

    // MARK: Utilitaires

    /// Replie une chaîne : minuscules + suppression des accents (comparaison robuste).
    static func fold(_ s: String) -> String {
        s.folding(options: .diacriticInsensitive, locale: Locale(identifier: "fr_FR")).lowercased()
    }

    /// Normalise un numéro français en format national `0XXXXXXXXX` (best effort).
    static func normalizeFR(_ raw: String) -> String {
        var s = raw.filter { !" .-()".contains($0) }
        if s.hasPrefix("+33") { s = "0" + s.dropFirst(3) }
        else if s.hasPrefix("0033") { s = "0" + s.dropFirst(4) }
        else if s.hasPrefix("33") && s.count == 11 { s = "0" + s.dropFirst(2) }
        return s
    }

    private static func isAllDigits(_ s: String) -> Bool {
        !s.isEmpty && s.allSatisfy { $0.isNumber }
    }

    // MARK: Analyse d'un numéro

    static func classifyNumber(_ raw: String,
                               allowlist: [String] = [],
                               blocklist: [String] = []) -> NumberVerdict {
        let n = normalizeFR(raw)
        func inList(_ list: [String]) -> Bool { list.map(normalizeFR).contains(n) }

        if n.isEmpty {
            return NumberVerdict(level: .suspect, label: "Numéro masqué", number: n,
                                 reasons: ["Appelant masqué ou inconnu"])
        }
        if inList(allowlist) {
            return NumberVerdict(level: .safe, label: "Autorisé", number: n,
                                 reasons: ["Numéro dans votre liste blanche"])
        }
        if inList(blocklist) {
            return NumberVerdict(level: .fraud, label: "Signalé frauduleux", number: n,
                                 reasons: ["Numéro que vous avez signalé"])
        }

        let prefix4 = String(n.prefix(4))
        if ArcepData.telemarketingPrefixes.contains(prefix4) {
            return NumberVerdict(level: .suspect, label: "Démarchage (ARCEP)", number: n,
                                 reasons: ["Plage \(prefix4) réservée au démarchage téléphonique (ARCEP)"])
        }
        if n.hasPrefix("089") {
            return NumberVerdict(level: .suspect, label: "Numéro surtaxé", number: n,
                                 reasons: ["Numéro surtaxé (08 9x)"])
        }
        if raw.trimmingCharacters(in: .whitespaces).hasPrefix("+") || n.hasPrefix("00") {
            if !n.hasPrefix("0033") && !raw.hasPrefix("+33") {
                return NumberVerdict(level: .info, label: "International", number: n,
                                     reasons: ["Appel international"])
            }
        }
        if n.hasPrefix("0") && isAllDigits(n) && n.count != 10 {
            return NumberVerdict(level: .suspect, label: "Numéro irrégulier", number: n,
                                 reasons: ["Longueur inhabituelle (\(n.count) chiffres)"])
        }
        return NumberVerdict(level: .safe, label: "Aucun signalement", number: n,
                             reasons: ["Aucun indicateur de fraude"])
    }

    // MARK: Analyse d'un SMS

    private static func extractHosts(_ text: String) -> [String] {
        let pattern = "(?:https?://)?((?:[a-z0-9-]+\\.)+[a-z]{2,})(?:/[^\\s]*)?"
        guard let re = try? NSRegularExpression(pattern: pattern, options: [.caseInsensitive]) else { return [] }
        let range = NSRange(text.startIndex..., in: text)
        var hosts: [String] = []
        re.enumerateMatches(in: text, range: range) { match, _, _ in
            guard let m = match, m.numberOfRanges > 1,
                  let r = Range(m.range(at: 1), in: text) else { return }
            hosts.append(text[r].lowercased())
        }
        return hosts
    }

    private static func hostEndsWithLegit(_ host: String) -> Bool {
        ArcepData.legitHosts.contains { host == $0 || host.hasSuffix("." + $0) }
    }

    /// Détecte un code à usage unique (OTP/2FA) → message transactionnel légitime.
    private static func looksLikeOTP(_ folded: String) -> Bool {
        let hasCodeWord = folded.range(of: "\\b(code|verification|confirmation|otp|securite)\\b",
                                       options: .regularExpression) != nil
        let hasShortCode = folded.range(of: "\\b\\d{4,8}\\b", options: .regularExpression) != nil
        let hasURL = !extractHosts(folded).isEmpty
        return hasCodeWord && hasShortCode && !hasURL
    }

    static func analyzeSMS(sender: String, body: String,
                           allowlist: [String] = [],
                           blocklist: [String] = []) -> SMSVerdict {
        let folded = fold(body)
        var reasons: [String] = []
        var score = 0

        if looksLikeOTP(folded) {
            return SMSVerdict(level: .safe, label: "Code de vérification", score: 0,
                              reasons: ["Ressemble à un code à usage unique (2FA)"])
        }

        // Expéditeur.
        let senderVerdict = classifyNumber(sender, allowlist: allowlist, blocklist: blocklist)
        if senderVerdict.level == .fraud {
            score += 6; reasons.append("Expéditeur déjà signalé")
        } else if senderVerdict.label.hasPrefix("Démarchage") {
            score += 2; reasons.append("Expéditeur sur une plage de démarchage ARCEP")
        } else if senderVerdict.level == .safe && senderVerdict.label == "Autorisé" {
            score -= 4; reasons.append("Expéditeur autorisé")
        }

        // Groupes thématiques.
        var themeHits = 0
        for group in ArcepData.keywordGroups {
            if group.words.contains(where: { folded.contains(fold($0)) }) {
                themeHits += 1
                reasons.append("Thème sensible : \(group.theme)")
            }
        }
        if themeHits > 0 { score += 2 + (themeHits - 1) }

        // Urgence / incitation.
        if ArcepData.urgencyWords.contains(where: { folded.contains(fold($0)) }) {
            score += 2; reasons.append("Ton d'urgence")
        }
        if ArcepData.callToActionWords.contains(where: { folded.contains(fold($0)) }) {
            score += 2; reasons.append("Incitation à cliquer / agir")
        }

        // Analyse d'URL.
        let hosts = extractHosts(body)
        if !hosts.isEmpty {
            let anyLegit = hosts.contains(where: hostEndsWithLegit)
            let anyShortener = hosts.contains(where: { ArcepData.urlShorteners.contains($0) })
            let anySuspTLD = hosts.contains(where: { host in
                ArcepData.suspiciousTLDs.contains(where: { host.hasSuffix($0) })
            })

            score += 1; reasons.append("Contient un lien")
            if anyShortener { score += 3; reasons.append("Lien raccourci (masque la destination)") }
            if anySuspTLD { score += 3; reasons.append("Extension de domaine à risque") }

            if let brand = ArcepData.impersonatedBrands.first(where: { folded.contains(fold($0)) }), !anyLegit {
                score += 4
                reasons.append("Usurpation probable : « \(brand) » avec un lien non officiel")
            }
            if anyLegit && !anyShortener && !anySuspTLD {
                score -= 2; reasons.append("Lien vers un domaine officiel")
            }
        }

        if score < 0 { score = 0 }

        let level: RiskLevel
        let label: String
        if score >= 6 { level = .fraud; label = "Frauduleux" }
        else if score >= 3 { level = .suspect; label = "Suspect" }
        else { level = .safe; label = "Sûr" }

        return SMSVerdict(level: level, label: label, score: score, reasons: reasons)
    }
}
