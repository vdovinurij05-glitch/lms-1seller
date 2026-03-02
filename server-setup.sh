#!/bin/bash
# Server setup script for learn.1seller.ru on 155.212.184.39
# Run this once on the server to configure everything

set -e

echo "=== LMS 1Seller Server Setup ==="

# 1. Clone repository
echo "1. Cloning repository..."
mkdir -p /var/www
cd /var/www
git clone https://github.com/vdovinurij05-glitch/lms-1seller.git
cd lms-1seller

# 2. Create .env file
echo "2. Creating .env file..."
cat > .env << 'EOF'
DATABASE_URL="file:./prisma/prod.db"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://learn.1seller.ru"
EOF

# 3. Install dependencies and build
echo "3. Installing dependencies..."
npm ci

echo "4. Setting up database..."
npx prisma generate
npx prisma migrate deploy
npx tsx prisma/seed.ts

echo "5. Building application..."
npm run build

# 4. Setup PM2
echo "6. Starting with PM2..."
pm2 start ecosystem.config.js
pm2 save

# 5. Setup nginx
echo "7. Configuring nginx..."
cp nginx.conf /etc/nginx/sites-available/learn.1seller.ru
ln -sf /etc/nginx/sites-available/learn.1seller.ru /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# 6. SSL Certificate
echo "8. Getting SSL certificate..."
certbot --nginx -d learn.1seller.ru --non-interactive --agree-tos --email admin@1seller.ru

echo "=== Setup complete! ==="
echo "Site: https://learn.1seller.ru"
echo "Login: admin@1seller.ru / admin1seller2024"
