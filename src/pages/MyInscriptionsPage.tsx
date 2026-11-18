import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarPlus, Info, Trash2, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatDateFr, getSlotById } from '../data/missions';
import { cancelOwnInscription } from '../services/firestoreService';
import { translateFirebaseError } from '../lib/firebase';
import type { Inscription, MissionSlot } from '../types';
import { downloadIcsFile } from '../utils/calendar';

export function MyInscriptionsPage() {
  const { user, authReady, inscriptions, inscriptionsLoading } = useAppContext();
  const [confirmTarget, setConfirmTarget] = useState<{
    inscription: Inscription;
    slot: MissionSlot;
  } | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const myInscriptions = useMemo(() => {
    if (!user) return [];
    return inscriptions
      .filter((ins) => ins.ownerUid === user.uid)
      .map((ins) => ({
        inscription: ins,
        slot: getSlotById(ins.slotId),
      }))
      .filter((item): item is { inscription: Inscription; slot: MissionSlot } =>
        Boolean(item.slot)
      )
      .sort((a, b) => {
        if (a.slot.date !== b.slot.date) return a.slot.date.localeCompare(b.slot.date);
        return a.slot.debut.localeCompare(b.slot.debut);
      });
  }, [inscriptions, user]);

  const teammatesBySlot = useMemo(() => {
    const map: Record<string, Inscription[]> = {};
    for (const ins of inscriptions) {
      if (!map[ins.slotId]) map[ins.slotId] = [];
      map[ins.slotId].push(ins);
    }
    return map;
  }, [inscriptions]);

  const handleConfirmCancel = async () => {
    if (!confirmTarget) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      await cancelOwnInscription(confirmTarget.inscription);
      setConfirmTarget(null);
    } catch (err) {
      setErrorMsg(translateFirebaseError(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1
            className="text-3xl font-bold text-[#2F4A9A]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Mes inscriptions
          </h1>
          <p className="text-base text-slate-700">
            Retrouvez ici les créneaux enregistrés depuis cet appareil.
          </p>
        </div>

        {myInscriptions.length > 0 && (
          <button
            type="button"
            onClick={() => downloadIcsFile(myInscriptions.map((item) => item.slot))}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-2.5 text-sm sm:text-base font-semibold text-[#2F4A9A] bg-white hover:bg-blue-50 border border-slate-300 rounded-xl transition-colors shrink-0"
          >
            <CalendarPlus className="w-5 h-5" aria-hidden="true" />
            <span>Ajouter à mon agenda (.ics)</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 text-base"
        >
          {errorMsg}
        </div>
      )}

      {!authReady || inscriptionsLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-600">
          Chargement de vos inscriptions...
        </div>
      ) : myInscriptions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
          <Users className="w-10 h-10 text-[#2F4A9A] mx-auto" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-[#14203B]">
              Aucune inscription enregistrée sur cet appareil
            </h2>
            <p className="text-base text-slate-600 max-w-md mx-auto">
              Vous pouvez choisir un ou plusieurs créneaux sur la page des missions bénévoles.
            </p>
          </div>
          <Link
            to="/benevoles"
            className="inline-flex items-center justify-center min-h-[48px] px-6 py-3 text-base font-bold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-xl transition-colors"
          >
            Voir les missions bénévoles
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {myInscriptions.map(({ inscription, slot }) => {
            const teammates = (teammatesBySlot[slot.id] ?? []).filter(
              (t) => t.id !== inscription.id
            );

            return (
              <article
                key={inscription.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#B91C1C]">
                    {formatDateFr(slot.date)} ·{' '}
                    <span className="font-mono text-[#2F4A9A]">{slot.libelleHoraire}</span>
                  </p>
                  <h2 className="text-xl font-bold text-[#14203B]">{slot.missionLabel}</h2>
                  <p className="text-sm text-slate-600">
                    Inscrit au nom de :{' '}
                    <strong className="text-[#14203B]">
                      {inscription.prenom} {inscription.nom}
                    </strong>
                  </p>
                  <p className="text-sm text-slate-700">
                    <strong>Coéquipiers :</strong>{' '}
                    {teammates.length === 0
                      ? 'Vous êtes actuellement le seul inscrit sur ce créneau.'
                      : teammates.map((t) => `${t.prenom} ${t.nom}`).join(', ')}
                  </p>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmTarget({ inscription, slot })}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-2.5 text-sm font-semibold text-[#B91C1C] bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>Me désinscrire</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Message d'aide changement d'appareil */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-sm sm:text-base text-[#14203B]">
        <Info className="w-5 h-5 text-[#2F4A9A] shrink-0 mt-0.5" aria-hidden="true" />
        <p>
          Vous avez changé de téléphone ou d&apos;ordinateur ? Contactez l&apos;équipe organisatrice
          pour modifier votre inscription.
        </p>
      </div>

      {/* Fenêtre de confirmation de désinscription */}
      {confirmTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-cancel-title"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-5 shadow-xl">
            <h2 id="confirm-cancel-title" className="text-xl font-bold text-[#14203B]">
              Confirmer la désinscription
            </h2>
            <p className="text-base text-slate-700 leading-relaxed">
              Êtes-vous sûr de vouloir annuler votre inscription à{' '}
              <strong>{confirmTarget.slot.missionLabel}</strong> (
              {formatDateFr(confirmTarget.slot.date)}, {confirmTarget.slot.libelleHoraire}) ?
            </p>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmTarget(null)}
                className="min-h-[46px] px-5 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Conserver mon inscription
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmCancel}
                className="min-h-[46px] px-5 py-2.5 rounded-xl font-semibold text-white bg-[#B91C1C] hover:bg-[#991B1B] disabled:bg-slate-400 transition-colors"
              >
                {deleting ? 'Annulation...' : 'Oui, me désinscrire'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
