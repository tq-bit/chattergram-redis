FROM node:14 as build-stage
WORKDIR /backend
COPY package.json ./
RUN apt-get update || : && apt-get install python -y
RUN npm install
COPY . .
RUN npm run build

# Prod stage
FROM node:14 as production-stage
COPY --from=build-stage /backend/dist /backend
COPY --from=build-stage /backend/node_modules /backend/node_modules
EXPOSE 8080
EXPOSE 9090
CMD [ "node", "backend/server.js" ]