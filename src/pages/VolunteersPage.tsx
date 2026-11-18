import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  CheckCircle2,
  Printer,
  Utensils,
} from 'lucide-react';
import {
  EVENT_CONFIG,
  MISSION_SLOTS,
  detectOverlaps,
  formatDateFr,
  formatDateShortFr,
  getSlotById,
} from '../data/missions';
import { useAppContext } from '../context/AppContext';
import { createVolunteerRegistrations } from '../services/firestoreService';
import { translateFirebaseError } from '../lib/firebase';
import type { Inscription, MissionSlot } from '../types';
import {
  formatFrenchPhone,
  isValidFrenchPhone,
  isValidOptionalEmail,
  loadSavedParentProfile,
  normalizeFirstName,
  normalizeLastName,
  saveParentProfile,
} from '../utils/validation';
import { downloadIcsFile } from '../utils/calendar';
import { GaugeBar } from '../components/GaugeBar';

const DATE_ORDER = ['2026-11-28', '2026-12-03', '2026-12-04'];

export function VolunteersPage() {
  const { inscriptions, inscriptionsLoading, inscriptionsError, firebaseReady } = useAppContext();
  const savedProfile = useMemo(() => loadSavedParentProfile(), []);

  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);

  const [prenom, setPrenom] = useState<string>(savedProfile?.prenom ?? '');
  const [nom, setNom] = useState<string>(savedProfile?.nom ?? '');
  const [telephone, setTelephone] = useState<string>(savedProfile?.telephone ?? '');
  const [email, setEmail] = useState<string>('');
  const [commentaire, setCommentaire] = useState<string>('');

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmedRegistrations, setConfirmedRegistrations] = useState<Inscription[] | null>(null);

  const formRef = useRef<HTMLElement | null>(null);

  const inscriptionsBySlot = useMemo(() => {
    const map: Record<string, Inscription[]> = {};
    for (const ins of inscriptions) {
      if (!map[ins.slotId]) map[ins.slotId] = [];
      map[ins.slotId].push(ins);
    }
    return map;
  }, [inscriptions]);

  const mealSlot = useMemo(
    () => MISSION_SLOTS.find((s) => s.isMealReservation) ?? null,
    []
  );

  const regularDates = useMemo(() => {
    return DATE_ORDER.filter((d) => dateFilter === 'all' || dateFilter === d).map((dateStr) => {
      const slotsForDate = MISSION_SLOTS.filter(
        (s) => s.date === dateStr && !s.isMealReservation
      );
      // Regrouper par missionId en conservant l'ordre d'apparition
      const missionsMap = new Map<string, { missionLabel: string; slots: MissionSlot[] }>();
      for (const slot of slotsForDate) {
        const existing = missionsMap.get(slot.missionId);
        if (existing) {
          existing.slots.push(slot);
        } else {
          missionsMap.set(slot.missionId, {
            missionLabel: slot.missionLabel,
            slots: [slot],
          });
        }
      }
      return {
        date: dateStr,
        dateLabel: formatDateFr(dateStr),
        missions: Array.from(missionsMap.entries()).map(([missionId, data]) => ({
          missionId,
          ...data,
        })),
      };
    });
  }, [dateFilter]);

  const overlaps = useMemo(() => detectOverlaps(selectedSlotIds), [selectedSlotIds]);

  const selectedSlots = useMemo(
    () =>
      selectedSlotIds
        .map((id) => getSlotById(id))
        .filter((s): s is MissionSlot => Boolean(s)),
    [selectedSlotIds]
  );

  const toggleSlot = (slot: MissionSlot) => {
    const currentCount = (inscriptionsBySlot[slot.id] ?? []).length;
    const isSelected = selectedSlotIds.includes(slot.id);
    if (!isSelected && currentCount >= slot.capacite) {
      return;
    }
    setFormError(null);
    setSelectedSlotIds((prev) =>
      prev.includes(slot.id) ? prev.filter((id) => id !== slot.id) : [...prev, slot.id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!firebaseReady) {
      setFormError(
        "L'enregistrement n'est pas actif car la configuration Firebase est manquante."
      );
      return;
    }

    if (selectedSlotIds.length === 0) {
      setFormError('Veuillez cocher au moins un créneau avant de valider votre inscription.');
      return;
    }

    const cleanPrenom = normalizeFirstName(prenom);
    const cleanNom = normalizeLastName(nom);

    if (!cleanPrenom) {
      setFormError('Veuillez renseigner votre prénom.');
      return;
    }
    if (!cleanNom) {
      setFormError('Veuillez renseigner votre nom.');
      return;
    }
    if (!telephone.trim()) {
      setFormError('Veuillez renseigner votre numéro de téléphone.');
      return;
    }
    if (!isValidFrenchPhone(telephone)) {
      setFormError(
        'Le numéro de téléphone ne semble pas valide (format français attendu, ex. 06 12 34 56 78).'
      );
      return;
    }
    if (!isValidOptionalEmail(email)) {
      setFormError("L'adresse e-mail saisie ne semble pas valide.");
      return;
    }

    const formattedPhone = formatFrenchPhone(telephone);

    setSubmitting(true);
    try {
      const created = await createVolunteerRegistrations({
        slotIds: selectedSlotIds,
        prenom: cleanPrenom,
        nom: cleanNom,
        telephone: formattedPhone,
        email: email.trim(),
        commentaire: commentaire.trim(),
      });

      saveParentProfile({
        prenom: cleanPrenom,
        nom: cleanNom,
        telephone: formattedPhone,
      });

      setConfirmedRegistrations(created);
      setSelectedSlotIds([]);
      setCommentaire('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setFormError(translateFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderSlotCard = (slot: MissionSlot) => {
    const slotInscriptions = inscriptionsBySlot[slot.id] ?? [];
    const count = slotInscriptions.length;
    const isFull = count >= slot.capacite;
    const isSelected = selectedSlotIds.includes(slot.id);

    return (
      <div
        key={slot.id}
        className={`rounded-xl border p-4 sm:p-5 transition-colors ${
          isSelected
            ? 'border-[#2F4A9A] bg-blue-50/60 ring-2 ring-[#2F4A9A]/25'
            : isFull
            ? 'border-slate-200 bg-slate-50'
            : 'border-slate-200 bg-white hover:border-slate-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-mono text-base sm:text-lg font-semibold text-[#2F4A9A] tabular-nums">
                {slot.libelleHoraire}
              </p>
              {slot.note && (
                <span className="text-xs font-semibold text-[#B91C1C]">{slot.note}</span>
              )}
            </div>

            <GaugeBar count={count} capacity={slot.capacite} />

            {/* Liste des inscrits */}
            <div className="pt-1">
              <p className="text-xs font-semibold text-slate-600 mb-1.5">
                Déjà inscrits ({count}) :
              </p>
              {slotInscriptions.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  Aucun parent inscrit pour le moment — soyez le premier !
                </p>
              ) : (
                <p className="text-sm text-[#14203B] leading-relaxed">
                  {slotInscriptions
                    .map((item) => `${item.prenom} ${item.nom}`)
                    .join(' · ')}
                </p>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              disabled={isFull}
              onClick={() => toggleSlot(slot)}
              aria-pressed={isSelected}
              className={`w-full sm:w-auto min-h-[48px] px-4 py-2.5 rounded-xl font-semibold text-sm sm:text-base inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F4A9A] ${
                isFull
                  ? 'bg-emerald-50 text-[#15803D] border border-emerald-200 cursor-not-allowed'
                  : isSelected
                  ? 'bg-[#2F4A9A] text-white hover:bg-[#1F3473]'
                  : 'bg-white text-[#2F4A9A] border-2 border-[#2F4A9A] hover:bg-blue-50'
              }`}
            >
              {isFull ? (
                <span>Complet – merci !</span>
              ) : isSelected ? (
                <>
                  <Check className="w-5 h-5" aria-hidden="true" />
                  <span>Sélectionné</span>
                </>
              ) : (
                <span>Choisir ce créneau</span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* -------------------- Écran de confirmation -------------------- */
  if (confirmedRegistrations) {
    const confirmedSlots = confirmedRegistrations
      .map((ins) => getSlotById(ins.slotId))
      .filter((s): s is MissionSlot => Boolean(s));

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        <div className="bg-white rounded-2xl border border-emerald-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-4">
            <CheckCircle2 className="w-10 h-10 text-[#16A34A] shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <h1
                className="text-2xl sm:text-3xl font-bold text-[#14203B]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Merci pour votre inscription !
              </h1>
              <p className="text-base text-slate-700">
                Votre participation est enregistrée pour{' '}
                <strong>
                  {confirmedRegistrations[0].prenom} {confirmedRegistrations[0].nom}
                </strong>
                . Vous pouvez retrouver ou annuler vos créneaux depuis cet appareil dans « Mes
                inscriptions ».
              </p>
            </div>
          </div>

          <div className="space-y-4 border-t border-slate-200 pt-5">
            <h2 className="text-lg font-bold text-[#2F4A9A]">Récapitulatif de vos créneaux</h2>
            {confirmedRegistrations.map((reg) => {
              const slot = getSlotById(reg.slotId);
              if (!slot) return null;
              const teammates = (inscriptionsBySlot[slot.id] ?? []).filter(
                (i) => i.id !== reg.id
              );
              return (
                <div
                  key={reg.id}
                  className="rounded-xl border border-slate-200 bg-[#F6F8FC] p-4 space-y-2 print-break-inside-avoid"
                >
                  <p className="text-sm font-semibold text-[#B91C1C]">
                    {formatDateFr(slot.date)} ·{' '}
                    <span className="font-mono">{slot.libelleHoraire}</span>
                  </p>
                  <p className="text-lg font-bold text-[#14203B]">{slot.missionLabel}</p>
                  <p className="text-sm text-slate-700">
                    <strong>Avec vous sur ce créneau :</strong>{' '}
                    {teammates.length === 0
                      ? 'Vous êtes actuellement le premier inscrit sur ce créneau.'
                      : teammates.map((t) => `${t.prenom} ${t.nom}`).join(', ')}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="no-print flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() => downloadIcsFile(confirmedSlots)}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 text-base font-semibold text-white bg-[#2F4A9A] hover:bg-[#1F3473] rounded-xl transition-colors"
            >
              <CalendarPlus className="w-5 h-5" aria-hidden="true" />
              <span>Ajouter à mon agenda</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 text-base font-semibold text-[#14203B] bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors"
            >
              <Printer className="w-5 h-5" aria-hidden="true" />
              <span>Imprimer / enregistrer en PDF</span>
            </button>

            <Link
              to="/mes-inscriptions"
              className="inline-flex items-center justify-center min-h-[48px] px-5 py-3 text-base font-semibold text-[#2F4A9A] hover:underline"
            >
              Voir mes inscriptions
            </Link>

            <button
              type="button"
              onClick={() => setConfirmedRegistrations(null)}
              className="inline-flex items-center justify-center min-h-[48px] px-5 py-3 text-base font-medium text-slate-600 hover:text-[#14203B]"
            >
              Inscrire une autre personne
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------- Page d'inscription bénévole -------------------- */
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
      <div className="space-y-3">
        <h1
          className="text-3xl sm:text-4xl font-bold text-[#2F4A9A]"
          style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
        >
          Inscription des parents bénévoles
        </h1>
        <p className="text-base text-slate-700 max-w-3xl leading-relaxed">
          Cochez un ou plusieurs créneaux disponibles ci-dessous, puis renseignez vos coordonnées en
          bas de page. Les compteurs et les listes de prénoms se mettent à jour en direct.
        </p>
      </div>

      {/* Filtres par date */}
      <div
        role="tablist"
        aria-label="Filtrer les missions par date"
        className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl border border-slate-200 w-fit"
      >
        {[
          { value: 'all', label: 'Toutes les dates' },
          { value: '2026-11-28', label: formatDateShortFr('2026-11-28') },
          { value: '2026-12-03', label: formatDateShortFr('2026-12-03') },
          { value: '2026-12-04', label: formatDateShortFr('2026-12-04') },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={dateFilter === tab.value}
            onClick={() => setDateFilter(tab.value)}
            className={`min-h-[42px] px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
              dateFilter === tab.value
                ? 'bg-[#2F4A9A] text-white'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {inscriptionsError && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 text-base"
        >
          {inscriptionsError}
        </div>
      )}

      {inscriptionsLoading && (
        <p className="text-sm text-slate-600">Chargement des inscriptions en temps réel...</p>
      )}

      {/* Catégorie à part : Repas du midi des bénévoles */}
      {mealSlot && (dateFilter === 'all' || dateFilter === mealSlot.date) && (
        <section
          aria-labelledby="repas-benevoles-titre"
          className="bg-white rounded-2xl border border-amber-300 p-5 sm:p-6 space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <Utensils className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Repas du midi des bénévoles · Vendredi 4 décembre 2026</span>
              </div>
              <h2
                id="repas-benevoles-titre"
                className="text-xl sm:text-2xl font-bold text-[#14203B]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {mealSlot.missionLabel}
              </h2>
            </div>
            <span className="text-sm font-semibold text-[#B91C1C]">
              Réponse avant le 27 novembre
            </span>
          </div>
          <p className="text-sm text-slate-700">
            Ce créneau est une réservation de repas pour les bénévoles présents sur la journée du
            vendredi (il n&apos;est pas comptabilisé comme une mission).
          </p>
          {renderSlotCard(mealSlot)}
        </section>
      )}

      {/* Liste des missions groupées par date puis par mission */}
      <div className="space-y-10">
        {regularDates.map((dateGroup) => (
          <section key={dateGroup.date} className="space-y-5">
            <div className="border-b border-slate-300 pb-2">
              <h2
                className="text-2xl font-bold text-[#2F4A9A]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {dateGroup.dateLabel}
              </h2>
            </div>

            <div className="space-y-6">
              {dateGroup.missions.map((mission) => (
                <div
                  key={mission.missionId}
                  className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4"
                >
                  <h3 className="text-lg sm:text-xl font-bold text-[#14203B]">
                    {mission.missionLabel}
                  </h3>
                  <div className="space-y-3">{mission.slots.map(renderSlotCard)}</div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Bandeau flottant discret si créneaux sélectionnés (pour descendre vite au formulaire) */}
      {selectedSlots.length > 0 && (
        <div className="sticky bottom-20 md:bottom-4 z-20 flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={() => formRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="pointer-events-auto shadow-lg min-h-[48px] px-6 py-3 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-bold text-base inline-flex items-center gap-2 transition-colors"
          >
            <span>
              {selectedSlots.length} créneau{selectedSlots.length > 1 ? 'x' : ''} sélectionné
              {selectedSlots.length > 1 ? 's' : ''} — Valider mes coordonnées
            </span>
          </button>
        </div>
      )}

      {/* Formulaire de coordonnées */}
      <section
        ref={formRef}
        id="formulaire-inscription"
        aria-labelledby="form-titre"
        className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6"
      >
        <div className="space-y-1">
          <h2
            id="form-titre"
            className="text-2xl font-bold text-[#2F4A9A]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Vos coordonnées
          </h2>
          <p className="text-sm text-slate-600">
            {selectedSlots.length === 0
              ? 'Sélectionnez au moins un créneau ci-dessus puis complétez ce formulaire.'
              : `Vous avez sélectionné ${selectedSlots.length} créneau${
                  selectedSlots.length > 1 ? 'x' : ''
                } :`}
          </p>
        </div>

        {selectedSlots.length > 0 && (
          <ul className="bg-[#F6F8FC] border border-slate-200 rounded-xl divide-y divide-slate-200">
            {selectedSlots.map((slot) => (
              <li
                key={slot.id}
                className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-sm sm:text-base"
              >
                <div>
                  <span className="font-semibold text-[#14203B]">{slot.missionLabel}</span>{' '}
                  <span className="text-slate-600">
                    ({formatDateShortFr(slot.date)} · {slot.libelleHoraire})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSlot(slot)}
                  className="text-sm font-semibold text-[#B91C1C] hover:underline min-h-[36px] px-2"
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Avertissement de chevauchement horaire */}
        {overlaps.length > 0 && (
          <div
            role="alert"
            className="bg-amber-50 border border-amber-300 text-amber-950 rounded-xl p-4 flex items-start gap-3"
          >
            <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1 text-sm sm:text-base">
              <p className="font-bold">Attention : chevauchement d&apos;horaires détecté</p>
              <p>
                Certains créneaux choisis se recouvrent dans le temps. Vous pouvez tout de même
                valider si vous inscrivez deux personnes ou si vous gérez les deux postes :
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {overlaps.map((pair) => (
                  <li key={`${pair.slotA.id}-${pair.slotB.id}`}>
                    <strong>{pair.slotA.missionLabel}</strong> ({pair.slotA.libelleHoraire}) et{' '}
                    <strong>{pair.slotB.missionLabel}</strong> ({pair.slotB.libelleHoraire})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prenom" className="block text-sm font-semibold text-[#14203B]">
                Prénom <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="prenom"
                name="prenom"
                type="text"
                required
                maxLength={40}
                autoComplete="given-name"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Ex. Marie"
                className="w-full min-h-[48px] px-3.5 py-2.5 text-base rounded-xl border border-slate-300 bg-white focus:border-[#2F4A9A] focus:outline-2 focus:outline-[#2F4A9A]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="nom" className="block text-sm font-semibold text-[#14203B]">
                Nom <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="nom"
                name="nom"
                type="text"
                required
                maxLength={40}
                autoComplete="family-name"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex. DUPONT"
                className="w-full min-h-[48px] px-3.5 py-2.5 text-base rounded-xl border border-slate-300 bg-white focus:border-[#2F4A9A] focus:outline-2 focus:outline-[#2F4A9A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="telephone" className="block text-sm font-semibold text-[#14203B]">
                Téléphone <span className="text-[#B91C1C]">*</span>
              </label>
              <input
                id="telephone"
                name="telephone"
                type="tel"
                required
                autoComplete="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex. 06 12 34 56 78"
                className="w-full min-h-[48px] px-3.5 py-2.5 text-base rounded-xl border border-slate-300 bg-white focus:border-[#2F4A9A] focus:outline-2 focus:outline-[#2F4A9A]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-[#14203B]">
                Adresse e-mail <span className="text-slate-500 font-normal">(facultatif)</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex. marie.dupont@exemple.fr"
                className="w-full min-h-[48px] px-3.5 py-2.5 text-base rounded-xl border border-slate-300 bg-white focus:border-[#2F4A9A] focus:outline-2 focus:outline-[#2F4A9A]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="commentaire" className="block text-sm font-semibold text-[#14203B]">
              Commentaire <span className="text-slate-500 font-normal">(facultatif)</span>
            </label>
            <textarea
              id="commentaire"
              name="commentaire"
              rows={2}
              maxLength={300}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Précision utile pour l'équipe organisatrice..."
              className="w-full px-3.5 py-2.5 text-base rounded-xl border border-slate-300 bg-white focus:border-[#2F4A9A] focus:outline-2 focus:outline-[#2F4A9A]"
            />
          </div>

          <p className="text-sm text-slate-600 bg-[#F6F8FC] border border-slate-200 rounded-xl p-3.5">
            {EVENT_CONFIG.mentionRgpd}
          </p>

          {formError && (
            <div
              role="alert"
              className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 text-base font-medium"
            >
              {formError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 text-base sm:text-lg font-bold text-white bg-[#B91C1C] hover:bg-[#991B1B] disabled:bg-slate-400 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B91C1C]"
          >
            {submitting
              ? 'Enregistrement en cours...'
              : selectedSlots.length > 1
              ? `Valider mes ${selectedSlots.length} inscriptions`
              : 'Valider mon inscription'}
          </button>
        </form>
      </section>
    </div>
  );
}
