// « Mon premier article ! » -> « mon-premier-article » (accents retirés, tirets, 60 caractères maximum).
export const slugify = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '')
