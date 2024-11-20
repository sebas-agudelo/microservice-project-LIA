# Använd Node.js-basen
FROM node:18

# Sätt arbetskatalogen i containern
WORKDIR /src/app

# Kopiera package.json och package-lock.json för att installera beroenden
COPY package*.json ./

# Installera beroenden
RUN npm install

# Kopiera all applikationskod
COPY . .

# Exponera port (t.ex. 3000 för en webbtjänst)
EXPOSE 3000

# Starta applikationen
CMD ["node", "src/app.js"]
