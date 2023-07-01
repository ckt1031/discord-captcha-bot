FROM node:20-alpine

WORKDIR /app

COPY . .

RUN npm install --omit=dev

EXPOSE ${PORT}

CMD ["npm", "start"]
