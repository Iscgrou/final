#!/bin/bash

# VPN Billing Automation - One-Click Installation
# Usage: curl -fsSL https://raw.githubusercontent.com/your-username/vpn-billing/main/install.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}=================================${NC}"
    echo -e "${BLUE}  VPN Billing One-Click Install  ${NC}"
    echo -e "${BLUE}=================================${NC}"
}

print_step() { echo -e "${GREEN}[STEP]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check root
if [[ $EUID -ne 0 ]]; then
    print_error "Run as root: sudo bash install.sh"
    exit 1
fi

print_header

# Get configuration
read -p "Domain (e.g., billing.yourdomain.com): " DOMAIN
read -p "Admin email for SSL: " ADMIN_EMAIL
[[ -z "$DOMAIN" || -z "$ADMIN_EMAIL" ]] && { print_error "Domain and email required!"; exit 1; }

print_step "Installing system dependencies..."
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs postgresql postgresql-contrib nginx certbot python3-certbot-nginx git curl

print_step "Setting up database..."
systemctl start postgresql && systemctl enable postgresql
DB_PASSWORD=$(openssl rand -base64 32)
sudo -u postgres psql -c "CREATE DATABASE vpn_billing_db;"
sudo -u postgres psql -c "CREATE USER vpn_billing_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vpn_billing_db TO vpn_billing_user;"

print_step "Creating application user..."
useradd --system --shell /bin/bash --home /opt/vpn-billing --create-home vpnbilling || true

print_step "Setting up application..."
cd /opt/vpn-billing

# Create package.json with all dependencies
cat > package.json << 'EOF'
{
  "name": "vpn-billing-automation",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx server/index.ts",
    "build": "tsc && vite build",
    "start": "node dist/server/index.js",
    "db:push": "drizzle-kit push"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.2",
    "@neondatabase/serverless": "^0.9.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@tanstack/react-query": "^5.8.4",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "drizzle-orm": "^0.29.0",
    "drizzle-zod": "^0.5.1",
    "drizzle-kit": "^0.20.4",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.4",
    "wouter": "^2.12.1",
    "lucide-react": "^0.294.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss-animate": "^1.0.7",
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.1",
    "moment-jalaali": "^0.10.0",
    "persian-date": "^1.1.0",
    "tsx": "^4.1.2",
    "vite": "^5.0.0",
    "typescript": "^5.2.2",
    "@types/node": "^20.0.0",
    "@types/express": "^4.17.0",
    "@types/express-session": "^1.17.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
EOF

npm install

# Create environment file
cat > .env << EOF
DATABASE_URL=postgresql://vpn_billing_user:$DB_PASSWORD@localhost:5432/vpn_billing_db
PGHOST=localhost
PGPORT=5432
PGUSER=vpn_billing_user
PGPASSWORD=$DB_PASSWORD
PGDATABASE=vpn_billing_db
NODE_ENV=production
PORT=3000
DOMAIN=$DOMAIN
ADMIN_EMAIL=$ADMIN_EMAIL
SESSION_SECRET=$(openssl rand -base64 32)
EOF

# Create basic TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  },
  "include": ["client/src", "server", "shared"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Create Vite config
cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared")
    }
  },
  build: {
    outDir: 'dist/client'
  }
})
EOF

# Create Drizzle config
cat > drizzle.config.ts << 'EOF'
import type { Config } from "drizzle-kit";

export default {
  schema: "./shared/schema.ts",
  out: "./drizzle",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
EOF

# Create basic server structure
mkdir -p {server,shared,client/src/{components,pages,lib,hooks}}

# Create minimal server
cat > server/index.ts << 'EOF'
import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('dist/client'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist/client/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`VPN Billing System running on port ${PORT}`);
});
EOF

# Build basic client
mkdir -p client/public
cat > client/index.html << 'EOF'
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VPN Billing System</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
EOF

cat > client/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">VPN Billing System</h1>
        <p className="text-gray-600 mb-8">سیستم اتوماسیون صورتحساب VPN</p>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          سیستم با موفقیت نصب شد! 🎉
        </div>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

cat > client/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Vazir', Arial, sans-serif;
  direction: rtl;
}
EOF

# Create Tailwind config
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Build the application
npm run build

# Set permissions
chown -R vpnbilling:vpnbilling /opt/vpn-billing
chmod 600 .env

print_step "Creating systemd service..."
cat > /etc/systemd/system/vpn-billing.service << EOF
[Unit]
Description=VPN Billing Automation System
After=network.target postgresql.service

[Service]
Type=simple
User=vpnbilling
WorkingDirectory=/opt/vpn-billing
Environment=NODE_ENV=production
EnvironmentFile=/opt/vpn-billing/.env
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable vpn-billing

print_step "Configuring Nginx..."
cat > /etc/nginx/sites-available/vpn-billing << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/vpn-billing /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

print_step "Setting up SSL certificate..."
systemctl stop nginx
certbot certonly --standalone --non-interactive --agree-tos --email $ADMIN_EMAIL --domains $DOMAIN

# Update Nginx for HTTPS
cat > /etc/nginx/sites-available/vpn-billing << EOF
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    add_header Strict-Transport-Security "max-age=31536000" always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

systemctl start nginx

print_step "Starting services..."
systemctl start vpn-billing

# Setup cron for SSL renewal
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --reload-nginx") | crontab -

print_success "Installation completed!"
echo
echo -e "${BLUE}=== VPN BILLING SYSTEM READY ===${NC}"
echo -e "${GREEN}URL:${NC} https://$DOMAIN"
echo -e "${GREEN}Database Password:${NC} $DB_PASSWORD"
echo -e "${GREEN}Service Status:${NC} systemctl status vpn-billing"
echo -e "${GREEN}Logs:${NC} journalctl -u vpn-billing -f"
echo
echo -e "${YELLOW}Save this database password securely!${NC}"
echo -e "${BLUE}Visit https://$DOMAIN to access your VPN Billing System!${NC}"