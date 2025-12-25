/**
 * L2 Vault - Main Application
 * Orchestrates all modules and handles UI interactions
 */

import {
    createPasswordHash,
    verifyStoredPassword,
    getEncryptionKey
} from './crypto/argon2.js';

import {
    encrypt,
    decrypt,
    importKey,
    generatePassword
} from './crypto/aes.js';

import {
    GENERATOR_PRESETS,
    calculateStrength,
    estimateCrackTime
} from './crypto/generator.js';

import {
    initDatabase,
    hasMasterPassword,
    storeMasterPassword,
    getMasterPasswordData,
    addCredential,
    updateCredential,
    deleteCredential,
    getAllCredentials,
    getSetting,
    setSetting,
    exportAllData,
    importAllData
} from './storage/db.js';

// ========== App State ==========
let encryptionKey = null;
let autoLockTimer = null;
let clipboardTimer = null;
let credentials = [];
let activeContextCredential = null;
let activeContextElement = null;
let currentGeneratorPreset = null;
let generatedPasswordValue = '';

// ========== DOM Elements ==========
const $ = (id) => document.getElementById(id);

const elements = {
    // Screens
    lockScreen: $('lock-screen'),
    vaultScreen: $('vault-screen'),

    // Lock Screen
    unlockForm: $('unlock-form'),
    masterPasswordInput: $('master-password'),
    togglePasswordBtn: $('toggle-password'),
    lockStatus: $('lock-status'),
    unlockBtn: $('unlock-btn'),

    // Header
    themeToggle: $('theme-toggle'),
    settingsBtn: $('settings-btn'),
    lockBtn: $('lock-btn'),

    // Search
    searchInput: $('search-input'),

    // Credential List
    credentialList: $('credential-list'),
    emptyState: $('empty-state'),
    addBtn: $('add-btn'),

    // Credential Modal
    credentialModal: $('credential-modal'),
    modalTitle: $('modal-title'),
    closeModalBtn: $('close-modal'),
    credentialForm: $('credential-form'),
    credentialId: $('credential-id'),
    credentialTitle: $('credential-title'),
    credentialUsername: $('credential-username'),
    credentialPassword: $('credential-password'),
    credentialCategory: $('credential-category'),
    credentialNotes: $('credential-notes'),
    generatePasswordBtn: $('generate-password'),
    toggleModalPasswordBtn: $('toggle-modal-password'),
    deleteCredentialBtn: $('delete-credential'),

    // Settings Modal
    settingsModal: $('settings-modal'),
    closeSettingsBtn: $('close-settings'),
    autoLockTime: $('auto-lock-time'),
    clipboardClearTime: $('clipboard-clear-time'),
    exportBtn: $('export-btn'),
    importBtn: $('import-btn'),
    importFile: $('import-file'),
    changePasswordBtn: $('change-password-btn'),

    // Generator Modal
    generatorModal: $('generator-modal'),
    closeGeneratorBtn: $('close-generator'),
    generatedPasswordInput: $('generated-password'),
    copyGeneratedBtn: $('copy-generated'),
    regenerateBtn: $('regenerate-password'),
    strengthFill: $('strength-fill'),
    strengthLabel: $('strength-label'),
    crackTime: $('crack-time'),
    useGeneratedBtn: $('use-generated-password'),

    // Toast
    toastContainer: $('toast-container'),

    // Context Menu
    contextMenu: $('context-menu'),
    ctxCopy: $('ctx-copy'),
    ctxEdit: $('ctx-edit'),
    ctxDelete: $('ctx-delete')
};

// ========== Initialization ==========
async function init() {
    await initDatabase();
    await loadSettings();
    await checkFirstTime();
    setupEventListeners();
    setupContextMenu();
    setupGeneratorModal();

    // Register service worker
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registered');
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }
}

