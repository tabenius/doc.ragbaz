# doc.ragbaz.cc — deployment bundle

Publishes the RAGBAZ Atlas Docusaurus site (built from this repo) as a static
site served by nginx in a rootless Docker container behind the konsonans
HAProxy frontend at `doc.ragbaz.cc`.

## Layout

- `Dockerfile` — minimal `nginx:alpine` image; copies the prebuilt `../build/`.
- `nginx.conf` — static serving plus a `/healthz` endpoint for HAProxy checks.
- `docker-compose.yml` — runtime definition binding `127.0.0.1:8890`.
- `Makefile` — `build` (Docusaurus export + image), `image` (image only),
  `push`, `pull`, `deploy`, `clean`.
- `systemd/doc-ragbaz-cc.service` — user-systemd unit for boot-time startup.
- `haproxy/doc-ragbaz-cc.cfg` — routing snippet to merge into
  `/etc/haproxy/haproxy.cfg` on konsonans.

## Usage (on konsonans)

```bash
cd /data/src/doc.ragbaz.cc/deploy
docker login registry.ragbaz.cc
make build     # rebuild static export + registry-tagged image
make push      # publish registry.ragbaz.cc/ragbaz/doc-ragbaz-cc:latest
make pull      # fetch the published image on another machine
make deploy    # (re)create the container from DOC_IMAGE
```

The container listens on `127.0.0.1:8890`; HAProxy forwards `doc.ragbaz.cc`
there. The host certificate for `ragbaz.cc` must cover this subdomain.
The default image reference is
`registry.ragbaz.cc/ragbaz/doc-ragbaz-cc:latest`. Override it with
`DOC_IMAGE=... make deploy` for one-off testing.

## HAProxy

Merge `haproxy/doc-ragbaz-cc.cfg` into the `konsonans` frontend and backend
section of `/etc/haproxy/haproxy.cfg`, then `sudo systemctl reload haproxy`.

## Boot persistence

```bash
mkdir -p ~/.config/systemd/user
cp systemd/doc-ragbaz-cc.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now doc-ragbaz-cc.service
loginctl enable-linger "$USER"
```
