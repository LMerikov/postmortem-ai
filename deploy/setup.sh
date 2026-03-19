#!/bin/bash
set -e

echo "=== Postmortem.ai Setup Script for CubePath VPS ==="

# System dependencies
apt update && apt upgrade -y
apt install -y python3 python3-pip python3-venv nodejs npm nginx certbot python3-certbot-nginx git

# Clone repo
mkdir -p /opt
cd /opt
git clone https://github.com/YOUR_USER/postmortem-ai.git
cd postmortem-ai

# Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
echo ">>> Edit /opt/postmortem-ai/backend/.env and add your ANTHROPIC_API_KEY"

# Frontend build
cd ../frontend
npm install
npm run build
mkdir -p /var/www/postmortem-ai
cp -r dist/* /var/www/postmortem-ai/

# Nginx setup
cp ../deploy/nginx.conf /etc/nginx/sites-available/postmortem-ai
ln -sf /etc/nginx/sites-available/postmortem-ai /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# Systemd service
cp ../deploy/postmortem.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable postmortem
systemctl start postmortem

echo "=== Setup complete! ==="
echo ">>> Get SSL: certbot --nginx -d postmortem-ai.cubepath.app"
echo ">>> Check logs: journalctl -u postmortem -f"
