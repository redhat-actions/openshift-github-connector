FROM node:14-alpine

RUN node --version && npm --version

WORKDIR /app

ENV NODE_ENV prod
ENV PORT 3000
EXPOSE 3000

COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build && \
    npm prune --production

ENTRYPOINT [ "npm", "start" ]
