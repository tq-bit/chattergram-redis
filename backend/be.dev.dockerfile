FROM node:14

WORKDIR /backend

COPY package.json .

RUN apt-get update || : && apt-get install python -y

RUN npm install

COPY . .

EXPOSE 8080
EXPOSE 9090

CMD [ "npm", "run", "dev" ]