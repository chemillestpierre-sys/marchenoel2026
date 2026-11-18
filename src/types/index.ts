import type { Timestamp } from 'firebase/firestore';

export interface MissionSlot {
  id: string;
  missionId: string;
  missionLabel: string;
  date: string; // YYYY-MM-DD
  debut: string; // HH:mm
  fin: string; // HH:mm ou '' si 'à partir de' / 'vers'
  libelleHoraire: string;
  capacite: number;
  isMealReservation?: boolean;
  note?: string;
}

export interface InitialImportItem {
  id: string;
  slotId: string;
  prenom: string;
  nom: string;
}

export type InscriptionSource = 'web' | 'import' | 'admin';

export interface Inscription {
  id: string;
  slotId: string;
  prenom: string;
  nom: string;
  ownerUid: string;
  source: InscriptionSource;
  createdAt: Timestamp | Date | null;
}

export interface ContactInfo {
  id: string;
  telephone: string;
  email: string;
  commentaire: string;
  ownerUid: string;
}

export interface JournalEntry {
  id: string;
  action: 'suppression' | 'restauration';
  inscription: {
    id: string;
    slotId: string;
    prenom: string;
    nom: string;
    ownerUid: string;
    source: InscriptionSource;
    createdAtMs?: number | null;
  };
  contact: {
    telephone: string;
    email: string;
    commentaire: string;
    ownerUid: string;
  } | null;
  parUid: string;
  date: Timestamp | Date | null;
}

export interface OverlapPair {
  slotA: MissionSlot;
  slotB: MissionSlot;
}

export interface SavedParentProfile {
  prenom: string;
  nom: string;
  telephone: string;
}
