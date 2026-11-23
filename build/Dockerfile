FROM oven/bun:1 AS base
WORKDIR /app
COPY package.json ./
RUN bun install
COPY tsconfig.json ./
COPY src ./src
COPY views ./views
ENV PORT=3010
ENV QUEUE_FILE=/app/data/queue.json
VOLUME /app/data
EXPOSE 3010
CMD ["bun", "run", "src/server.ts"]
