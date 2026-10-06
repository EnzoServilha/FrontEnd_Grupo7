FROM node:22-alpine AS build
WORKDIR /app
COPY codetracker/package.json codetracker/package-lock.json ./
RUN npm ci
COPY codetracker/index.html codetracker/vite.config.js ./
COPY codetracker/public ./public
COPY codetracker/src ./src
RUN npm run build

FROM nginx:1.28-alpine
COPY codetracker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80