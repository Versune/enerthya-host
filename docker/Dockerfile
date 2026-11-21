# Built from a release tarball (standalone output + static + public + drizzle).
# The installer builds this on the target host, so no registry or Node install
# is needed there.
FROM node:24-alpine

WORKDIR /app
ENV NODE_ENV=production \
    PORT=8420 \
    HOSTNAME=0.0.0.0

COPY --chown=node:node apps ./apps
COPY --chown=node:node node_modules ./node_modules
COPY --chown=node:node drizzle ./drizzle

USER node
EXPOSE 8420

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=6 \
  CMD wget -qO- http://127.0.0.1:8420/api/health >/dev/null || exit 1

CMD ["node", "apps/web/server.js"]
