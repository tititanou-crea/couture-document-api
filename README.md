# Couture Document API

API REST moderne pour gerer un catalogue documentaire specialise couture. Le projet couvre aujourd'hui les livres et prepare proprement les prochains modules : magazines, patrons PDF, validation documentaire, utilisateurs, medias, OCR et IA.

## Stack

- Python 3.12+
- FastAPI
- PostgreSQL
- SQLAlchemy 2.x async
- Pydantic v2
- pydantic-settings
- Alembic
- Docker et Docker Compose
- pytest
- Ruff

## Lancement rapide

```bash
cp .env.example .env
docker compose up --build
```

Au demarrage, l'application garantit le compte administrateur par defaut :

- email : `tania.rojasangele@gmail.com`
- mot de passe : `Admin123!`

Le mot de passe est stocke en base avec un hash bcrypt.

Si un premier lancement Docker a echoue pendant une migration sur une base de developpement vide, repartir proprement :

```bash
docker compose down -v
docker compose up --build
```

Documentation :

- Swagger UI : http://localhost:8000/docs
- ReDoc : http://localhost:8000/redoc
- Health check : http://localhost:8000/health
- Deploiement : voir `DEPLOYMENT.md`

Les migrations Alembic sont appliquees automatiquement au demarrage du conteneur API.

## Routes principales

Toutes les routes metier sont prefixees par `/api/v1`.

Books :

- `GET /api/v1/books`
- `GET /api/v1/books/search?q=couture`
- `GET /api/v1/books/{id}`
- `POST /api/v1/books`
- `PUT /api/v1/books/{id}`
- `DELETE /api/v1/books/{id}`

Auth :

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

Users admin :

- `GET /api/v1/users`
- `POST /api/v1/users`

Media :

- `POST /api/v1/upload/cover`

Metadata publique pour l'application Flutter :

- `POST /metadata`
- `POST /api/v1/metadata`

## Workflow documentaire

Les livres ont maintenant un statut documentaire :

- `draft` : brouillon, peut etre incomplet
- `pending_validation` : pret a relire, champs essentiels requis
- `validated` : fiche validee, champs essentiels requis et `validated_at` renseigne automatiquement si absent

Champs essentiels hors brouillon :

- `isbn`
- `title`
- `authors`

## Nouveaux champs Books

Les anciens champs `categories` et `tags` sont conserves pour compatibilite.

Champs metier couture ajoutes :

- `difficulty_levels` : `beginner`, `intermediate`, `advanced`
- `target_audiences` : `women`, `men`, `children`, `baby`, `plus_size`
- `main_categories` : `clothing`, `accessories`, `technique`, `patternmaking`, `embroidery`, `patchwork`, `upcycling`, `alterations`
- `project_types` : `dress`, `skirt`, `top`, `pants`, `jacket`, `coat`, `bag`, `pouch`, `hair_accessories`, `textile_decoration`
- `techniques` : `jersey`, `serger`, `embroidery`, `patchwork`, `alterations`, `patternmaking`
- `includes_patterns` : `true`, `false` ou `null`
- `status`
- `created_by`
- `validated_by`
- `validated_at`

Les valeurs metier sont validees avec des enums Python/Pydantic et stockees avec des enums SQLAlchemy/PostgreSQL.

## Exemple de creation de livre

```json
{
  "isbn": "9782842218232",
  "title": "La couture pratique",
  "subtitle": "Techniques et finitions",
  "description": "Un ouvrage de reference pour progresser en couture.",
  "authors": ["Atelier Couture"],
  "publisher": "Editions Textile",
  "published_date": "2024-01-15",
  "page_count": 240,
  "language": "fr",
  "cover_url": "https://example.com/covers/couture-pratique.jpg",
  "categories": ["couture", "techniques"],
  "tags": ["finitions", "patronage"],
  "difficulty_levels": ["beginner", "intermediate"],
  "target_audiences": ["women"],
  "main_categories": ["clothing", "technique"],
  "project_types": ["dress", "skirt"],
  "techniques": ["patternmaking", "serger"],
  "includes_patterns": true,
  "status": "draft"
}
```

## Authentification

Le projet contient un modele `User` complet :

- `id`
- `first_name`
- `last_name`
- `email`
- `hashed_password`
- `role`
- `is_active`
- `created_at`

Roles :

- `admin`
- `volunteer`

Il n'y a pas d'inscription publique. Le compte administrateur par defaut est cree ou remis a jour au demarrage pour permettre une connexion immediate :

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tania.rojasangele@gmail.com","password":"Admin123!"}'
```

Le token retourne est un JWT HS256. Les routes privees exigent ensuite :

```text
Authorization: Bearer <token>
```

Routes protegees :

- `/api/v1/books`
- `/api/v1/upload/cover`
- `/api/v1/users`
- `/api/v1/auth/me`

Les routes `/api/v1/users` sont reservees au role `admin`. Cote frontend, la session est conservee dans un cookie `SameSite=Strict`, le middleware redirige vers `/login` si la session manque ou expire, et `/volunteers` est reserve a l'administratrice.

## Upload couverture

L'upload local est volontairement simple et remplacable par S3 ou Cloudinary plus tard.

Endpoint :

```bash
curl -X POST http://localhost:8000/api/v1/upload/cover \
  -H "Content-Type: image/png" \
  -H "X-Filename: cover.png" \
  --data-binary "@cover.png"
