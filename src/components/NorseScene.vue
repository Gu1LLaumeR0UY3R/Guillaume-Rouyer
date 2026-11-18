<script setup>
// Décor du hero : nuit nordique (aurore, étoiles, montagnes, pins), une wyvern qui traverse le ciel et des runes qui montent comme des braises.
// Tout est en SVG/CSS (aucune image). La souris déplace légèrement les plans pour donner de la profondeur.
import { onBeforeUnmount, onMounted, ref } from 'vue'

const root = ref(null)

// Générateur pseudo-aléatoire fixe : le décor est identique à chaque chargement
const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647
const rand = rng(20260)

const stars = Array.from({ length: 80 }, () => ({ x: rand() * 1600, y: rand() * 430, r: 0.6 + rand() * 1.6, d: rand() * 6, s: 2.5 + rand() * 4 }))
const pine = (x, y, s) => { const P = (dx, dy) => `${x + dx * s} ${y + dy * s}`; return `M${P(0, 0)} L${P(-10, 26)} L${P(-5, 26)} L${P(-15, 52)} L${P(-7, 52)} L${P(-20, 80)} L${P(20, 80)} L${P(7, 52)} L${P(15, 52)} L${P(5, 26)} L${P(10, 26)} Z` }
const pines = Array.from({ length: 22 }, (_, i) => ({ x: 20 + i * 76 + rand() * 40, y: 640 + rand() * 40, s: 0.7 + rand() * 0.8 }))
  .map((p) => pine(p.x, p.y, p.s)).join(' ')

const RUNES = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ'
const embers = Array.from({ length: 16 }, (_, i) => ({
  ch: RUNES[Math.floor(rand() * RUNES.length)], left: 4 + (i / 16) * 92 + rand() * 4, size: 14 + rand() * 18,
  dur: 14 + rand() * 12, delay: -rand() * 24, drift: (rand() - 0.5) * 120,
}))

// Parallaxe à la souris (désactivée si l'utilisateur préfère moins d'animations)
let host = null
const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
function onMove(e) {
  const r = host.getBoundingClientRect()
  root.value.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3))
  root.value.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3))
}
onMounted(() => { if (!reduce) { host = root.value.parentElement; host.addEventListener('pointermove', onMove, { passive: true }) } })
onBeforeUnmount(() => host?.removeEventListener('pointermove', onMove))
</script>

<template>
  <div ref="root" class="norse" aria-hidden="true">
    <svg viewBox="0 90 1600 620" preserveAspectRatio="xMidYMid slice" focusable="false">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style="stop-color:var(--sky1)" /><stop offset=".55" style="stop-color:var(--sky2)" /><stop offset="1" style="stop-color:var(--sky3)" />
        </linearGradient>
        <linearGradient id="aur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style="stop-color:var(--aur1);stop-opacity:0" /><stop offset=".5" style="stop-color:var(--aur1);stop-opacity:.55" /><stop offset="1" style="stop-color:var(--aur2);stop-opacity:0" />
        </linearGradient>
        <radialGradient id="moon" cx=".5" cy=".5" r=".5">
          <stop offset=".35" style="stop-color:var(--moon);stop-opacity:.9" /><stop offset="1" style="stop-color:var(--moon);stop-opacity:0" />
        </radialGradient>
        <linearGradient id="fog" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style="stop-color:var(--fog);stop-opacity:0" /><stop offset=".55" style="stop-color:var(--fog);stop-opacity:.3" /><stop offset="1" style="stop-color:var(--fog);stop-opacity:0" />
        </linearGradient>
        <path id="wing" d="M352 154 L332 66 Q296 10 238 2 Q246 24 232 46 Q196 32 176 40 Q192 62 180 80 Q158 78 150 92 Q176 100 178 124 Q196 126 190 128 Q232 138 270 162 Z" />
      </defs>

      <rect y="60" width="1600" height="740" fill="url(#sky)" />

      <g class="stars">
        <circle v-for="(s, i) in stars" :key="i" :cx="s.x" :cy="s.y" :r="s.r" :style="{ animationDelay: `${s.d}s`, animationDuration: `${s.s}s` }" />
      </g>

      <g class="l-sky">
        <circle class="moon" cx="1240" cy="250" r="150" fill="url(#moon)" />
        <circle class="moon-disc" cx="1240" cy="250" r="44" />
      </g>

      <g class="aurora">
        <path class="a1" d="M0 250 C300 120 520 330 820 190 S1300 120 1600 230 L1600 420 C1300 330 1100 470 800 360 S300 470 0 380 Z" fill="url(#aur)" />
        <path class="a2" d="M-100 210 C300 90 700 260 980 150 S1380 100 1700 170 L1700 330 C1400 260 1200 380 960 290 S420 400 -100 320 Z" fill="url(#aur)" />
      </g>

      <!-- Wyvern : traverse le ciel d'un bord à l'autre, bat des ailes -->
      <g class="l-wyv">
        <g class="fly"><g class="bob"><g class="wyvern" transform="scale(.8)">
          <g class="wing far"><use href="#wing" transform="translate(-34 -10)" /></g>
          <path class="body" d="M524 131 C512 124 498 121 486 123 L468 103 L474 126 L450 113 L460 134 C442 141 412 152 382 158 C342 152 292 154 256 164 C222 174 172 192 122 202 C92 208 62 210 40 202 L16 186 L26 216 L52 222 C74 220 112 226 156 214 C186 206 206 198 224 192 L222 218 L210 228 L234 222 L248 196 C276 194 332 198 370 196 L368 216 L356 226 L380 220 L392 192 C414 188 442 168 464 150 C482 148 506 144 518 139 Z" />
          <g class="wing near">
            <use href="#wing" />
            <path class="ribs" d="M332 66 L238 2 M332 66 L176 40 M332 66 L150 92 M332 66 L190 128 M352 154 L270 162" />
          </g>
          <circle class="eye" cx="490" cy="127" r="3" />
        </g></g></g>
      </g>

      <g class="l-far"><path class="m-far" d="M0 520 L120 430 L210 470 L330 380 L430 450 L560 340 L680 430 L800 390 L920 460 L1060 350 L1190 440 L1320 380 L1450 450 L1600 400 V800 H0Z" /></g>
      <g class="l-mid"><path class="m-mid" d="M0 600 L90 520 L190 570 L300 480 L420 560 L540 500 L660 580 L790 490 L920 570 L1040 510 L1170 580 L1300 500 L1430 570 L1600 520 V800 H0Z" /></g>
      <rect class="mist" y="500" width="1600" height="240" fill="url(#fog)" />
      <g class="l-near"><path class="pines" :d="pines" /><path class="m-near" d="M0 700 C300 660 600 730 900 695 S1400 680 1600 715 V800 H0Z" /></g>
    </svg>

    <span v-for="(e, i) in embers" :key="i" class="ember" :style="{ left: `${e.left}%`, fontSize: `${e.size}px`, animationDuration: `${e.dur}s`, animationDelay: `${e.delay}s`, '--drift': `${e.drift}px` }">{{ e.ch }}</span>
  </div>