async function loadSettings() {
    // Theme
    const theme = await getSetting('theme', 'dark');
    document.documentElement.setAttribute('data-theme', theme);

    // Auto-lock time
    const autoLockMs = await getSetting('autoLockTime', 300000);
    elements.autoLockTime.value = autoLockMs;

    // Clipboard clear time
    const clipboardMs = await getSetting('clipboardClearTime', 30000);
    elements.clipboardClearTime.value = clipboardMs;
}

async function checkFirstTime() {
    const hasMaster = await hasMasterPassword();

    if (!hasMaster) {
        elements.lockStatus.textContent = 'Crie sua senha mestra';
        elements.unlockBtn.querySelector('span').textContent = 'Criar Cofre';
    } else {
        elements.lockStatus.textContent = '';
        elements.unlockBtn.querySelector('span').textContent = 'Desbloquear';
    }
}

// ========== Event Listeners ==========
function setupEventListeners() {
    // Unlock form
    elements.unlockForm.addEventListener('submit', handleUnlock);
    elements.togglePasswordBtn.addEventListener('click', () => {
        togglePasswordVisibility(elements.masterPasswordInput, elements.togglePasswordBtn);
    });

    // Header buttons
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.settingsBtn.addEventListener('click', () => openModal(elements.settingsModal));
    elements.lockBtn.addEventListener('click', lockVault);

    // Search
    elements.searchInput.addEventListener('input', handleSearch);

    // Add button
    elements.addBtn.addEventListener('click', openAddModal);

    // Credential modal
    elements.closeModalBtn.addEventListener('click', () => closeModal(elements.credentialModal));
    elements.credentialModal.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(elements.credentialModal));
    elements.credentialForm.addEventListener('submit', handleSaveCredential);
    elements.generatePasswordBtn.addEventListener('click', () => {
        // Open generator modal instead of quick generate
        openModal(elements.generatorModal);
    });
    elements.toggleModalPasswordBtn.addEventListener('click', () => {
        togglePasswordVisibility(elements.credentialPassword, elements.toggleModalPasswordBtn);
    });
    elements.deleteCredentialBtn.addEventListener('click', handleDeleteCredential);

    // Settings modal
    elements.closeSettingsBtn.addEventListener('click', () => closeModal(elements.settingsModal));
    elements.settingsModal.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(elements.settingsModal));
    elements.autoLockTime.addEventListener('change', (e) => setSetting('autoLockTime', parseInt(e.target.value)));
    elements.clipboardClearTime.addEventListener('change', (e) => setSetting('clipboardClearTime', parseInt(e.target.value)));
    elements.exportBtn.addEventListener('click', handleExport);
    elements.importBtn.addEventListener('click', () => elements.importFile.click());
    elements.importFile.addEventListener('change', handleImport);
    elements.changePasswordBtn.addEventListener('click', handleChangePassword);

    // Auto-lock on visibility change
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && encryptionKey) {
            resetAutoLockTimer();
        }
    });

    // Reset timer on activity
    document.addEventListener('click', resetAutoLockTimer);
    document.addEventListener('keypress', resetAutoLockTimer);
}

// ========== Generator Modal ==========
function setupGeneratorModal() {
    // Close button
    elements.closeGeneratorBtn.addEventListener('click', () => closeModal(elements.generatorModal));
    elements.generatorModal.querySelector('.modal-backdrop').addEventListener('click', () => closeModal(elements.generatorModal));

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.dataset.preset;
            selectPreset(presetKey, btn);
        });
    });

    // Copy generated password
    elements.copyGeneratedBtn.addEventListener('click', async () => {
        if (generatedPasswordValue) {
            await navigator.clipboard.writeText(generatedPasswordValue);
            showToast('Senha copiada!', 'success');
            scheduleClipboardClear();
        }
    });

    // Regenerate with same preset
    elements.regenerateBtn.addEventListener('click', () => {
        if (currentGeneratorPreset) {
            const activeBtn = document.querySelector(`.preset-btn[data-preset="${currentGeneratorPreset}"]`);
            selectPreset(currentGeneratorPreset, activeBtn);
        }
    });

    // Use generated password in credential form
    elements.useGeneratedBtn.addEventListener('click', () => {
        if (generatedPasswordValue) {
            elements.credentialPassword.value = generatedPasswordValue;
            closeModal(elements.generatorModal);
            showToast('Senha aplicada!', 'success');
        }
    });
}

