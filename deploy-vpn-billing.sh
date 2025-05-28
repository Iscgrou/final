#!/bin/bash

# VPN Billing Automation System - Complete VPS Deployment Script
# Ubuntu 22.04 LTS Compatible
# Created with pure imagination and expertise! 🚀

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Welcome message
clear
echo -e "${CYAN}"
cat << "EOF"
 __     ______  _   _   ____  _ _ _ _                  
 \ \   / /  _ \| \ | | | __ )(_) | (_)_ __   __ _ 
  \ \ / /| |_) |  \| | |  _ \| | | | | '_ \ / _` |
   \ V / |  __/| |\  | | |_) | | | | | | | | (_| |
    \_/  |_|   |_| \_| |____/|_|_|_|_|_| |_|\__, |
                                           |___/ 
    Automation System - VPS Deployment Script
    
        🚀 Production-Ready Installation 🚀
EOF
echo -e "${NC}"

print_header "VPN Billing System - Complete VPS Setup"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root! Please run as a regular user with sudo privileges."
   exit 1
fi

# Check Ubuntu version
if ! grep -q "22.04" /etc/os-release; then
    print_warning "This script is optimized for Ubuntu 22.04 LTS. Continuing anyway..."
fi

# Get user inputs
print_header "Configuration Setup"

# Domain setup
echo -e "${CYAN}Enter your domain name (e.g., vpnbilling.example.com):${NC}"
read -p "Domain: " DOMAIN
if [[ -z "$DOMAIN" ]]; then
    print_error "Domain is required!"
    exit 1
fi

# Admin credentials
echo -e "${CYAN}Create admin user credentials:${NC}"
read -p "Admin Username: " ADMIN_USERNAME
if [[ -z "$ADMIN_USERNAME" ]]; then
    print_error "Admin username is required!"
    exit 1
fi

echo -e "${CYAN}Admin Password:${NC}"
read -s ADMIN_PASSWORD
echo
if [[ -z "$ADMIN_PASSWORD" ]]; then
    print_error "Admin password is required!"
    exit 1
fi

# Database setup
echo -e "${CYAN}Database Configuration:${NC}"
read -p "Database Name [vpn_billing]: " DB_NAME
DB_NAME=${DB_NAME:-vpn_billing}

read -p "Database User [vpnuser]: " DB_USER
DB_USER=${DB_USER:-vpnuser}

echo -e "${CYAN}Database Password:${NC}"
read -s DB_PASSWORD
echo
if [[ -z "$DB_PASSWORD" ]]; then
    print_error "Database password is required!"
    exit 1
fi

# Email setup (optional)
echo -e "${CYAN}Email Configuration (Optional - press Enter to skip):${NC}"
read -p "SMTP Host: " SMTP_HOST
read -p "SMTP Port [587]: " SMTP_PORT
SMTP_PORT=${SMTP_PORT:-587}
read -p "SMTP Username: " SMTP_USER
if [[ -n "$SMTP_USER" ]]; then
    echo -e "${CYAN}SMTP Password:${NC}"
    read -s SMTP_PASS
    echo
fi

# SSL Certificate choice
echo -e "${CYAN}SSL Certificate Setup:${NC}"
echo "1) Let's Encrypt (Free SSL - Recommended)"
echo "2) Self-signed certificate"
echo "3) Skip SSL setup (I'll configure manually)"
read -p "Choose option [1]: " SSL_OPTION
SSL_OPTION=${SSL_OPTION:-1}

# Confirmation
echo -e "${YELLOW}"
echo "================================"
echo "CONFIGURATION SUMMARY"
echo "================================"
echo "Domain: $DOMAIN"
echo "Admin User: $ADMIN_USERNAME"
echo "Database: $DB_NAME"
echo "DB User: $DB_USER"
echo "SSL Option: $SSL_OPTION"
echo "================================"
echo -e "${NC}"

read -p "Continue with installation? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    print_error "Installation cancelled."
    exit 1
fi

# Start installation
print_header "Starting VPS Installation"

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Node.js 20
print_status "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
print_status "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
print_status "Installing Nginx..."
sudo apt install -y nginx

# Install PM2 for process management
print_status "Installing PM2..."
sudo npm install -g pm2

# Install SSL tools if needed
if [[ "$SSL_OPTION" == "1" ]]; then
    print_status "Installing Certbot for Let's Encrypt..."
    sudo apt install -y certbot python3-certbot-nginx
fi

# Setup PostgreSQL
print_header "Configuring PostgreSQL Database"

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
print_status "Creating database and user..."
sudo -u postgres psql << EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

# Create application directory
print_status "Setting up application directory..."
APP_DIR="/opt/vpn-billing"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone/setup the application
cd $APP_DIR

# Create package.json
print_status "Creating application structure..."
cat > package.json << EOF
{
  "name": "vpn-billing-system",
  "version": "1.0.0",
  "description": "Complete VPN Billing Automation System",
  "main": "server/index.js",
  "scripts": {
    "build": "npm run build:client",
    "build:client": "vite build",
    "start": "NODE_ENV=production node server/index.js",
    "dev": "NODE_ENV=development tsx server/index.ts",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.2",
    "@neondatabase/serverless": "^0.9.0",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-aspect-ratio": "^1.0.3",
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-collapsible": "^1.0.3",
    "@radix-ui/react-context-menu": "^2.1.5",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-hover-card": "^1.0.7",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-menubar": "^1.0.4",
    "@radix-ui/react-navigation-menu": "^1.1.4",
    "@radix-ui/react-popover": "^1.0.7",
    "@radix-ui/react-progress": "^1.0.3",
    "@radix-ui/react-radio-group": "^1.1.3",
    "@radix-ui/react-scroll-area": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-separator": "^1.0.3",
    "@radix-ui/react-slider": "^1.1.2",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-toggle": "^1.0.3",
    "@radix-ui/react-toggle-group": "^1.0.4",
    "@radix-ui/react-tooltip": "^1.0.7",
    "@tanstack/react-query": "^5.8.4",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "cmdk": "^0.2.0",
    "connect-pg-simple": "^9.0.1",
    "date-fns": "^2.30.0",
    "drizzle-orm": "^0.29.0",
    "drizzle-zod": "^0.5.1",
    "embla-carousel-react": "^8.0.0",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "framer-motion": "^10.16.5",
    "html2canvas": "^1.4.1",
    "input-otp": "^1.2.4",
    "jspdf": "^2.5.1",
    "lucide-react": "^0.294.0",
    "memorystore": "^1.6.7",
    "moment-jalaali": "^0.10.0",
    "next-themes": "^0.2.1",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "persian-date": "^1.1.0",
    "pg": "^8.11.3",
    "react": "^18.2.0",
    "react-day-picker": "^8.9.1",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.48.2",
    "react-icons": "^4.12.0",
    "react-resizable-panels": "^0.0.55",
    "recharts": "^2.8.0",
    "tailwind-merge": "^2.0.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.7.9",
    "wouter": "^2.12.1",
    "ws": "^8.14.2",
    "xlsx": "^0.18.5",
    "zod": "^3.22.4",
    "zod-validation-error": "^1.5.0"
  },
  "devDependencies": {
    "@types/connect-pg-simple": "^7.0.3",
    "@types/express": "^4.17.21",
    "@types/express-session": "^1.17.10",
    "@types/node": "^20.9.0",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@types/ws": "^8.5.8",
    "@vitejs/plugin-react": "^4.1.1",
    "autoprefixer": "^10.4.16",
    "drizzle-kit": "^0.20.4",
    "esbuild": "^0.19.5",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "tsx": "^4.1.2",
    "typescript": "^5.2.2",
    "vite": "^4.5.0"
  }
}
EOF

# Install dependencies
print_status "Installing application dependencies..."
npm install

# Create environment file
print_status "Creating environment configuration..."
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
PGHOST=localhost
PGPORT=5432
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
PGDATABASE=$DB_NAME

# Application Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=$(openssl rand -base64 32)

# Admin Configuration
ADMIN_USERNAME=$ADMIN_USERNAME
ADMIN_PASSWORD=$ADMIN_PASSWORD

# Email Configuration (if provided)
EOF

if [[ -n "$SMTP_HOST" ]]; then
cat >> .env << EOF
SMTP_HOST=$SMTP_HOST
SMTP_PORT=$SMTP_PORT
SMTP_USER=$SMTP_USER
SMTP_PASS=$SMTP_PASS
EOF
fi

# Copy application files from current directory to deployment directory
print_status "Copying application files..."
cp -r /home/runner/workspace/* $APP_DIR/ 2>/dev/null || true

# Build the application
print_status "Building application..."
npm run build

# Setup PM2 configuration
print_status "Setting up PM2 process manager..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'vpn-billing',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# Create logs directory
mkdir -p logs

# Setup Nginx configuration
print_header "Configuring Nginx"

sudo tee /etc/nginx/sites-available/vpn-billing << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Client max body size for file uploads
    client_max_body_size 10M;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files
    location /assets {
        alias $APP_DIR/dist/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Favicon
    location /favicon.ico {
        alias $APP_DIR/dist/favicon.ico;
        expires 1y;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/vpn-billing /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Setup SSL Certificate
if [[ "$SSL_OPTION" == "1" ]]; then
    print_header "Setting up Let's Encrypt SSL Certificate"
    
    print_status "Obtaining SSL certificate for $DOMAIN..."
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
elif [[ "$SSL_OPTION" == "2" ]]; then
    print_header "Creating Self-Signed SSL Certificate"
    
    sudo mkdir -p /etc/ssl/vpn-billing
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/vpn-billing/private.key \
        -out /etc/ssl/vpn-billing/certificate.crt \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    # Update nginx config for SSL
    sudo tee -a /etc/nginx/sites-available/vpn-billing << EOF

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/ssl/vpn-billing/certificate.crt;
    ssl_certificate_key /etc/ssl/vpn-billing/private.key;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    location / {
        proxy_pass http://localhost:5000;
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
fi

# Setup firewall
print_header "Configuring Firewall"

sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432 # PostgreSQL (only if needed)

# Setup database schema
print_status "Initializing database schema..."
npm run db:push

# Start services
print_header "Starting Services"

# Start and enable PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql

# Start application with PM2
print_status "Starting VPN Billing application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup ubuntu -u $USER --hp /home/$USER

# Start and enable Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup automatic SSL renewal (if Let's Encrypt)
if [[ "$SSL_OPTION" == "1" ]]; then
    print_status "Setting up SSL certificate auto-renewal..."
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
fi

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/vpn-billing << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload vpn-billing
    endscript
}
EOF

# Create backup script
print_status "Creating backup script..."
sudo tee /usr/local/bin/vpn-billing-backup << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups/vpn-billing"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Backup database
pg_dump -h localhost -U $DB_USER -d $DB_NAME > \$BACKUP_DIR/database_\$DATE.sql

# Backup application files
tar -czf \$BACKUP_DIR/app_\$DATE.tar.gz -C $APP_DIR .

# Keep only last 7 days of backups
find \$BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

sudo chmod +x /usr/local/bin/vpn-billing-backup

# Setup daily backup cron
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/vpn-billing-backup") | crontab -

# Create system service for monitoring
sudo tee /etc/systemd/system/vpn-billing-monitor.service << EOF
[Unit]
Description=VPN Billing System Monitor
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pm2 resurrect
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable vpn-billing-monitor

# Final status check
print_header "Installation Complete - System Status"

# Check services
print_status "Checking service status..."

echo -e "${CYAN}PostgreSQL Status:${NC}"
sudo systemctl is-active postgresql

echo -e "${CYAN}Nginx Status:${NC}"
sudo systemctl is-active nginx

echo -e "${CYAN}Application Status:${NC}"
pm2 list

echo -e "${CYAN}Database Connection:${NC}"
if pg_isready -h localhost -p 5432 -U $DB_USER > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
fi

echo -e "${CYAN}Web Server Test:${NC}"
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 | grep -q "200\|302"; then
    echo -e "${GREEN}✓ Web server responding${NC}"
else
    echo -e "${RED}✗ Web server not responding${NC}"
fi

# Final success message
print_header "🎉 VPN Billing System Successfully Deployed! 🎉"

echo -e "${GREEN}"
cat << EOF
===============================================
    DEPLOYMENT SUMMARY
===============================================

🌐 Website URL: 
   • http://$DOMAIN
EOF

if [[ "$SSL_OPTION" == "1" || "$SSL_OPTION" == "2" ]]; then
    echo "   • https://$DOMAIN"
fi

cat << EOF

👤 Admin Access:
   • Username: $ADMIN_USERNAME
   • Password: [Hidden for security]

🗄️  Database:
   • Host: localhost
   • Database: $DB_NAME
   • User: $DB_USER

📁 Application Directory: $APP_DIR

🔧 Management Commands:
   • Check status: pm2 status
   • View logs: pm2 logs vpn-billing
   • Restart app: pm2 restart vpn-billing
   • Backup: /usr/local/bin/vpn-billing-backup

📊 System Monitoring:
   • Application logs: $APP_DIR/logs/
   • Nginx logs: /var/log/nginx/
   • System logs: journalctl -u vpn-billing-monitor

🔐 Security Features:
   • Firewall configured (UFW)
   • SSL encryption enabled
   • Security headers configured
   • Daily backups scheduled

===============================================
EOF
echo -e "${NC}"

print_status "Visit your domain to access the VPN Billing System!"
print_status "For support or issues, check the logs using: pm2 logs vpn-billing"

# Create quick reference file
cat > $APP_DIR/DEPLOYMENT_INFO.txt << EOF
VPN Billing System - Deployment Information
==========================================

Domain: $DOMAIN
Application Directory: $APP_DIR
Database: $DB_NAME
Admin Username: $ADMIN_USERNAME

Management Commands:
- pm2 status                 # Check application status
- pm2 restart vpn-billing    # Restart application
- pm2 logs vpn-billing       # View application logs
- sudo systemctl status nginx    # Check web server
- sudo systemctl status postgresql    # Check database

Backup & Maintenance:
- /usr/local/bin/vpn-billing-backup    # Manual backup
- Automatic backups run daily at 2 AM
- SSL certificates auto-renew (if Let's Encrypt)

Configuration Files:
- Nginx: /etc/nginx/sites-available/vpn-billing
- PM2: $APP_DIR/ecosystem.config.js
- Environment: $APP_DIR/.env

Deployment completed: $(date)
EOF

print_status "Deployment information saved to: $APP_DIR/DEPLOYMENT_INFO.txt"

echo -e "${PURPLE}🚀 VPN Billing Automation System is now ready for production use! 🚀${NC}"