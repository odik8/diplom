FROM node:20-alpine

RUN apk add --no-cache git

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 8081 19000 19001 19002 19006

ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

CMD ["npx", "expo", "start", "--port", "8081", "--host", "lan"]
