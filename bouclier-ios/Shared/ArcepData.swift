import Foundation

/// Données de référence pour la détection (ARCEP + patterns de smishing français).
/// Miroir exact de `reference/engine.mjs`. Toute modification doit être répercutée dans les deux.
enum ArcepData {

    /// Préfixes réservés au démarchage téléphonique par l'ARCEP (obligatoires depuis 2023).
    /// Un appel/SMS commercial non sollicité utilisant ces plages relève du démarchage encadré.
    static let telemarketingPrefixes: Set<String> = [
        "0162", "0163", "0270", "0271", "0377", "0378",
        "0424", "0425", "0568", "0569", "0948", "0949",
    ]

    /// Domaines officiels légitimes : une URL vers ces hôtes n'est pas du phishing.
    static let legitHosts: [String] = [
        "gouv.fr", "ameli.fr", "laposte.fr", "colissimo.fr", "chronopost.fr",
        "impots.gouv.fr", "service-public.fr", "moncompteformation.gouv.fr",
        "antai.gouv.fr", "mondialrelay.fr", "edf.fr", "sfr.fr", "orange.fr",
        "free.fr", "bouyguestelecom.fr",
    ]

    /// Raccourcisseurs d'URL (fortement corrélés au smishing).
    static let urlShorteners: Set<String> = [
        "bit.ly", "tinyurl.com", "t.co", "cutt.ly", "is.gd", "ow.ly",
        "rebrand.ly", "urlz.fr", "u.to", "rb.gy", "shorturl.at", "lc.cx",
    ]

    /// TLD à risque très fréquents dans les campagnes frauduleuses.
    static let suspiciousTLDs: [String] = [
        ".xyz", ".top", ".icu", ".buzz", ".click", ".live", ".shop",
        ".online", ".info", ".cn", ".ru", ".tk", ".ml", ".ga", ".cf", ".rest", ".sbs",
    ]

    /// Marques usurpées : marque citée + URL non officielle = usurpation probable.
    static let impersonatedBrands: [String] = [
        "ameli", "impots", "laposte", "colissimo", "chronopost", "mondial relay",
        "cpf", "compte formation", "carte vitale", "antai", "edf", "engie",
        "netflix", "amazon", "paypal", "boursorama", "sfr", "orange", "free mobile",
    ]

    /// Groupes thématiques de mots-clés (repérés sur texte replié, sans accents).
    static let keywordGroups: [(theme: String, words: [String])] = [
        ("colis", [
            "colis", "livraison", "chronopost", "colissimo", "point relais", "mondial relay",
            "frais de douane", "douane", "reexpedition", "redevance", "suivi de votre colis",
            "colis est en attente", "adresse incomplete", "frais de livraison",
        ]),
        ("banque", [
            "compte a ete bloque", "compte bloque", "carte bancaire", "operation suspecte",
            "activite suspecte", "code confidentiel", "identifiant bancaire", "virement",
            "votre rib", "coordonnees bancaires", "plafond", "prelevement non autorise",
        ]),
        ("cpf", ["cpf", "compte formation", "compte personnel de formation", "mon compte formation"]),
        ("sante", ["carte vitale", "ameli", "assurance maladie", "cpam", "nouvelle carte vitale"]),
        ("impots", ["impots", "tresor public", "remboursement fiscal", "dgfip", "remboursement d impot"]),
        ("amende", ["amende", "antai", "stationnement", "infraction", "forfait post-stationnement", "crit air", "critair"]),
        ("gain", ["gagne", "gagnant", "tirage au sort", "felicitations", "iphone gratuit", "cadeau", "recompense"]),
    ]

    static let urgencyWords: [String] = [
        "urgent", "immediatement", "sous 24h", "sous 48h", "dernier avertissement",
        "derniere relance", "expire", "suspendu", "des aujourd hui", "delai depasse",
    ]

    static let callToActionWords: [String] = [
        "cliquez", "cliquer ici", "mettre a jour vos informations", "confirmez", "validez",
        "regularisez", "reactivez", "renseignez", "verifiez vos informations", "veuillez cliquer",
    ]
}
