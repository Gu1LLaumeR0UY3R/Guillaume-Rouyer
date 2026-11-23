<template>
  <svg class="medal" viewBox="0 0 210 210" role="img" aria-label="Médaillon de succès étoilé">
    <defs>
      <linearGradient id="medal-ivory" x1="34" y1="24" x2="175" y2="188">
        <stop stop-color="#fff9df" />
        <stop offset=".55" stop-color="#f6e8bd" />
        <stop offset="1" stop-color="#dfbd78" />
      </linearGradient>
      <linearGradient id="medal-gold" x1="53" y1="40" x2="154" y2="169">
        <stop stop-color="#e4c27f" />
        <stop offset=".48" stop-color="#a7743d" />
        <stop offset="1" stop-color="#7e512e" />
      </linearGradient>
      <linearGradient id="star-gold" x1="72" y1="60" x2="138" y2="147">
        <stop stop-color="#fff3bb" />
        <stop offset=".43" stop-color="#e9c36e" />
        <stop offset="1" stop-color="#b47930" />
      </linearGradient>
      <filter id="medal-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="7" result="blur" />
        <feFlood flood-color="#ffe6a0" flood-opacity=".68" />
        <feComposite in2="blur" operator="in" />
        <feMerge>
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g filter="url(#medal-glow)">
      <path fill="url(#medal-ivory)" d="m105 7 10 12c34 3 63 28 72 61l15 11-10 14 10 14-15 11c-9 33-38 58-72 61l-10 12-10-12c-34-3-63-28-72-61L8 119l10-14L8 91l15-11c9-33 38-58 72-61l10-12Z" />
      <circle cx="105" cy="105" r="79" fill="none" stroke="#d6ae63" stroke-width="3" />
      <circle cx="105" cy="105" r="70" fill="#fbf1d4" stroke="#fffdf3" stroke-width="4" />
      <path fill="url(#medal-gold)" d="m105 35 18 24 29 6 7 29 21 11-21 11-7 29-29 6-18 24-18-24-29-6-7-29-21-11 21-11 7-29 29-6 18-24Z" />
      <path fill="#fff7d8" d="m105 46 15 21 25 7 6 24 15 7-15 7-6 24-25 7-15 21-15-21-25-7-6-24-15-7 15-7 6-24 25-7 15-21Z" />
      <path fill="#a8733f" d="m105 52 14 26 28 5-17 22 17 22-28 5-14 26-14-26-28-5 17-22-17-22 28-5 14-26Z" />
      <path fill="url(#star-gold)" d="M105 65c4.1 24 13.4 33.4 37.5 37.5-24.1 4.1-33.4 13.4-37.5 37.5-4.1-24.1-13.4-33.4-37.5-37.5C91.6 98.4 100.9 89 105 65Z" />
      <path fill="#fff3bd" d="m105 65 3 37.5-3 37.5-3-37.5 3-37.5Z" />
    </g>
  </svg>
</template>

<style scoped>
.medal{display:block;width:100%;height:100%;overflow:visible}
</style>