function selectPreset(presetKey, btn) {
    const preset = GENERATOR_PRESETS[presetKey];
    if (!preset) return;

    // Update active state
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    currentGeneratorPreset = presetKey;

    // Generate password
    generatedPasswordValue = preset.generate();
    elements.generatedPasswordInput.value = generatedPasswordValue;

    // Update strength meter
    updateStrengthMeter(generatedPasswordValue);

    // Enable use button
    elements.useGeneratedBtn.disabled = false;

    hapticFeedback('success');
}

function updateStrengthMeter(password) {
    const strength = calculateStrength(password);
    const crackTime = estimateCrackTime(password);

    // Determine strength level
    let level, label;
    if (strength < 30) {
        level = 'weak';
        label = 'Fraca';
    } else if (strength < 50) {
        level = 'fair';
        label = 'Razoável';
    } else if (strength < 75) {
        level = 'good';
        label = 'Boa';
    } else {
        level = 'strong';
        label = 'Forte';
    }

    // Update UI
    elements.strengthFill.className = `strength-fill ${level}`;
    elements.strengthLabel.textContent = `${label} (${strength}%)`;
    elements.crackTime.textContent = `⏱️ ${crackTime}`;
}

// ========== Context Menu ==========
function setupContextMenu() {
    // Copy button
    elements.ctxCopy.addEventListener('click', async () => {
        if (activeContextCredential) {
            await handleCredentialTap(null, activeContextCredential, activeContextElement);
            hideContextMenu();
        }
    });

    // Edit button
    elements.ctxEdit.addEventListener('click', () => {
        if (activeContextCredential) {
            hideContextMenu();
            openEditModal(activeContextCredential);
        }
    });

    // Delete button
    elements.ctxDelete.addEventListener('click', async () => {
        if (activeContextCredential) {
            hideContextMenu();
            if (confirm('Excluir esta senha permanentemente?')) {
                try {
                    await deleteCredential(activeContextCredential.id);
                    await loadCredentials();
                    showToast('Senha excluída', 'success');
                } catch (error) {
                    showToast('Erro ao excluir', 'error');
                }
            }
        }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!elements.contextMenu.contains(e.target) &&
            !e.target.closest('.credential-item')) {
            hideContextMenu();
        }
    });

    // Close on scroll
    document.addEventListener('scroll', hideContextMenu, true);
}

function showContextMenu(e, credential, element) {
    activeContextCredential = credential;
    activeContextElement = element;

    // Clear any other open states
    document.querySelectorAll('.credential-item.menu-open').forEach(el => {
        el.classList.remove('menu-open');
    });

    element.classList.add('menu-open');

    // Get position
    const touch = e.touches ? e.touches[0] : e;
    let x = touch.clientX;
    let y = touch.clientY;

    // Show menu to get dimensions
    elements.contextMenu.classList.add('active');

    // Adjust if menu goes off screen
    const menuRect = elements.contextMenu.getBoundingClientRect();
    const padding = 16;

    if (x + menuRect.width > window.innerWidth - padding) {
        x = window.innerWidth - menuRect.width - padding;
    }
    if (y + menuRect.height > window.innerHeight - padding) {
        y = window.innerHeight - menuRect.height - padding;
    }

    elements.contextMenu.style.left = `${x}px`;
    elements.contextMenu.style.top = `${y}px`;
}

