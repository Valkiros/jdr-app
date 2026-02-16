# Guide de Mise à Jour Automatique - Codex debilium

Ce guide explique comment générer les clés de sécurité et publier une nouvelle version de "Codex debilium" pour que les joueurs reçoivent la mise à jour automatiquement.

## 1. Génération des Clés (À faire UNE SEULE fois)

Pour que l'application accepte une mise à jour, elle doit être "signée" numériquement par vous.

### Étape 1 : Ouvrir le terminal
Ouvrez votre terminal (PowerShell ou Cmd) dans le dossier du projet `d:\Application JDR`.

### Étape 2 : Lancer la commande de génération
Tapez la commande suivante :
```bash
npm run tauri signer generate -w src-tauri/tauri.conf.json
```
*(Si cela ne fonctionne pas, essayez `npx tauri signer generate -w src-tauri/tauri.conf.json`)*

### Étape 3 : Sauvegarder les clés
Le terminal va vous afficher deux clés et vous demander un mot de passe (optionnel mais recommandé).
- **Public Key (Clé Publique)** : Elle sera automatiquement ajoutée dans `tauri.conf.json`. C'est celle que tout le monde peut voir.
- **Private Key (Clé Privée)** : **GARDER SECRÈTE !** Elle sera sauvegardée dans un fichier `.env` ou sur votre ordinateur. Ne la partagez jamais sur GitHub public.

## 2. Publier une Mise à Jour

Quand vous avez fait des modifications et que vous voulez envoyer la version aux joueurs.

### Étape 1 : Changer la version
Ouvrez `src-tauri/tauri.conf.json` et augmentez le numéro de version.
*Exemple : passez de `0.1.0` à `0.1.1`.*

### Étape 2 : Construire l'application
Lancez la commande :
```bash
npm run tauri build
```
Cela va créer l'installateur (`.exe`) ET un fichier de signature (`.sig`).

### Étape 3 : Créer une Release sur GitHub
1. Allez sur votre dépôt GitHub -> onglet "Releases" -> "Draft a new release".
2. **Tag version** : mettez le même numéro (ex: `v0.1.1`).
3. **Titre** : "Mise à jour v0.1.1".
4. **Description** : Listez les changements.
5. **Drag & Drop** (Glisser-déposer) les fichiers générés qui se trouvent dans `src-tauri/target/release/bundle/nsis/` :
    - `Codex debilium_0.1.1_x64-setup.exe`
    - `Codex debilium_0.1.1_x64-setup.exe.sig` (très important !)
    - `latest.json` (si généré, sinon on le fera manuellement)

### Étape 4 : Publier
Cliquez sur "Publish release".
C'est tout ! Au prochain lancement, les joueurs verront la notification.
