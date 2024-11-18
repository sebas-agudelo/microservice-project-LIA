# Använd officiell Node.js-bild som bas
FROM node:16

# Skapa arbetskatalogen
WORKDIR /app

# Kopiera package.json och package-lock.json
COPY package*.json ./

# Installera beroenden
RUN npm install

# Kopiera all kod till arbetskatalogen
COPY . .

# Exponera porten som applikationen kör på
EXPOSE 3000

# Starta appen
CMD ["node", "src/app.js"]  
