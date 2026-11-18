import type { InitialImportItem, MissionSlot, OverlapPair } from '../types';

/**
 * Fichier de configuration centralisé de l'événement.
 * Pour préparer l'édition de l'année prochaine, il suffit de mettre à jour
 * EVENT_CONFIG et MISSION_SLOTS ci-dessous, puis de remplacer le PDF dans public/.
 */
export const EVENT_CONFIG = {
  titre: "Marché de Noël de l'École Saint-Pierre – Vendredi 4 décembre 2026",
  titreCourt: 'Marché de Noël 2026',
  ecole: 'École Saint-Pierre de Chemillé-en-Anjou',
  association: 'APEL Saint-Pierre (« La Christmas Team »)',
  piedDePage: 'École Saint-Pierre – APEL Saint-Pierre de Chemillé – La Christmas Team',
  horairesOuverture: 'Le marché est ouvert de 17h30 à 20h30 environ.',
  flyerUrl: '/flyer-marche-de-noel-2026.pdf',
  helloAssoUrl:
    'https://www.helloasso.com/associations/association-de-parents-d-eleves-de-l-enseignement-libre-saint-pierre-de-chemille/boutiques/marche-de-noel-2026-commandes-de-repas-2',
  // Date limite des pré-commandes : samedi 21 novembre 2026 à 23h59:59 (heure de Paris, CET = UTC+1)
  dateLimiteCommandesIso: '2026-11-21T23:59:59+01:00',
  mentionRgpd:
    "Vos coordonnées sont uniquement visibles par l'équipe organisatrice et seront supprimées après le marché de Noël. Seuls vos prénom et nom apparaissent aux autres bénévoles.",
  programme: [
    { horaire: '17h30', titre: 'Ouverture des portes du marché' },
    { horaire: '18h00', titre: 'Chants des classes de maternelle (cycle 1)' },
    { horaire: '18h30', titre: 'Début de la distribution des repas à emporter' },
    { horaire: '18h45', titre: 'Chants des classes de cycle 2' },
    { horaire: '19h15', titre: 'Chants des classes de cycle 3' },
  ],
  surPlace: [
    'Vente des bricolages réalisés par les parents (paiement par CB possible)',
    'Bar (paiement par CB possible)',
    'Pop-corn et snacks au niveau du bar',
  ],
  repas: {
    traiteur: '« Comme à la maison » (Mauges-sur-Loire)',
    modalite: 'Uniquement à emporter',
    tarifAdulte: '9,50 € la part adulte',
    tarifEnfant: '5,50 € la part enfant',
    plats: [
      { nom: 'Tartiflette', vegetarien: false },
      { nom: 'Tartiflette végétarienne', vegetarien: true },
      { nom: 'Rougail-saucisses', vegetarien: false },
      { nom: 'Curry de lentilles-patates douces-épinards-coco', vegetarien: true },
    ],
    messageAvantCloture:
      'Réservation possible jusqu’au samedi 21 novembre. Quelques parts de dernière minute seront en vente sur place, mais il est impératif de pré-commander afin de prévoir les quantités.',
    messageApresCloture:
      'Les pré-commandes sont closes. Quelques parts de dernière minute seront en vente sur place.',
  },
} as const;

export const DATE_LABELS: Record<string, string> = {
  '2026-11-28': 'Samedi 28 novembre 2026',
  '2026-12-03': 'Jeudi 3 décembre 2026',
  '2026-12-04': 'Vendredi 4 décembre 2026',
};

export const DATE_SHORT_LABELS: Record<string, string> = {
  '2026-11-28': 'Sam. 28 nov.',
  '2026-12-03': 'Jeu. 3 déc.',
  '2026-12-04': 'Ven. 4 déc.',
};

