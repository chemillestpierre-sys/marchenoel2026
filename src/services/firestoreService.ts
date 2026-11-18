import {
  collection,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { INITIAL_IMPORTS, getSlotById } from '../data/missions';
import { db, ensureParentSession } from '../lib/firebase';
import type { ContactInfo, Inscription, JournalEntry } from '../types';

function requireDb() {
  if (!db) {
    throw new Error("La connexion à la base de données n'est pas encore configurée.");
  }
  return db;
}

export function subscribeInscriptions(
  onData: (items: Inscription[]) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, 'inscriptions'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items: Inscription[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          slotId: String(data.slotId ?? ''),
          prenom: String(data.prenom ?? ''),
          nom: String(data.nom ?? ''),
          ownerUid: String(data.ownerUid ?? ''),
          source: (data.source as Inscription['source']) ?? 'web',
          createdAt: data.createdAt ?? null,
        };
      });
      onData(items);
    },
    onError
  );
}

export function subscribeContacts(
  onData: (map: Record<string, ContactInfo>) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  if (!db) {
    onData({});
    return () => {};
  }
  return onSnapshot(
    collection(db, 'contacts'),
    (snapshot) => {
      const map: Record<string, ContactInfo> = {};
      for (const d of snapshot.docs) {
        const data = d.data();
        map[d.id] = {
          id: d.id,
          telephone: String(data.telephone ?? ''),
          email: String(data.email ?? ''),
          commentaire: String(data.commentaire ?? ''),
          ownerUid: String(data.ownerUid ?? ''),
        };
      }
      onData(map);
    },
    onError
  );
}

export function subscribeJournal(
  onData: (entries: JournalEntry[]) => void,
  onError: (err: unknown) => void
): Unsubscribe {
  if (!db) {
    onData([]);
    return () => {};
  }
  const q = query(collection(db, 'journal'), orderBy('date', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          action: data.action === 'restauration' ? 'restauration' : 'suppression',
          inscription: data.inscription,
          contact: data.contact ?? null,
          parUid: String(data.parUid ?? ''),
          date: data.date ?? null,
        };
      });
      onData(entries);
    },
    onError
  );
}

export async function checkIsAdmin(uid: string): Promise<boolean> {
  const database = requireDb();
  const snap = await getDoc(doc(database, 'admins', uid));
  return snap.exists();
}

export interface CreateRegistrationsInput {
  slotIds: string[];
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  commentaire: string;
}

/**
 * Crée une ou plusieurs inscriptions parent en batch atomique (inscriptions + contacts).
 * Re-vérifie la capacité directement sur le serveur avant écriture.
 */
export async function createVolunteerRegistrations(
  input: CreateRegistrationsInput
): Promise<Inscription[]> {
  const database = requireDb();
  const uid = await ensureParentSession();
  const uniqueSlots = Array.from(new Set(input.slotIds));
  if (uniqueSlots.length === 0) {
    throw new Error('Veuillez sélectionner au moins un créneau.');
  }

  // Relire les inscriptions depuis le serveur pour vérifier les jauges en temps réel
  const counts: Record<string, number> = {};
  // Firestore 'in' supporte jusqu'à 30 valeurs ; on découpe par paquets de 25 par sécurité
  for (let i = 0; i < uniqueSlots.length; i += 25) {
    const chunk = uniqueSlots.slice(i, i + 25);
    const snap = await getDocsFromServer(
      query(collection(database, 'inscriptions'), where('slotId', 'in', chunk))
    );
    snap.forEach((d) => {
      const sid = String(d.data().slotId ?? '');
      counts[sid] = (counts[sid] ?? 0) + 1;
    });
  }

  for (const slotId of uniqueSlots) {
    const slot = getSlotById(slotId);
    if (!slot) {
      throw new Error('Créneau introuvable.');
    }
    const current = counts[slotId] ?? 0;
    if (current >= slot.capacite) {
      throw new Error(
        `Ce créneau vient d'être complété, merci de choisir un autre horaire. (${slot.missionLabel} — ${slot.libelleHoraire})`
      );
    }
  }

  const batch = writeBatch(database);
  const created: Inscription[] = [];

  for (const slotId of uniqueSlots) {
    const insRef = doc(collection(database, 'inscriptions'));
    const contactRef = doc(database, 'contacts', insRef.id);

    batch.set(insRef, {
      slotId,
      prenom: input.prenom,
      nom: input.nom,
      ownerUid: uid,
      source: 'web',
      createdAt: serverTimestamp(),
    });

    batch.set(contactRef, {
      telephone: input.telephone,
      email: input.email,
      commentaire: input.commentaire,
      ownerUid: uid,
    });

    created.push({
      id: insRef.id,
      slotId,
      prenom: input.prenom,
      nom: input.nom,
      ownerUid: uid,
      source: 'web',
      createdAt: new Date(),
    });
  }

  await batch.commit();
  return created;
}

