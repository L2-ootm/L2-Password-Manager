/**
 * L2 Vault - Stealth Mode Module
 * Disguises the app as a notepad application
 */

const STEALTH_KEY = 'stealthMode';
const TRIGGER_PHRASE = 'L2VAULT';
const NOTEPAD_TITLE = 'Notas Rápidas';

// ========== State ==========
let stealthEnabled = false;
let typedBuffer = '';
let stealthElements = null;

/**
 * Initialize stealth mode
 */
export function initStealthMode() {
    // Check if stealth mode is enabled
    stealthEnabled = localStorage.getItem(STEALTH_KEY) === 'true';

    // Create stealth UI elements
    createStealthUI();

    // If stealth mode is enabled, show notepad immediately
    if (stealthEnabled) {
        showNotepad();
    }

    // Listen for trigger phrase on notepad
    setupTriggerListener();
}

/**
 * Toggle stealth mode on/off
 */
export function toggleStealthMode(enabled) {
    stealthEnabled = enabled;
    localStorage.setItem(STEALTH_KEY, enabled ? 'true' : 'false');

    if (enabled) {
        showNotepad();
    } else {
        hideNotepad();
    }
}

/**
 * Check if stealth mode is enabled
 */
export function isStealthEnabled() {
    return localStorage.getItem(STEALTH_KEY) === 'true';
}

/**
 * Create the notepad UI overlay
 */
function createStealthUI() {
    // Check if already created
    if (document.getElementById('stealth-notepad')) return;

    const notepadHTML = `
        <div id="stealth-notepad" class="stealth-notepad hidden">
            <div class="notepad-header">
                <div class="notepad-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                    </svg>
                    ${NOTEPAD_TITLE}
                </div>
                <div class="notepad-actions">
                    <button class="notepad-btn" id="notepad-new" aria-label="Nova nota">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </button>
                    <button class="notepad-btn" id="notepad-save" aria-label="Salvar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                        </svg>
                    </button>
                </div>
            </div>
            <div class="notepad-body">
                <textarea 
                    id="notepad-textarea" 
                    class="notepad-textarea" 
                    placeholder="Digite ${TRIGGER_PHRASE} para acessar o cofre..."
                    spellcheck="false"
                ></textarea>
            </div>
            <div class="notepad-footer">
                <span id="notepad-charcount">0 caracteres</span>
                <span class="notepad-date" id="notepad-date"></span>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', notepadHTML);

    stealthElements = {
        notepad: document.getElementById('stealth-notepad'),
        textarea: document.getElementById('notepad-textarea'),
        charCount: document.getElementById('notepad-charcount'),
        dateDisplay: document.getElementById('notepad-date'),
        newBtn: document.getElementById('notepad-new'),
        saveBtn: document.getElementById('notepad-save')
    };

    // Setup notepad functionality
    setupNotepadEvents();
}

/**
 * Setup notepad events
 */
function setupNotepadEvents() {
    if (!stealthElements) return;

    // Update char count
    stealthElements.textarea.addEventListener('input', () => {
        const count = stealthElements.textarea.value.length;
        stealthElements.charCount.textContent = `${count} caractere${count !== 1 ? 's' : ''}`;
    });

    // Update date
    updateNotepadDate();

    // New button - clear textarea
    stealthElements.newBtn.addEventListener('click', () => {
        stealthElements.textarea.value = '';
        stealthElements.charCount.textContent = '0 caracteres';
        saveNotepadContent();
    });

    // Save button - save to localStorage (as decoy)
    stealthElements.saveBtn.addEventListener('click', () => {
        saveNotepadContent();
        showNotepadToast('Nota salva!');
    });

    // Load saved content
    loadNotepadContent();
}

/**
 * Setup trigger phrase listener
 */
function setupTriggerListener() {
    if (!stealthElements) return;

    stealthElements.textarea.addEventListener('input', (e) => {
        const value = e.target.value;

        // Check if trigger phrase is in the text
        if (value.toUpperCase().includes(TRIGGER_PHRASE)) {
            // Clear the trigger phrase from textarea
            stealthElements.textarea.value = value.replace(new RegExp(TRIGGER_PHRASE, 'gi'), '');

            // Reveal the vault
            revealVault();
        }
    });
}

/**
 * Show notepad (activate stealth mode)
 */
function showNotepad() {
    if (!stealthElements) createStealthUI();

    // Hide all app screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

    // Show notepad
    stealthElements.notepad.classList.remove('hidden');

    // Update date
    updateNotepadDate();

    // Change page title
    document.title = NOTEPAD_TITLE;

    // Focus textarea
    setTimeout(() => stealthElements.textarea.focus(), 100);
}

/**
 * Hide notepad and reveal app
 */
function hideNotepad() {
    if (!stealthElements) return;

    stealthElements.notepad.classList.add('hidden');

    // Restore title
    document.title = 'L2 Vault';
}

/**
 * Reveal the vault from stealth mode
 */
function revealVault() {
    hideNotepad();

    // Show lock screen
    const lockScreen = document.getElementById('lock-screen');
    if (lockScreen) {
        lockScreen.classList.add('active');
    }

    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('stealthRevealed'));
}

/**
 * Update notepad date display
 */
function updateNotepadDate() {
    if (!stealthElements?.dateDisplay) return;

    const now = new Date();
    const options = {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    };
    stealthElements.dateDisplay.textContent = now.toLocaleDateString('pt-BR', options);
}

/**
 * Save notepad content to localStorage
 */
function saveNotepadContent() {
    if (!stealthElements?.textarea) return;
    localStorage.setItem('notepadContent', stealthElements.textarea.value);
}

/**
 * Load notepad content from localStorage
 */
function loadNotepadContent() {
    if (!stealthElements?.textarea) return;
    const content = localStorage.getItem('notepadContent') || '';
    stealthElements.textarea.value = content;
    stealthElements.charCount.textContent = `${content.length} caractere${content.length !== 1 ? 's' : ''}`;
}

/**
 * Show toast notification in notepad
 */
function showNotepadToast(message) {
    const toast = document.createElement('div');
    toast.className = 'notepad-toast';
    toast.textContent = message;

    stealthElements.notepad.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
