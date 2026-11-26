<script setup>
// Choix d'un créneau pour échanger. Les créneaux viennent des disponibilités réglées dans l'admin (plages hebdomadaires, heure de Paris),
// moins ceux déjà demandés. FullCalendar n'est chargé qu'à l'ouverture du calendrier : il ne pèse pas sur la page de contact.
// Vue « Liste » en alternative : boutons natifs, accessibles au clavier et lisibles sur petit écran.
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { bookableSlots, bookableWindow, availabilityOf } from '../../functions/_lib/availability.js' // même logique que le serveur
import { settings } from '../content/settings.js'
import { lang, t } from '../i18n/index.js'
import { addMin, dayOf, hourOf, labelSlot as labelSlotFmt } from '../lib/slotFormat.js'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const open = ref(false)
const view = ref('calendar') // calendar | list
const taken = ref([])
const loading = ref(false)
const failed = ref(false)
const host = ref(null)
let calendar = null

const avail = computed(() => availabilityOf(settings.value))
const free = computed(() => bookableSlots(avail.value).filter((s) => !taken.value.includes(s)))
const byDay = computed(() => {
  const days = new Map()
  for (const s of free.value) { const d = s.slice(0, 10); (days.get(d) ?? days.set(d, []).get(d)).push(s) }
  return [...days].slice(0, 21)
})

const labelSlot = (s) => labelSlotFmt(s, lang.value)
const dayLabel = (d) => dayOf(`${d}T00:00`, lang.value)
const hourLabel = (s) => hourOf(s, lang.value)

async function loadTaken() {
  try { taken.value = (await (await fetch('/api/availability', { headers: { Accept: 'application/json' } })).json()).taken ?? [] } catch { /* on propose quand même : le serveur arbitre */ }
}

async function mountCalendar() {
  await nextTick()
  if (!host.value || calendar) return
  const [{ Calendar }, timeGrid, list, fr] = await Promise.all([
    import('@fullcalendar/core'), import('@fullcalendar/timegrid'), import('@fullcalendar/list'), import('@fullcalendar/core/locales/fr'),
  ])
  if (!host.value) return // fermé pendant le chargement
  const w = bookableWindow()
  const dows = new Set(avail.value.days.map((d) => d.dow))
  const starts = avail.value.days.map((d) => d.start).sort(), ends = avail.value.days.map((d) => d.end).sort()
  calendar = new Calendar(host.value, {
    plugins: [timeGrid.default, list.default],
    locales: [fr.default], locale: lang.value === 'fr' ? 'fr' : 'en', firstDay: 1,
    initialView: matchMedia('(max-width: 640px)').matches ? 'listWeek' : 'timeGridWeek',
    initialDate: free.value[0]?.slice(0, 10),
    headerToolbar: { left: 'prev,next', center: 'title', right: '' },
    height: 'auto', allDaySlot: false, nowIndicator: false,
    hiddenDays: [0, 1, 2, 3, 4, 5, 6].filter((d) => !dows.has(d)),
    slotMinTime: `${starts[0] ?? '08:00'}:00`, slotMaxTime: `${ends.at(-1) ?? '19:00'}:00`, slotDuration: `00:${String(avail.value.duration).padStart(2, '0')}:00`,
    validRange: { start: w.from.slice(0, 10), end: addMin(`${w.to.slice(0, 10)}T00:00`, 1440).slice(0, 10) },
    noEventsContent: t('contactForm.slotNone'),
    eventInteractive: true, // les créneaux se choisissent aussi au clavier (Tab, Entrée)
    events: free.value.map((s) => ({ id: s, start: s, end: addMin(s, avail.value.duration), title: hourLabel(s) })),
    displayEventTime: false, // le titre de chaque créneau est déjà son heure
    eventClick: (a) => { a.jsEvent.preventDefault(); pick(a.event.id) },
  })
  calendar.render()
  mark(props.modelValue) // un créneau déjà choisi reste surligné à la réouverture
}
function destroyCalendar() { calendar?.destroy(); calendar = null }

// Met en évidence le créneau choisi dans le calendrier (FullCalendar 6 : on change la classe de chaque événement)
const mark = (slot) => calendar?.getEvents().forEach((e) => e.setProp('classNames', e.id === slot ? ['is-picked'] : []))
const pick = (s) => { emit('update:modelValue', s); mark(s) }
async function toggle() {
  open.value = !open.value
  if (!open.value) { destroyCalendar(); return }
  loading.value = true; failed.value = false
  await loadTaken()
  loading.value = false
  if (view.value === 'calendar') mountCalendar().catch(() => { failed.value = true; view.value = 'list' })
}
function setView(v) {
  view.value = v
  if (v === 'calendar') mountCalendar().catch(() => { failed.value = true; view.value = 'list' }); else destroyCalendar()
}
defineExpose({ reload: loadTaken, labelSlot })
onBeforeUnmount(destroyCalendar)
</script>

