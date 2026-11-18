import React, { useState } from 'react';
import { MISSION_SLOTS, formatDateShortFr } from '../../data/missions';
import {
  adminCreateInscription,
  adminDeleteInscription,
  adminMoveInscription,
  purgeAllContacts,
} from '../../services/firestoreService';
import { translateFirebaseError } from '../../lib/firebase';
import type { ContactInfo, Inscription } from '../../types';
import {
  formatFrenchPhone,
  isValidFrenchPhone,
  isValidOptionalEmail,
  normalizeFirstName,
  normalizeLastName,
} from '../../utils/validation';

interface AddVolunteerModalProps {
  adminUid: string;
  countsBySlot: Record<string, number>;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function AddVolunteerModal({
  adminUid,
  countsBySlot,
  onClose,
  onSuccess,
}: AddVolunteerModalProps) {
  const [slotId, setSlotId] = useState<string>(MISSION_SLOTS[0].id);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const cleanPrenom = normalizeFirstName(prenom);
    const cleanNom = normalizeLastName(nom);
    if (!cleanPrenom || !cleanNom) {
      setError('Le prénom et le nom sont obligatoires.');
      return;
    }
    if (telephone.trim() && !isValidFrenchPhone(telephone)) {
      setError('Format de téléphone français invalide.');
      return;
    }
    if (!isValidOptionalEmail(email)) {
      setError("Format d'adresse e-mail invalide.");
      return;
    }

    setSaving(true);
    try {
      await adminCreateInscription({
        slotIds: [slotId],
        prenom: cleanPrenom,
        nom: cleanNom,
        telephone: telephone.trim() ? formatFrenchPhone(telephone) : '',
        email: email.trim(),
        commentaire: commentaire.trim(),
        adminUid,
      });
      onSuccess(`Inscription ajoutée pour ${cleanPrenom} ${cleanNom}.`);
      onClose();
    } catch (err) {
      setError(translateFirebaseError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-volunteer-title"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 id="add-volunteer-title" className="text-xl font-bold text-[#2F4A9A]">
          Ajouter un bénévole manuellement
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="admin-slot" className="block text-sm font-semibold text-[#14203B]">
              Mission et créneau
            </label>
            <select
              id="admin-slot"
              value={slotId}
              onChange={(e) => setSlotId(e.target.value)}
              className="w-full min-h-[46px] px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
            >
              {MISSION_SLOTS.map((s) => {
                const cnt = countsBySlot[s.id] ?? 0;
                const full = cnt >= s.capacite;
                return (
                  <option key={s.id} value={s.id} disabled={full}>
                    {formatDateShortFr(s.date)} · {s.libelleHoraire} — {s.missionLabel} ({cnt}/
                    {s.capacite}
                    {full ? ' - COMPLET' : ''})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="admin-prenom" className="block text-sm font-semibold text-[#14203B]">
                Prénom *
              </label>
              <input
                id="admin-prenom"
                type="text"
                required
                maxLength={40}
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-base rounded-xl border border-slate-300"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="admin-nom" className="block text-sm font-semibold text-[#14203B]">
                Nom *
              </label>
              <input
                id="admin-nom"
                type="text"
                required
                maxLength={40}
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-base rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label htmlFor="admin-tel" className="block text-sm font-semibold text-[#14203B]">
                Téléphone (optionnel en saisie admin)
              </label>
              <input
                id="admin-tel"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full min-h-[44px] px-3 py-2 text-base rounded-xl border border-slate-300"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="admin-email" className="block text-sm font-semibold text-[#14203B]">
                E-mail
              </label>
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-base rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="admin-comment" className="block text-sm font-semibold text-[#14203B]">
              Commentaire
            </label>
            <input
              id="admin-comment"
              type="text"
              maxLength={300}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ex. Inscription papier / téléphone"
              className="w-full min-h-[44px] px-3 py-2 text-base rounded-xl border border-slate-300"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-[#B91C1C] bg-red-50 p-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 py-2 rounded-xl font-semibold text-white bg-[#2F4A9A] hover:bg-[#1F3473] disabled:bg-slate-400"
            >
              {saving ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface MoveVolunteerModalProps {
  inscription: Inscription;
  countsBySlot: Record<string, number>;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function MoveVolunteerModal({
  inscription,
  countsBySlot,
  onClose,
  onSuccess,
}: MoveVolunteerModalProps) {
  const [targetSlotId, setTargetSlotId] = useState<string>(inscription.slotId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetSlotId === inscription.slotId) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminMoveInscription(inscription.id, targetSlotId);
      onSuccess(`${inscription.prenom} ${inscription.nom} a été déplacé.`);
      onClose();
    } catch (err) {
      setError(translateFirebaseError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="move-volunteer-title"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-xl">
        <h2 id="move-volunteer-title" className="text-xl font-bold text-[#2F4A9A]">
          Déplacer {inscription.prenom} {inscription.nom}
        </h2>
        <form onSubmit={handleMove} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="target-slot" className="block text-sm font-semibold text-[#14203B]">
              Nouveau créneau
            </label>
            <select
              id="target-slot"
              value={targetSlotId}
              onChange={(e) => setTargetSlotId(e.target.value)}
              className="w-full min-h-[46px] px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white"
            >
              {MISSION_SLOTS.map((s) => {
                const cnt = countsBySlot[s.id] ?? 0;
                const full = cnt >= s.capacite && s.id !== inscription.slotId;
                return (
                  <option key={s.id} value={s.id} disabled={full}>
                    {formatDateShortFr(s.date)} · {s.libelleHoraire} — {s.missionLabel} ({cnt}/
                    {s.capacite}
                    {full ? ' - COMPLET' : ''})
                  </option>
                );
              })}
            </select>
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-[#B91C1C] bg-red-50 p-3 rounded-xl">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] px-5 py-2 rounded-xl font-semibold text-white bg-[#2F4A9A] hover:bg-[#1F3473] disabled:bg-slate-400"
            >
              {saving ? 'Déplacement...' : 'Déplacer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface DeleteVolunteerModalProps {
  inscription: Inscription;
  contact: ContactInfo | undefined;
  adminUid: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function DeleteVolunteerModal({
  inscription,
  contact,
  adminUid,
  onClose,
  onSuccess,
}: DeleteVolunteerModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await adminDeleteInscription(inscription, contact, adminUid);
      onSuccess(
        `Inscription de ${inscription.prenom} ${inscription.nom} supprimée (sauvegardée dans le journal).`
      );
      onClose();
    } catch (err) {
      setError(translateFirebaseError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-volunteer-title"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
        <h2 id="delete-volunteer-title" className="text-xl font-bold text-[#14203B]">
          Supprimer cette inscription ?
        </h2>
        <p className="text-base text-slate-700">
          Voulez-vous supprimer l&apos;inscription de{' '}
          <strong>
            {inscription.prenom} {inscription.nom}
          </strong>{' '}
          ? Une copie complète sera conservée dans le journal pour restauration éventuelle.
        </p>
        {error && (
          <p role="alert" className="text-sm font-medium text-[#B91C1C] bg-red-50 p-3 rounded-xl">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDelete}
            className="min-h-[44px] px-5 py-2 rounded-xl font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] disabled:bg-slate-400"
          >
            {deleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PurgeContactsModalProps {
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function PurgeContactsModal({ onClose, onSuccess }: PurgeContactsModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState('');
  const [purging, setPurging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePurge = async () => {
    if (confirmText.trim().toUpperCase() !== 'EFFACER') return;
    setPurging(true);
    setError(null);
    try {
      const deleted = await purgeAllContacts();
      onSuccess(`${deleted} fiche(s) de coordonnées supprimée(s) définitivement.`);
      onClose();
    } catch (err) {
      setError(translateFirebaseError(err));
    } finally {
      setPurging(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="purge-contacts-title"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
        <h2 id="purge-contacts-title" className="text-xl font-bold text-[#B91C1C]">
          Effacer toutes les coordonnées (RGPD)
        </h2>

        {step === 1 ? (
          <>
            <p className="text-base text-slate-700 leading-relaxed">
              Cette action supprimera définitivement tous les numéros de téléphone, adresses e-mail
              et commentaires de la collection <code className="font-mono text-sm">contacts</code>{' '}
              après le marché de Noël. Les prénoms et noms des inscriptions restent en place.
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[44px] px-5 py-2 rounded-xl font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B]"
              >
                Continuer (étape 1/2)
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-base text-slate-700">
              Dernière confirmation : saisissez le mot <strong>EFFACER</strong> ci-dessous pour
              confirmer la purge définitive.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Saisissez EFFACER"
              className="w-full min-h-[46px] px-3.5 py-2 text-base rounded-xl border border-slate-300"
            />
            {error && (
              <p role="alert" className="text-sm font-medium text-[#B91C1C] bg-red-50 p-3 rounded-xl">
                {error}
              </p>
            )}
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                disabled={purging}
                onClick={onClose}
                className="min-h-[44px] px-4 py-2 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={purging || confirmText.trim().toUpperCase() !== 'EFFACER'}
                onClick={handlePurge}
                className="min-h-[44px] px-5 py-2 rounded-xl font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] disabled:bg-slate-300"
              >
                {purging ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