function hideContextMenu() {
    elements.contextMenu.classList.remove('active');
    document.querySelectorAll('.credential-item.menu-open').forEach(el => {
        el.classList.remove('menu-open');
    });
    activeContextCredential = null;
    activeContextElement = null;
}

// ========== Authentication ==========
async function handleUnlock(e) {
    e.preventDefault();

    const password = elements.masterPasswordInput.value;
    if (!password) return;

    elements.unlockBtn.disabled = true;
    elements.lockStatus.textContent = 'Processando...';
    elements.lockStatus.className = 'status-text';

    try {
        const hasMaster = await hasMasterPassword();

        if (!hasMaster) {
            // First time - create master password
            if (password.length < 8) {
                throw new Error('A senha deve ter pelo menos 8 caracteres');
            }

            const { hash, salt } = await createPasswordHash(password);
            await storeMasterPassword(hash, salt);

            const keyMaterial = await getEncryptionKey(password, salt);
            encryptionKey = await importKey(keyMaterial);

            showToast('Cofre criado com sucesso!', 'success');
        } else {
            // Verify existing password
            const masterData = await getMasterPasswordData();
            const isValid = await verifyStoredPassword(password, masterData.hash, masterData.salt);

            if (!isValid) {
                throw new Error('Senha incorreta');
            }

            const keyMaterial = await getEncryptionKey(password, masterData.salt);
            encryptionKey = await importKey(keyMaterial);
        }

        // Clear password input
        elements.masterPasswordInput.value = '';

        // Load and show vault
        await loadCredentials();
        showScreen('vault');
        resetAutoLockTimer();

    } catch (error) {
        elements.lockStatus.textContent = error.message;
        elements.lockStatus.className = 'status-text error';
        hapticFeedback('error');
    } finally {
        elements.unlockBtn.disabled = false;
    }
}

function lockVault() {
    encryptionKey = null;
    credentials = [];
    clearAutoLockTimer();
    elements.credentialList.innerHTML = '';
    elements.credentialList.appendChild(elements.emptyState);
    elements.emptyState.classList.remove('hidden');
    showScreen('lock');
    elements.lockStatus.textContent = '';
    showToast('Cofre bloqueado', 'success');
}

// ========== Credentials ==========
async function loadCredentials() {
    credentials = await getAllCredentials();
    renderCredentials(credentials);
}

