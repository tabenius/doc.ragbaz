SHELL := /bin/bash

ROOT := $(realpath $(CURDIR)/..)
REGISTRY := registry.ragbaz.cc
IMAGE_NAME := ragbaz/doc-ragbaz-xyz
IMAGE_TAG := latest
IMAGE := $(REGISTRY)/$(IMAGE_NAME):$(IMAGE_TAG)
COMPOSE_PROJECT_NAME := doc-ragbaz-xyz
COMPOSE := COMPOSE_PROJECT_NAME=$(COMPOSE_PROJECT_NAME) DOC_IMAGE=$(IMAGE) docker compose -f $(CURDIR)/docker-compose.yml

.PHONY: all build image push pull deploy clean

all: build push deploy

# Rebuild the Docusaurus static export, then bake the registry image.
build:
	npm --prefix $(ROOT) run build
	docker build -f $(CURDIR)/Dockerfile -t $(IMAGE) $(ROOT)

# Build only the image from an existing $(ROOT)/build export.
image:
	docker build -f $(CURDIR)/Dockerfile -t $(IMAGE) $(ROOT)

push:
	docker push $(IMAGE)

pull:
	docker pull $(IMAGE)

deploy:
	$(COMPOSE) up -d --force-recreate --remove-orphans

clean:
	$(COMPOSE) down --remove-orphans || true
