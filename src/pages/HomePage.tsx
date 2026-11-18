import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  ExternalLink,
  FileDown,
  Leaf,
  MapPin,
  Users,
  Utensils,
} from 'lucide-react';
import { EVENT_CONFIG, isMealOrderClosed } from '../data/missions';
import { SnowflakesPattern } from '../components/SnowflakesPattern';

export function HomePage() {
  const ordersClosed = isMealOrderClosed();

  return (
    <div className="space-y-10 sm:space-y-14">
      {/* Bannière principale (Hero) */}
      <section className="relative overflow-hidden bg-[#2F4A9A] text-white">
        <SnowflakesPattern className="absolute inset-0 text-white" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 items-center">
            {/* Logo de l'école en bonne place */}
            <div className="flex justify-center lg:justify-start">
              <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-lg border border-white/20 w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
                <img
                  src="/logo-ecole.svg"
                  alt="Logo de l'École Saint-Pierre de Chemillé-en-Anjou"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="space-y-5 text-center lg:text-left">
              <p className="text-sm sm:text-base font-medium text-blue-100">
                {EVENT_CONFIG.association} · {EVENT_CONFIG.ecole}
              </p>
              <h1
                className="font-bold text-3xl sm:text-4xl lg:text-[2.75rem] leading-tight tracking-tight"
                style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
              >
                {EVENT_CONFIG.titre}
              </h1>
              <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Rendez-vous autour des chants de Noël des élèves, des créations des parents et du
                bar convivial. Un événement rendu possible grâce aux parents bénévoles !
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center lg:justify-start gap-3 sm:gap-4">
                <Link
                  to="/benevoles"
                  className="inline-flex items-center justify-center gap-2.5 min-h-[52px] px-7 py-3.5 text-base sm:text-lg font-bold text-white bg-[#B91C1C] hover:bg-[#991B1B] rounded-xl shadow-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Users className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>Je m&apos;inscris comme bénévole</span>
                </Link>

                <Link
                  to="/mes-inscriptions"
                  className="inline-flex items-center justify-center gap-2 min-h-[52px] px-6 py-3.5 text-base font-semibold text-[#2F4A9A] bg-white hover:bg-blue-50 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <CalendarCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>Mes inscriptions</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contenu principal en 2 colonnes sur grand écran */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Bloc Programme du 4 décembre */}
        <section
          aria-labelledby="programme-titre"
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6"
        >
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-[#B91C1C]">Vendredi 4 décembre 2026</p>
            <h2
              id="programme-titre"
              className="text-2xl sm:text-3xl font-bold text-[#2F4A9A]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Programme du 4 décembre
            </h2>
          </div>

          <ol className="divide-y divide-slate-100 border-t border-b border-slate-100">
            {EVENT_CONFIG.programme.map((etape) => (
              <li key={etape.horaire} className="py-3.5 flex items-baseline gap-4">
                <span className="font-mono font-semibold text-[#2F4A9A] text-base w-16 shrink-0 tabular-nums">
                  {etape.horaire}
                </span>
                <span className="text-base text-[#14203B] leading-snug">{etape.titre}</span>
              </li>
            ))}
          </ol>

          <div className="space-y-3 text-base text-slate-700">
            <p className="flex items-start gap-2.5 font-medium text-[#14203B]">
              <Clock className="w-5 h-5 text-[#2F4A9A] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{EVENT_CONFIG.horairesOuverture}</span>
            </p>
            <div className="pt-1">
              <p className="font-semibold text-[#14203B] mb-2">Sur place :</p>
              <ul className="space-y-2 text-slate-700 list-disc pl-5">
                {EVENT_CONFIG.surPlace.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <p className="flex items-start gap-2.5 text-sm text-slate-600 pt-1">
              <MapPin className="w-4 h-4 text-[#2F4A9A] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{EVENT_CONFIG.ecole}</span>
            </p>
          </div>
        </section>

        {/* Bloc Commander son repas à emporter */}
        <section
          aria-labelledby="repas-titre"
          className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-6"
        >
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-[#2F4A9A]">
              Cuisinés par {EVENT_CONFIG.repas.traiteur}
            </p>
            <h2
              id="repas-titre"
              className="text-2xl sm:text-3xl font-bold text-[#2F4A9A] flex items-center gap-2.5"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Utensils className="w-6 h-6 text-[#B91C1C] shrink-0" aria-hidden="true" />
              <span>Commander son repas à emporter</span>
            </h2>
            <p className="text-sm font-medium text-slate-600">{EVENT_CONFIG.repas.modalite}</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-base font-semibold text-[#14203B]">Menu proposé</h3>
            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {EVENT_CONFIG.repas.plats.map((plat) => (
                <li
                  key={plat.nom}
                  className="px-4 py-3 flex items-center justify-between gap-3 bg-slate-50/60"
                >
                  <span className="text-base font-medium text-[#14203B]">{plat.nom}</span>
                  {plat.vegetarien && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#15803D] shrink-0">
                      <Leaf className="w-4 h-4" aria-hidden="true" />
                      <span>Végétarien</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F6F8FC] border border-slate-200 rounded-xl p-4">
            <div>
              <p className="text-xs font-medium text-slate-600">Tarif adulte</p>
              <p className="text-lg font-bold text-[#2F4A9A] tabular-nums">
                {EVENT_CONFIG.repas.tarifAdulte}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600">Tarif enfant</p>
              <p className="text-lg font-bold text-[#2F4A9A] tabular-nums">
                {EVENT_CONFIG.repas.tarifEnfant}
              </p>
            </div>
          </div>

          <p
            className={`text-sm leading-relaxed p-4 rounded-xl border ${
              ordersClosed
                ? 'bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            {ordersClosed
              ? EVENT_CONFIG.repas.messageApresCloture
              : EVENT_CONFIG.repas.messageAvantCloture}
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {ordersClosed ? (
              <button
                type="button"
                disabled
                aria-disabled="true"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 text-base font-semibold text-slate-500 bg-slate-200 rounded-xl cursor-not-allowed"
              >
                <span>Commander sur HelloAsso (clos)</span>
              </button>
            ) : (
              <a
                href={EVENT_CONFIG.helloAssoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 text-base font-semibold text-white bg-[#2F4A9A] hover:bg-[#1F3473] rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F4A9A]"
              >
                <span>Commander sur HelloAsso</span>
                <ExternalLink className="w-4 h-4 shrink-0" aria-hidden="true" />
              </a>
            )}

            <a
              href={EVENT_CONFIG.flyerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-3 text-base font-semibold text-[#2F4A9A] bg-white hover:bg-blue-50 border border-slate-300 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2F4A9A]"
            >
              <FileDown className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>Télécharger le flyer (PDF)</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
