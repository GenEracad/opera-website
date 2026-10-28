export const CATEGORY_ORDER = [
  "Escolas",
  "Habitação",
  "Equipamentos Públicos",
  "Certificações Energéticas",
  "Revisões de Projeto",
];

export const CATEGORY_LABELS_EN: Record<string, string> = {
  "Habitação": "Housing",
  "Escolas": "Schools",
  "Equipamentos Públicos": "Public Facilities",
  "Revisões de Projeto": "Project Reviews",
  "Certificações Energéticas": "Energy Certifications",
};

/** Shorter Portuguese labels shown on the site; projects keep the stored
 * category name, so filters and existing data are unaffected. */
export const CATEGORY_LABELS_PT: Record<string, string> = {
  "Equipamentos Públicos": "Equipamentos",
};

export function categoryLabel(category: string, locale: "pt" | "en"): string {
  if (!category) return category;
  if (locale === "pt") return CATEGORY_LABELS_PT[category] ?? category;
  return CATEGORY_LABELS_EN[category] ?? category;
}

/** Sorts known categories by CATEGORY_ORDER; anything unrecognized (legacy
 * categories not yet reassigned) sorts alphabetically after the known ones. */
export function sortCategories(categories: string[]): string[] {
  return [...categories].sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a);
    const ib = CATEGORY_ORDER.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}
