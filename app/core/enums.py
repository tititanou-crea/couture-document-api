from enum import StrEnum


class DifficultyLevel(StrEnum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class TargetAudience(StrEnum):
    WOMEN = "women"
    MEN = "men"
    CHILDREN = "children"
    BABY = "baby"
    PLUS_SIZE = "plus_size"


class MainCategory(StrEnum):
    CLOTHING = "clothing"
    ACCESSORIES = "accessories"
    TECHNIQUE = "technique"
    PATTERNMAKING = "patternmaking"
    EMBROIDERY = "embroidery"
    PATCHWORK = "patchwork"
    UPCYCLING = "upcycling"
    ALTERATIONS = "alterations"


class ProjectType(StrEnum):
    DRESS = "dress"
    SKIRT = "skirt"
    TOP = "top"
    PANTS = "pants"
    JACKET = "jacket"
    COAT = "coat"
    BAG = "bag"
    POUCH = "pouch"
    HAIR_ACCESSORIES = "hair_accessories"
    TEXTILE_DECORATION = "textile_decoration"


class Technique(StrEnum):
    JERSEY = "jersey"
    SERGER = "serger"
    EMBROIDERY = "embroidery"
    PATCHWORK = "patchwork"
    ALTERATIONS = "alterations"
    PATTERNMAKING = "patternmaking"


class PatternFormat(StrEnum):
    PHYSICAL = "physical"
    DIGITAL = "digital"
    BOTH = "both"


class DocumentStatus(StrEnum):
    DRAFT = "draft"
    PENDING_VALIDATION = "pending_validation"
    VALIDATED = "validated"


class UserRole(StrEnum):
    ADMIN = "admin"
    VOLUNTEER = "volunteer"

