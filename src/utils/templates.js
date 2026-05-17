const KEY = 'pdp_templates';

export function getTemplates() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}

export function saveTemplate(name, formData) {
  const templates = getTemplates();
  const tpl = {
    id: `tpl_${Date.now()}`,
    name: name.trim(),
    createdAt: new Date().toISOString(),
    data: {
      lieu:                  formData.lieu                  || '',
      entreprise_exterieure: formData.entreprise_exterieure || '',
      responsable:           formData.responsable           || '',
      contact_urgence:       formData.contact_urgence       || '',
      intervenants:          formData.intervenants          || '',
      type_travaux:          formData.type_travaux          || '',
      type_intervention:     formData.type_intervention     || '',
      environnement:         formData.environnement         || [],
      description_travaux:   formData.description_travaux   || '',
      // intentionnellement pas de photos, signatures, reponses, mesures
    },
  };
  templates.unshift(tpl);
  // Limite à 20 templates
  if (templates.length > 20) templates.splice(20);
  try { localStorage.setItem(KEY, JSON.stringify(templates)); } catch {}
  return tpl;
}

export function deleteTemplate(id) {
  const templates = getTemplates().filter(t => t.id !== id);
  try { localStorage.setItem(KEY, JSON.stringify(templates)); } catch {}
}
