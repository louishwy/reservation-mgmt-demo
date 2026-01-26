set -e

MONGO_HOST=${MONGO_HOST:-mongo}
MONGO_PORT=${MONGO_PORT:-27017}
MAX_WAIT=${WAIT_FOR_DB_TIMEOUT:-120}

echo "[entrypoint] Waiting for MongoDB at ${MONGO_HOST}:${MONGO_PORT} (timeout ${MAX_WAIT}s)"

wait_for_db() {
  start=$(date +%s)
  while :; do
    if nc -z "$MONGO_HOST" "$MONGO_PORT" 2>/dev/null; then
      echo "[entrypoint] MongoDB reachable"
      return 0
    fi
    now=$(date +%s)
    if [ $((now - start)) -ge "$MAX_WAIT" ]; then
      echo "[entrypoint] Timed out waiting for MongoDB"
      return 1
    fi
    sleep 2
  done
}

if wait_for_db; then
  echo "[entrypoint] Running migrations: node dist/db/migrate.js"
  if [ -f dist/db/migrate.js ]; then
    node dist/db/migrate.js || echo "[entrypoint] Migration script exited with non-zero status"
  else
    echo "[entrypoint] Migration script not found at dist/db/migrate.js; skipping"
  fi
else
  echo "[entrypoint] MongoDB not reachable; proceeding anyway (migration may fail)"
fi

echo "[entrypoint] Starting backend: node dist/index.js"
exec node dist/index.js
