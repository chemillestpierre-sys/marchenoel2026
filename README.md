# Marché de Noël 2026 — École Saint-Pierre de Chemillé-en-Anjou

Application web de gestion des inscriptions des parents bénévoles pour le **Marché de Noël 2026** de l'École Saint-Pierre (Chemillé-en-Anjou), organisée par l'**APEL Saint-Pierre (« La Christmas Team »)**.

Elle remplace le tableau partagé afin que chaque parent puisse s'inscrire simplement sur mobile ou ordinateur, sans jamais risquer de modifier ou d'effacer l'inscription d'un autre parent.

---

## Guide d'installation pas à pas (pour un non-développeur)

Temps estimé : environ 20 minutes. Aucun abonnement payant n'est nécessaire : tout fonctionne avec les offres gratuites de **Firebase (Spark)**, **GitHub** et **Vercel**.

---

### Étape 1 : Créer le projet Firebase (offre gratuite Spark)

1. Rendez-vous sur [https://console.firebase.google.com/](https://console.firebase.google.com/) et connectez-vous avec un compte Google (par exemple le compte de l'APEL).
2. Cliquez sur **« Créer un projet »** (ou **« Ajouter un projet »**).
3. Donnez un nom au projet, par exemple `marche-noel-saint-pierre-2026`, puis cliquez sur **Continuer**.
4. Vous pouvez désactiver *Google Analytics* (ce n'est pas utile ici), puis cliquez sur **Créer le projet**.
5. Vérifiez que votre projet est bien sur l'offre gratuite **Spark** (en bas à gauche de la console Firebase).

---

### Étape 2 : Activer la base de données Firestore et publier les règles de sécurité

1. Dans le menu de gauche de Firebase, cliquez sur **Créer** (ou *Build*) → **Firestore Database**.
2. Cliquez sur **Créer une base de données**.
3. Choisissez l'emplacement le plus proche, par exemple `eur3 (europe-west)` ou `europe-west9 (Paris)`, puis cliquez sur **Suivant**.
4. Choisissez **« Démarrer en mode production »** puis cliquez sur **Créer**.
5. Une fois la base créée, cliquez sur l'onglet **Règles** en haut de l'écran Firestore.
6. Ouvrez le fichier `firestore.rules` présent dans ce dépôt, copiez **tout** son contenu, et remplacez le texte existant dans l'éditeur de Firebase.
7. Cliquez sur le bouton **Publier**.

---

### Étape 3 : Activer l'authentification (Anonyme + E-mail/Mot de passe)

1. Dans le menu de gauche de Firebase, cliquez sur **Créer** → **Authentication**.
2. Cliquez sur **Commencer**.
3. Dans l'onglet **Sign-in method** (Modes de connexion) :
   - Cliquez sur **Anonyme**, activez le bouton **Activer**, puis cliquez sur **Enregistrer**.
   - Cliquez sur **Ajouter un fournisseur**, choisissez **Adresse e-mail/Mot de passe**, activez le premier interrupteur (**Activer**), puis cliquez sur **Enregistrer**.

---

### Étape 4 : Créer les comptes organisateurs et leur donner les droits admin

1. Toujours dans **Authentication**, ouvrez l'onglet **Users** (Utilisateurs).
2. Cliquez sur **Ajouter un utilisateur** pour chaque membre de l'équipe organisatrice qui doit accéder à l'espace organisateurs.
3. Saisissez son adresse e-mail et choisissez un mot de passe solide, puis cliquez sur **Ajouter un utilisateur**.
4. Dans la liste des utilisateurs qui s'affiche, repérez la colonne **UID (Identifiant utilisateur)** de chaque organisateur et **copiez cet UID** (icône copier à droite du code).
5. Retournez dans **Firestore Database** → onglet **Données**.
6. Cliquez sur **+ Démarrer une collection**.
   - ID de la collection : écrivez exactement `admins` (en minuscules), puis cliquez sur **Suivant**.
   - ID du document : **collez l'UID** de l'organisateur (ne cliquez pas sur « ID automatique » !).
   - Laissez les champs vides (ou cliquez simplement sur **Enregistrer**).
7. Répétez l'opération (ajouter un document dans la collection `admins` avec comme ID de document l'UID) pour chaque autre organisateur.

---

### Étape 5 : Récupérer les clés de configuration de l'application Web

1. Dans la console Firebase, cliquez sur la **roue dentée** à côté de *Vue d'ensemble du projet* → **Paramètres du projet**.
2. Descendez jusqu'à la section **Vos applications**.
3. Cliquez sur l'icône Web **`</>`**.
4. Donnez un surnom à l'application (ex. `site-marche-noel`) et cliquez sur **Enregistrer l'application** (ne cochez pas Firebase Hosting).
5. Firebase affiche un bloc `const firebaseConfig = { ... };`. Notez précieusement les 6 valeurs suivantes :
   - `apiKey` → correspond à `VITE_FIREBASE_API_KEY`
   - `authDomain` → correspond à `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → correspond à `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → correspond à `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → correspond à `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → correspond à `VITE_FIREBASE_APP_ID`

---

### Étape 6 : Mettre le code sur GitHub et le déployer sur Vercel

1. Créez un compte gratuit sur [GitHub](https://github.com/) si vous n'en avez pas, puis créez un nouveau dépôt (par exemple `marche-noel-saint-pierre-2026`) et poussez les fichiers de ce projet dedans.
2. Rendez-vous sur [https://vercel.com/](https://vercel.com/) et connectez-vous avec votre compte GitHub.
3. Cliquez sur **Add New…** → **Project** et sélectionnez votre dépôt GitHub.
4. Vercel détecte automatiquement **Vite** (commande de build `npm run build`, dossier de sortie `dist`).
5. Avant de cliquer sur Deploy, ouvrez la section **Environment Variables** et ajoutez une par une les **6 variables** relevées à l'étape 5 :
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
6. Cliquez sur **Deploy**. Après quelques instants, Vercel vous donne l'adresse publique de votre site (par exemple `https://marche-noel-saint-pierre-2026.vercel.app`).

---

### Étape 7 : Autoriser le domaine Vercel dans Firebase

1. Retournez dans la console Firebase → **Authentication** → onglet **Paramètres** (Settings) → **Domaines autorisés** (Authorized domains).
2. Cliquez sur **Ajouter un domaine**.
3. Collez le nom de domaine fourni par Vercel (sans `https://`, par exemple `marche-noel-saint-pierre-2026.vercel.app`) et validez.

---

### Étape 8 : Importer les inscriptions déjà reçues

1. Ouvrez votre site en ligne et cliquez en bas de page sur **« Espace organisateurs »** (ou allez sur `/organisateurs`).
2. Connectez-vous avec l'adresse e-mail et le mot de passe créés à l'étape 4.
3. Cliquez sur le bouton **« Importer les inscriptions initiales »**.
4. Les 18 inscriptions déjà enregistrées apparaissent immédiatement. Ce bouton peut être cliqué plusieurs fois sans jamais créer de doublon.

---

## Préparer l'édition de l'année prochaine

Toutes les informations de l'événement (date, horaires du programme, lien HelloAsso, date limite des commandes, liste des missions, capacités et créneaux) sont regroupées dans un seul fichier :

`src/data/missions.ts`

Il suffit de modifier ce fichier et de remplacer le PDF `public/flyer-marche-de-noel-2026.pdf` pour préparer l'édition suivante.

---

## Nettoyage RGPD après le marché de Noël

Après l'événement, connectez-vous à l'**Espace organisateurs** → onglet **Journal & RGPD** et cliquez sur **« Effacer toutes les coordonnées »** (double confirmation) pour supprimer définitivement tous les numéros de téléphone, adresses e-mail et commentaires de la base de données.
