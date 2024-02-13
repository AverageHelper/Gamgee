FROM node:alpine as builder

WORKDIR /app

COPY . .

RUN npm install
RUN npm run firstrun:buildtime

FROM node:alpine

WORKDIR /app

COPY --from=builder /app/dist/server.js ./dist/server.js
COPY package*.json ./
COPY prisma prisma/
COPY scripts/launch_in_docker.sh .


RUN npm install --omit dev

ENV DATABASE_URL="file:/db/db.sqlite"

CMD ["sh", "/app/launch_in_docker.sh"]
