FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL
RUN npm run build

# ---- Serve Stage ----
FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=build /app/build /app/build

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
