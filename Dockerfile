FROM node:16-alpine
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_ENV=production

RUN apk add chromium

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 9090
CMD node index.js