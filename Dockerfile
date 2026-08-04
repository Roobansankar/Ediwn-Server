FROM oven/bun:alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --no-save

FROM oven/bun:alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json /app/bun.lock ./
RUN bun install --production --no-save
COPY --from=build /app/dist ./dist
EXPOSE 4000
CMD ["bun", "run", "start:prod"]
