#!/bin/bash
set -e

echo "🚀 MyLibrary Installation Script"
echo "================================="
echo ""

# Variablen
PROJECT_NAME="mylibrary"
SUBDOMAIN="bibliothek"
INSTALL_DIR="/opt/$PROJECT_NAME"
DATA_DIR="/mnt/media/$PROJECT_NAME"

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funktion: Erfolgsmeldung
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Funktion: Warnung
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Funktion: Fehler
error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# Prüfe ob als root
if [ "$EUID" -ne 0 ]; then 
    error "Bitte als root ausführen (sudo)"
fi

# Prüfe Docker
if ! command -v docker &> /dev/null; then
    error "Docker ist nicht installiert"
fi

if ! command -v docker compose &> /dev/null; then
    error "Docker Compose ist nicht installiert"
fi

success "Docker ist installiert"

# Prüfe Traefik Netzwerk
if ! docker network inspect traefik-proxy &> /dev/null; then
    warning "traefik-proxy Netzwerk existiert nicht. Erstelle es..."
    docker network create traefik-proxy || error "Netzwerk konnte nicht erstellt werden"
    success "traefik-proxy Netzwerk erstellt"
else
    success "traefik-proxy Netzwerk existiert"
fi

# Erstelle Verzeichnisse
echo ""
echo "📁 Erstelle Verzeichnisse..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$DATA_DIR/uploads"
mkdir -p "$INSTALL_DIR/backups"
success "Verzeichnisse erstellt"

# Generiere sichere Passwörter
echo ""
echo "🔐 Generiere sichere Passwörter..."
DB_PASSWORD=$(openssl rand -base64 32)
SECRET_KEY=$(openssl rand -base64 64)
success "Passwörter generiert"

# Erstelle .env wenn nicht vorhanden
if [ ! -f "$INSTALL_DIR/.env" ]; then
    echo ""
    echo "⚙️  Erstelle .env-Datei..."
    cat > "$INSTALL_DIR/.env" << EOF
# Database Configuration
DB_NAME=mylibrary
DB_USER=mylibraryuser
DB_PASSWORD=$DB_PASSWORD

# Application Security
SECRET_KEY=$SECRET_KEY

# Domain Configuration
SUBDOMAIN=$SUBDOMAIN
DOMAIN=$SUBDOMAIN.hoefer2000.de
ALLOWED_ORIGINS=https://$SUBDOMAIN.hoefer2000.de
EOF
    success ".env-Datei erstellt"
else
    warning ".env-Datei existiert bereits - überspringe"
fi

# Setze Berechtigungen
echo ""
echo "🔧 Setze Berechtigungen..."
chown -R 1000:1000 "$DATA_DIR"
chmod 755 "$INSTALL_DIR"
success "Berechtigungen gesetzt"

# Zeige Zusammenfassung
echo ""
echo "================================="
echo "✅ Installation vorbereitet!"
echo "================================="
echo ""
echo "Nächste Schritte:"
echo "1. cd $INSTALL_DIR"
echo "2. docker compose up -d"
echo "3. docker compose logs -f"
echo ""
echo "Zugriff über: https://$SUBDOMAIN.hoefer2000.de"
echo ""
echo "Wichtig: Notiere diese Zugangsdaten:"
echo "  DB Password: $DB_PASSWORD"
echo "  Secret Key: $SECRET_KEY"
echo ""
echo "Diese sind auch in $INSTALL_DIR/.env gespeichert"
echo ""
