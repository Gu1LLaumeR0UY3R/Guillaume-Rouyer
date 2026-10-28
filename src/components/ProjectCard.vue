<script setup>
defineProps({ project: { type: Object, required: true } })
</script>

<template>
  <article class="card">
    <span v-if="project.status" class="status">{{ project.status }}</span>
    <span class="tag">{{ project.tag }}</span>
    <h3>{{ project.name }}</h3>
    <p>{{ project.desc }}</p>
    <ul class="stack"><li v-for="s in project.stack" :key="s">{{ s }}</li></ul>
    <a
      v-if="project.repo"
      class="link"
      :href="project.repo"
      target="_blank"
      rel="noopener"
      :aria-label="`Voir le code de ${project.name} sur GitHub`"
    >Voir le code sur GitHub →</a>
    <p v-else class="note">{{ project.note || 'Code non public' }}</p>
  </article>
</template>

<style scoped>
.card{flex:0 0 min(340px,82vw);display:flex;flex-direction:column;gap:12px;min-height:320px;padding:28px;border:1px solid var(--line);border-radius:var(--radius);background:var(--card);transition:transform .3s,box-shadow .3s,border-color .3s}
.card:hover{transform:translateY(-8px) rotate(-.6deg);box-shadow:0 24px 40px -18px var(--glow);border-color:var(--neon)}
.tag{color:var(--green);font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
h3{font-size:26px}
p{margin:0;color:var(--muted)}
.status{align-self:flex-start;padding:3px 10px;border-radius:999px;background:var(--deep);color:#d9ffe6;font-size:12px}
.stack{display:flex;flex-wrap:wrap;gap:6px;margin:auto 0 0;padding:0;list-style:none}
.stack li{padding:4px 10px;border:1px solid var(--line);border-radius:999px;font-size:13px}
.link{color:var(--green);font-weight:600;text-decoration:none}
.link:hover{text-decoration:underline}
.note{font-size:14px}
</style>
