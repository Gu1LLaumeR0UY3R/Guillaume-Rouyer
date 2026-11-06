// Extraits copiés du dépôt Bataille-Navale (src/game/ai.ts et src/engine/vagues.ts).
export const CODE = {
  easy: `function tirFacile(connaissance: Connaissance, hasard: Hasard): CoordCase {
    return choisirAuHasard(casesLibres(connaissance), hasard)
}`,
  medium: `function tirMoyen(connaissance: Connaissance, hasard: Hasard): CoordCase {
    // Cible : une case voisine (haut, bas, gauche, droite) d'une touche non résolue.
    const voisines = new Map<string, CoordCase>()
    for (const touche of touchesNonResolues(connaissance)) {
        const voisins: CoordCase[] = [
            { colonne: touche.colonne - 1, ligne: touche.ligne },
            { colonne: touche.colonne + 1, ligne: touche.ligne },
            { colonne: touche.colonne, ligne: touche.ligne - 1 },
            { colonne: touche.colonne, ligne: touche.ligne + 1 },
        ]
    // …
// Chasse : en damier, car tout bateau (longueur ≥ 2) occupe au moins une case de chaque couleur.
const libres = casesVisables(connaissance)
const damier = libres.filter((caseGrille) => (caseGrille.colonne + caseGrille.ligne) % 2 === 0)
return choisirAuHasard(damier.length > 0 ? damier : libres, hasard)`,
  hard: `const cases = casesBateau({ colonne, ligne, longueur, horizontal })
let impossible = false
let nbTouches = 0
for (const caseGrille of cases) {
    const etat = connaissance.etats.get(cle(caseGrille))
    if (etat === 'rate' || etat === 'coule') { impossible = true; break }
    if (etat === 'touche') nbTouches++
}
if (impossible || (exigerTouche && nbTouches === 0)) continue

positions++
// Une position qui couvre plusieurs touches est bien plus vraisemblable.
let valeur = 1 + nbTouches * 10
// Un sonar a dit ces cases vides : les positions qui les traversent sont bien moins vraisemblables.
for (const caseGrille of cases) {
    if (connaissance.vides.has(cle(caseGrille))) valeur *= 0.1
}
for (const caseGrille of cases) {
    const visable = !connaissance.etats.has(cle(caseGrille)) || connaissance.rejouables.has(cle(caseGrille))
    if (visable) poids[caseGrille.ligne]![caseGrille.colonne]! += valeur
}`,
  waves: `const ONDES: readonly Onde[] = [
    { amplitude: 0.045, longueurOnde: 7, pulsation: 1.3, direction: [1, 0.35] },
    { amplitude: 0.02, longueurOnde: 3.7, pulsation: 1.9, direction: [-0.4, 1] },
]

export function hauteurVague(x: number, z: number, temps: number): number {
    let hauteur = 0
    ONDES.forEach((onde, i) => {
        const { kx, kz } = VECTEURS[i]!
        hauteur += onde.amplitude * Math.sin(kx * x + kz * z - onde.pulsation * temps)
    })
    return hauteur
}`,
}
