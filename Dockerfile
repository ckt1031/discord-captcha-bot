FROM node:lts-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

FROM node:lts-alpine AS production

WORKDIR /app

COPY --from=build /app/package.json /app/package-lock.json ./

RUN npm ci --omit=dev

# COPY assets and html
COPY --from=build /app/assets ./assets
COPY --from=build /app/html ./html
COPY --from=build /app/dist ./dist

CMD ["node", "dist/index.js"]
