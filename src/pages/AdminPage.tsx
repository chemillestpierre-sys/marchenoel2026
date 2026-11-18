import React, { useEffect, useMemo, useState } from 'react';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  ArrowDownUp,
  ArrowRightLeft,
  Download,
  History,
  LogOut,
  Plus,
  Printer,
  RotateCcw,
  Search,
  ShieldAlert,
  Trash2,
  Upload,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { auth, translateFirebaseError } from '../lib/firebase';
import {
  MISSION_SLOTS,
  formatDateFr,
  formatDateShortFr,
  getSlotById,
} from '../data/missions';
import {
  adminRestoreInscription,
  importInitialInscriptions,
  subscribeContacts,
  subscribeJournal,
} from '../services/firestoreService';
import type { ContactInfo, Inscription, JournalEntry } from '../types';
import { GaugeBar } from '../components/GaugeBar';
import {
  AddVolunteerModal,
  DeleteVolunteerModal,
  MoveVolunteerModal,
  PurgeContactsModal,
} from '../components/admin/AdminModals';

type AdminTab = 'dashboard' | 'table' | 'planning' | 'print' | 'journal';
type SortField = 'date' | 'horaire' | 'mission' | 'prenom' | 'nom' | 'createdAt';

function formatTimestampFr(ts: Inscription['createdAt'] | JournalEntry['date']): string {
  if (!ts) return '—';
  let dateObj: Date | null = null;
  if (ts instanceof Date) {
    dateObj = ts;
  } else if (typeof (ts as { toDate?: () => Date }).toDate === 'function') {
    dateObj = (ts as { toDate: () => Date }).toDate();
  }
  if (!dateObj) return '—';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

function getTimestampMs(ts: Inscription['createdAt']): number {
  if (!ts) return 0;
  if (ts instanceof Date) return ts.getTime();
  if (typeof (ts as { toMillis?: () => number }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  return 0;
}

export function AdminPage() {
  const { user, authReady, isAdmin, adminChecking, inscriptions, firebaseReady } = useAppContext();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [contactsMap, setContactsMap] = useState<Record<string, ContactInfo>>({});
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Filtres et tri du tableau
  const [filterDate, setFilterDate] = useState<string>('all');
  const [filterMission, setFilterMission] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [moveTarget, setMoveTarget] = useState<Inscription | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Inscription | null>(null);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin || !firebaseReady) {
      setContactsMap({});
      setJournalEntries([]);
      return;
    }

    const unsubContacts = subscribeContacts(
      (map) => setContactsMap(map),
      (err) => setFeedback({ type: 'error', text: translateFirebaseError(err) })
    );
    const unsubJournal = subscribeJournal(
      (entries) => setJournalEntries(entries),
      (err) => setFeedback({ type: 'error', text: translateFirebaseError(err) })
    );

    return () => {
      unsubContacts();
      unsubJournal();
    };
  }, [isAdmin, firebaseReady]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      setLoginError('Firebase non configuré.');
      return;
    }
    setLoggingIn(true);
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      setLoginPassword('');
    } catch (err) {
      setLoginError(translateFirebaseError(err));
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  /* -------------------- Calculs statistiques -------------------- */
  const countsBySlot = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ins of inscriptions) {
      map[ins.slotId] = (map[ins.slotId] ?? 0) + 1;
    }
    return map;
  }, [inscriptions]);

  const dashboardStats = useMemo(() => {
    // Exclure le déjeuner cantine du taux de remplissage des missions
    const missionSlotsOnly = MISSION_SLOTS.filter((s) => !s.isMealReservation);
    const totalCapacity = missionSlotsOnly.reduce((sum, s) => sum + s.capacite, 0);
    const totalFilled = missionSlotsOnly.reduce(
      (sum, s) => sum + Math.min(s.capacite, countsBySlot[s.id] ?? 0),
      0
    );
    const fillRate = totalCapacity > 0 ? Math.round((totalFilled / totalCapacity) * 100) : 0;

    // Nombre de bénévoles distincts (toutes inscriptions confondues hors repas ou toutes)
    const distinctSet = new Set(
      inscriptions
        .filter((ins) => {
          const slot = getSlotById(ins.slotId);
          return slot && !slot.isMealReservation;
        })
        .map((ins) => `${ins.prenom.trim().toLowerCase()}::${ins.nom.trim().toUpperCase()}`)
    );

    // Créneaux encore incomplets triés par manque décroissant
    const incompleteSlots = missionSlotsOnly
      .map((slot) => {
        const count = countsBySlot[slot.id] ?? 0;
        const missing = Math.max(0, slot.capacite - count);
        return { slot, count, missing };
      })
      .filter((item) => item.missing > 0)
      .sort((a, b) => b.missing - a.missing);

    return {
      totalCapacity,
      totalFilled,
      fillRate,
      distinctVolunteers: distinctSet.size,
      incompleteSlots,
    };
  }, [countsBySlot, inscriptions]);

  const missionOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of MISSION_SLOTS) {
      map.set(s.missionId, s.missionLabel);
    }
    return Array.from(map.entries());
  }, []);

  const enrichedRows = useMemo(() => {
    const queryLower = searchTerm.trim().toLowerCase();
    return inscriptions
      .map((ins) => {
        const slot = getSlotById(ins.slotId);
        const contact = contactsMap[ins.id];
        return {
          inscription: ins,
          slot,
          contact,
        };
      })
      .filter((row) => {
        if (!row.slot) return false;
        if (filterDate !== 'all' && row.slot.date !== filterDate) return false;
        if (filterMission !== 'all' && row.slot.missionId !== filterMission) return false;
        if (queryLower) {
          const fullName = `${row.inscription.prenom} ${row.inscription.nom}`.toLowerCase();
          const revName = `${row.inscription.nom} ${row.inscription.prenom}`.toLowerCase();
          const phone = (row.contact?.telephone ?? '').toLowerCase();
          if (
            !fullName.includes(queryLower) &&
            !revName.includes(queryLower) &&
            !phone.includes(queryLower)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const dir = sortAsc ? 1 : -1;
        const slotA = a.slot!;
        const slotB = b.slot!;
        switch (sortField) {
          case 'date':
            return (
              (slotA.date.localeCompare(slotB.date) || slotA.debut.localeCompare(slotB.debut)) *
              dir
            );
          case 'horaire':
            return slotA.debut.localeCompare(slotB.debut) * dir;
          case 'mission':
            return slotA.missionLabel.localeCompare(slotB.missionLabel, 'fr') * dir;
          case 'prenom':
            return a.inscription.prenom.localeCompare(b.inscription.prenom, 'fr') * dir;
          case 'nom':
            return a.inscription.nom.localeCompare(b.inscription.nom, 'fr') * dir;
          case 'createdAt':
            return (
              (getTimestampMs(a.inscription.createdAt) -
                getTimestampMs(b.inscription.createdAt)) *
              dir
            );
          default:
            return 0;
        }
      });
  }, [inscriptions, contactsMap, filterDate, filterMission, searchTerm, sortField, sortAsc]);

  /* -------------------- Planning par bénévole -------------------- */
  const planningByVolunteer = useMemo(() => {
    const groups = new Map<
      string,
      {
        displayName: string;
        phones: Set<string>;
        emails: Set<string>;
        items: Array<{ inscription: Inscription; slot: ReturnType<typeof getSlotById> }>;
      }
    >();

    for (const ins of inscriptions) {
      const slot = getSlotById(ins.slotId);
      if (!slot) continue;
      const key = `${ins.nom.trim().toUpperCase()}::${ins.prenom.trim().toLowerCase()}`;
      const contact = contactsMap[ins.id];

      if (!groups.has(key)) {
        groups.set(key, {
          displayName: `${ins.nom.toUpperCase()} ${ins.prenom}`,
          phones: new Set(),
          emails: new Set(),
          items: [],
        });
      }
      const g = groups.get(key)!;
      if (contact?.telephone) g.phones.add(contact.telephone);
      if (contact?.email) g.emails.add(contact.email);
      g.items.push({ inscription: ins, slot });
    }

    return Array.from(groups.values())
      .map((g) => ({
        ...g,
        items: g.items.sort((a, b) => {
          const sa = a.slot!;
          const sb = b.slot!;
          return sa.date.localeCompare(sb.date) || sa.debut.localeCompare(sb.debut);
        }),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'));
  }, [inscriptions, contactsMap]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      'Date',
      'Horaire',
      'Mission',
      'Prénom',
      'Nom',
      'Téléphone',
      'E-mail',
      'Commentaire',
      'Source',
      "Date d'inscription",
    ];
    const escapeCell = (val: string) => `"${val.replace(/"/g, '""')}"`;

    const lines = [headers.map(escapeCell).join(';')];
    for (const row of enrichedRows) {
      const slot = row.slot!;
      const c = row.contact;
      lines.push(
        [
          formatDateFr(slot.date),
          slot.libelleHoraire,
          slot.missionLabel,
          row.inscription.prenom,
          row.inscription.nom,
          c?.telephone ?? '',
          c?.email ?? '',
          c?.commentaire ?? '',
          row.inscription.source,
          formatTimestampFr(row.inscription.createdAt),
        ]
          .map(escapeCell)
          .join(';')
      );
    }

    const csvContent = '\uFEFF' + lines.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `benevoles-marche-noel-2026.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportInitial = async () => {
    setImporting(true);
    setFeedback(null);
    try {
      const res = await importInitialInscriptions();
      if (res.added === 0) {
        setFeedback({
          type: 'success',
          text: `Toutes les inscriptions initiales (${res.skipped}) étaient déjà importées.`,
        });
      } else {
        setFeedback({
          type: 'success',
          text: `${res.added} inscription(s) initiale(s) importée(s) (${res.skipped} déjà présente(s)).`,
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: translateFirebaseError(err) });
    } finally {
      setImporting(false);
    }
  };

  const handleRestore = async (entry: JournalEntry) => {
    if (!user) return;
    setRestoringId(entry.id);
    setFeedback(null);
    try {
      await adminRestoreInscription(entry, user.uid);
      setFeedback({
        type: 'success',
        text: `Inscription de ${entry.inscription.prenom} ${entry.inscription.nom} restaurée.`,
      });
    } catch (err) {
      setFeedback({ type: 'error', text: translateFirebaseError(err) });
    } finally {
      setRestoringId(null);
    }
  };

  /* -------------------- États d'accès -------------------- */
  if (!authReady || adminChecking) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center text-slate-600">
        Vérification de votre session organisateur...
      </div>
    );
  }

  // Connecté par e-mail/mdp mais UID absent de la collection admins
  if (user && !user.isAnonymous && !isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl border border-red-200 p-6 sm:p-8 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-[#B91C1C] mx-auto" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-[#14203B]">Accès réservé aux organisateurs</h1>
          <p className="text-base text-slate-700">
            Le compte <strong>{user.email}</strong> ne figure pas dans la liste des administrateurs
            autorisés (<code className="font-mono text-sm">admins</code>).
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="min-h-[46px] px-5 py-2.5 rounded-xl font-semibold text-white bg-[#2F4A9A] hover:bg-[#1F3473]"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  // Non connecté en tant qu'admin : écran de connexion
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-10 sm:py-14">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h1
              className="text-2xl sm:text-3xl font-bold text-[#2F4A9A]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Espace organisateurs
            </h1>
            <p className="text-sm text-slate-600">
              Connectez-vous avec votre compte e-mail organisateur pour gérer les créneaux et
              consulter les coordonnées des bénévoles.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="org-email" className="block text-sm font-semibold text-[#14203B]">
                Adresse e-mail
              </label>
              <input
                id="org-email"
                type="email"
                required
                autoComplete="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full min-h-[48px] px-3.5 py-2 text-base rounded-xl border border-slate-300"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="org-password" className="block text-sm font-semibold text-[#14203B]">
                Mot de passe
              </label>
              <input
                id="org-password"
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full min-h-[48px] px-3.5 py-2 text-base rounded-xl border border-slate-300"
              />
            </div>

            {loginError && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-3 text-sm font-medium"
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn || !firebaseReady}
              className="w-full min-h-[48px] px-5 py-3 rounded-xl font-bold text-white bg-[#2F4A9A] hover:bg-[#1F3473] disabled:bg-slate-400 transition-colors"
            >
              {loggingIn ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  /* -------------------- Console Organisateurs -------------------- */
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* En-tête organisateur */}
      <div className="no-print flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold text-[#2F4A9A]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Espace organisateurs
          </h1>
          <p className="text-sm text-slate-600">Connecté en tant que {user?.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 text-sm font-semibold text-white bg-[#2F4A9A] hover:bg-[#1F3473] rounded-xl transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Ajouter un bénévole</span>
          </button>

          <button
            type="button"
            onClick={handleImportInitial}
            disabled={importing}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 text-sm font-semibold text-[#2F4A9A] bg-white hover:bg-blue-50 border border-slate-300 rounded-xl transition-colors whitespace-nowrap"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>{importing ? 'Import...' : 'Importer les inscriptions initiales'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 text-sm font-semibold text-[#14203B] bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-[#B91C1C] rounded-xl transition-colors whitespace-nowrap"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          role="status"
          className={`no-print rounded-xl p-4 text-sm sm:text-base font-medium border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Onglets de navigation */}
      <div
        role="tablist"
        aria-label="Vues organisateurs"
        className="no-print flex flex-wrap gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 w-fit"
      >
        {[
          { id: 'dashboard', label: 'Tableau de bord' },
          { id: 'table', label: 'Tableau récapitulatif' },
          { id: 'planning', label: 'Planning par bénévole' },
          { id: 'print', label: 'Feuille de mission' },
          { id: 'journal', label: `Journal (${journalEntries.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`min-h-[42px] px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#2F4A9A] text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ONGLET 1 : TABLEAU DE BORD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
              <p className="text-sm text-slate-600">Taux de remplissage global</p>
              <p className="text-3xl font-bold text-[#2F4A9A] tabular-nums">
                {dashboardStats.fillRate} %
              </p>
              <p className="text-xs text-slate-500 tabular-nums">
                {dashboardStats.totalFilled} / {dashboardStats.totalCapacity} postes (hors repas
                midi)
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
              <p className="text-sm text-slate-600">Bénévoles distincts</p>
              <p className="text-3xl font-bold text-[#14203B] tabular-nums">
                {dashboardStats.distinctVolunteers}
              </p>
              <p className="text-xs text-slate-500">Sur l&apos;ensemble des missions</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
              <p className="text-sm text-slate-600">Créneaux incomplets</p>
              <p className="text-3xl font-bold text-[#B91C1C] tabular-nums">
                {dashboardStats.incompleteSlots.length}
              </p>
              <p className="text-xs text-slate-500">
                Sur {MISSION_SLOTS.filter((s) => !s.isMealReservation).length} créneaux de mission
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1">
              <p className="text-sm text-slate-600">Déjeuner bénévoles (cantine)</p>
              <p className="text-3xl font-bold text-[#14203B] tabular-nums">
                {countsBySlot['dejeuner-cantine'] ?? 0} / 20
              </p>
              <p className="text-xs text-slate-500">Réservations repas du vendredi midi</p>
            </div>
          </div>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <h2 className="text-xl font-bold text-[#14203B]">
              Créneaux encore incomplets (classés par manque le plus important)
            </h2>
            {dashboardStats.incompleteSlots.length === 0 ? (
              <p className="text-base text-[#15803D] font-semibold">
                Tous les créneaux sont complets !
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboardStats.incompleteSlots.map(({ slot, count, missing }) => (
                  <div
                    key={slot.id}
                    className="rounded-xl border border-slate-200 p-4 space-y-2.5 bg-[#F6F8FC]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[#2F4A9A]">
                          {formatDateShortFr(slot.date)} ·{' '}
                          <span className="font-mono">{slot.libelleHoraire}</span>
                        </p>
                        <p className="font-bold text-[#14203B]">{slot.missionLabel}</p>
                      </div>
                      <span className="text-sm font-bold text-[#B91C1C] tabular-nums shrink-0">
                        -{missing} place{missing > 1 ? 's' : ''}
                      </span>
                    </div>
                    <GaugeBar count={count} capacity={slot.capacite} />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ONGLET 2 : TABLEAU RÉCAPITULATIF */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, prénom ou téléphone..."
                className="w-full min-h-[44px] pl-10 pr-3 py-2 text-sm rounded-xl border border-slate-300"
              />
            </div>

            <select
              aria-label="Filtrer par date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="min-h-[44px] px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
            >
              <option value="all">Toutes les dates</option>
              <option value="2026-11-28">Samedi 28 novembre</option>
              <option value="2026-12-03">Jeudi 3 décembre</option>
              <option value="2026-12-04">Vendredi 4 décembre</option>
            </select>

            <select
              aria-label="Filtrer par mission"
              value={filterMission}
              onChange={(e) => setFilterMission(e.target.value)}
              className="min-h-[44px] px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white max-w-xs"
            >
              <option value="all">Toutes les missions</option>
              {missionOptions.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    {(
                      [
                        ['date', 'Date'],
                        ['horaire', 'Horaire'],
                        ['mission', 'Mission'],
                        ['prenom', 'Prénom'],
                        ['nom', 'Nom'],
                      ] as Array<[SortField, string]>
                    ).map(([field, label]) => (
                      <th key={field} className="py-3 px-3.5 font-semibold whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleSort(field)}
                          className="inline-flex items-center gap-1 hover:text-[#2F4A9A]"
                        >
                          <span>{label}</span>
                          <ArrowDownUp className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      </th>
                    ))}
                    <th className="py-3 px-3.5 font-semibold whitespace-nowrap">Téléphone</th>
                    <th className="py-3 px-3.5 font-semibold whitespace-nowrap">E-mail</th>
                    <th className="py-3 px-3.5 font-semibold">Commentaire</th>
                    <th className="py-3 px-3.5 font-semibold whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleSort('createdAt')}
                        className="inline-flex items-center gap-1 hover:text-[#2F4A9A]"
                      >
                        <span>Inscription</span>
                        <ArrowDownUp className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    </th>
                    <th className="py-3 px-3.5 font-semibold text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrichedRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-500">
                        Aucune inscription ne correspond aux critères sélectionnés.
                      </td>
                    </tr>
                  ) : (
                    enrichedRows.map(({ inscription, slot, contact }) => (
                      <tr key={inscription.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-3.5 whitespace-nowrap tabular-nums">
                          {formatDateShortFr(slot!.date)}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap font-mono text-xs tabular-nums">
                          {slot!.libelleHoraire}
                        </td>
                        <td className="py-3 px-3.5 font-medium text-[#14203B] min-w-[180px]">
                          {slot!.missionLabel}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">{inscription.prenom}</td>
                        <td className="py-3 px-3.5 whitespace-nowrap font-semibold">
                          {inscription.nom}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap font-mono text-xs tabular-nums">
                          {contact?.telephone || '—'}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-xs text-slate-600">
                          {contact?.email || '—'}
                        </td>
                        <td className="py-3 px-3.5 text-xs text-slate-600 max-w-[200px]">
                          {contact?.commentaire || '—'}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-xs text-slate-500 tabular-nums">
                          {inscription.source === 'import'
                            ? 'Import initial'
                            : formatTimestampFr(inscription.createdAt)}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              title="Déplacer vers un autre créneau"
                              onClick={() => setMoveTarget(inscription)}
                              className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-[#2F4A9A] hover:bg-blue-50"
                            >
                              <ArrowRightLeft className="w-4 h-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              title="Supprimer cette inscription"
                              onClick={() => setDeleteTarget(inscription)}
                              className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-[#B91C1C] hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-slate-500 tabular-nums">
            {enrichedRows.length} inscription(s) affichée(s).
          </p>
        </div>
      )}

      {/* ONGLET 3 : PLANNING PAR BÉNÉVOLE */}
      {activeTab === 'planning' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {planningByVolunteer.length === 0 ? (
            <p className="text-slate-600">Aucun bénévole inscrit pour le moment.</p>
          ) : (
            planningByVolunteer.map((person) => (
              <div
                key={person.displayName}
                className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <h2 className="text-lg font-bold text-[#2F4A9A]">{person.displayName}</h2>
                  <span className="text-xs text-slate-600 font-mono">
                    {Array.from(person.phones).join(' · ') || 'Téléphone non renseigné'}
                  </span>
                </div>
                <ul className="space-y-2 text-sm">
                  {person.items.map(({ inscription, slot }) => (
                    <li key={inscription.id} className="flex items-baseline gap-2.5">
                      <span className="font-mono text-xs font-semibold text-[#B91C1C] shrink-0 tabular-nums">
                        {formatDateShortFr(slot!.date)} · {slot!.libelleHoraire}
                      </span>
                      <span className="text-[#14203B]">{slot!.missionLabel}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      {/* ONGLET 4 : FEUILLE DE MISSION IMPRIMABLE */}
      {activeTab === 'print' && (
        <div className="space-y-6">
          <div className="no-print flex items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-sm text-slate-700">
              Vue optimisée pour l&apos;impression : une fiche claire par mission et par créneau
              avec les noms et numéros de téléphone.
            </p>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-[#2F4A9A] hover:bg-[#1F3473] rounded-xl shrink-0"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              <span>Imprimer les feuilles de mission</span>
            </button>
          </div>

          <div className="space-y-6">
            {MISSION_SLOTS.map((slot) => {
              const slotIns = inscriptions.filter((i) => i.slotId === slot.id);
              return (
                <section
                  key={slot.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 print-break-inside-avoid"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <p className="text-xs font-semibold text-[#2F4A9A]">
                        {formatDateFr(slot.date)} ·{' '}
                        <span className="font-mono">{slot.libelleHoraire}</span>
                      </p>
                      <h2 className="text-lg font-bold text-[#14203B]">{slot.missionLabel}</h2>
                    </div>
                    <span className="font-mono text-sm font-semibold text-slate-700 tabular-nums">
                      {slotIns.length} / {slot.capacite}
                    </span>
                  </div>

                  {slotIns.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Aucun inscrit.</p>
                  ) : (
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-600">
                          <th className="py-1.5 pr-4 font-semibold">Bénévole</th>
                          <th className="py-1.5 pr-4 font-semibold">Téléphone</th>
                          <th className="py-1.5 font-semibold">Commentaire / Présence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {slotIns.map((ins) => {
                          const c = contactsMap[ins.id];
                          return (
                            <tr key={ins.id}>
                              <td className="py-2 pr-4 font-medium">
                                {ins.prenom} {ins.nom}
                              </td>
                              <td className="py-2 pr-4 font-mono text-xs tabular-nums">
                                {c?.telephone || '—'}
                              </td>
                              <td className="py-2 text-xs text-slate-600">
                                {c?.commentaire || ''}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* ONGLET 5 : JOURNAL & RGPD */}
      {activeTab === 'journal' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-red-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#B91C1C]">
                Nettoyage RGPD après le marché de Noël
              </h2>
              <p className="text-sm text-slate-700">
                Purgez définitivement tous les numéros de téléphone, e-mails et commentaires une
                fois l&apos;événement terminé.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPurgeModal(true)}
              className="min-h-[46px] px-5 py-2.5 rounded-xl font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] shrink-0"
            >
              Effacer toutes les coordonnées
            </button>
          </div>

          <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#2F4A9A]" aria-hidden="true" />
              <h2 className="text-xl font-bold text-[#14203B]">
                Journal des suppressions et restaurations
              </h2>
            </div>

            {journalEntries.length === 0 ? (
              <p className="text-sm text-slate-600">
                Aucune suppression enregistrée pour le moment.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {journalEntries.map((entry) => {
                  const slot = getSlotById(entry.inscription?.slotId);
                  const isRestoredAlready = inscriptions.some(
                    (i) => i.id === entry.inscription?.id
                  );

                  return (
                    <div
                      key={entry.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#14203B]">
                          <span
                            className={
                              entry.action === 'restauration'
                                ? 'text-[#15803D]'
                                : 'text-[#B91C1C]'
                            }
                          >
                            {entry.action === 'restauration' ? 'Restauration' : 'Suppression'}
                          </span>{' '}
                          · {entry.inscription?.prenom} {entry.inscription?.nom}
                        </p>
                        <p className="text-sm text-slate-700">
                          {slot
                            ? `${formatDateShortFr(slot.date)} (${slot.libelleHoraire}) — ${
                                slot.missionLabel
                              }`
                            : entry.inscription?.slotId}
                        </p>
                        <p className="text-xs text-slate-500 tabular-nums">
                          {formatTimestampFr(entry.date)}
                          {entry.contact?.telephone ? ` · Tél : ${entry.contact.telephone}` : ''}
                        </p>
                      </div>

                      {entry.action === 'suppression' && (
                        <button
                          type="button"
                          disabled={isRestoredAlready || restoringId === entry.id}
                          onClick={() => handleRestore(entry)}
                          className="inline-flex items-center justify-center gap-1.5 min-h-[42px] px-4 py-2 text-sm font-semibold rounded-xl border border-slate-300 text-[#2F4A9A] bg-white hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          <RotateCcw className="w-4 h-4" aria-hidden="true" />
                          <span>
                            {isRestoredAlready
                              ? 'Déjà restaurée'
                              : restoringId === entry.id
                              ? 'Restauration...'
                              : 'Restaurer'}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modales */}
      {showAddModal && user && (
        <AddVolunteerModal
          adminUid={user.uid}
          countsBySlot={countsBySlot}
          onClose={() => setShowAddModal(false)}
          onSuccess={(msg) => setFeedback({ type: 'success', text: msg })}
        />
      )}

      {moveTarget && (
        <MoveVolunteerModal
          inscription={moveTarget}
          countsBySlot={countsBySlot}
          onClose={() => setMoveTarget(null)}
          onSuccess={(msg) => setFeedback({ type: 'success', text: msg })}
        />
      )}

      {deleteTarget && user && (
        <DeleteVolunteerModal
          inscription={deleteTarget}
          contact={contactsMap[deleteTarget.id]}
          adminUid={user.uid}
          onClose={() => setDeleteTarget(null)}
          onSuccess={(msg) => setFeedback({ type: 'success', text: msg })}
        />
      )}

      {showPurgeModal && (
        <PurgeContactsModal
          onClose={() => setShowPurgeModal(false)}
          onSuccess={(msg) => setFeedback({ type: 'success', text: msg })}
        />
      )}
    </div>
  );
}
