<template>
  <section class="container missing">
    <h1>404</h1>
    <p>Cette page s'est perdue dans l'herbe.</p>
    <RouterLink class="btn btn-primary" to="/">Retour à l'accueil</RouterLink>
  </section>
</template>

<style scoped>
.missing{min-height:50vh;display:grid;align-content:center;justify-items:center;gap:12px;text-align:center}
h1{font-size:64px}
p{margin:0;color:var(--muted)}
</style>
