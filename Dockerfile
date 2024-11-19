# Använd en officiell Node.js-bild
FROM node:18

# Ange arbetskatalog i containern
WORKDIR /usr/src/app

# Kopiera applikationsfiler
COPY package*.json ./
COPY . .

# Installera beroenden
RUN npm install

# Exponera porten för applikationen
EXPOSE 3000

# Starta applikationen
CMD ["npm", "run", "start"]
