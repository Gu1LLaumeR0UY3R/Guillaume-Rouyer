// Pays et continents pour l'admin : code numérique des cartes → code à 2 lettres, et continent de chaque pays.
import iso from 'iso-3166-1'

export const CONTINENTS = { AF: 'Afrique', AN: 'Antarctique', AS: 'Asie', EU: 'Europe', NA: 'Amérique du Nord', OC: 'Océanie', SA: 'Amérique du Sud' }

const GROUPS = {
  AF: 'DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW EH RE YT SH',
  AS: 'AF AM AZ BH BD BT BN KH CN CY GE HK IN ID IR IQ IL JP JO KZ KW KG LA LB MO MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE',
  EU: 'AL AD AT BY BE BA BG HR CZ DK EE FO FI FR DE GI GR HU IS IE IM IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA AX GG JE SJ',
  NA: 'AG BS BB BZ CA CR CU DM DO SV GD GT HT HN JM MX NI PA KN LC VC TT US GL PR BM KY VG VI AW CW SX TC MS AI BL MF PM GP MQ BQ',
  SA: 'AR BO BR CL CO EC GY PY PE SR UY VE FK GF',
  OC: 'AU FJ KI MH FM NR NZ PW PG WS SB TO TV VU NC PF GU AS CK NU TK WF MP NF PN',
  AN: 'AQ TF GS BV HM',
}
const BY_CC = {}
for (const [cont, list] of Object.entries(GROUPS)) for (const cc of list.split(' ')) BY_CC[cc] = cont
export const continentOf = (cc) => BY_CC[cc] ?? null

export const alpha2 = (numeric) => iso.whereNumeric(String(numeric).padStart(3, '0'))?.alpha2 ?? null

const regions = new Intl.DisplayNames(['fr'], { type: 'region' })
export const countryName = (cc) => { try { return regions.of(cc) } catch { return cc } }
export const flag = (cc) => (/^[A-Z]{2}$/.test(cc) && cc !== 'XX' ? String.fromCodePoint(...[...cc].map((c) => 127397 + c.charCodeAt(0))) : '🌐')
