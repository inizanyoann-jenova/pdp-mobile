import { supabase } from '../supabaseClient';

const LS_KEY = 'pdp_templates';

function lsGet() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function lsSet(templates) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(templates)); } catch {}
}

export async function getTemplates() {
  const { data, error } = await supabase
    .from('templates_pdp')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return lsGet();
  lsSet(data); // cache local
  return data;
}

export async function saveTemplate(name, formData) {
  const { data: { user } } = await supabase.auth.getUser();
  const tpl = {
    created_by: user?.id,
    name: name.trim(),
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
    },
  };
  const { data, error } = await supabase
    .from('templates_pdp')
    .insert([tpl])
    .select()
    .single();
  if (error) {
    // Fallback local
    const local = { ...tpl, id: `local_${Date.now()}`, created_at: new Date().toISOString() };
    lsSet([local, ...lsGet()]);
    return local;
  }
  return data;
}

export async function deleteTemplate(id) {
  if (String(id).startsWith('local_')) {
    lsSet(lsGet().filter(t => t.id !== id));
    return;
  }
  await supabase.from('templates_pdp').delete().eq('id', id);
}
