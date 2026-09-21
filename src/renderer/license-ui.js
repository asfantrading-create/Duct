// Licence wording shown to users. Customers only ever hold subscriptions (monthly / yearly / custom date);
// the internal never-expiring staff licence is labelled as such and the word "lifetime" never appears in the UI.
import { t, fmtDate } from './i18n.js';
import { planOf } from '../shared/license-format.js';

export function isInternal(payload) { return planOf(payload) === 'internal'; }
function planKey(payload) { const plan = planOf(payload); return plan === 'internal' ? 'internalLicense' : plan === 'monthly' ? 'planMonthly' : plan === 'yearly' ? 'planYearly' : 'planCustom'; }
/** Short label for the top-bar chip: plan name, plus the days left when renewal is near. */
export function licenseShort({ payload, daysLeft }) { if (isInternal(payload)) return t('internalLicense'); return `${t(planKey(payload))}${Number.isFinite(daysLeft) && daysLeft <= 30 ? ` · ${daysLeft} ${t('daysLeft')}` : ''}`; }
/** Full label for detail cards: "Annual subscription · expires on 2026-12-31 · 120 days left". */
export function licenseLong({ payload, daysLeft }) { if (isInternal(payload)) return t('internalLicense'); return `${t(planKey(payload))} · ${t('expiresOn')} ${fmtDate(payload.expires)}${Number.isFinite(daysLeft) ? ` · ${daysLeft} ${t('daysLeft')}` : ''}`; }
/** True when a subscription should show a renewal notice (30 days or less). */
export function renewalDue({ payload, daysLeft }) { return !isInternal(payload) && Number.isFinite(daysLeft) && daysLeft <= 30; }
