FROM node:26-bookworm-slim

WORKDIR /app
# 必要なツールをインストール
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Vite CLIを使えるように
RUN npm install -g create-vite