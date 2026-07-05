# Deploiement

Ce projet est pret pour un deploiement gratuit de test en trois parties :

- API FastAPI sur Render Free
- PostgreSQL sur Supabase Free ou Neon Free
- Frontend Next.js sur Vercel

## 1. Base PostgreSQL gratuite

Creer d'abord une base PostgreSQL chez Supabase ou Neon.

Recuperer l'URL de connexion PostgreSQL. Elle ressemble a :

```text
postgresql://user:password@host:5432/database
```

L'application convertit automatiquement cette URL vers le driver async requis.

## 2. API sur Render

1. Pousser le projet sur GitHub.
2. Dans Render, creer un nouveau Blueprint depuis le depot.
3. Render detecte `render.yaml` et cree :
   - le service web `couture-document-api`
4. Renseigner les variables marquees `sync: false` :

```text
DATABASE_URL=postgresql://user:password@host:5432/database
BACKEND_CORS_ORIGINS=["https://votre-frontend.vercel.app"]
BACKEND_CORS_ORIGIN_REGEX=^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$|^https://couture-document(-[a-z0-9-]+)?-tanou-projects\.vercel\.app$|^https://couture-document-api\.vercel\.app$|^https://couture-document\.vercel\.app$
DEFAULT_ADMIN_EMAIL=votre-email
DEFAULT_ADMIN_PASSWORD=un-mot-de-passe-fort
DEFAULT_ADMIN_FIRST_NAME=Votre prenom
DEFAULT_ADMIN_LAST_NAME=Votre nom
```

Notes :

- Cette configuration Render utilise le plan gratuit. L'API peut se mettre en veille apres une periode d'inactivite.
- Pour eviter une connexion tres lente au premier acces, passer le service API sur un plan Render qui ne dort pas, ou configurer un moniteur externe qui appelle regulierement `/health`.
- Si le login affiche une erreur CORS, verifier que `BACKEND_CORS_ORIGIN_REGEX` autorise bien l'URL Vercel affichee dans la console du navigateur.
- Les uploads sont stockes localement sur Render Free et ne sont pas durables. Pour conserver les images, utiliser ensuite Cloudinary, Supabase Storage ou S3.
- `SECRET_KEY` est genere automatiquement par Render.
- Les migrations Alembic sont appliquees au demarrage du conteneur.
- Le health check Render utilise `/health`.

## 3. Frontend sur Vercel

1. Importer le meme depot dans Vercel.
2. Choisir le dossier racine du frontend :

```text
frontend
```

3. Renseigner la variable d'environnement :

```text
NEXT_PUBLIC_API_URL=https://votre-api-render.onrender.com/api/v1
```

4. Lancer le deploiement.

## 4. Apres le premier deploiement

1. Ouvrir `https://votre-api-render.onrender.com/health`.
2. Ouvrir `https://votre-api-render.onrender.com/docs`.
3. Ouvrir le site Vercel.
4. Se connecter avec le compte administrateur configure dans Render.
5. Ajouter un livre et tester l'upload d'une couverture.

## 5. Points a surveiller

- Les uploads ne sont pas persistants sur Render Free. Pour une version plus robuste, remplacer ensuite ce stockage par Cloudinary, Supabase Storage ou S3.
- Garder `DEBUG=false` en production.
- Remplacer le mot de passe administrateur de developpement par un mot de passe fort.
- Si le domaine final change, mettre a jour `BACKEND_CORS_ORIGINS` sur Render et redeployer.
