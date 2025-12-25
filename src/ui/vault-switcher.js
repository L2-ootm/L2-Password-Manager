/**
 * L2 Vault - Vault Switcher UI
 * Handles vault switching on lock screen with swipe gestures
 */

import {
    getAllVaults,
    getCurrentVaultId,
    setCurrentVault,
    getNextVault,
    getPreviousVault,
    createVault,
    getVault
} from '../storage/vaults.js';

// DOM Elements
let indicatorsContainer;
let lockContainer;
let vaultNameElement;
let swipeHint;
let addVaultBtn;

// Swipe state
let startX = 0;
let startY = 0;
let isSwiping = false;
const SWIPE_THRESHOLD = 50;

/**
 * Initialize vault switcher
 */
export function initVaultSwitcher() {
    indicatorsContainer = document.getElementById('vault-indicators');
    lockContainer = document.getElementById('lock-container');
    vaultNameElement = document.getElementById('current-vault-name');
    swipeHint = document.getElementById('swipe-hint');
    addVaultBtn = document.getElementById('add-vault-btn');

    if (!indicatorsContainer || !lockContainer) {
        console.warn('Vault switcher elements not found');
        return;
    }

    renderVaultIndicators();
    updateVaultName();
    setupSwipeGestures();
    setupAddVaultButton();

    // Show swipe hint if multiple vaults
    updateSwipeHintVisibility();
}

/**
 * Render vault indicator dots
 */
export function renderVaultIndicators() {
    if (!indicatorsContainer) return;

    const vaults = getAllVaults();
    const currentId = getCurrentVaultId();

    indicatorsContainer.innerHTML = '';

    vaults.forEach(vault => {
        const dot = document.createElement('div');
        dot.className = `vault-dot ${vault.id === currentId ? 'active' : ''}`;
        dot.style.setProperty('--vault-color', vault.color);
        dot.title = vault.name;

        dot.addEventListener('click', () => {
            if (vault.id !== currentId) {
                switchToVault(vault.id);
            }
        });

        indicatorsContainer.appendChild(dot);
    });
}

/**
 * Update displayed vault name
 */
export function updateVaultName() {
    if (!vaultNameElement) return;

    const vault = getVault(getCurrentVaultId());
    if (vault && !vault.isDefault) {
        vaultNameElement.textContent = vault.name;
    } else {
        vaultNameElement.textContent = '';
    }
}

/**
 * Update swipe hint visibility
 */
function updateSwipeHintVisibility() {
    const vaults = getAllVaults();

    if (vaults.length > 1) {
        swipeHint?.classList.add('visible');
        addVaultBtn?.classList.add('visible');
    } else {
        swipeHint?.classList.remove('visible');
        addVaultBtn?.classList.add('visible'); // Always show add button
    }
}

/**
 * Setup swipe gestures for vault switching
 */
function setupSwipeGestures() {
    if (!lockContainer) return;

    // Touch events
    lockContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    lockContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    lockContainer.addEventListener('touchend', handleTouchEnd);

    // Mouse events (for desktop testing)
    lockContainer.addEventListener('mousedown', handleMouseStart);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseEnd);
}

function handleTouchStart(e) {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isSwiping = false;
}

function handleTouchMove(e) {
    if (!startX) return;

    const touch = e.touches[0];
    const diffX = touch.clientX - startX;
    const diffY = touch.clientY - startY;

    // Only swipe if horizontal movement is greater than vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 20) {
        isSwiping = true;
        e.preventDefault();

        // Visual feedback
        if (diffX > 0) {
            lockContainer.classList.add('swiping-right');
            lockContainer.classList.remove('swiping-left');
        } else {
            lockContainer.classList.add('swiping-left');
            lockContainer.classList.remove('swiping-right');
        }
    }
}

function handleTouchEnd(e) {
    if (!isSwiping) {
        resetSwipeState();
        return;
    }

    const touch = e.changedTouches[0];
    const diffX = touch.clientX - startX;

    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
        if (diffX > 0) {
            // Swipe right - previous vault
            const prevVault = getPreviousVault(getCurrentVaultId());
            switchToVault(prevVault.id);
        } else {
            // Swipe left - next vault
            const nextVault = getNextVault(getCurrentVaultId());
            switchToVault(nextVault.id);
        }
    }

    resetSwipeState();
}

function handleMouseStart(e) {
    startX = e.clientX;
    startY = e.clientY;
    isSwiping = false;
}

function handleMouseMove(e) {
    if (!startX) return;

    const diffX = e.clientX - startX;
    const diffY = e.clientY - startY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 20) {
        isSwiping = true;

        if (diffX > 0) {
            lockContainer?.classList.add('swiping-right');
            lockContainer?.classList.remove('swiping-left');
        } else {
            lockContainer?.classList.add('swiping-left');
            lockContainer?.classList.remove('swiping-right');
        }
    }
}

function handleMouseEnd(e) {
    if (!isSwiping || !startX) {
        resetSwipeState();
        return;
    }

    const diffX = e.clientX - startX;

    if (Math.abs(diffX) > SWIPE_THRESHOLD) {
        if (diffX > 0) {
            const prevVault = getPreviousVault(getCurrentVaultId());
            switchToVault(prevVault.id);
        } else {
            const nextVault = getNextVault(getCurrentVaultId());
            switchToVault(nextVault.id);
        }
    }

    resetSwipeState();
}

function resetSwipeState() {
    startX = 0;
    startY = 0;
    isSwiping = false;
    lockContainer?.classList.remove('swiping-left', 'swiping-right');
}

/**
 * Switch to a different vault
 */
export function switchToVault(vaultId) {
    setCurrentVault(vaultId);
    renderVaultIndicators();
    updateVaultName();

    // Clear password field
    const passwordInput = document.getElementById('master-password');
    if (passwordInput) {
        passwordInput.value = '';
        passwordInput.focus();
    }

    // Update status
    const lockStatus = document.getElementById('lock-status');
    if (lockStatus) {
        lockStatus.textContent = '';
    }

    // Dispatch event for app.js to handle
    window.dispatchEvent(new CustomEvent('vaultChanged', {
        detail: { vaultId }
    }));
}

/**
 * Setup add vault button
 */
function setupAddVaultButton() {
    if (!addVaultBtn) return;

    // Always show the button
    addVaultBtn.classList.add('visible');

    addVaultBtn.addEventListener('click', () => {
        const name = prompt('Nome do novo cofre:');
        if (name && name.trim()) {
            const newVault = createVault(name.trim());
            renderVaultIndicators();
            updateSwipeHintVisibility();

            // Switch to new vault
            switchToVault(newVault.id);
        }
    });
}

/**
 * Get current vault color
 */
export function getCurrentVaultColor() {
    const vault = getVault(getCurrentVaultId());
    return vault?.color || '#D4AF37';
}
