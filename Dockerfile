# --- Stage 1: Setup and TypeScript Compilation ---
FROM node:22-bookworm-slim AS ts-compiler
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig*.json ./
COPY tsconfig*.json ./
RUN npm ci
COPY . ./
RUN npm run build

# --- Stage 2: Copies Production Dependencies/TypeScript Removal/File Cleanup ---
FROM node:22-bookworm-slim AS ts-remover
WORKDIR /usr/src/app
COPY --from=ts-compiler /usr/src/app/package*.json ./
COPY --from=ts-compiler /usr/src/app/.env ./
RUN sed -i '/^PROTOCOL=/d;/^HOST=/d;/^PORT=/d' .env
COPY --from=ts-compiler /usr/src/app/build ./
COPY --from=ts-compiler /usr/src/app/src/v2/emailTemplates ./emailTemplates
RUN npm ci --omit=dev

# --- Stage 3: Final Image and Runs the SSR Server ---
FROM node:22-alpine as final
WORKDIR /usr/src/app
COPY --from=ts-remover /usr/src/app ./

USER 1000
EXPOSE 4001
CMD ["npm", "run", "serve"]
