#!/bin/bash

# VPN Billing Automation - One-Click Installation Script
# For Ubuntu 22.04 VPS with automatic domain configuration
# Usage: curl -fsSL https://raw.githubusercontent.com/your-repo/vpn-billing/main/install.sh | bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="vpn-billing"
APP_DIR="/opt/$APP_NAME"
SERVICE_USER="vpnbilling"
DB_NAME="vpn_billing_db"
DB_USER="vpn_billing_user"
DB_PASSWORD=$(openssl rand -base64 32)
ADMIN_EMAIL=""
DOMAIN=""
PORT="3000"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "================================="
    echo "  VPN Billing Automation Setup  "
    echo "================================="
    echo -e "${NC}"
}

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Get user input
get_configuration() {
    print_step "Getting configuration details..."
    
    # Domain configuration
    read -p "Enter your domain name (e.g., billing.yourdomain.com): " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        print_error "Domain name is required!"
        exit 1
    fi
    
    # Admin email
    read -p "Enter admin email for SSL certificates: " ADMIN_EMAIL
    if [[ -z "$ADMIN_EMAIL" ]]; then
        print_error "Admin email is required!"
        exit 1
    fi
    
    # Custom port (optional)
    read -p "Enter custom port (default: 3000): " CUSTOM_PORT
    if [[ -n "$CUSTOM_PORT" ]]; then
        PORT="$CUSTOM_PORT"
    fi
    
    print_success "Configuration received!"
}

# Update system
update_system() {
    print_step "Updating system packages..."
    apt update && apt upgrade -y
    print_success "System updated!"
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    # Install Node.js 20
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    # Install PostgreSQL
    apt-get install -y postgresql postgresql-contrib
    
    # Install Nginx
    apt-get install -y nginx
    
    # Install Certbot for SSL
    apt-get install -y certbot python3-certbot-nginx
    
    # Install Git and other utilities
    apt-get install -y git curl wget unzip build-essential
    
    print_success "Dependencies installed!"
}

# Setup database
setup_database() {
    print_step "Setting up PostgreSQL database..."
    
    # Start PostgreSQL service
    systemctl start postgresql
    systemctl enable postgresql
    
    # Create database and user
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
    
    print_success "Database setup completed!"
}

# Create application user
create_app_user() {
    print_step "Creating application user..."
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd --system --shell /bin/bash --home $APP_DIR --create-home $SERVICE_USER
    fi
    
    print_success "Application user created!"
}

# Download and setup application
setup_application() {
    print_step "Setting up VPN Billing application..."
    
    # Create application directory
    mkdir -p $APP_DIR
    cd $APP_DIR
    
    # Download application (replace with your actual repository)
    if [[ -d ".git" ]]; then
        git pull origin main
    else
        # For now, create the essential files structure
        mkdir -p {client/src/{components,pages,lib,hooks},server,shared}
        
        # Create package.json
        cat > package.json << 'EOF'
{
  "name": "vpn-billing-automation",
  "version": "1.0.0",
  "description": "VPN Billing Automation System",
  "main": "server/index.js",
  "scripts": {
    "dev": "tsx server/index.ts",
    "build": "vite build",
    "start": "node dist/server.js",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.3.2",
    "@neondatabase/serverless": "^0.9.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@tanstack/react-query": "^5.8.4",
    "drizzle-orm": "^0.29.0",
    "drizzle-zod": "^0.5.1",
    "express": "^4.18.2",
    "express-session": "^1.17.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.47.0",
    "zod": "^3.22.4",
    "wouter": "^2.12.1",
    "lucide-react": "^0.294.0",
    "tsx": "^4.1.2",
    "vite": "^5.0.0",
    "typescript": "^5.2.2"
  }
}
EOF
    fi
    
    # Install npm dependencies
    npm install
    
    # Create environment file
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
PORT=$PORT
DOMAIN=$DOMAIN
ADMIN_EMAIL=$ADMIN_EMAIL

# Session Configuration
SESSION_SECRET=$(openssl rand -base64 32)
EOF
    
    # Set proper permissions
    chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
    chmod 600 $APP_DIR/.env
    
    print_success "Application setup completed!"
}

# Setup systemd service
setup_systemd_service() {
    print_step "Creating systemd service..."
    
    cat > /etc/systemd/system/$APP_NAME.service << EOF
[Unit]
Description=VPN Billing Automation System
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
EnvironmentFile=$APP_DIR/.env
ExecStart=/usr/bin/npm start
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=$APP_NAME

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable $APP_NAME
    
    print_success "Systemd service created!"
}

# Setup Nginx reverse proxy
setup_nginx() {
    print_step "Configuring Nginx reverse proxy..."
    
    cat > /etc/nginx/sites-available/$APP_NAME << EOF
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
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Main application
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_redirect off;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:$PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security: Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
EOF
    
    # Enable site
    ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    nginx -t
    
    # Restart nginx
    systemctl restart nginx
    systemctl enable nginx
    
    print_success "Nginx configured!"
}

# Setup SSL certificate
setup_ssl() {
    print_step "Setting up SSL certificate with Let's Encrypt..."
    
    # Stop nginx temporarily
    systemctl stop nginx
    
    # Get SSL certificate
    certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email $ADMIN_EMAIL \
        --domains $DOMAIN
    
    # Update nginx configuration for HTTPS
    cat > /etc/nginx/sites-available/$APP_NAME << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_session_cache shared:SSL:1m;
    ssl_session_timeout 5m;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Main application
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_redirect off;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:$PORT;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Security: Deny access to hidden files
    location ~ /\. {
        deny all;
    }
}
EOF
    
    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --reload-nginx") | crontab -
    
    # Start nginx
    systemctl start nginx
    
    print_success "SSL certificate configured!"
}

