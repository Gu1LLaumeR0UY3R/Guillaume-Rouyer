<template>
  <footer class="site-footer">
    <div class="container">
      <p>© 2026 Guillaume Rouyer · Fait avec Vue.js</p>
      <nav aria-label="Informations légales">
        <RouterLink to="/mentions-legales">Mentions légales</RouterLink>
        <RouterLink to="/confidentialite">Confidentialité</RouterLink>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.site-footer{padding:24px 0;border-top:1px solid var(--line);color:var(--muted);font-size:14px;text-align:center}
.container{display:flex;flex-wrap:wrap;gap:12px 24px;align-items:center;justify-content:center}
p{margin:0}
nav{display:flex;gap:20px}
a{text-decoration:none}
a:hover{color:var(--green);text-decoration:underline}
</style>
