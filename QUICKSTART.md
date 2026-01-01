# 🚀 MyLibrary - Schnellstart

## Installation in 5 Minuten

### 1. Dateien kopieren

```bash
# Projekt nach /opt kopieren
sudo cp -r mylibrary /opt/
cd /opt/mylibrary
```

### 2. Installation ausführen

```bash
# Installations-Script ausführbar machen
sudo chmod +x install.sh

# Installation starten
sudo ./install.sh
```

Das Script:
- ✓ Erstellt alle Verzeichnisse
- ✓ Generiert sichere Passwörter
- ✓ Erstellt .env-Datei
- ✓ Setzt Berechtigungen

### 3. DNS konfigurieren

**Bei Cloudflare:**
1. DNS → Add Record
2. Type: `A`
3. Name: `bibliothek` (oder deine gewünschte Subdomain)
4. Content: `DEINE_SERVER_IP`
5. Proxy: An oder Aus (beides funktioniert)

**Bei anderem DNS-Provider:**
- Erstelle A-Record: `bibliothek.hoefer2000.de` → `DEINE_SERVER_IP`

### 4. Container starten

```bash
cd /opt/mylibrary

# Starten
docker compose up -d

# Logs beobachten (Ctrl+C zum Beenden)
docker compose logs -f
```

**Warte ca. 30-60 Sekunden** bis:
- ✓ Datenbank bereit ist
- ✓ Migrationen durchgelaufen sind
- ✓ Let's Encrypt Zertifikat ausgestellt ist

### 5. Zugriff

Öffne: `https://bibliothek.hoefer2000.de`

**Ersten Account erstellen:**
1. Klicke "Neuen Account erstellen"
2. Email, Username, Passwort eingeben
3. Registrieren
4. Anmelden
5. Fertig! 🎉

## Erste Schritte

### Standort erstellen

1. Gehe zu "Einstellungen"
2. Unter "Standorte verwalten" → "+ Neu"
3. Name eingeben (z.B. "Wohnzimmer Regal 1")
4. Speichern

### Erstes Buch hinzufügen

**Variante A: Mit Smartphone**
1. Klicke "ISBN scannen"
2. Erlaube Kamera
3. Scanne Barcode
4. Metadaten werden geladen
5. Standort auswählen
6. Speichern!

**Variante B: Manuell**
1. Klicke "Buch hinzufügen"
2. ISBN eingeben → "Suchen"
3. Oder alle Felder manuell
4. Speichern!

**Variante C: CSV Import**
1. Klicke "CSV Import"
2. Datei hochladen (siehe example_import.csv)
3. Warten
4. Fertig!

### Bibliothek öffentlich teilen

1. "Einstellungen" → "Öffentliche Bibliothek"
2. Haken bei "Bibliothek öffentlich teilen"
3. URL kopieren
4. Mit Freunden teilen!

## Wichtige Befehle

```bash
# Status prüfen
docker compose ps

# Logs anzeigen
docker compose logs -f

# Container neustarten
docker compose restart

# Container stoppen
docker compose down

# Updates installieren
docker compose pull
docker compose up -d

# Backup erstellen
docker exec mylibrary-db pg_dump -U mylibraryuser mylibrary > backup_$(date +%Y%m%d).sql
```

## Troubleshooting

### Container startet nicht
```bash
docker compose logs -f
```
→ Fehler in den Logs suchen

### "502 Bad Gateway"
- Warte 30 Sekunden (Container startet noch)
- Prüfe: `docker compose ps` → müssen "healthy" sein

### Keine Verbindung zur Datenbank
```bash
docker compose restart db
docker compose logs db
```

### Let's Encrypt Fehler
- Prüfe ob Port 80 & 443 offen sind
- Prüfe ob Domain auf Server zeigt
- Warte 2 Minuten, Traefik versucht es erneut

## Support

Vollständige Dokumentation: [README.md](README.md)

Bei Problemen:
- Logs prüfen: `docker compose logs -f`
- Container Status: `docker compose ps`
- GitHub Issues erstellen

---

**Viel Erfolg! 📚**
