FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ENV NODE_ENV=production
ENV PORT=3001

RUN npm run build

EXPOSE 3001

CMD ["npm", "run", "start"]
