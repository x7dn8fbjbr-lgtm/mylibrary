// MyLibrary Frontend Application
const API_BASE = window.location.origin + '/api';
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// ==================== UTILITY FUNCTIONS ====================

function showLoading(show = true) {
    document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-yellow-600'
    };
    
    toast.className = `${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => toast.remove(), 5000);
}

async function apiCall(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    try {
        const response = await fetch(API_BASE + endpoint, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            logout();
            throw new Error('Nicht authentifiziert');
        }
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({detail: 'Unbekannter Fehler'}));
            throw new Error(error.detail || 'Request fehlgeschlagen');
        }
        
        return await response.json().catch(() => null);
    } catch (error) {
        showToast(error.message, 'error');
        throw error;
    }
}

// ==================== AUTHENTICATION ====================

function logout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    showLoginView();
}

async function login(username, password) {
    showLoading();
    try {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        const response = await fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: formData
        });
        
        if (!response.ok) throw new Error('Login fehlgeschlagen');
        
        const data = await response.json();
        authToken = data.access_token;
        localStorage.setItem('authToken', authToken);
        
        await loadCurrentUser();
        showView('library');
        showToast('Erfolgreich angemeldet!', 'success');
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function register(email, username, password) {
    showLoading();
    try {
        await apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({email, username, password})
        });
        
        showToast('Registrierung erfolgreich! Bitte anmelden.', 'success');
        showLoginForm();
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function loadCurrentUser() {
    currentUser = await apiCall('/users/me');
    document.getElementById('userName').textContent = currentUser.display_name || currentUser.username;
}

// ==================== VIEW MANAGEMENT ====================

function showView(viewName) {
    const views = {
        'library': renderLibraryView,
        'stats': renderStatsView,
        'settings': renderSettingsView
    };
    
    if (views[viewName]) {
        views[viewName]();
    }
}

function showLoginView() {
    document.getElementById('navMenu').classList.add('hidden');
    document.getElementById('userMenu').classList.add('hidden');
    showLoginForm();
}

function showLoginForm() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="max-w-md mx-auto mt-16">
            <div class="bg-gray-800 rounded-lg shadow-xl p-8">
                <h2 class="text-3xl font-bold text-center mb-8">
                    <i class="fas fa-book text-blue-500"></i> MyLibrary
                </h2>
                
                <div id="authForm">
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2">Email / Benutzername</label>
                        <input type="text" id="loginUsername" 
                            class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2">Passwort</label>
                        <input type="password" id="loginPassword" 
                            class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    </div>
                    
                    <button onclick="handleLogin()" 
                        class="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium mb-4">
                        Anmelden
                    </button>
                    
                    <button onclick="showRegisterForm()" 
                        class="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-medium">
                        Neuen Account erstellen
                    </button>
                </div>
            </div>
        </div>
    `;
}

