FROM node:14.20.1

# create destination directory
RUN mkdir -p /usr/src/nuxt-app

WORKDIR /usr/src/nuxt-app

# update and install dependency
# RUN apk update && apk upgrade
# RUN apk add git

# copy the app, note .dockerignore
COPY . /usr/src/nuxt-app/

COPY package*.json ./

RUN npm install

# since it builds the server as well

# RUN npm run build