<template>
  <div v-if="settings.availOn && avail.days.length" class="slot">
    <div class="head">
      <p class="lbl">{{ t('contactForm.slotTitle') }} <span class="opt">({{ t('contactForm.optional') }})</span></p>
      <button class="btn outline sm" type="button" :aria-expanded="open" @click="toggle">{{ open ? t('contactForm.slotClose') : t('contactForm.slotOpen') }}</button>
    </div>
    <p v-if="settings.availNote" class="hint">{{ settings.availNote }}</p>
    <p v-if="modelValue" class="chosen" role="status">
      ✓ {{ t('contactForm.slotChosen') }} <strong>{{ labelSlot(modelValue) }}</strong> ({{ t('contactForm.slotTz') }})
      <button class="link" type="button" @click="pick('')">{{ t('contactForm.slotClear') }}</button>
    </p>

    <div v-if="open" class="box">
      <p v-if="loading" role="status">{{ t('veille.loading') }}</p>
      <template v-else>
        <div class="views" role="group" :aria-label="t('contactForm.slotView')">
          <button type="button" :aria-pressed="view === 'calendar'" @click="setView('calendar')">{{ t('contactForm.slotCalendar') }}</button>
          <button type="button" :aria-pressed="view === 'list'" @click="setView('list')">{{ t('contactForm.slotList') }}</button>
        </div>
        <div v-show="view === 'calendar'" ref="host" class="fc-host" />
        <div v-if="view === 'list'" class="list">
          <p v-if="!byDay.length" class="hint">{{ t('contactForm.slotNone') }}</p>
          <div v-for="[d, slots] in byDay" :key="d" class="day">
            <p class="dl">{{ dayLabel(d) }}</p>
            <div class="slots"><button v-for="s in slots" :key="s" type="button" :aria-pressed="s === modelValue" @click="pick(s)">{{ hourLabel(s) }}</button></div>
          </div>
        </div>
        <p class="hint">{{ t('contactForm.slotTz') }}. {{ t('contactForm.slotHelp') }}</p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.slot{display:grid;gap:10px;padding:16px;border:1px solid rgba(184,216,194,.35);border-radius:14px}
.head{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between}
.lbl{margin:0;color:#f3fbf5;font-weight:600}
.opt,.hint{color:#b8d8c2;font-weight:400;font-size:14px;margin:0}
.sm{min-height:40px;padding:0 16px}
.outline{background:transparent;border-color:#b8d8c2;color:#f3fbf5}
.chosen{margin:0;color:#f3fbf5}
.chosen strong{color:#39ff88}
.link{margin-left:8px;padding:0;border:0;background:none;color:#39ff88;font:inherit;text-decoration:underline;cursor:pointer}
.box{display:grid;gap:12px;padding:14px;border-radius:12px;background:#f3fbf5;color:#0b1f14}
.box .hint{color:#4a5f52}
.views{display:flex;gap:8px}
.views button,.slots button{min-height:40px;padding:0 14px;border:1px solid #14532d;border-radius:999px;background:#fff;color:#0b1f14;font:600 14px var(--font);cursor:pointer}
.views button[aria-pressed=true],.slots button[aria-pressed=true]{background:#14532d;color:#fff}
.day{display:grid;gap:6px;margin-bottom:10px}
.dl{margin:0;font-weight:700;text-transform:capitalize}
.slots{display:flex;flex-wrap:wrap;gap:8px}
.fc-host{--fc-event-bg-color:#14532d;--fc-event-border-color:#14532d;--fc-event-text-color:#fff;--fc-today-bg-color:rgba(20,83,45,.08);--fc-border-color:#c9d6cd;--fc-page-bg-color:#f3fbf5;--fc-neutral-bg-color:#e7efe9;--fc-list-event-hover-bg-color:#e1ece4;font-size:14px}
.fc-host :deep(.fc-event){cursor:pointer}
.fc-host :deep(.fc-event.is-picked){--fc-event-bg-color:#39ff88;--fc-event-border-color:#052e16;--fc-event-text-color:#052e16;outline:2px solid #052e16;font-weight:700}
.fc-host :deep(.fc-event:focus-visible),.fc-host :deep(.fc-list-event:focus-visible){outline:3px solid #052e16;outline-offset:2px}
.fc-host :deep(.fc-button){background:#14532d;border-color:#14532d;min-height:40px}
.fc-host :deep(.fc-toolbar-title){font-size:18px}
</style>
