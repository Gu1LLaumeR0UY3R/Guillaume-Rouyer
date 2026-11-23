<script setup>
// Notification de succès : médaillon, étincelles et bandeau ivoire, centrés à l'écran. Un seul à la fois ; les suivants attendent leur tour.
// Affichée dans la « couche supérieure » du navigateur (popover) pour rester visible même quand une boîte de dialogue est ouverte.
import { computed, nextTick, ref, watch } from 'vue'
import { toasts } from '../lib/achievements.js'
import AchMedal from './AchMedal.vue'
const head = computed(() => toasts.value[0] ?? null)
const stage = ref(null)
watch(toasts, async () => {
  const h = head.value
  await nextTick()
  const el = stage.value
  if (!el?.showPopover) return
  try {
    const open = el.matches(':popover-open')
    if (open) el.hidePopover() // on le rouvre à chaque notification pour qu'il repasse au-dessus d'une boîte de dialogue ouverte entre-temps
    if (h) el.showPopover()
  } catch { /* ignoré */ }
}, { immediate: true })
const STAR = 'M20 1.5c1.9 11.9 6.6 16.6 18.5 18.5C26.6 21.9 21.9 26.6 20 38.5 18.1 26.6 13.4 21.9 1.5 20 13.4 18.1 18.1 13.4 20 1.5Z'
</script>

<template>
  <div ref="stage" class="stage" popover="manual" role="status" aria-live="polite">
    <section v-if="head" :key="head.key" class="achievement" :aria-label="`Succès débloqué : ${head.title}`">
      <div class="sparkles sparkles-left" aria-hidden="true">
        <svg class="sparkle sparkle-one" viewBox="0 0 40 40"><path :d="STAR" /></svg>
        <svg class="sparkle sparkle-two" viewBox="0 0 40 40"><path :d="STAR" /></svg>
        <svg class="sparkle sparkle-three" viewBox="0 0 40 40"><path :d="STAR" /></svg>
        <span class="spark-dot dot-one" />
        <span class="spark-dot dot-two" />
      </div>

      <div class="orbit orbit-one" aria-hidden="true" />
      <div class="orbit orbit-two" aria-hidden="true" />

      <div class="achievement-card">
        <div class="card-line card-line-top" />
        <div class="card-line card-line-bottom" />
        <div class="achievement-copy">
          <div class="eyebrow">
            <span class="tiny-diamond" />
            <span>Succès débloqué</span>
            <span class="tiny-diamond" />
          </div>
          <h1>{{ head.title }}</h1>
        </div>
        <svg class="end-star" viewBox="0 0 40 40" aria-hidden="true"><path :d="STAR" /></svg>
      </div>

      <div class="medal-wrap"><AchMedal /></div>

      <div class="sparkles sparkles-right" aria-hidden="true">
        <svg class="sparkle sparkle-four" viewBox="0 0 40 40"><path :d="STAR" /></svg>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Zone plein écran transparente, non cliquable, qui centre la notification. */
.stage{position:fixed;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;background:none;overflow:visible;pointer-events:none;display:grid;place-items:start center;padding-top:clamp(64px,9vh,96px);box-sizing:border-box;color:inherit;z-index:80}
.stage[popover]:not(:popover-open){display:none}

