FROM node:22-bookworm-slim

ARG AUDIVERIS_VERSION=5.7.0
ARG AUDIVERIS_DEB=Audiveris-${AUDIVERIS_VERSION}-ubuntu22.04-x86_64.deb

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates ghostscript libasound2 libfreetype6 libfontconfig1 \
  && curl -fsSL "https://github.com/Audiveris/audiveris/releases/download/${AUDIVERIS_VERSION}/${AUDIVERIS_DEB}" -o /tmp/audiveris.deb \
  && apt-get install -y /tmp/audiveris.deb \
  && rm -rf /var/lib/apt/lists/* /tmp/audiveris.deb

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/package.json
COPY services/omr-api/package.json services/omr-api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN npm ci --workspace @play-sheet-music/omr-api --workspace @play-sheet-music/contracts

COPY services/omr-api services/omr-api
COPY packages/contracts packages/contracts
RUN npm --workspace @play-sheet-music/omr-api run build

ENV HOST=0.0.0.0
ENV PORT=8787
ENV PDF_RASTERIZE_COMMAND='gs -dNOPAUSE -dBATCH -sDEVICE=tiffgray -r400 -sOutputFile="{output}" "{input}"'
ENV AUDIVERIS_COMMAND='/opt/audiveris/bin/Audiveris -batch -transcribe -export -output "{outputDir}" "{input}"'

EXPOSE 8787
CMD ["npm", "--workspace", "@play-sheet-music/omr-api", "run", "start"]
