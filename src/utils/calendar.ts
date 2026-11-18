import { EVENT_CONFIG, getEffectiveTimeRange } from '../data/missions';
import type { MissionSlot } from '../types';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function minutesToIcsTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${pad2(h)}${pad2(m)}00`;
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatUtcStamp(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    pad2(date.getUTCMonth() + 1) +
    pad2(date.getUTCDate()) +
    'T' +
    pad2(date.getUTCHours()) +
    pad2(date.getUTCMinutes()) +
    pad2(date.getUTCSeconds()) +
    'Z'
  );
}

export function generateIcsContent(slots: MissionSlot[]): string {
  const nowStamp = formatUtcStamp(new Date());

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//APEL Saint-Pierre Chemille//Marche de Noel 2026//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Bénévolat Marché de Noël Saint-Pierre 2026',
    'X-WR-TIMEZONE:Europe/Paris',
    'BEGIN:VTIMEZONE',
    'TZID:Europe/Paris',
    'X-LIC-LOCATION:Europe/Paris',
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0200',
    'TZOFFSETTO:+0100',
    'TZNAME:CET',
    'DTSTART:19701025T030000',
    'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
    'END:STANDARD',
    'BEGIN:DAYLIGHT',
    'TZOFFSETFROM:+0100',
    'TZOFFSETTO:+0200',
    'TZNAME:CEST',
    'DTSTART:19700329T020000',
    'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
    'END:DAYLIGHT',
    'END:VTIMEZONE',
  ];

  for (const slot of slots) {
    const dateCompact = slot.date.replace(/-/g, '');
    const { startMin, endMin } = getEffectiveTimeRange(slot);
    const dtStart = `${dateCompact}T${minutesToIcsTime(startMin)}`;
    const dtEnd = `${dateCompact}T${minutesToIcsTime(endMin)}`;
    const summary = slot.isMealReservation
      ? `${slot.missionLabel} — Marché de Noël Saint-Pierre`
      : `Bénévole : ${slot.missionLabel}`;

    const descriptionParts = [
      `${EVENT_CONFIG.ecole} — ${EVENT_CONFIG.association}`,
      `Horaire : ${slot.libelleHoraire}`,
    ];
    if (slot.note) {
      descriptionParts.push(slot.note);
    }

    lines.push(
      'BEGIN:VEVENT',
      `UID:${slot.id}-${dateCompact}@apel-saint-pierre-chemille.fr`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART;TZID=Europe/Paris:${dtStart}`,
      `DTEND;TZID=Europe/Paris:${dtEnd}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `LOCATION:${escapeIcsText(EVENT_CONFIG.ecole)}`,
      `DESCRIPTION:${escapeIcsText(descriptionParts.join('\n'))}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcsFile(slots: MissionSlot[], filename = 'benevolat-marche-noel-2026.ics'): void {
  const content = generateIcsContent(slots);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