export const MISSION_SLOTS: MissionSlot[] = [
  {
    id: 'deco-cours',
    missionId: 'deco-cours',
    missionLabel: 'Décoration des cours',
    date: '2026-11-28',
    debut: '09:00',
    fin: '',
    libelleHoraire: 'À partir de 9h00',
    capacite: 20,
  },
  {
    id: 'montage-praticables',
    missionId: 'montage-praticables',
    missionLabel: 'Montage des praticables',
    date: '2026-12-03',
    debut: '17:30',
    fin: '',
    libelleHoraire: 'À partir de 17h30',
    capacite: 20,
  },
  {
    id: 'install-bricolages',
    missionId: 'install-bricolages',
    missionLabel: 'Installation des bricolages',
    date: '2026-12-04',
    debut: '09:00',
    fin: '11:30',
    libelleHoraire: '9h00 – 11h30',
    capacite: 20,
  },
  {
    id: 'install-stands-matin',
    missionId: 'install-stands',
    missionLabel: 'Installation stands restauration et bar, guirlandes, déco, sono',
    date: '2026-12-04',
    debut: '09:00',
    fin: '11:30',
    libelleHoraire: '9h00 – 11h30',
    capacite: 20,
  },
  {
    id: 'install-stands-aprem',
    missionId: 'install-stands',
    missionLabel: 'Installation stands restauration et bar, guirlandes, déco, sono',
    date: '2026-12-04',
    debut: '13:30',
    fin: '16:30',
    libelleHoraire: '13h30 – 16h30',
    capacite: 20,
  },
  {
    id: 'dejeuner-cantine',
    missionId: 'dejeuner-cantine',
    missionLabel: 'Déjeuner des bénévoles à la cantine',
    date: '2026-12-04',
    debut: '11:30',
    fin: '13:00',
    libelleHoraire: '11h30 – 13h00',
    capacite: 20,
    isMealReservation: true,
    note: 'Réponse avant le 27 novembre',
  },
  {
    id: 'vente-eleves-1',
    missionId: 'vente-eleves',
    missionLabel: 'Vente des bricolages aux élèves',
    date: '2026-12-04',
    debut: '13:30',
    fin: '15:00',
    libelleHoraire: '13h30 – 15h00',
    capacite: 14,
  },
  {
    id: 'vente-eleves-2',
    missionId: 'vente-eleves',
    missionLabel: 'Vente des bricolages aux élèves',
    date: '2026-12-04',
    debut: '15:00',
    fin: '16:30',
    libelleHoraire: '15h00 – 16h30',
    capacite: 14,
  },
  {
    id: 'vente-familles-1',
    missionId: 'vente-familles',
    missionLabel: 'Vente des bricolages aux familles',
    date: '2026-12-04',
    debut: '17:30',
    fin: '18:15',
    libelleHoraire: '17h30 – 18h15',
    capacite: 14,
  },
  {
    id: 'vente-familles-2',
    missionId: 'vente-familles',
    missionLabel: 'Vente des bricolages aux familles',
    date: '2026-12-04',
    debut: '18:15',
    fin: '19:00',
    libelleHoraire: '18h15 – 19h00',
    capacite: 14,
  },
  {
    id: 'vente-familles-3',
    missionId: 'vente-familles',
    missionLabel: 'Vente des bricolages aux familles',
    date: '2026-12-04',
    debut: '19:00',
    fin: '19:45',
    libelleHoraire: '19h00 – 19h45',
    capacite: 14,
  },
  {
    id: 'vente-familles-4',
    missionId: 'vente-familles',
    missionLabel: 'Vente des bricolages aux familles',
    date: '2026-12-04',
    debut: '19:45',
    fin: '20:30',
    libelleHoraire: '19h45 – 20h30',
    capacite: 14,
  },
  {
    id: 'rangement-bricolages',
    missionId: 'rangement-bricolages',
    missionLabel: 'Rangement des bricolages',
    date: '2026-12-04',
    debut: '20:30',
    fin: '',
    libelleHoraire: 'À partir de 20h30',
    capacite: 3,
  },
  {
    id: 'popcorn-1',
    missionId: 'popcorn',
    missionLabel: 'Pop-corn et distribution des repas',
    date: '2026-12-04',
    debut: '17:30',
    fin: '18:15',
    libelleHoraire: '17h30 – 18h15',
    capacite: 3,
  },
  {
    id: 'popcorn-2',
    missionId: 'popcorn',
    missionLabel: 'Pop-corn et distribution des repas',
    date: '2026-12-04',
    debut: '18:15',
    fin: '19:00',
    libelleHoraire: '18h15 – 19h00',
    capacite: 5,
  },
  {
    id: 'popcorn-3',
    missionId: 'popcorn',
    missionLabel: 'Pop-corn et distribution des repas',
    date: '2026-12-04',
    debut: '19:00',
    fin: '19:45',
    libelleHoraire: '19h00 – 19h45',
    capacite: 5,
  },
  {
    id: 'popcorn-4',
    missionId: 'popcorn',
    missionLabel: 'Pop-corn et distribution des repas',
    date: '2026-12-04',
    debut: '19:45',
    fin: '20:30',
    libelleHoraire: '19h45 – 20h30',
    capacite: 5,
  },
  {
    id: 'bar-1',
    missionId: 'bar',
    missionLabel: 'Bar',
    date: '2026-12-04',
    debut: '17:30',
    fin: '18:15',
    libelleHoraire: '17h30 – 18h15',
    capacite: 4,
  },
  {
    id: 'bar-2',
    missionId: 'bar',
    missionLabel: 'Bar',
    date: '2026-12-04',
    debut: '18:15',
    fin: '18:45',
    libelleHoraire: '18h15 – 18h45',
    capacite: 4,
  },
  {
    id: 'bar-3',
    missionId: 'bar',
    missionLabel: 'Bar',
    date: '2026-12-04',
    debut: '18:45',
    fin: '19:30',
    libelleHoraire: '18h45 – 19h30',
    capacite: 4,
  },
  {
    id: 'bar-4',
    missionId: 'bar',
    missionLabel: 'Bar',
    date: '2026-12-04',
    debut: '19:30',
    fin: '20:15',
    libelleHoraire: '19h30 – 20h15',
    capacite: 4,
  },
  {
    id: 'bar-5',
    missionId: 'bar',
    missionLabel: 'Bar',
    date: '2026-12-04',
    debut: '20:15',
    fin: '21:00',
    libelleHoraire: '20h15 – 21h00',
    capacite: 4,
  },
  {
    id: 'demontage-praticables',
    missionId: 'demontage-praticables',
    missionLabel: 'Démontage des praticables après le chant du cycle 3',
    date: '2026-12-04',
    debut: '19:45',
    fin: '',
    libelleHoraire: 'Vers 19h45',
    capacite: 10,
  },
  {
    id: 'rangement-final',
    missionId: 'rangement-final',
    missionLabel: 'Rangement après le marché',
    date: '2026-12-04',
    debut: '21:00',
    fin: '',
    libelleHoraire: 'À partir de 21h00',
    capacite: 17,
  },
];

