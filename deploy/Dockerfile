# Static-site image for doc.ragbaz.xyz (RAGBAZ Atlas).
# Build context is the doc.ragbaz.xyz repo root so the prebuilt
# Docusaurus export under build/ can be copied in directly.
#   docker build -f deploy/Dockerfile -t doc-ragbaz-xyz:latest .
FROM nginx:1.29-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY build/ /usr/share/nginx/html/
