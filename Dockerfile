FROM node:20-alpine AS build

WORKDIR /app/youandinotai

COPY youandinotai/package.json youandinotai/package-lock.json ./
RUN npm ci

COPY youandinotai/ ./
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app/youandinotai

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app/youandinotai ./

EXPOSE 8080

CMD ["npm", "start"]
