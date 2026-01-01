# 📚 MyLibrary - Persönliche Bibliotheksverwaltung

Moderne, selbst-gehostete Web-Anwendung zur Verwaltung deiner physischen Buchsammlung mit öffentlicher Sharing-Funktion.

## ✨ Features

### Kernfunktionen
- ✅ **Multi-User System** mit Registrierung und Login
- ✅ **Individuelle Bibliotheken** - jeder User hat seine eigene
- ✅ **Öffentliches Teilen** - Bibliothek kann über `/library/username` geteilt werden
- ✅ **ISBN-Scanner** - Barcode scannen mit Smartphone-Kamera
- ✅ **Automatische Metadaten** - von Open Library API
- ✅ **CSV Massenimport** - mit Fortschrittsanzeige
- ✅ **Erweiterte Suche** - nach Titel, Autor, ISBN, Tags
- ✅ **Standort-Verwaltung** - Regal, Zimmer, eigene Kategorien
- ✅ **Export als CSV** - vollständiger Bibliotheks-Export
- ✅ **Statistiken** - Top Autoren, Tags, kürzliche Zugänge

### Buch-Verwaltung
- ISBN (mit Auto-Lookup)
- Titel, Autor(en), Cover
- Standort (anpassbar)
- Tags (mehrfach)
- Notizen (Markdown)
- Zustand (Neu, Sehr gut, Gut, Akzeptabel)
- Pin-Funktion für Lieblingsbücher

### Öffentliche Bibliothek
- Eigene URL: `https://bibliothek.hoefer2000.de/library/username`
- Besucher können nur ansehen (Read-Only)
- Konfigurierbar welche Felder öffentlich sind
- Standort-Informationen automatisch privat
- Schönes, responsives Design
- Statistiken für öffentliche Ansicht

## 🚀 Installation

### Voraussetzungen
- Ubuntu Server 24.04
- Docker & Docker Compose
- Traefik Reverse Proxy (läuft bereits)
- Domain: `hoefer2000.de`

### Schritt 1: Projekt-Setup

```bash
# Projektname und Subdomain festlegen
PROJECT_NAME="mylibrary"
SUBDOMAIN="bibliothek"

# Verzeichnisse erstellen
sudo mkdir -p /opt/$PROJECT_NAME
sudo mkdir -p /mnt/media/$PROJECT_NAME/uploads

# Projekt-Dateien kopieren
cd /opt/$PROJECT_NAME
# <Alle Dateien aus dem Repository hierher kopieren>
```

### Schritt 2: Umgebungsvariablen

```bash
cd /opt/$PROJECT_NAME

# .env erstellen
cp .env.example .env
nano .env
```

**Wichtige Einstellungen in `.env`:**

```env
# Sichere Passwörter generieren!
DB_PASSWORD=$(openssl rand -base64 32)
SECRET_KEY=$(openssl rand -base64 64)

# Domain konfigurieren
SUBDOMAIN=bibliothek
DOMAIN=bibliothek.hoefer2000.de
ALLOWED_ORIGINS=https://bibliothek.hoefer2000.de
```

### Schritt 3: DNS konfigurieren

**Option A: Wildcard DNS (empfohlen)**
```
*.hoefer2000.de → Deine Server IP
```

**Option B: Einzelne Subdomain**
```
bibliothek.hoefer2000.de → Deine Server IP
```

### Schritt 4: Starten

```bash
cd /opt/mylibrary

# Syntax prüfen
docker compose config

# Container starten
docker compose up -d

# Logs verfolgen
docker compose logs -f

# Status prüfen
docker compose ps
```

### Schritt 5: Zugriff

1. Warte 1-2 Minuten auf Let's Encrypt Zertifikat
2. Öffne `https://bibliothek.hoefer2000.de`
3. Registriere deinen ersten Account
4. Füge Bücher hinzu!

## 📖 Verwendung

### Bücher hinzufügen

**Methode 1: ISBN Scanner**
1. Klicke auf "ISBN scannen"
2. Erlaube Kamera-Zugriff
3. Scanne den Barcode
4. Metadaten werden automatisch geladen
5. Ergänze ggf. Standort und Tags
6. Speichern!

