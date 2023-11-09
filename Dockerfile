FROM node:16
# Create app directory
LABEL authors="brunocosta"
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production
RUN npm run build

COPY . .

EXPOSE 3000

CMD [ "node","bin/www" ]

LABEL version="1.0"