// Page /veille : même application, avec le titre et la description de la veille dans le HTML de départ.
import { htmlResponse, injectMeta, listMeta } from '../_lib/seo.js'

export async function onRequestGet(ctx) {
  const res = await ctx.next()
  if (!(res.headers.get('Content-Type') ?? '').includes('text/html')) return res
  try { return htmlResponse(res, injectMeta(await res.text(), listMeta), { cache: 'public, max-age=0, s-maxage=300' }) } catch (e) { console.error('veille_list_meta_error', e.message); return res }
}
