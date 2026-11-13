// Route inconnue sous /api : 404 JSON (sinon le site renverrait sa page d'accueil).
import { json } from '../_lib/http.js'
export const onRequest = () => json({ error: 'Introuvable' }, 404)
