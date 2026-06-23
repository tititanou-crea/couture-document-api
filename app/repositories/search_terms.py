from __future__ import annotations

import unicodedata

SEARCH_ALIASES = {
    "accessoire": "accessories",
    "accessoires": "accessories",
    "avance": "advanced",
    "avancee": "advanced",
    "avancé": "advanced",
    "avancée": "advanced",
    "bebe": "baby",
    "bébé": "baby",
    "broderie": "embroidery",
    "debutant": "beginner",
    "debutante": "beginner",
    "débutant": "beginner",
    "débutante": "beginner",
    "enfant": "children",
    "enfants": "children",
    "femme": "women",
    "femmes": "women",
    "grandetaille": "plus_size",
    "grandestailles": "plus_size",
    "grande taille": "plus_size",
    "grandes tailles": "plus_size",
    "haut": "top",
    "hauts": "top",
    "homme": "men",
    "hommes": "men",
    "intermediaire": "intermediate",
    "intermédiaire": "intermediate",
    "jupe": "skirt",
    "jupes": "skirt",
    "livre": "book",
    "livres": "book",
    "manteau": "coat",
    "manteaux": "coat",
    "pantalon": "pants",
    "pantalons": "pants",
    "patronnage": "patternmaking",
    "patchwork": "patchwork",
    "pochette": "pouch",
    "pochettes": "pouch",
    "retouche": "alterations",
    "retouches": "alterations",
    "robe": "dress",
    "robes": "dress",
    "sac": "bag",
    "sacs": "bag",
    "surjeteuse": "serger",
    "technique": "technique",
    "techniques": "technique",
    "upcycling": "upcycling",
    "veste": "jacket",
    "vestes": "jacket",
    "vetement": "clothing",
    "vetements": "clothing",
    "vêtement": "clothing",
    "vêtements": "clothing",
}


def expand_search_terms(query: str) -> list[str]:
    normalized = _normalize(query)
    terms = {query.lower(), normalized}
    if alias := SEARCH_ALIASES.get(normalized):
        terms.add(alias)
    if alias := SEARCH_ALIASES.get(query.lower()):
        terms.add(alias)
    return sorted(term for term in terms if term)


def _normalize(value: str) -> str:
    without_accents = "".join(
        char
        for char in unicodedata.normalize("NFKD", value.lower())
        if not unicodedata.combining(char)
    )
    return " ".join(without_accents.split())
