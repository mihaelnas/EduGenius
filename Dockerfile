# === Stage 1: Build ===
FROM node:20-alpine AS builder

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json ./
COPY package-lock.json ./

# Installer les dépendances
# Utiliser --omit=dev pour les dépendances de développement en production si nécessaire, mais ici nous avons besoin des devDependencies pour le build.
RUN npm install

# Copier le reste des fichiers de l'application
COPY . .

# Construire l'application Next.js pour la production
RUN npm run build


# === Stage 2: Production ===
FROM node:20-alpine AS runner

WORKDIR /app

# Copier les dépendances de production depuis le stage builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copier les fichiers de build de Next.js
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# Exposer le port sur lequel l'application Next.js tourne
EXPOSE 3000

# Commande pour démarrer l'application
CMD ["npm", "start"]