function renderCredentials(items) {
    // Clear list except empty state and context menu
    const emptyState = elements.emptyState;
    const contextMenu = elements.contextMenu;
    elements.credentialList.innerHTML = '';
    elements.credentialList.appendChild(emptyState);
    elements.credentialList.appendChild(contextMenu);

    if (items.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');

    items.forEach(cred => {
        const item = createCredentialElement(cred);
        elements.credentialList.insertBefore(item, emptyState);
    });
}

function createCredentialElement(credential) {
    const div = document.createElement('div');
    div.className = 'credential-item';
    div.dataset.id = credential.id;

    // Get initial letter for icon
    const initial = (credential.title || 'X').charAt(0).toUpperCase();

    div.innerHTML = `
    <div class="credential-icon">${initial}</div>
    <div class="credential-info">
      <div class="credential-title">${escapeHtml(credential.title)}</div>
      <div class="credential-username">${escapeHtml(credential.username || '')}</div>
    </div>
    <span class="credential-category">${escapeHtml(credential.category || 'geral')}</span>
  `;

    // Store credential data
    div._credential = credential;

    // Interaction variables
    let pressTimer;
    let isPressing = false;
    let clickCount = 0;
    let clickTimer;
    let startX, startY;
    const LONG_PRESS_DURATION = 500;
    const DOUBLE_CLICK_DELAY = 300;
    const MOVE_THRESHOLD = 10;

    const startPress = (e) => {
        isPressing = true;
        const touch = e.touches ? e.touches[0] : e;
        startX = touch.clientX;
        startY = touch.clientY;

        div.classList.add('pressing');

        pressTimer = setTimeout(() => {
            if (isPressing) {
                hapticFeedback('success');
                showContextMenu(e, credential, div);
                isPressing = false;
                div.classList.remove('pressing');
                clickCount = 0;
            }
        }, LONG_PRESS_DURATION);
    };

    const endPress = (e) => {
        const wasQuickTap = isPressing && pressTimer;
        clearTimeout(pressTimer);
        div.classList.remove('pressing');

        if (wasQuickTap && isPressing) {
            // Handle click/double-click
            clickCount++;

            if (clickCount === 1) {
                clickTimer = setTimeout(() => {
                    if (clickCount === 1) {
                        // Single click - copy password
                        handleCredentialTap(e, credential, div);
                    }
                    clickCount = 0;
                }, DOUBLE_CLICK_DELAY);
            } else if (clickCount === 2) {
                // Double click - copy username/email
                clearTimeout(clickTimer);
                clickCount = 0;
                handleCopyUsername(credential, div);
            }
        }
        isPressing = false;
    };

    const movePress = (e) => {
        if (!isPressing) return;
        const touch = e.touches ? e.touches[0] : e;
        const dx = Math.abs(touch.clientX - startX);
        const dy = Math.abs(touch.clientY - startY);

        if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
            clearTimeout(pressTimer);
            div.classList.remove('pressing');
            isPressing = false;
        }
    };

    // Touch events
    div.addEventListener('touchstart', startPress, { passive: true });
    div.addEventListener('touchend', endPress);
    div.addEventListener('touchmove', movePress, { passive: true });
    div.addEventListener('touchcancel', () => {
        clearTimeout(pressTimer);
        div.classList.remove('pressing');
        isPressing = false;
        clickCount = 0;
    });

    // Mouse events (desktop)
    div.addEventListener('mousedown', startPress);
    div.addEventListener('mouseup', endPress);
    div.addEventListener('mouseleave', () => {
        clearTimeout(pressTimer);
        div.classList.remove('pressing');
        isPressing = false;
    });

    // Right-click to show context menu (desktop)
    div.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showContextMenu(e, credential, div);
    });

    return div;
}

async function handleCredentialTap(e, credential, element) {
    if (!element && e) element = e.currentTarget;

    try {
        // Decrypt password
        const password = await decrypt(
            credential.encryptedPassword,
            credential.iv,
            encryptionKey
        );

        // Copy to clipboard
        await navigator.clipboard.writeText(password);

        // Visual feedback
        if (element) {
            element.classList.add('copying');
            setTimeout(() => element.classList.remove('copying'), 300);
        }

        hapticFeedback('success');
        showToast('Senha copiada!', 'success');

        // Schedule clipboard clear
        scheduleClipboardClear();

    } catch (error) {
        showToast('Erro ao copiar senha', 'error');
    }
}

async function handleCopyUsername(credential, element) {
    if (!credential.username) {
        showToast('Nenhum usuário/email cadastrado', 'error');
        return;
    }

    try {
        await navigator.clipboard.writeText(credential.username);

        if (element) {
            element.classList.add('copying');
            setTimeout(() => element.classList.remove('copying'), 300);
        }

        hapticFeedback('success');
        showToast('Email/usuário copiado!', 'success');
        scheduleClipboardClear();
    } catch (error) {
        showToast('Erro ao copiar', 'error');
    }
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();

    if (!query) {
        renderCredentials(credentials);
        return;
    }

    const filtered = credentials.filter(cred =>
        cred.title.toLowerCase().includes(query) ||
        (cred.username && cred.username.toLowerCase().includes(query)) ||
        (cred.category && cred.category.toLowerCase().includes(query))
    );

    renderCredentials(filtered);
}

// ========== Credential Modal ==========
function openAddModal() {
    elements.modalTitle.textContent = 'Nova Senha';
    elements.credentialForm.reset();
    elements.credentialId.value = '';
    elements.deleteCredentialBtn.classList.add('hidden');
    openModal(elements.credentialModal);
}

