# @cloudflareIPInfoBot

> Cloudflare IP Analyzer Bot built with Node.js + Telegraf.

## Core Modules

- `cloudflare.js`: Resolve IPs, detect CF IPs
- `searchService.js`: Main search handler
- `portService.js`: Scan for common open ports
- `cacheService.js`: Simple in-memory cache
- `botHandler.js`: Telegraf flow

## Commands

- `/start` — Open main menu
- `🔍 Search` — Prompt for IP/domain
- Replies with info like country, proxy status, open ports, etc.

## Installation

```bash
git clone https://github.com/youruser/cloudflare-ip-bot
cd cloudflare-ip-bot
npm install
node index.js