function serializeTimestampMs(ts: Inscription['createdAt']): number | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts.getTime();
  if (typeof (ts as { toMillis?: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return null;
}

/**
 * Permet à un parent de supprimer sa propre inscription (et le contact associé)
 * tout en enregistrant l'action dans le journal.
 */
export async function cancelOwnInscription(inscription: Inscription): Promise<void> {
  const database = requireDb();
  const uid = await ensureParentSession();

  let contactCopy: JournalEntry['contact'] = null;
  try {
    const contactSnap = await getDoc(doc(database, 'contacts', inscription.id));
    if (contactSnap.exists()) {
      const c = contactSnap.data();
      contactCopy = {
        telephone: String(c.telephone ?? ''),
        email: String(c.email ?? ''),
        commentaire: String(c.commentaire ?? ''),
        ownerUid: String(c.ownerUid ?? uid),
      };
    }
  } catch {
    contactCopy = null;
  }

  const batch = writeBatch(database);
  batch.delete(doc(database, 'inscriptions', inscription.id));
  batch.delete(doc(database, 'contacts', inscription.id));

  const journalRef = doc(collection(database, 'journal'));
  batch.set(journalRef, {
    action: 'suppression',
    inscription: {
      id: inscription.id,
      slotId: inscription.slotId,
      prenom: inscription.prenom,
      nom: inscription.nom,
      ownerUid: inscription.ownerUid,
      source: inscription.source,
      createdAtMs: serializeTimestampMs(inscription.createdAt),
    },
    contact: contactCopy,
    parUid: uid,
    date: serverTimestamp(),
  });

  await batch.commit();
}

/* ------------------ Fonctions Organisateurs (Admin) ------------------ */

export async function adminCreateInscription(
  input: CreateRegistrationsInput & { adminUid: string }
): Promise<void> {
  const database = requireDb();
  const uniqueSlots = Array.from(new Set(input.slotIds));

  for (const slotId of uniqueSlots) {
    const slot = getSlotById(slotId);
    if (!slot) throw new Error('Créneau introuvable.');
    const snap = await getDocsFromServer(
      query(collection(database, 'inscriptions'), where('slotId', '==', slotId))
    );
    if (snap.size >= slot.capacite) {
      throw new Error(
        `Ce créneau vient d'être complété, merci de choisir un autre horaire. (${slot.missionLabel})`
      );
    }
  }

  const batch = writeBatch(database);
  for (const slotId of uniqueSlots) {
    const insRef = doc(collection(database, 'inscriptions'));
    const contactRef = doc(database, 'contacts', insRef.id);
    batch.set(insRef, {
      slotId,
      prenom: input.prenom,
      nom: input.nom,
      ownerUid: input.adminUid,
      source: 'admin',
      createdAt: serverTimestamp(),
    });
    batch.set(contactRef, {
      telephone: input.telephone,
      email: input.email,
      commentaire: input.commentaire,
      ownerUid: input.adminUid,
    });
  }
  await batch.commit();
}

export async function adminMoveInscription(
  inscriptionId: string,
  newSlotId: string
): Promise<void> {
  const database = requireDb();
  const targetSlot = getSlotById(newSlotId);
  if (!targetSlot) throw new Error('Créneau cible introuvable.');

  const snap = await getDocsFromServer(
    query(collection(database, 'inscriptions'), where('slotId', '==', newSlotId))
  );
  if (snap.size >= targetSlot.capacite) {
    throw new Error("Ce créneau vient d'être complété, merci de choisir un autre horaire.");
  }

  const batch = writeBatch(database);
  batch.update(doc(database, 'inscriptions', inscriptionId), { slotId: newSlotId });
  await batch.commit();
}

export async function adminDeleteInscription(
  inscription: Inscription,
  contact: ContactInfo | undefined,
  adminUid: string
): Promise<void> {
  const database = requireDb();
  const batch = writeBatch(database);
  batch.delete(doc(database, 'inscriptions', inscription.id));
  batch.delete(doc(database, 'contacts', inscription.id));

  const journalRef = doc(collection(database, 'journal'));
  batch.set(journalRef, {
    action: 'suppression',
    inscription: {
      id: inscription.id,
      slotId: inscription.slotId,
      prenom: inscription.prenom,
      nom: inscription.nom,
      ownerUid: inscription.ownerUid,
      source: inscription.source,
      createdAtMs: serializeTimestampMs(inscription.createdAt),
    },
    contact: contact
      ? {
          telephone: contact.telephone,
          email: contact.email,
          commentaire: contact.commentaire,
          ownerUid: contact.ownerUid,
        }
      : null,
    parUid: adminUid,
    date: serverTimestamp(),
  });

  await batch.commit();
}

export async function adminRestoreInscription(
  entry: JournalEntry,
  adminUid: string
): Promise<void> {
  const database = requireDb();
  const ins = entry.inscription;
  const targetSlot = getSlotById(ins.slotId);
  if (!targetSlot) throw new Error('Le créneau associé est introuvable.');

  const existingDoc = await getDoc(doc(database, 'inscriptions', ins.id));
  if (existingDoc.exists()) {
    throw new Error('Cette inscription est déjà présente dans la liste.');
  }

  const snap = await getDocsFromServer(
    query(collection(database, 'inscriptions'), where('slotId', '==', ins.slotId))
  );
  if (snap.size >= targetSlot.capacite) {
    throw new Error("Ce créneau vient d'être complété, merci de choisir un autre horaire.");
  }

  const batch = writeBatch(database);
  batch.set(doc(database, 'inscriptions', ins.id), {
    slotId: ins.slotId,
    prenom: ins.prenom,
    nom: ins.nom,
    ownerUid: ins.ownerUid || adminUid,
    source: ins.source || 'admin',
    createdAt: serverTimestamp(),
  });

  if (entry.contact) {
    batch.set(doc(database, 'contacts', ins.id), {
      telephone: entry.contact.telephone ?? '',
      email: entry.contact.email ?? '',
      commentaire: entry.contact.commentaire ?? '',
      ownerUid: entry.contact.ownerUid || ins.ownerUid || adminUid,
    });
  }

  const journalRef = doc(collection(database, 'journal'));
  batch.set(journalRef, {
    action: 'restauration',
    inscription: ins,
    contact: entry.contact ?? null,
    parUid: adminUid,
    date: serverTimestamp(),
  });

  await batch.commit();
}

/**
 * Import idempotent des 18 inscriptions initiales (import-01 à import-18).
 * Ne crée jamais de doublon si exécuté plusieurs fois.
 */
export async function importInitialInscriptions(): Promise<{ added: number; skipped: number }> {
  const database = requireDb();
  const existingSnap = await getDocs(collection(database, 'inscriptions'));
  const existingIds = new Set(existingSnap.docs.map((d) => d.id));

  const missing = INITIAL_IMPORTS.filter((item) => !existingIds.has(item.id));
  if (missing.length === 0) {
    return { added: 0, skipped: INITIAL_IMPORTS.length };
  }

  const batch = writeBatch(database);
  for (const item of missing) {
    const insRef = doc(database, 'inscriptions', item.id);
    const contactRef = doc(database, 'contacts', item.id);
    batch.set(insRef, {
      slotId: item.slotId,
      prenom: item.prenom,
      nom: item.nom,
      ownerUid: 'import',
      source: 'import',
      createdAt: serverTimestamp(),
    });
    batch.set(contactRef, {
      telephone: '',
      email: '',
      commentaire: '',
      ownerUid: 'import',
    });
  }

  await batch.commit();
  return {
    added: missing.length,
    skipped: INITIAL_IMPORTS.length - missing.length,
  };
}

/**
 * Purge RGPD : supprime tous les documents de la collection contacts.
 */
export async function purgeAllContacts(): Promise<number> {
  const database = requireDb();
  const snap = await getDocs(collection(database, 'contacts'));
  if (snap.empty) return 0;

  let deleted = 0;
  for (let i = 0; i < snap.docs.length; i += 450) {
    const chunk = snap.docs.slice(i, i + 450);
    const batch = writeBatch(database);
    for (const d of chunk) {
      batch.delete(d.ref);
      deleted += 1;
    }
    await batch.commit();
  }
  return deleted;
}