async function openEditModal(credential) {
    elements.modalTitle.textContent = 'Editar Senha';
    elements.credentialId.value = credential.id;
    elements.credentialTitle.value = credential.title;
    elements.credentialUsername.value = credential.username || '';
    elements.credentialCategory.value = credential.category || 'geral';
    elements.credentialNotes.value = credential.notes || '';

    // Decrypt and show password
    try {
        const password = await decrypt(
            credential.encryptedPassword,
            credential.iv,
            encryptionKey
        );
        elements.credentialPassword.value = password;
    } catch (error) {
        elements.credentialPassword.value = '';
    }

    elements.deleteCredentialBtn.classList.remove('hidden');
    openModal(elements.credentialModal);
}

async function handleSaveCredential(e) {
    e.preventDefault();

    const id = elements.credentialId.value;
    const title = elements.credentialTitle.value.trim();
    const username = elements.credentialUsername.value.trim();
    const password = elements.credentialPassword.value;
    const category = elements.credentialCategory.value;
    const notes = elements.credentialNotes.value.trim();

    if (!title || !password) {
        showToast('Preencha título e senha', 'error');
        return;
    }

    try {
        // Encrypt password
        const { ciphertext, iv } = await encrypt(password, encryptionKey);

        const credentialData = {
            title,
            username,
            encryptedPassword: ciphertext,
            iv,
            category,
            notes
        };

        if (id) {
            // Update existing
            await updateCredential({ ...credentialData, id: parseInt(id) });
            showToast('Senha atualizada!', 'success');
        } else {
            // Add new
            await addCredential(credentialData);
            showToast('Senha adicionada!', 'success');
        }

        await loadCredentials();
        closeModal(elements.credentialModal);

    } catch (error) {
        showToast('Erro ao salvar: ' + error.message, 'error');
    }
}

async function handleDeleteCredential() {
    const id = elements.credentialId.value;
    if (!id) return;

    if (!confirm('Excluir esta senha permanentemente?')) return;

    try {
        await deleteCredential(parseInt(id));
        await loadCredentials();
        closeModal(elements.credentialModal);
        showToast('Senha excluída', 'success');
    } catch (error) {
        showToast('Erro ao excluir', 'error');
    }
}

// ========== Export/Import ==========
async function handleExport() {
    const exportPassword = prompt('Defina uma senha para o backup:');
    if (!exportPassword || exportPassword.length < 8) {
        showToast('A senha deve ter pelo menos 8 caracteres', 'error');
        return;
    }

    try {
        // Get all data
        const data = await exportAllData();

        // Create export key
        const { hash, salt } = await createPasswordHash(exportPassword);
        const keyMaterial = await getEncryptionKey(exportPassword, salt);
        const exportKey = await importKey(keyMaterial);

        // Encrypt the data
        const jsonData = JSON.stringify(data);
        const { ciphertext, iv } = await encrypt(jsonData, exportKey);

        // Create backup file
        const backup = {
            version: 1,
            salt,
            iv,
            data: ciphertext
        };

        // Download file
        const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `l2vault-backup-${new Date().toISOString().split('T')[0]}.l2vault`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast('Backup exportado!', 'success');

    } catch (error) {
        showToast('Erro ao exportar: ' + error.message, 'error');
    }
}

async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const importPassword = prompt('Digite a senha do backup:');
    if (!importPassword) return;

    try {
        const text = await file.text();
        const backup = JSON.parse(text);

        if (!backup.salt || !backup.iv || !backup.data) {
            throw new Error('Arquivo de backup inválido');
        }

        // Derive key from password
        const keyMaterial = await getEncryptionKey(importPassword, backup.salt);
        const importKeyDerived = await importKey(keyMaterial);

        // Decrypt data
        const jsonData = await decrypt(backup.data, backup.iv, importKeyDerived);
        const data = JSON.parse(jsonData);

        // Import
        await importAllData(data);
        await loadCredentials();

        showToast('Backup importado com sucesso!', 'success');

    } catch (error) {
        showToast('Erro ao importar: senha incorreta ou arquivo inválido', 'error');
    }

    // Reset file input
    e.target.value = '';
}