.achievement {
  --medal-size: clamp(9.5rem, 17vw, 13.2rem);
  position: relative;
  width: min(64rem, 83vw);
  zoom: 0.5; /* notification discrète : moitié de la maquette d'origine */
  opacity: 0;
  filter: blur(9px);
  transform: translateX(4rem) scale(0.98);
  animation: achievement-enter 900ms cubic-bezier(0.16, 1, 0.3, 1) 120ms forwards, achievement-exit 600ms ease-in 4.4s forwards;
}
.achievement::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 12% 4% 12% 8%;
  background: rgba(255, 224, 145, 0.25);
  filter: blur(2.3rem);
  animation: aura-pulse 2.8s ease-in-out 1s infinite;
}
.achievement-card {
  position: relative;
  height: clamp(8.4rem, 14vw, 10.8rem);
  margin-left: calc(var(--medal-size) * 0.54);
  display: flex;
  align-items: center;
  padding: 1rem clamp(5rem, 9vw, 8rem) 1rem calc(var(--medal-size) * 0.62);
  color: #72523e;
  background: linear-gradient(90deg, rgba(255, 251, 232, 0.98), rgba(247, 235, 207, 0.98)), #f8efd7;
  clip-path: polygon(0 7%, 92% 7%, 96% 15%, 98% 27%, 100% 50%, 98% 73%, 96% 85%, 92% 93%, 0 93%);
  filter: drop-shadow(0 0.75rem 0.45rem rgba(30, 22, 15, 0.23));
}
.achievement-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(104deg, transparent 18%, rgba(255, 255, 255, 0.4) 45%, transparent 72%), radial-gradient(circle at 35% 20%, rgba(255, 255, 255, 0.6), transparent 22rem);
  pointer-events: none;
}
.card-line { position: absolute; left: 2.5rem; right: 5.2rem; height: 2px; background: linear-gradient(90deg, transparent, #c5a366 13%, #c5a366 92%, transparent); opacity: 0.72; }
.card-line-top { top: 8%; }
.card-line-bottom { bottom: 8%; }
.achievement-copy { position: relative; z-index: 2; display: flex; min-width: 0; flex-direction: column; justify-content: center; }
.eyebrow {
  display: flex; align-items: center; gap: clamp(0.55rem, 1vw, 0.85rem); margin-bottom: 0.1rem;
  color: #a27b49; font-family: 'Cinzel Variable', 'Cinzel', Georgia, serif;
  font-size: clamp(0.85rem, 2.1vw, 1.55rem); font-weight: 700; letter-spacing: 0.075em; line-height: 1.2; text-transform: uppercase; white-space: nowrap;
}
.tiny-diamond { width: 0.62em; height: 0.62em; flex: none; background: currentColor; clip-path: polygon(50% 0, 66% 34%, 100% 50%, 66% 66%, 50% 100%, 34% 66%, 0 50%, 34% 34%); }
h1 {
  margin: 0; color: #604634; font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(2.4rem, 5vw, 4.2rem); font-weight: 700; letter-spacing: -0.025em; line-height: 0.92; white-space: nowrap; text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}
.medal-wrap {
  position: absolute; z-index: 4; top: 50%; left: 0; width: var(--medal-size); aspect-ratio: 1;
  transform: translateY(-50%) scale(0) rotate(-20deg);
  animation: medal-enter 850ms cubic-bezier(0.34, 1.56, 0.64, 1) 330ms forwards;
}
.end-star { position: absolute; z-index: 2; top: 50%; right: clamp(1.8rem, 4vw, 3.8rem); width: clamp(2rem, 4vw, 3.2rem); color: #b68a4c; fill: currentColor; transform: translateY(-50%); }
.sparkles { position: absolute; z-index: 6; inset: 0; pointer-events: none; }
.sparkle { position: absolute; color: #fff0ae; fill: currentColor; filter: drop-shadow(0 0 7px #ffd877); opacity: 0; animation: sparkle-pop 1.2s ease-out forwards; }
.sparkle-one { top: -15%; left: 6%; width: 1.25rem; animation-delay: 620ms; }
.sparkle-two { bottom: -18%; left: 13%; width: 2.4rem; animation-delay: 780ms; }
.sparkle-three { top: 2%; left: -5%; width: 0.9rem; animation-delay: 880ms; }
.sparkle-four { right: 9%; bottom: -13%; width: 1.2rem; animation-delay: 950ms; }
.spark-dot { position: absolute; width: 0.38rem; aspect-ratio: 1; border-radius: 50%; background: #fff3b3; box-shadow: 0 0 10px 3px #f7ce69; opacity: 0; animation: sparkle-pop 900ms ease-out forwards; }
.dot-one { top: 18%; left: 0; animation-delay: 720ms; }
.dot-two { right: 2%; bottom: 4%; animation-delay: 980ms; }
.orbit { position: absolute; z-index: 3; left: calc(var(--medal-size) * -0.35); width: calc(var(--medal-size) * 1.75); height: 55%; border: 2px solid transparent; border-bottom-color: rgba(255, 225, 139, 0.78); border-radius: 50%; opacity: 0; filter: drop-shadow(0 0 5px #f7cc64); pointer-events: none; }
.orbit-one { top: 28%; transform: rotate(19deg); animation: orbit-enter 1.25s ease-out 470ms forwards; }
.orbit-two { top: 15%; transform: rotate(-13deg) scale(0.9); animation: orbit-enter-two 1.4s ease-out 560ms forwards; }

@keyframes achievement-enter { to { opacity: 1; filter: blur(0); transform: translateX(0) scale(1); } }
@keyframes achievement-exit { from { opacity: 1; filter: blur(0); transform: translateX(0) scale(1); } to { opacity: 0; filter: blur(6px); transform: translateX(-2rem) scale(0.98); } }
@keyframes medal-enter { 70% { transform: translateY(-50%) scale(1.06) rotate(3deg); } 100% { transform: translateY(-50%) scale(1) rotate(0); } }
@keyframes sparkle-pop { 0% { opacity: 0; transform: scale(0) rotate(-35deg); } 38% { opacity: 1; transform: scale(1.2) rotate(0); } 100% { opacity: 0.75; transform: scale(0.9) rotate(12deg); } }
@keyframes orbit-enter { from { opacity: 0; transform: rotate(19deg) scale(0.55); } to { opacity: 0.7; transform: rotate(19deg) scale(1); } }
@keyframes orbit-enter-two { from { opacity: 0; transform: rotate(-13deg) scale(0.5); } to { opacity: 0.35; transform: rotate(-13deg) scale(0.9); } }
@keyframes aura-pulse { 50% { opacity: 0.65; transform: scale(1.04); } }

@media (max-width: 720px) {
  .achievement { --medal-size: clamp(6.7rem, 28vw, 8.5rem); width: min(36rem, 96vw); zoom: 0.75; }
  .achievement-card { height: clamp(6.2rem, 25vw, 7.6rem); margin-left: calc(var(--medal-size) * 0.48); padding-right: 3.3rem; padding-left: calc(var(--medal-size) * 0.58); }
  .eyebrow { font-size: clamp(0.53rem, 2.7vw, 0.85rem); letter-spacing: 0.04em; }
  h1 { font-size: clamp(1.8rem, 8.8vw, 2.7rem); }
  .end-star { right: 1.3rem; width: 1.5rem; }
  .card-line { right: 2.9rem; }
}
@media (prefers-reduced-motion: reduce) {
  .achievement, .medal-wrap, .sparkle, .spark-dot, .orbit { animation: none; opacity: 1; }
  .achievement { filter: none; transform: none; }
  .medal-wrap { transform: translateY(-50%); }
}
</style>
