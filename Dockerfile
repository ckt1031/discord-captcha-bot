FROM node:lts-alpine

WORKDIR /app

COPY . .

RUN npm install --omit=dev

EXPOSE ${PORT}

CMD ["npm", "start"]