```

Regles actuelles :

- extensions autorisees : `.jpg`, `.jpeg`, `.png`, `.webp`
- validation du type image
- validation de la signature du fichier
- taille max configurable
- nom unique genere automatiquement
- stockage local dans `media/uploads`
- retour d'une URL de type `/media/uploads/{filename}`

## Recherche metadata Flutter

L'application Flutter peut utiliser l'URL publique HTTPS de l'endpoint metadata :

```bash
flutter run -d chrome --dart-define=LIBRARY_METADATA_API_URL=https://ton-api.example.com/metadata
```

ou, si vous preferez rester sous le prefixe versionne :

```bash
flutter run -d chrome --dart-define=LIBRARY_METADATA_API_URL=https://ton-api.example.com/api/v1/metadata
```

L'endpoint est public et ne demande pas de JWT. Il accepte :

```json
{
  "type": "livre",
  "isbn": "978..."
}
```

```json
{
  "type": "magazine",
  "ean": "..."
}
```

```json
{
  "type": "magazine",
  "title": "Burda",
  "dateNumero": "2024"
}
```

Quand un livre est trouve dans le catalogue par ISBN, la reponse est :

```json
{
  "title": "Titre",
  "authors": ["Auteur 1"],
  "publisher": "Editeur",
  "description": "Resume",
  "coverUrl": "https://..."
}
```

Si aucune metadata n'est trouvee, l'API repond `204 No Content`.

Pour Flutter Web, Render doit autoriser l'origine de l'application dans la configuration CORS.
En developpement local avec un port Flutter variable, vous pouvez configurer :

```text
BACKEND_CORS_ORIGIN_REGEX=^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$
```

En production, ajoutez aussi l'origine exacte de l'application web dans `BACKEND_CORS_ORIGINS`,
par exemple :

```text
BACKEND_CORS_ORIGINS=https://ton-app.example.com
```

## Structure

```text
app/
  api/              Assemblage des versions d'API
  core/             Configuration, enums, securite, exceptions
  db/               Session SQLAlchemy async, types, metadata
  media/            Services de gestion media
  models/           Modeles SQLAlchemy et mixins documentaires
  schemas/          Schemas Pydantic v2
  repositories/     Acces aux donnees
  services/         Logique metier
  routes/           Endpoints FastAPI
  utils/            Helpers transverses futurs
  tests/            Tests pytest
alembic/            Migrations de base de donnees
media/uploads/      Stockage local developpement des images
```

## Architecture documentaire

Les modeles utilisent maintenant des mixins reutilisables :

- `UUIDPrimaryKeyMixin`
- `TimestampMixin`
- `BaseDocumentMixin`
- `ValidationWorkflowMixin`

Cette base prepare les futurs modeles `Magazine` et `PatternPdf` sans introduire d'architecture excessive.

## Recherche

La recherche actuelle reste simple via `GET /api/v1/books/search?q=...`.

Elle cherche dans :

- titre
- auteurs
- tags
- categories
- categories principales
- types de projets
- techniques

Le code est structure pour evoluer plus tard vers PostgreSQL full-text search et des filtres metier.

## Migrations

Appliquer les migrations :

```bash
docker compose exec api alembic upgrade head
```

Creer une migration apres modification des modeles :

```bash
docker compose exec api alembic revision --autogenerate -m "description"
```

Revenir en arriere d'une migration :

```bash
docker compose exec api alembic downgrade -1
```

## Tests

Installer les dependances localement, puis lancer :

```bash
pip install -e ".[dev]"
pytest
ruff check .
```

Les tests couvrent actuellement :

- CRUD Books
- validation ISBN
- validation stricte des enums
- brouillons incomplets
- workflow validation
- recherche
- login auth
- upload couverture

## Configuration

Variables principales :

- `APP_NAME`
- `DEBUG`
- `API_V1_PREFIX`
- `DATABASE_URL`
- `BACKEND_CORS_ORIGINS`
- `SECRET_KEY`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `DEFAULT_ADMIN_FIRST_NAME`
- `DEFAULT_ADMIN_LAST_NAME`
- `MEDIA_STORAGE_DIR`
- `MEDIA_BASE_URL`
- `MAX_UPLOAD_SIZE_MB`
- `ALLOWED_IMAGE_EXTENSIONS`

## Evolution prevue

Extensions naturelles :

- routes admin pour creer les utilisateurs
- dependances FastAPI pour proteger les routes d'ecriture
- forgot password
- modele Magazine
- modele PatternPdf
- stockage S3 ou Cloudinary
- OCR asynchrone
- enrichissement IA des fiches
- PostgreSQL full-text search
- filtres couture avances