**Methode 2: Manuelle Eingabe**
1. Klicke auf "Buch hinzufügen"
2. Gib ISBN ein (optional) und klicke "Suchen"
3. Oder fülle alle Felder manuell aus
4. Speichern!

**Methode 3: CSV Import**
1. Erstelle CSV mit Spalten: `ISBN, Title, Authors`
2. Klicke auf "CSV Import"
3. Datei hochladen
4. Fortschritt beobachten

### Bibliothek öffentlich teilen

1. Gehe zu "Einstellungen"
2. Aktiviere "Bibliothek öffentlich teilen"
3. Wähle aus welche Felder öffentlich sein sollen
4. Kopiere die öffentliche URL
5. Teile sie mit Freunden!

**Öffentliche URL:** `https://bibliothek.hoefer2000.de/library/deinusername`

### Standorte verwalten

1. Gehe zu "Einstellungen"
2. Unter "Standorte verwalten"
3. Klicke "+ Neu"
4. Name eingeben (z.B. "Wohnzimmer Regal 1")
5. Optional: Beschreibung
6. Speichern!

### CSV Export

1. Gehe zu "Bibliothek"
2. Klicke auf "Export"
3. CSV-Datei wird heruntergeladen

**CSV-Format:**
```csv
ISBN,Title,Authors,Publisher,Published Year,Page Count,Location,Condition,Tags,Notes,Added
978-3-...,Der Name der Rose,"Umberto Eco",Hanser,1982,608,Wohnzimmer,Sehr gut,"Krimi, Mittelalter",Signiert,2024-01-15T10:30:00
```

## 🔧 Wartung

### Updates durchführen

```bash
cd /opt/mylibrary

# Neue Images pullen
docker compose pull

# Container neu starten
docker compose up -d

# Alte Images aufräumen
docker image prune -a
```

**Wichtig:** Datenbank-Migrationen laufen automatisch beim Start!

### Backup erstellen

```bash
# Datenbank-Backup
docker exec mylibrary-db pg_dump -U mylibraryuser mylibrary > /opt/mylibrary/backups/db_$(date +%Y%m%d).sql

# Oder vollständiges Backup
tar -czf /mnt/backup/mylibrary_$(date +%Y%m%d).tar.gz \
  /opt/mylibrary \
  /mnt/media/mylibrary
```

### Backup wiederherstellen

```bash
# Datenbank wiederherstellen
cat backup.sql | docker exec -i mylibrary-db psql -U mylibraryuser mylibrary
```

## 🛠️ Troubleshooting

### Container startet nicht

```bash
# Logs prüfen
docker compose logs -f

# Neustart
docker compose restart

# Container-Status
docker ps -a
```

### "502 Bad Gateway"

**Mögliche Ursachen:**
1. Container noch nicht bereit → warte 30 Sekunden
2. Traefik-Labels falsch → prüfe docker-compose.yml
3. Nicht im traefik-proxy Netzwerk

```bash
# Netzwerk prüfen
docker network inspect traefik-proxy
```

### Datenbank-Verbindung fehlschlägt

```bash
# DB-Container prüfen
docker exec mylibrary-db pg_isready -U mylibraryuser

# Logs prüfen
docker compose logs db
```

### Migrationen schlagen fehl

```bash
# Manuell ausführen
docker exec mylibrary-app alembic upgrade head
```

## 🏗️ Architektur

### Tech Stack
- **Backend:** FastAPI (Python 3.11)
- **Datenbank:** PostgreSQL 16
- **Frontend:** Vanilla JS + Tailwind CSS
- **Auth:** JWT Tokens (HTTPOnly Cookies)
- **ORM:** SQLAlchemy + Alembic
- **API:** Open Library für Metadaten
- **Scanner:** QuaggaJS (Barcode)

### Verzeichnisstruktur