export const INITIAL_IMPORTS: InitialImportItem[] = [
  { id: 'import-01', slotId: 'deco-cours', prenom: 'Pierre', nom: 'BERDER' },
  { id: 'import-02', slotId: 'montage-praticables', prenom: 'Pierre', nom: 'BERDER' },
  { id: 'import-03', slotId: 'install-bricolages', prenom: 'Elodie', nom: 'FEUVRIER' },
  { id: 'import-04', slotId: 'install-bricolages', prenom: 'Alicia', nom: 'LAMOUREUX' },
  { id: 'import-05', slotId: 'install-bricolages', prenom: 'Katiana', nom: 'BARRE' },
  { id: 'import-06', slotId: 'install-stands-matin', prenom: 'Pierre', nom: 'BERDER' },
  { id: 'import-07', slotId: 'install-stands-aprem', prenom: 'Pierre', nom: 'BERDER' },
  { id: 'import-08', slotId: 'dejeuner-cantine', prenom: 'Elodie', nom: 'FEUVRIER' },
  { id: 'import-09', slotId: 'dejeuner-cantine', prenom: 'Pierre', nom: 'BERDER' },
  { id: 'import-10', slotId: 'dejeuner-cantine', prenom: 'Alicia', nom: 'LAMOUREUX' },
  { id: 'import-11', slotId: 'dejeuner-cantine', prenom: 'Katiana', nom: 'BARRE' },
  { id: 'import-12', slotId: 'vente-eleves-1', prenom: 'Elodie', nom: 'FEUVRIER' },
  { id: 'import-13', slotId: 'vente-eleves-1', prenom: 'Maureen', nom: 'DOLLET' },
  { id: 'import-14', slotId: 'vente-eleves-2', prenom: 'Elodie', nom: 'FEUVRIER' },
  { id: 'import-15', slotId: 'vente-familles-1', prenom: 'Sarah', nom: 'POTTIER' },
  { id: 'import-16', slotId: 'rangement-bricolages', prenom: 'Elodie', nom: 'FEUVRIER' },
  { id: 'import-17', slotId: 'bar-3', prenom: 'Sarah', nom: 'POTTIER' },
  { id: 'import-18', slotId: 'rangement-final', prenom: 'Pierre', nom: 'BERDER' },
];

export function getSlotById(slotId: string): MissionSlot | undefined {
  return MISSION_SLOTS.find((s) => s.id === slotId);
}

export function isMealOrderClosed(now: Date = new Date()): boolean {
  const deadline = new Date(EVENT_CONFIG.dateLimiteCommandesIso);
  return now.getTime() > deadline.getTime();
}

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Retourne l'intervalle [debutMinutes, finMinutes] utilisé pour les chevauchements et le calendrier .ics.
 * Règle métier :
 * - « À partir de HHhMM » (fin === '') : durée de 2 heures.
 * - « Vers 19h45 » (demontage-praticables) : 19h45 – 20h30.
 */
export function getEffectiveTimeRange(slot: MissionSlot): { startMin: number; endMin: number } {
  const startMin = timeToMinutes(slot.debut);
  if (slot.fin) {
    return { startMin, endMin: timeToMinutes(slot.fin) };
  }
  if (slot.id === 'demontage-praticables') {
    return { startMin, endMin: timeToMinutes('20:30') };
  }
  return { startMin, endMin: startMin + 120 };
}

export function detectOverlaps(slotIds: string[]): OverlapPair[] {
  const selected = slotIds
    .map((id) => getSlotById(id))
    .filter((s): s is MissionSlot => Boolean(s));

  const overlaps: OverlapPair[] = [];
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const a = selected[i];
      const b = selected[j];
      if (a.date !== b.date) continue;
      const rangeA = getEffectiveTimeRange(a);
      const rangeB = getEffectiveTimeRange(b);
      if (rangeA.startMin < rangeB.endMin && rangeB.startMin < rangeA.endMin) {
        overlaps.push({ slotA: a, slotB: b });
      }
    }
  }
  return overlaps;
}

export function formatDateFr(dateStr: string): string {
  return DATE_LABELS[dateStr] ?? dateStr;
}

export function formatDateShortFr(dateStr: string): string {
  return DATE_SHORT_LABELS[dateStr] ?? dateStr;
}
