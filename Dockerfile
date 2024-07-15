FROM node:22-alpine as base

WORKDIR /src

# ======

FROM base as build

COPY package.json package-lock.json ./
RUN npm ci --production=false
COPY . .

RUN npm run build

# ======

FROM base
ENV NODE_ENV=production
EXPOSE 3000

COPY --from=build /src/.output /src/.output

CMD [ "node", ".output/server/index.mjs" ]
