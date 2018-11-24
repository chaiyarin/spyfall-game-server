FROM node:10-alpine
WORKDIR /app
COPY .  /app
RUN npm install --no-optional && npm rebuild
CMD node server.js