# Setup firewall
setup_firewall() {
    print_step "Configuring firewall..."
    
    # Install ufw if not present
    apt-get install -y ufw
    
    # Reset firewall rules
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (be careful!)
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 'Nginx Full'
    
    # Allow PostgreSQL locally only
    ufw allow from 127.0.0.1 to any port 5432
    
    # Enable firewall
    ufw --force enable
    
    print_success "Firewall configured!"
}

# Start services
start_services() {
    print_step "Starting services..."
    
    # Initialize database
    cd $APP_DIR
    sudo -u $SERVICE_USER npm run db:push
    
    # Start application service
    systemctl start $APP_NAME
    
    # Check service status
    sleep 5
    if systemctl is-active --quiet $APP_NAME; then
        print_success "Application service started successfully!"
    else
        print_error "Failed to start application service!"
        systemctl status $APP_NAME
        exit 1
    fi
}

# Setup monitoring and logging
setup_monitoring() {
    print_step "Setting up monitoring and logging..."
    
    # Create log directory
    mkdir -p /var/log/$APP_NAME
    chown $SERVICE_USER:$SERVICE_USER /var/log/$APP_NAME
    
    # Setup logrotate
    cat > /etc/logrotate.d/$APP_NAME << EOF
/var/log/$APP_NAME/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
    
    # Create health check script
    cat > /usr/local/bin/vpn-billing-health << EOF
#!/bin/bash
curl -f http://localhost:$PORT/health || exit 1
EOF
    chmod +x /usr/local/bin/vpn-billing-health
    
    print_success "Monitoring setup completed!"
}

# Create backup script
setup_backup() {
    print_step "Setting up backup system..."
    
    mkdir -p /opt/backups/$APP_NAME
    
    cat > /opt/backups/$APP_NAME/backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups/$APP_NAME"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="\$BACKUP_DIR/vpn_billing_backup_\$DATE.sql"

# Database backup
sudo -u postgres pg_dump $DB_NAME > \$BACKUP_FILE

# Compress backup
gzip \$BACKUP_FILE

# Keep only last 30 days of backups
find \$BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: \$BACKUP_FILE.gz"
EOF
    
    chmod +x /opt/backups/$APP_NAME/backup.sh
    
    # Setup daily backup cron job
    (crontab -l 2>/dev/null; echo "0 2 * * * /opt/backups/$APP_NAME/backup.sh") | crontab -
    
    print_success "Backup system configured!"
}

# Final security hardening
security_hardening() {
    print_step "Applying security hardening..."
    
    # Disable root login if not already disabled
    if grep -q "^PermitRootLogin yes" /etc/ssh/sshd_config; then
        sed -i 's/^PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
        systemctl restart ssh
    fi
    
    # Setup fail2ban
    apt-get install -y fail2ban
    
    cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true

[sshd]
enabled = true
port = ssh
EOF
    
    systemctl enable fail2ban
    systemctl start fail2ban
    
    print_success "Security hardening completed!"
}

# Print final information
print_final_info() {
    print_success "Installation completed successfully!"
    echo
    echo -e "${BLUE}=== VPN BILLING AUTOMATION SYSTEM ===${NC}"
    echo -e "${GREEN}Application URL:${NC} https://$DOMAIN"
    echo -e "${GREEN}Database:${NC} PostgreSQL on localhost:5432"
    echo -e "${GREEN}Database Name:${NC} $DB_NAME"
    echo -e "${GREEN}Database User:${NC} $DB_USER"
    echo -e "${GREEN}Service Status:${NC} systemctl status $APP_NAME"
    echo -e "${GREEN}Application Logs:${NC} journalctl -u $APP_NAME -f"
    echo -e "${GREEN}Nginx Logs:${NC} tail -f /var/log/nginx/access.log"
    echo
    echo -e "${YELLOW}Important Files:${NC}"
    echo -e "  Application Directory: $APP_DIR"
    echo -e "  Environment File: $APP_DIR/.env"
    echo -e "  Nginx Config: /etc/nginx/sites-available/$APP_NAME"
    echo -e "  Service File: /etc/systemd/system/$APP_NAME.service"
    echo -e "  SSL Certificates: /etc/letsencrypt/live/$DOMAIN/"
    echo
    echo -e "${YELLOW}Useful Commands:${NC}"
    echo -e "  Restart Application: systemctl restart $APP_NAME"
    echo -e "  View Logs: journalctl -u $APP_NAME -f"
    echo -e "  Database Backup: /opt/backups/$APP_NAME/backup.sh"
    echo -e "  Renew SSL: certbot renew"
    echo
    echo -e "${GREEN}Database Password (save this securely):${NC}"
    echo -e "  $DB_PASSWORD"
    echo
    echo -e "${BLUE}Your VPN Billing System is now ready!${NC}"
    echo -e "${BLUE}Visit https://$DOMAIN to access the application${NC}"
}

# Main installation flow
main() {
    print_header
    check_root
    get_configuration
    update_system
    install_dependencies
    setup_database
    create_app_user
    setup_application
    setup_systemd_service
    setup_nginx
    setup_ssl
    setup_firewall
    start_services
    setup_monitoring
    setup_backup
    security_hardening
    print_final_info
}

# Run main function
main "$@"