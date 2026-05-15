FROM node:14.21.2-alpine AS dependencies

RUN npm i -g @nestjs/cli

ENV TERM=xterm
ENV TZ=Asia/Bangkok
RUN date

RUN mkdir -p /usr/app
WORKDIR /usr/app

COPY package*.json ./

COPY . .
