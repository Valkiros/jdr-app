# Guide Github

Ce document explique les commandes essentielles pour travailler avec Git et Github sur ce projet.

## 1. Mettre en ligne (Sauvegarder et Envoyer vers Github)

Utilisez cette procédure quand vous avez fini de travailler sur une fonctionnalité ou une correction et que vous voulez sauvegarder votre travail sur le serveur (Github).

### Étape 1 : Vérifier ce qui a changé
Cette commande vous montre les fichiers modifiés en rouge.
```powershell
git status
```

### Étape 2 : Préparer les fichiers (Ajouter)
Cette commande ajoute **tous** les fichiers modifiés à la liste "prête à être envoyée".
```powershell
git add .
```

### Étape 3 : Valider les changements (Commit)
Cette commande crée un point de sauvegarde local avec un message descriptif. Remplacez "Message" par une description de ce que vous avez fait (ex: "Ajout onglet Richesse").
```powershell
git commit -m "Votre message explicatif ici"
```

### Étape 4 : Envoyer vers Github (Push)
Cette commande envoie vos sauvegardes locales vers le serveur distant.
```powershell
git push
```
*Si c'est la première fois ou si vous avez changé de branche, il faudra peut-être préciser : `git push origin main`*

---

## 2. Reprendre le travail (Récupérer depuis Github)

Utilisez cette procédure au début de votre session de travail si d'autres personnes (ou vous-même depuis un autre ordinateur) ont modifié le projet.

### Étape 1 : Récupérer les dernières versions (Pull)
Cette commande télécharge les modifications distantes et les fusionne avec votre version locale.
```powershell
git pull
```

### Cas particulier : Conflits
Si vous avez modifié des fichiers qui on *aussi* été modifiés sur le serveur, `git pull` peut échouer ou indiquer un conflit.
1. Git vous indiquera quels fichiers sont en conflit.
2. Ouvrez ces fichiers, cherchez les marqueurs `<<<<<<< HEAD` et `>>>>>>>`.
3. Choisissez quelle version garder (ou mélangez les deux manuellement).
4. Sauvegardez le fichier.
5. Faites `git add .` puis `git commit -m "Résolution conflit"` pour finir.
