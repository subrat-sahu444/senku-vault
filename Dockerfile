FROM node:20-alpine

# Install Python, FFmpeg, and yt-dlp
RUN apk update && \
    apk add --no-cache python3 py3-pip ffmpeg curl && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

COPY package.json ./
COPY server.js ./
COPY public ./public

ENV PORT=3000
EXPOSE 3000

CMD ["node", "server.js"]