```
/opt/mylibrary/
├── docker-compose.yml      # Container-Konfiguration
├── .env                    # Umgebungsvariablen (NICHT committen!)
├── Dockerfile             # Container-Image
├── backend/               # FastAPI Backend
│   ├── main.py           # Hauptanwendung
│   ├── models.py         # Datenbank-Modelle
│   ├── schemas.py        # Pydantic Schemas
│   ├── auth.py           # Authentifizierung
│   ├── services.py       # ISBN Lookup etc.
│   ├── database.py       # DB Connection
│   ├── requirements.txt  # Python Dependencies
│   ├── alembic/          # Datenbank-Migrationen
│   └── routers/          # API Routes
├── frontend/             # Frontend
│   ├── index.html       # SPA
│   └── app.js           # JavaScript App
└── postgres/            # PostgreSQL Daten (automatisch erstellt)

/mnt/media/mylibrary/
└── uploads/             # Cover-Uploads (zukünftig)
```

### API Endpunkte

**Authentifizierung:**
- `POST /api/auth/register` - Registrierung
- `POST /api/auth/login` - Login

**User:**
- `GET /api/users/me` - Aktueller User
- `PATCH /api/users/me` - Profil aktualisieren

**Bücher:**
- `GET /api/books/` - Alle Bücher (mit Filtern)
- `GET /api/books/{id}` - Einzelnes Buch
- `POST /api/books/` - Buch erstellen
- `PATCH /api/books/{id}` - Buch aktualisieren
- `DELETE /api/books/{id}` - Buch löschen
- `GET /api/books/isbn/lookup/{isbn}` - ISBN Lookup
- `POST /api/books/import/csv` - CSV Import
- `GET /api/books/export/csv` - CSV Export

**Standorte:**
- `GET /api/locations/` - Alle Standorte
- `POST /api/locations/` - Standort erstellen
- `DELETE /api/locations/{id}` - Standort löschen

**Statistiken:**
- `GET /api/stats/` - Bibliotheks-Statistiken

**Öffentlich:**
- `GET /api/public/library/{username}` - User-Info
- `GET /api/public/library/{username}/books` - Öffentliche Bücher
- `GET /api/public/library/{username}/stats` - Öffentliche Stats

## 🔒 Sicherheit

- ✅ Passwörter mit bcrypt gehasht
- ✅ JWT Tokens mit Expiry
- ✅ HTTPS-only (via Traefik)
- ✅ SQL Injection Prevention (SQLAlchemy ORM)
- ✅ CORS korrekt konfiguriert
- ✅ User-Isolation (jeder sieht nur eigene Daten)
- ✅ Öffentliche Endpunkte: Read-Only

## 📝 CSV Import Format

**Minimal:**
```csv
ISBN
978-3-446-23351-1
978-0-14-017739-8
```

**Vollständig:**
```csv
ISBN,Title,Authors
978-3-446-23351-1,Der Name der Rose,Umberto Eco
978-0-14-017739-8,1984,"George Orwell"
```

## 🎨 Anpassungen

### Logo ändern

Ersetze in `frontend/index.html`:
```html
<i class="fas fa-book"></i> MyLibrary
```

### Farben anpassen

Tailwind CSS nutzt Utility-Classes:
- `bg-blue-600` → `bg-purple-600` (Purple Theme)
- `text-blue-500` → `text-green-500` (Green Accents)

### Domain ändern

In `.env`:
```env
SUBDOMAIN=meinebibliothek
DOMAIN=meinebibliothek.meinedomain.de
```

## 📊 Performance

- **Response Time:** < 100ms (API)
- **Database:** Indiziert (ISBN, Title, User)
- **Frontend:** Single Page App (schnelle Navigation)
- **Images:** Lazy Loading
- **CSV Import:** Batch Processing

## 🤝 Support

Bei Problemen:
1. Logs prüfen: `docker compose logs -f`
2. GitHub Issues
3. Email: support@example.com

## 📜 Lizenz

MIT License - Frei verwendbar!

## 🙏 Credits

- **Open Library API** für Buchmetadaten
- **QuaggaJS** für Barcode-Scanning
- **Tailwind CSS** für Design
- **FastAPI** für Backend
- **PostgreSQL** für Datenbank

---

**Viel Spaß mit deiner digitalen Bibliothek! 📚✨**
