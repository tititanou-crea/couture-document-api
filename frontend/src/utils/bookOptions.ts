import type {
  DifficultyLevel,
  MainCategory,
  ProjectType,
  TargetAudience,
  Technique,
} from "@/types/book";

export type Option<T extends string> = {
  label: string;
  value: T;
  hint?: string;
};

export const difficultyOptions: Option<DifficultyLevel>[] = [
  { label: "Débutant", value: "beginner" },
  { label: "Intermédiaire", value: "intermediate" },
  { label: "Avancé", value: "advanced" },
];

export const audienceOptions: Option<TargetAudience>[] = [
  { label: "Femme", value: "women" },
  { label: "Homme", value: "men" },
  { label: "Enfant", value: "children" },
  { label: "Bébé", value: "baby" },
  { label: "Grandes tailles", value: "plus_size" },
];

export const categoryOptions: Option<MainCategory>[] = [
  { label: "Vêtements", value: "clothing" },
  { label: "Accessoires", value: "accessories", hint: "Sacs, pochettes, accessoires cheveux..." },
  { label: "Technique", value: "technique", hint: "Ourlets, poches, ajustements, bases de couture." },
  { label: "Patronnage", value: "patternmaking" },
  { label: "Broderie", value: "embroidery" },
  { label: "Patchwork", value: "patchwork" },
  { label: "Upcycling", value: "upcycling" },
  { label: "Retouches", value: "alterations" },
];

export const projectOptions: Option<ProjectType>[] = [
  { label: "Robe", value: "dress" },
  { label: "Jupe", value: "skirt" },
  { label: "Haut", value: "top" },
  { label: "Pantalon", value: "pants" },
  { label: "Veste", value: "jacket" },
  { label: "Manteau", value: "coat" },
  { label: "Sac", value: "bag" },
  { label: "Pochette", value: "pouch" },
  { label: "Accessoires cheveux", value: "hair_accessories" },
  { label: "Décoration textile", value: "textile_decoration" },
];

export const techniqueOptions: Option<Technique>[] = [
  { label: "Jersey", value: "jersey" },
  { label: "Surjeteuse", value: "serger" },
  { label: "Broderie", value: "embroidery" },
  { label: "Patchwork", value: "patchwork" },
  { label: "Retouches", value: "alterations" },
  { label: "Patronnage", value: "patternmaking" },
];

export function labelFor(value: string) {
  const all = [
    ...difficultyOptions,
    ...audienceOptions,
    ...categoryOptions,
    ...projectOptions,
    ...techniqueOptions,
  ];
  return all.find((option) => option.value === value)?.label ?? value;
}
