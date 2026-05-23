# BiblioCouture Admin

Interface d’administration Next.js pour gérer le catalogue couture de l’association.

## Lancer le frontend

```bash
npm install
npm run dev
```

Par défaut, le frontend appelle l’API sur :

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Vous pouvez modifier cette valeur dans un fichier `.env.local`.

## Pages incluses

- Connexion
- Tableau de bord
- Liste des livres
- Recherche avec filtres
- Ajout de livre sur une seule page
- Modification de livre
- Profil utilisateur
- Gestion bénévoles, réservée au rôle admin
- Mot de passe oublié
- Aide / support
