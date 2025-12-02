# ---- Base Bun image ----
FROM oven/bun:1 AS base
WORKDIR /app

# Copy lock file + package metadata first for better layer caching
COPY bun.lock package.json ./

# Install dependencies (no node_modules from host)
RUN bun install --frozen-lockfile

# ---- Source stage ----
FROM base AS source
# Copy the rest of the project
COPY tsconfig.json vitest.config.ts wrangler.toml ./
COPY src ./src
COPY tests ./tests
# COPY README.md .  # Adding this for local dev
# Add other files if the code imports them (schemas, JSON, etc.)
# COPY schema ./schema

# At this point:
# - /app has dependencies
# - TypeScript source is present
# - Vitest config is present

# ---- Test image ----
FROM source AS test

# Ensure non-root user for better CI compatibility
#RUN addgroup -g 1001 bunuser && adduser -D -u 1001 -G bunuser bunuser
#USER bunuser

# Default command: run the test script from package.json via Bun
# Assumes "scripts": { "test": "vitest" } or similar
# CMD ["bun", "test"]

# ---- Web/runtime image ----
FROM source AS web
EXPOSE 8787

CMD ["bun", "run", "dev"]
 
LABEL authors="sbaptista"