async function handleChangePassword() {
    const currentPassword = prompt('Digite sua senha atual:');
    if (!currentPassword) return;

    try {
        const masterData = await getMasterPasswordData();
        const isValid = await verifyStoredPassword(currentPassword, masterData.hash, masterData.salt);

        if (!isValid) {
            showToast('Senha atual incorreta', 'error');
            return;
        }

        const newPassword = prompt('Digite a nova senha (mínimo 8 caracteres):');
        if (!newPassword || newPassword.length < 8) {
            showToast('A nova senha deve ter pelo menos 8 caracteres', 'error');
            return;
        }

        const confirmPassword = prompt('Confirme a nova senha:');
        if (newPassword !== confirmPassword) {
            showToast('As senhas não coincidem', 'error');
            return;
        }

        // Re-encrypt all credentials with new key
        const oldKeyMaterial = await getEncryptionKey(currentPassword, masterData.salt);
        const oldKey = await importKey(oldKeyMaterial);

        const { hash: newHash, salt: newSalt } = await createPasswordHash(newPassword);
        const newKeyMaterial = await getEncryptionKey(newPassword, newSalt);
        const newKey = await importKey(newKeyMaterial);

        // Decrypt and re-encrypt each credential
        for (const cred of credentials) {
            const password = await decrypt(cred.encryptedPassword, cred.iv, oldKey);
            const { ciphertext, iv } = await encrypt(password, newKey);

            await updateCredential({
                ...cred,
                encryptedPassword: ciphertext,
                iv
            });
        }

        // Update master password
        await storeMasterPassword(newHash, newSalt);
        encryptionKey = newKey;

        showToast('Senha mestra alterada com sucesso!', 'success');

    } catch (error) {
        showToast('Erro ao alterar senha: ' + error.message, 'error');
    }
}

// ========== UI Helpers ==========
function showScreen(screen) {
    elements.lockScreen.classList.remove('active');
    elements.vaultScreen.classList.remove('active');

    if (screen === 'lock') {
        elements.lockScreen.classList.add('active');
    } else {
        elements.vaultScreen.classList.add('active');
    }
}

function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function togglePasswordVisibility(input, button) {
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    button.classList.toggle('active', isPassword);
}

async function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', next);
    await setSetting('theme', next);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function hapticFeedback(type) {
    if (!navigator.vibrate) return;

    switch (type) {
        case 'success':
            navigator.vibrate(50);
            break;
        case 'error':
            navigator.vibrate([50, 50, 50]);
            break;
        default:
            navigator.vibrate(30);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== Auto-Lock ==========
function resetAutoLockTimer() {
    if (!encryptionKey) return;

    clearAutoLockTimer();

    const timeout = parseInt(elements.autoLockTime.value) || 300000;
    autoLockTimer = setTimeout(() => {
        lockVault();
    }, timeout);
}

function clearAutoLockTimer() {
    if (autoLockTimer) {
        clearTimeout(autoLockTimer);
        autoLockTimer = null;
    }
}

// ========== Clipboard ==========
async function scheduleClipboardClear() {
    if (clipboardTimer) {
        clearTimeout(clipboardTimer);
    }

    const timeout = parseInt(elements.clipboardClearTime.value) || 30000;

    clipboardTimer = setTimeout(async () => {
        try {
            await navigator.clipboard.writeText('');
        } catch (error) {
            // Clipboard API may not be available
        }
    }, timeout);
}

// ========== Start Application ==========
document.addEventListener('DOMContentLoaded', init);
