FROM node:18
# Create app directory
LABEL authors="brunocosta"
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .
RUN npm run build

EXPOSE $PORT

CMD [ "sh", "-c", "GIT_COMMIT=$(cut -f1 .FETCH_HEAD) npm start" ]

LABEL version="1.0"
