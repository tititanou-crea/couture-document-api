# Deploiement

Ce projet est pret pour un deploiement simple en deux parties :

- API FastAPI + PostgreSQL sur Render
- Frontend Next.js sur Vercel

## 1. API sur Render

1. Pousser le projet sur GitHub.
2. Dans Render, creer un nouveau Blueprint depuis le depot.
3. Render detecte `render.yaml` et cree :
   - le service web `couture-document-api`
   - la base PostgreSQL `couture-postgres`
   - un disque persistant pour `media/uploads`
4. Renseigner les variables marquees `sync: false` :

```text
BACKEND_CORS_ORIGINS=["https://votre-frontend.vercel.app"]
DEFAULT_ADMIN_EMAIL=votre-email
DEFAULT_ADMIN_PASSWORD=un-mot-de-passe-fort
DEFAULT_ADMIN_FIRST_NAME=Votre prenom
DEFAULT_ADMIN_LAST_NAME=Votre nom
```

Notes :

- La configuration Render utilise une petite offre payante pour eviter deux limites importantes : les disques persistants ne sont pas disponibles sur les services web gratuits et les bases PostgreSQL gratuites expirent.
- `SECRET_KEY` est genere automatiquement par Render.
- `DATABASE_URL` est branchee automatiquement sur la base PostgreSQL.
- Les migrations Alembic sont appliquees au demarrage du conteneur.
- Le health check Render utilise `/health`.

## 2. Frontend sur Vercel

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

## 3. Apres le premier deploiement

1. Ouvrir `https://votre-api-render.onrender.com/health`.
2. Ouvrir `https://votre-api-render.onrender.com/docs`.
3. Ouvrir le site Vercel.
4. Se connecter avec le compte administrateur configure dans Render.
5. Ajouter un livre et tester l'upload d'une couverture.

## 4. Points a surveiller

- Les uploads sont conserves sur le disque persistant Render. Pour une version plus robuste, remplacer ensuite ce stockage par Cloudinary ou S3.
- Garder `DEBUG=false` en production.
- Remplacer le mot de passe administrateur de developpement par un mot de passe fort.
- Si le domaine final change, mettre a jour `BACKEND_CORS_ORIGINS` sur Render et redeployer.
