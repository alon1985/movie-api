FROM node:8.10.0

WORKDIR /app/movie-api

# Install app dependencies
COPY package.json  package-lock.json ./
# For npm@5 or later, copy package-lock.json as well
RUN npm install pm2 -g
RUN npm install

# Bundle app source
COPY . .

EXPOSE 8080

CMD ["pm2-runtime", "start", "process.json"]