</template>

<style scoped>
.norse{--px:0;--py:0;position:absolute;inset:0;z-index:0;overflow:hidden;pointer-events:none;
  --sky1:#04070d;--sky2:#0c1626;--sky3:#1b2b45;--aur1:#5fe0c0;--aur2:#6f8cff;--moon:#dfe9ff;--fog:#9fb4d4;
  --far:#0c1626;--mid:#070d17;--near:#04070c;--pine:#03060a;--star:1;--wyv:#03050a;--rib:#33445f;--eye:#f2c75c;--ember:#c8a24a}
:global(:root[data-theme=light]) .norse{--sky1:#efe3c8;--sky2:#e6c996;--sky3:#d49a5c;--aur1:#fff;--aur2:#fff;--moon:#fff4cf;--fog:#fff2d6;
  --far:#b59c7d;--mid:#86705a;--near:#3d3229;--pine:#2c241d;--star:0;--wyv:#1c150e;--rib:#5a4630;--eye:#b3261e;--ember:#7a5a14}
svg{display:block;width:100%;height:100%}
.stars circle{fill:#fff;opacity:calc(var(--star) * .8);animation:twinkle 4s ease-in-out infinite}
.moon-disc{fill:var(--moon)}
.aurora{opacity:calc(var(--star) * .9);filter:blur(22px)}
.a1{animation:aurora 14s ease-in-out infinite alternate;transform-origin:800px 300px}
.a2{animation:aurora 19s ease-in-out -6s infinite alternate-reverse;transform-origin:900px 250px}
.m-far{fill:var(--far)}.m-mid{fill:var(--mid)}.m-near{fill:var(--near)}.pines{fill:var(--pine)}
.l-sky,.l-wyv,.l-far,.l-mid,.l-near{transition:transform .5s ease-out}
.l-sky{transform:translate(calc(var(--px) * -6px),calc(var(--py) * -4px))}
.l-wyv{transform:translate(calc(var(--px) * -14px),calc(var(--py) * -8px))}
.l-far{transform:translate(calc(var(--px) * -10px),calc(var(--py) * -3px))}
.l-mid{transform:translate(calc(var(--px) * -18px),calc(var(--py) * -5px))}
.l-near{transform:translate(calc(var(--px) * -28px),calc(var(--py) * -7px))}
.fly{animation:fly 30s linear -9s infinite}
.bob{animation:bob 7s ease-in-out infinite}
.wyvern .body{fill:var(--wyv)}.wyvern .wing use{fill:var(--wyv)}.wyvern .far{opacity:.6}
.ribs{fill:none;stroke:var(--rib);stroke-width:2;stroke-linecap:round}
.eye{fill:var(--eye)}
.wing{transform-box:view-box;transform-origin:352px 154px;animation:flap 2.4s ease-in-out infinite}
.wing.far{animation-delay:-.25s}
.ember{position:absolute;bottom:-40px;color:var(--ember);font-family:var(--runic);opacity:0;animation:rise linear infinite;text-shadow:0 0 12px var(--ember)}
@keyframes twinkle{50%{opacity:calc(var(--star) * .15)}}
@keyframes aurora{from{opacity:.45;transform:translateX(-50px) scaleY(.9)}to{opacity:1;transform:translateX(50px) scaleY(1.18)}}
@keyframes fly{from{transform:translate(-560px,205px)}to{transform:translate(1900px,205px)}}
@keyframes bob{50%{transform:translateY(-38px)}}
@keyframes flap{0%,100%{transform:rotate(-8deg) scaleY(1)}50%{transform:rotate(22deg) scaleY(.82)}}
@keyframes rise{0%{transform:translate(0,0) rotate(0);opacity:0}12%{opacity:.75}100%{transform:translate(var(--drift),-430px) rotate(40deg);opacity:0}}
@media (prefers-reduced-motion:reduce){.fly{animation:none;transform:translate(900px,205px)}.ember{display:none}}
</style>
