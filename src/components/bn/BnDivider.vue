<script setup>
defineProps({ top: { type: String, required: true }, bottom: { type: String, required: true } })
</script>

<template>
  <div class="divider" :style="{ background: bottom }" aria-hidden="true">
    <svg viewBox="0 0 1200 60" preserveAspectRatio="none">
      <path d="M0 0H1200V28C1130 52 1070 52 1000 28S870 4 800 28 670 52 600 28 470 4 400 28 270 52 200 28 70 4 0 28Z" :fill="top" />
    </svg>
  </div>
</template>

<style scoped>
.divider{height:56px;overflow:hidden}
svg{display:block;width:140%;height:100%;margin-left:-20%;animation:sway 9s ease-in-out infinite alternate}
@keyframes sway{from{transform:translateX(-4%)}to{transform:translateX(4%)}}
@media (prefers-reduced-motion:reduce){svg{animation:none}}
</style>
