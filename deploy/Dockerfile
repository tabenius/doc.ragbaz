# Static-site image for doc.ragbaz.cc (RAGBAZ Atlas).
# Build context is the doc.ragbaz.cc repo root so the prebuilt
# Docusaurus export under build/ can be copied in directly.
#   docker build -f deploy/Dockerfile -t doc-ragbaz-cc:latest .
FROM nginx:1.29-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY build/ /usr/share/nginx/html/
