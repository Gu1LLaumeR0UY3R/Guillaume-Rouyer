-- Contact « intelligent » : motif du message et créneau demandé (heure de Paris, « 2026-12-03T14:30 », vide si aucun).
ALTER TABLE messages ADD COLUMN motif TEXT NOT NULL DEFAULT '';
ALTER TABLE messages ADD COLUMN slot TEXT NOT NULL DEFAULT '';
-- Retrouver vite les créneaux déjà demandés (messages non fermés)
CREATE INDEX idx_messages_slot ON messages (slot) WHERE slot != '';
