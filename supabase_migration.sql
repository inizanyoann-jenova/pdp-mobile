-- ============================================================
--  Migration : PdP & Analyses de Risques Terrain
--  À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- 1. Table principale des Plans de Prévention
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plans_prevention (
  id                    uuid            DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at            timestamptz     DEFAULT now(),
  updated_at            timestamptz     DEFAULT now(),

  -- Informations chantier
  lieu                  text            NOT NULL,
  entreprise_exterieure text            NOT NULL,
  date_travaux          date            NOT NULL,
  responsable           text,
  contact_urgence       text,
  description_travaux   text,

  -- Photos : tableau de { url, source, name }
  photos                jsonb           DEFAULT '[]'::jsonb,

  -- Risques : { categorie_id: [risque_id, ...], ... }
  risques_selectionnes  jsonb           DEFAULT '{}'::jsonb,

  -- Mesures de prévention textuelles
  mesures_prevention    text,

  -- Statut du document
  statut                text            DEFAULT 'brouillon'
                                        CHECK (statut IN ('brouillon', 'valide', 'archive')),

  -- Traçabilité
  created_by            uuid            REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index pour les requêtes courantes
CREATE INDEX IF NOT EXISTS idx_pdp_created_by   ON plans_prevention (created_by);
CREATE INDEX IF NOT EXISTS idx_pdp_statut        ON plans_prevention (statut);
CREATE INDEX IF NOT EXISTS idx_pdp_date_travaux  ON plans_prevention (date_travaux DESC);

-- Trigger mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pdp_updated_at
  BEFORE UPDATE ON plans_prevention
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 2. Row Level Security (RLS)
-- ------------------------------------------------------------
ALTER TABLE plans_prevention ENABLE ROW LEVEL SECURITY;

-- Chaque utilisateur voit et gère ses propres plans
CREATE POLICY "Lecture ses propres plans" ON plans_prevention
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Création de ses plans" ON plans_prevention
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Modification de ses plans" ON plans_prevention
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Suppression de ses plans" ON plans_prevention
  FOR DELETE USING (auth.uid() = created_by);


-- 3. Bucket Storage pour les photos
-- ------------------------------------------------------------
-- À exécuter UNE SEULE FOIS — crée le bucket public "pdp-photos"
INSERT INTO storage.buckets (id, name, public)
VALUES ('pdp-photos', 'pdp-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Politique : les utilisateurs authentifiés peuvent uploader
CREATE POLICY "Upload photos PdP"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pdp-photos' AND auth.role() = 'authenticated');

-- Politique : lecture publique des photos
CREATE POLICY "Lecture publique photos PdP"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pdp-photos');

-- Politique : suppression par le propriétaire
CREATE POLICY "Suppression photos PdP"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pdp-photos' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ============================================================
-- Vérification : SELECT * FROM plans_prevention LIMIT 5;
-- ============================================================


-- 4. Table des actions correctives
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actions_correctives (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  plan_id      uuid        NOT NULL REFERENCES plans_prevention(id) ON DELETE CASCADE,
  description  text        NOT NULL,
  responsable  text,
  echeance     date,
  statut       text        DEFAULT 'todo' CHECK (statut IN ('todo', 'doing', 'done')),
  question_id  text,
  created_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_actions_plan_id ON actions_correctives (plan_id);
CREATE INDEX IF NOT EXISTS idx_actions_statut  ON actions_correctives (statut);

ALTER TABLE actions_correctives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRUD ses propres actions" ON actions_correctives
  FOR ALL USING (auth.uid() = created_by);

CREATE TRIGGER trg_actions_updated_at
  BEFORE UPDATE ON actions_correctives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