function showRegisterForm() {
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="max-w-md mx-auto mt-16">
            <div class="bg-gray-800 rounded-lg shadow-xl p-8">
                <h2 class="text-2xl font-bold mb-6">Registrierung</h2>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Email</label>
                    <input type="email" id="regEmail" 
                        class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                </div>
                
                <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">Benutzername</label>
                    <input type="text" id="regUsername" 
                        class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <p class="text-xs text-gray-400 mt-1">Wird in der URL verwendet: /library/username</p>
                </div>
                
                <div class="mb-6">
                    <label class="block text-sm font-medium mb-2">Passwort</label>
                    <input type="password" id="regPassword" 
                        class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <p class="text-xs text-gray-400 mt-1">Mindestens 8 Zeichen</p>
                </div>
                
                <button onclick="handleRegister()" 
                    class="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium mb-4">
                    Registrieren
                </button>
                
                <button onclick="showLoginForm()" 
                    class="w-full bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-medium">
                    Zurück zum Login
                </button>
            </div>
        </div>
    `;
}

async function handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    await login(username, password);
}

async function handleRegister() {
    const email = document.getElementById('regEmail').value;
    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    await register(email, username, password);
}

// ==================== LIBRARY VIEW ====================

let currentBooks = [];
let currentLocations = [];

async function renderLibraryView() {
    showLoading();
    const content = document.getElementById('mainContent');
    
    try {
        currentBooks = await apiCall('/books/');
        currentLocations = await apiCall('/locations/');
        
        content.innerHTML = `
            <div class="mb-6 flex flex-wrap gap-4 items-center justify-between">
                <h2 class="text-3xl font-bold">Meine Bibliothek</h2>
                <div class="flex gap-2">
                    <button onclick="showAddBookModal()" 
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                        <i class="fas fa-plus"></i> Buch hinzufügen
                    </button>
                    <button onclick="showISBNScanModal()" 
                        class="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg">
                        <i class="fas fa-barcode"></i> ISBN scannen
                    </button>
                    <button onclick="showCSVImportModal()" 
                        class="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg">
                        <i class="fas fa-file-csv"></i> CSV Import
                    </button>
                    <button onclick="exportCSV()" 
                        class="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="mb-6 bg-gray-800 rounded-lg p-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="text" id="searchInput" placeholder="Suche nach Titel, Autor, ISBN..." 
                        class="px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        onkeyup="filterBooks()">
                    
                    <select id="locationFilter" onchange="filterBooks()" 
                        class="px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Alle Standorte</option>
                        ${currentLocations.map(loc => `<option value="${loc.id}">${loc.name}</option>`).join('')}
                    </select>
                    
                    <select id="viewMode" onchange="toggleViewMode()" 
                        class="px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="grid">Grid-Ansicht</option>
                        <option value="list">Listen-Ansicht</option>
                    </select>
                    
                    <button onclick="clearFilters()" 
                        class="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg">
                        Filter zurücksetzen
                    </button>
                </div>
            </div>
            
            <!-- Books Grid -->
            <div id="booksContainer" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                ${renderBooks(currentBooks)}
            </div>
            
            ${currentBooks.length === 0 ? `
                <div class="text-center py-16 text-gray-400">
                    <i class="fas fa-book-open text-6xl mb-4"></i>
                    <p class="text-xl">Noch keine Bücher in deiner Bibliothek</p>
                    <p class="mt-2">Füge dein erstes Buch hinzu!</p>
                </div>
            ` : ''}
        `;
    } finally {
        showLoading(false);
    }
}

function renderBooks(books) {
    return books.map(book => {
        const authors = book.authors ? JSON.parse(book.authors).join(', ') : 'Unbekannt';
        const tags = book.tags.map(t => t.name).join(', ');
        
        return `
            <div class="book-card bg-gray-800 rounded-lg overflow-hidden cursor-pointer" onclick="showBookDetails(${book.id})">
                ${book.is_pinned ? '<div class="bg-yellow-500 text-xs px-2 py-1 text-center">⭐ Angepinnt</div>' : ''}
                <img src="${book.cover_url || '/static/placeholder.png'}" 
                    alt="${book.title}" 
                    class="w-full h-64 object-cover bg-gray-700">
                <div class="p-4">
                    <h3 class="font-bold text-sm mb-1 truncate" title="${book.title}">${book.title}</h3>
                    <p class="text-xs text-gray-400 truncate">${authors}</p>
                    ${tags ? `<p class="text-xs text-blue-400 mt-2">${tags}</p>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function filterBooks() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const locationId = document.getElementById('locationFilter').value;
    
    let filtered = currentBooks;
    
    if (search) {
        filtered = filtered.filter(book => {
            const title = book.title.toLowerCase();
            const authors = (book.authors || '').toLowerCase();
            const isbn = (book.isbn || '').toLowerCase();
            return title.includes(search) || authors.includes(search) || isbn.includes(search);
        });
    }
    
    if (locationId) {
        filtered = filtered.filter(book => book.location_id == locationId);
    }
    
    document.getElementById('booksContainer').innerHTML = renderBooks(filtered);
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('locationFilter').value = '';
    filterBooks();
}

function toggleViewMode() {
    const mode = document.getElementById('viewMode').value;
    const container = document.getElementById('booksContainer');
    
    if (mode === 'list') {
        container.className = 'space-y-4';
    } else {
        container.className = 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6';
    }
}

async function exportCSV() {
    window.location.href = API_BASE + '/books/export/csv';
    showToast('Export gestartet', 'success');
}


// ==================== BOOK MODALS ====================

function showAddBookModal() {
    const modal = createModal('Buch hinzufügen', `
        <form id="addBookForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">ISBN (optional)</label>
                <div class="flex gap-2">
                    <input type="text" id="bookISBN" 
                        class="flex-1 px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <button type="button" onclick="lookupISBN()" 
                        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">
                        Suchen
                    </button>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Titel *</label>
                <input type="text" id="bookTitle" required
                    class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Autor(en)</label>
                <input type="text" id="bookAuthors" placeholder="Mehrere mit Komma trennen"
                    class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Cover URL</label>
                <input type="url" id="bookCover"
                    class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Standort</label>
                <select id="bookLocation" 
                    class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Kein Standort</option>
                    ${currentLocations.map(loc => `<option value="${loc.id}">${loc.name}</option>`).join('')}
                </select>
                <button type="button" onclick="showAddLocationModal()" 
                    class="text-sm text-blue-400 hover:underline mt-1">
                    + Neuen Standort erstellen
                </button>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Zustand</label>
                <select id="bookCondition" 
                    class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                    <option value="">Nicht angegeben</option>
                    <option value="new">Neu</option>
                    <option value="very_good">Sehr gut</option>
                    <option value="good">Gut</option>
                    <option value="acceptable">Akzeptabel</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Tags (mit Komma trennen)</label>
                <input type="text" id="bookTags" placeholder="Krimi, Signiert, Erstausgabe"
                    class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Notizen</label>
                <textarea id="bookNotes" rows="3"
                    class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
            </div>
            
            <div class="flex gap-4">
                <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg">
                    Speichern
                </button>
                <button type="button" onclick="closeModal()" 
                    class="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded-lg">
                    Abbrechen
                </button>
            </div>
        </form>
    `);
    
    document.getElementById('addBookForm').onsubmit = async (e) => {
        e.preventDefault();
        await saveBook();
    };
}

async function lookupISBN() {
    const isbn = document.getElementById('bookISBN').value.trim();
    if (!isbn) {
        showToast('Bitte ISBN eingeben', 'warning');
        return;
    }
    
    showLoading();
    try {
        const data = await apiCall(`/books/isbn/lookup/${isbn}`);
        
        document.getElementById('bookTitle').value = data.title || '';
        document.getElementById('bookAuthors').value = (data.authors || []).join(', ');
        document.getElementById('bookCover').value = data.cover_url || '';
        
        showToast('Metadaten geladen!', 'success');
    } catch (error) {
        showToast('Keine Daten für diese ISBN gefunden', 'warning');
    } finally {
        showLoading(false);
    }
}

async function saveBook() {
    showLoading();
    try {
        const authors = document.getElementById('bookAuthors').value
            .split(',').map(a => a.trim()).filter(Boolean);
        const tags = document.getElementById('bookTags').value
            .split(',').map(t => t.trim()).filter(Boolean);
        
        const bookData = {
            isbn: document.getElementById('bookISBN').value || null,
            title: document.getElementById('bookTitle').value,
            authors: JSON.stringify(authors),
            cover_url: document.getElementById('bookCover').value || null,
            location_id: parseInt(document.getElementById('bookLocation').value) || null,
            condition: document.getElementById('bookCondition').value || null,
            notes: document.getElementById('bookNotes').value || null,
            tag_names: tags
        };
        
        await apiCall('/books/', {
            method: 'POST',
            body: JSON.stringify(bookData)
        });
        
        showToast('Buch hinzugefügt!', 'success');
        closeModal();
        renderLibraryView();
    } finally {
        showLoading(false);
    }
}

async function showBookDetails(bookId) {
    const book = currentBooks.find(b => b.id === bookId);
    if (!book) return;
    
    const authors = book.authors ? JSON.parse(book.authors).join(', ') : 'Unbekannt';
    const tags = book.tags.map(t => t.name).join(', ');
    const location = book.location ? book.location.name : 'Kein Standort';
    
    const modal = createModal(book.title, `
        <div class="space-y-4">
            <img src="${book.cover_url || '/static/placeholder.png'}" 
                alt="${book.title}" 
                class="w-full max-w-xs mx-auto rounded-lg">
            
            <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <span class="text-gray-400">Autor:</span>
                    <p class="font-medium">${authors}</p>
                </div>
                ${book.isbn ? `
                    <div>
                        <span class="text-gray-400">ISBN:</span>
                        <p class="font-medium">${book.isbn}</p>
                    </div>
                ` : ''}
                <div>
                    <span class="text-gray-400">Standort:</span>
                    <p class="font-medium">${location}</p>
                </div>
                ${book.condition ? `
                    <div>
                        <span class="text-gray-400">Zustand:</span>
                        <p class="font-medium">${book.condition}</p>
                    </div>
                ` : ''}
            </div>
            
            ${tags ? `<p class="text-blue-400"><i class="fas fa-tags"></i> ${tags}</p>` : ''}
            
            ${book.notes ? `
                <div>
                    <span class="text-gray-400">Notizen:</span>
                    <p class="mt-1">${book.notes}</p>
                </div>
            ` : ''}
            
            <div class="flex gap-2 pt-4">
                <button onclick="editBook(${book.id})" 
                    class="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg">
                    <i class="fas fa-edit"></i> Bearbeiten
                </button>
                <button onclick="togglePinBook(${book.id}, ${!book.is_pinned})" 
                    class="flex-1 bg-yellow-600 hover:bg-yellow-700 py-2 rounded-lg">
                    <i class="fas fa-star"></i> ${book.is_pinned ? 'Unpin' : 'Pin'}
                </button>
                <button onclick="deleteBook(${book.id})" 
                    class="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded-lg">
                    <i class="fas fa-trash"></i> Löschen
                </button>
            </div>
        </div>
    `);
}

async function togglePinBook(bookId, isPinned) {
    showLoading();
    try {
        await apiCall(`/books/${bookId}`, {
            method: 'PATCH',
            body: JSON.stringify({is_pinned: isPinned})
        });
        
        showToast(isPinned ? 'Buch angepinnt' : 'Pin entfernt', 'success');
        closeModal();
        renderLibraryView();
    } finally {
        showLoading(false);
    }
}

async function deleteBook(bookId) {
    if (!confirm('Buch wirklich löschen?')) return;
    
    showLoading();
    try {
        await apiCall(`/books/${bookId}`, {method: 'DELETE'});
        showToast('Buch gelöscht', 'success');
        closeModal();
        renderLibraryView();
    } finally {
        showLoading(false);
    }
}

// ==================== ISBN SCANNER ====================

function showISBNScanModal() {
    const modal = createModal('ISBN Scanner', `
        <div class="space-y-4">
            <p class="text-sm text-gray-400">Richte die Kamera auf den Barcode des Buches</p>
            <div id="scanner" class="bg-black rounded-lg overflow-hidden" style="height: 400px;"></div>
            <button onclick="stopScanner(); closeModal();" 
                class="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg">
                Scanner stoppen
            </button>
        </div>
    `);
    
    startScanner();
}

function startScanner() {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#scanner'),
            constraints: {
                facingMode: "environment"
            }
        },
        decoder: {
            readers: ["ean_reader"]
        }
    }, (err) => {
        if (err) {
            console.error(err);
            showToast('Kamera konnte nicht gestartet werden', 'error');
            return;
        }
        Quagga.start();
    });
    
    Quagga.onDetected(async (data) => {
        const isbn = data.codeResult.code;
        Quagga.stop();
        closeModal();
        
        showToast(`ISBN erkannt: ${isbn}`, 'success');
        
        // Auto-lookup and add
        showLoading();
        try {
            const bookData = await apiCall(`/books/isbn/lookup/${isbn}`);
            
            // Pre-fill add book modal
            showAddBookModal();
            document.getElementById('bookISBN').value = isbn;
            document.getElementById('bookTitle').value = bookData.title || '';
            document.getElementById('bookAuthors').value = (bookData.authors || []).join(', ');
            document.getElementById('bookCover').value = bookData.cover_url || '';
        } catch (error) {
            showToast('Keine Daten gefunden. Bitte manuell eingeben.', 'warning');
            showAddBookModal();
            document.getElementById('bookISBN').value = isbn;
        } finally {
            showLoading(false);
        }
    });
}

function stopScanner() {
    if (Quagga) {
        Quagga.stop();
    }
}


// ==================== CSV IMPORT ====================

function showCSVImportModal() {
    const modal = createModal('CSV Import', `
        <div class="space-y-4">
            <p class="text-sm text-gray-400">
                CSV-Datei mit ISBN-Spalte hochladen. 
                Optional: Spalten "Title" und "Authors".
            </p>
            
            <div class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                <i class="fas fa-file-csv text-4xl text-gray-400 mb-4"></i>
                <input type="file" id="csvFile" accept=".csv" 
                    class="hidden" onchange="handleCSVUpload(event)">
                <label for="csvFile" 
                    class="cursor-pointer bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg inline-block">
                    CSV-Datei wählen
                </label>
            </div>
            
            <div id="importProgress" class="hidden">
                <div class="bg-gray-700 rounded-lg h-4 overflow-hidden">
                    <div id="progressBar" class="bg-blue-600 h-full transition-all" style="width: 0%"></div>
                </div>
                <p id="progressText" class="text-sm text-center mt-2"></p>
            </div>
            
            <div id="importResults" class="hidden text-sm space-y-2"></div>
        </div>
    `);
}

async function handleCSVUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    document.getElementById('importProgress').classList.remove('hidden');
    
    try {
        const response = await fetch(API_BASE + '/books/import/csv', {
            method: 'POST',
            headers: {'Authorization': `Bearer ${authToken}`},
            body: formData
        });
        
        const result = await response.json();
        
        document.getElementById('importResults').innerHTML = `
            <div class="bg-gray-700 rounded p-4">
                <p>✅ Erfolgreich importiert: ${result.successful}</p>
                <p>❌ Fehler: ${result.failed}</p>
                <p>📊 Gesamt: ${result.total}</p>
                ${result.errors.length > 0 ? `
                    <details class="mt-2">
                        <summary class="cursor-pointer text-red-400">Fehler anzeigen</summary>
                        <ul class="mt-2 space-y-1 text-xs">
                            ${result.errors.map(e => `<li>- ${e}</li>`).join('')}
                        </ul>
                    </details>
                ` : ''}
            </div>
        `;
        document.getElementById('importResults').classList.remove('hidden');
        
        showToast(`${result.successful} Bücher importiert!`, 'success');
        
        setTimeout(() => {
            closeModal();
            renderLibraryView();
        }, 3000);
        
    } catch (error) {
        showToast('Import fehlgeschlagen', 'error');
    }
}

// ==================== LOCATIONS ====================

function showAddLocationModal() {
    const modal = createModal('Standort hinzufügen', `
        <form id="addLocationForm" class="space-y-4">
            <div>
                <label class="block text-sm font-medium mb-2">Name *</label>
                <input type="text" id="locationName" required
                    placeholder="z.B. Wohnzimmer Regal 1"
                    class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
            </div>
            
            <div>
                <label class="block text-sm font-medium mb-2">Beschreibung (optional)</label>
                <textarea id="locationDescription" rows="3"
                    class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
            </div>
            
            <div class="flex gap-4">
                <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg">
                    Speichern
                </button>
                <button type="button" onclick="closeModal()" 
                    class="flex-1 bg-gray-600 hover:bg-gray-500 py-2 rounded-lg">
                    Abbrechen
                </button>
            </div>
        </form>
    `);
    
    document.getElementById('addLocationForm').onsubmit = async (e) => {
        e.preventDefault();
        
        showLoading();
        try {
            const locationData = {
                name: document.getElementById('locationName').value,
                description: document.getElementById('locationDescription').value || null
            };
            
            await apiCall('/locations/', {
                method: 'POST',
                body: JSON.stringify(locationData)
            });
            
            showToast('Standort erstellt!', 'success');
            closeModal();
            
            // Reload locations
            currentLocations = await apiCall('/locations/');
            
            // If coming from add book modal, update the select
            const locationSelect = document.getElementById('bookLocation');
            if (locationSelect) {
                showAddBookModal();
            }
        } finally {
            showLoading(false);
        }
    };
}

// ==================== STATISTICS VIEW ====================

async function renderStatsView() {
    showLoading();
    const content = document.getElementById('mainContent');
    
    try {
        const stats = await apiCall('/stats/');
        
        content.innerHTML = `
            <h2 class="text-3xl font-bold mb-6">Statistiken</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-gray-800 rounded-lg p-6">
                    <div class="text-4xl font-bold text-blue-500">${stats.total_books}</div>
                    <div class="text-gray-400 mt-2">Bücher gesamt</div>
                </div>
                
                <div class="bg-gray-800 rounded-lg p-6">
                    <div class="text-4xl font-bold text-green-500">${stats.books_by_author.length}</div>
                    <div class="text-gray-400 mt-2">Verschiedene Autoren</div>
                </div>
                
                <div class="bg-gray-800 rounded-lg p-6">
                    <div class="text-4xl font-bold text-purple-500">${stats.books_by_location.length}</div>
                    <div class="text-gray-400 mt-2">Standorte</div>
                </div>
                
                <div class="bg-gray-800 rounded-lg p-6">
                    <div class="text-4xl font-bold text-yellow-500">${stats.pinned_books.length}</div>
                    <div class="text-gray-400 mt-2">Angepinnte Bücher</div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Top Authors -->
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-4">Top 10 Autoren</h3>
                    <div class="space-y-2">
                        ${stats.books_by_author.slice(0, 10).map(item => `
                            <div class="flex justify-between items-center">
                                <span class="text-gray-300">${item.author}</span>
                                <span class="bg-blue-600 px-3 py-1 rounded text-sm">${item.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Top Tags -->
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-4">Beliebte Tags</h3>
                    <div class="space-y-2">
                        ${stats.books_by_tag.slice(0, 10).map(item => `
                            <div class="flex justify-between items-center">
                                <span class="text-gray-300">${item.tag}</span>
                                <span class="bg-purple-600 px-3 py-1 rounded text-sm">${item.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Top Locations -->
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-4">Bücher pro Standort</h3>
                    <div class="space-y-2">
                        ${stats.books_by_location.map(item => `
                            <div class="flex justify-between items-center">
                                <span class="text-gray-300">${item.location}</span>
                                <span class="bg-green-600 px-3 py-1 rounded text-sm">${item.count}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Recent Additions -->
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-4">Kürzlich hinzugefügt</h3>
                    <div class="space-y-3">
                        ${stats.recent_additions.slice(0, 5).map(book => {
                            const authors = book.authors ? JSON.parse(book.authors).join(', ') : 'Unbekannt';
                            return `
                                <div class="flex items-center gap-3 cursor-pointer hover:bg-gray-700 p-2 rounded" 
                                    onclick="showBookDetails(${book.id})">
                                    <img src="${book.cover_url || '/static/placeholder.png'}" 
                                        class="w-12 h-16 object-cover rounded">
                                    <div class="flex-1 min-w-0">
                                        <p class="font-medium truncate">${book.title}</p>
                                        <p class="text-sm text-gray-400 truncate">${authors}</p>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
    } finally {
        showLoading(false);
    }
}

// ==================== SETTINGS VIEW ====================

async function renderSettingsView() {
    showLoading();
    const content = document.getElementById('mainContent');
    
    try {
        const user = await apiCall('/users/me');
        const publicUrl = `${window.location.origin}/library/${user.username}`;
        
        content.innerHTML = `
            <h2 class="text-3xl font-bold mb-6">Einstellungen</h2>
            
            <div class="max-w-2xl space-y-6">
                <!-- Profile Settings -->
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-4">Profil</h3>
                    <form id="profileForm" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Anzeigename</label>
                            <input type="text" id="displayName" value="${user.display_name || ''}"
                                class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Bio</label>
                            <textarea id="bio" rows="3"
                                class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">${user.bio || ''}</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Avatar URL</label>
                            <input type="url" id="avatarUrl" value="${user.avatar_url || ''}"
                                class="w-full px-4 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                        </div>
                        
                        <button type="submit" class="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg">
                            Profil speichern
                        </button>
                    </form>
                </div>
                
                <!-- Public Sharing Settings -->
                <div class="bg-gray-800 rounded-lg p-6">
                    <h3 class="text-xl font-bold mb-4">Öffentliche Bibliothek</h3>
                    
                    <div class="space-y-4">
                        <label class="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" id="isPublic" ${user.is_library_public ? 'checked' : ''}
                                onchange="togglePublicLibrary(this.checked)"
                                class="w-5 h-5">
                            <span>Bibliothek öffentlich teilen</span>
                        </label>
                        
                        ${user.is_library_public ? `
                            <div class="bg-gray-700 rounded p-4 space-y-3">
                                <div>
                                    <label class="text-sm text-gray-400">Öffentliche URL:</label>
                                    <div class="flex gap-2 mt-1">
                                        <input type="text" value="${publicUrl}" readonly
                                            class="flex-1 px-3 py-2 bg-gray-600 rounded text-sm">
                                        <button onclick="copyPublicURL('${publicUrl}')" 
                                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="space-y-2">
                                    <p class="text-sm font-medium">Anzuzeigende Felder:</p>
                                    
                                    <label class="flex items-center gap-2">
                                        <input type="checkbox" id="showTags" ${user.show_tags_public ? 'checked' : ''}
                                            onchange="updatePublicSettings()">
                                        <span class="text-sm">Tags anzeigen</span>
                                    </label>
                                    
                                    <label class="flex items-center gap-2">
                                        <input type="checkbox" id="showNotes" ${user.show_notes_public ? 'checked' : ''}
                                            onchange="updatePublicSettings()">
                                        <span class="text-sm">Notizen anzeigen</span>
                                    </label>
                                    
                                    <label class="flex items-center gap-2">
                                        <input type="checkbox" id="showCondition" ${user.show_condition_public ? 'checked' : ''}
                                            onchange="updatePublicSettings()">
                                        <span class="text-sm">Zustand anzeigen</span>
                                    </label>
                                </div>
                            </div>
                        ` : `
                            <p class="text-sm text-gray-400">
                                Aktiviere die öffentliche Freigabe, um deine Bibliothek mit anderen zu teilen.
                            </p>
                        `}
                    </div>
                </div>
                
                <!-- Locations Management -->
                <div class="bg-gray-800 rounded-lg p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold">Standorte verwalten</h3>
                        <button onclick="showAddLocationModal()" 
                            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm">
                            <i class="fas fa-plus"></i> Neu
                        </button>
                    </div>
                    
                    <div id="locationsList" class="space-y-2">
                        ${currentLocations.map(loc => `
                            <div class="flex justify-between items-center bg-gray-700 p-3 rounded">
                                <div>
                                    <p class="font-medium">${loc.name}</p>
                                    ${loc.description ? `<p class="text-sm text-gray-400">${loc.description}</p>` : ''}
                                </div>
                                <button onclick="deleteLocation(${loc.id})" 
                                    class="text-red-400 hover:text-red-300">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('profileForm').onsubmit = async (e) => {
            e.preventDefault();
            await updateProfile();
        };
        
    } finally {
        showLoading(false);
    }
}

async function updateProfile() {
    showLoading();
    try {
        const data = {
            display_name: document.getElementById('displayName').value,
            bio: document.getElementById('bio').value,
            avatar_url: document.getElementById('avatarUrl').value
        };
        
        await apiCall('/users/me', {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
        
        showToast('Profil aktualisiert!', 'success');
        await loadCurrentUser();
    } finally {
        showLoading(false);
    }
}

async function togglePublicLibrary(isPublic) {
    showLoading();
    try {
        await apiCall('/users/me', {
            method: 'PATCH',
            body: JSON.stringify({is_library_public: isPublic})
        });
        
        showToast(isPublic ? 'Bibliothek ist jetzt öffentlich' : 'Bibliothek ist jetzt privat', 'success');
        renderSettingsView();
    } finally {
        showLoading(false);
    }
}

async function updatePublicSettings() {
    const data = {
        show_tags_public: document.getElementById('showTags').checked,
        show_notes_public: document.getElementById('showNotes').checked,
        show_condition_public: document.getElementById('showCondition').checked
    };
    
    await apiCall('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
    
    showToast('Einstellungen gespeichert', 'success');
}

function copyPublicURL(url) {
    navigator.clipboard.writeText(url);
    showToast('URL kopiert!', 'success');
}

async function deleteLocation(locationId) {
    if (!confirm('Standort wirklich löschen?')) return;
    
    showLoading();
    try {
        await apiCall(`/locations/${locationId}`, {method: 'DELETE'});
        showToast('Standort gelöscht', 'success');
        currentLocations = await apiCall('/locations/');
        renderSettingsView();
    } finally {
        showLoading(false);
    }
}

// ==================== MODAL HELPERS ====================

function createModal(title, content) {
    const modal = document.createElement('div');
    modal.id = 'modal';
    modal.className = 'modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-2xl font-bold">${title}</h3>
                <button onclick="closeModal()" class="text-gray-400 hover:text-white">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            ${content}
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.onclick = (e) => {
        if (e.target === modal) closeModal();
    };
    
    return modal;
}

function closeModal() {
    const modal = document.getElementById('modal');
    if (modal) modal.remove();
    stopScanner();
}

// ==================== INITIALIZATION ====================

async function init() {
    if (!authToken) {
        showLoginView();
        return;
    }
    
    try {
        await loadCurrentUser();
        document.getElementById('navMenu').classList.remove('hidden');
        document.getElementById('userMenu').classList.remove('hidden');
        showView('library');
    } catch (error) {
        showLoginView();
    }
}

// Start the app
init();
