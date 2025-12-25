<p align="center">
  <a href="README.md">🇧🇷 Português</a> •
  <a href="README.en.md">🇺🇸 English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-gold?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/PWA-Ready-blue?style=for-the-badge" alt="PWA">
  <img src="https://img.shields.io/badge/Security-Military%20Grade-red?style=for-the-badge" alt="Security">
</p>

<h1 align="center">🔐 L2 Vault</h1>
<h3 align="center">Fortress Protocol • Zero-Knowledge Password Manager</h3>

<p align="center">
  <strong>100% Offline • Military-Grade Encryption • Progressive Web App</strong>
</p>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Security Architecture](#-security-architecture)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Usage Guide](#-usage-guide)
- [Advanced Features](#-advanced-features)
- [Password Generator](#-password-generator)
- [API Reference](#-api-reference)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🏰 Overview

**L2 Vault** (Codename: *Fortress*) is a next-generation password manager built with a **Zero-Knowledge, Local-First** philosophy. Your secrets never leave your device. No servers. No sync. No trust required.

### Core Philosophy

| Principle | Description |
|-----------|-------------|
| **🔒 Zero-Knowledge** | Your data is encrypted with keys derived from YOUR password. Even if someone steals the database, it's unreadable. |
| **📱 Local-First** | All data lives on your device. No cloud sync, no account creation, no attack surface. |
| **🛡️ Security by Design** | Military-grade cryptography (AES-256-GCM + Argon2id) from day one, not as an afterthought. |
| **⚡ Radical Simplicity** | Open → Unlock → Copy. No configuration required. |

---

## ✨ Key Features

### Core Functionality
- ✅ **Secure Credential Storage** - AES-256-GCM encrypted passwords in IndexedDB
- ✅ **Master Password** - Argon2id key derivation (OWASP recommended)
- ✅ **Tap-to-Copy** - Single tap copies password, shows toast notification
- ✅ **Double-tap Email** - Double tap copies username/email
- ✅ **Long-press Context Menu** - Edit, copy, or delete with visual feedback
- ✅ **Search** - Real-time filtering by title, username, or category
- ✅ **Categories** - Organize passwords by type (social, work, banking, etc.)
- ✅ **Auto Favicons** - Automatic site icons with styled fallback
- ✅ **Dark/Light Themes** - OLED-friendly dark mode with gold accents

### Security Features
- ✅ **Auto-Lock** - Configurable timeout (1-30 minutes)
- ✅ **Clipboard Auto-Clear** - Clears copied passwords after timeout
- ✅ **Encrypted Export/Import** - Backup with password-protected files
- ✅ **Service Worker** - Full offline functionality

### Advanced Features (NEW!)
- ✅ **8-Mode Password Generator** - From quantum to memorable
- ✅ **Decoy Vaults** - Multiple isolated vaults, swipe to switch
- ✅ **Strength Meter** - Real-time password analysis with crack time estimation

---

## 🔒 Security Architecture

### Encryption Stack

```
┌─────────────────────────────────────────────────────────────┐
│                     USER'S MASTER PASSWORD                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Argon2id Key Derivation                                     │
│  ├─ Memory: 64MB                                             │
│  ├─ Iterations: 3                                            │
│  ├─ Parallelism: 4                                           │
│  └─ Salt: Cryptographically random (128-bit)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  256-bit Encryption Key                                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  AES-256-GCM Encryption                                      │
│  ├─ Mode: Galois/Counter Mode (authenticated)                │
│  ├─ IV: Random 96-bit per encryption                         │
│  └─ Tag: 128-bit authentication tag                          │
└─────────────────────────────────────────────────────────────┘
```

### Security Guarantees

| Threat | Protection |
|--------|------------|
| Database theft | AES-256-GCM encryption renders data unreadable |
| Brute force | Argon2id makes password cracking computationally infeasible |
| Memory dump | Keys exist only during session, cleared on lock |
| Network interception | 100% offline, no network requests for sensitive data |
| Clipboard sniffing | Auto-clear after configurable timeout |

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **Vanilla JavaScript** | Core logic (ES Modules) |
| **CSS3** | Glassmorphism design, animations |
| **HTML5** | Semantic markup |

### Cryptography
| Library | Purpose |
|---------|---------|
| **Web Crypto API** | AES-256-GCM encryption/decryption |
| **argon2-browser** | Argon2id password hashing |

### Storage
| Technology | Purpose |
|------------|---------|
| **IndexedDB** | Encrypted credential storage |
| **LocalStorage** | Settings and favicon cache |

### PWA
| Feature | Implementation |
|---------|---------------|
| **Service Worker** | Offline caching (cache-first strategy) |
| **Web App Manifest** | Installable app with icons |

---

## 📦 Installation

### Option 1: Use Online (PWA)
```bash
# Simply visit the hosted version and install as PWA
# (Add to Home Screen on mobile)
```

### Option 2: Self-Host
```bash
# Clone the repository
git clone https://github.com/L2-ootm/L2-Password-Manager.git
cd L2-Password-Manager

# Serve with any static HTTP server
npx http-server -p 3000 -c-1

# Open in browser
open http://localhost:3000
```

### Option 3: Development
```bash
# Clone and install dependencies
git clone https://github.com/L2-ootm/L2-Password-Manager.git
cd L2-Password-Manager

# Install dev dependencies (optional)
npm install

# Start development server with live reload
npm run dev
```

---

## 📖 Usage Guide

### First Time Setup
1. Open L2 Vault
2. Create a **Master Password** (minimum 8 characters)
3. Your vault is created and encrypted

### Daily Use
| Action | Result |
|--------|--------|
| **Single tap** on credential | Copies password |
| **Double tap** on credential | Copies email/username |
| **Long press** on credential | Opens context menu |
| **Right-click** (desktop) | Opens context menu |
| **Click + (FAB)** | Add new credential |
| **Swipe left/right** (lock screen) | Switch between vaults |

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Enter` | Submit form |
| `Escape` | Close modal |

---

## 🚀 Advanced Features

### Multi-Vault (Decoy Vaults)
Create multiple isolated vaults, each with its own password:
- **Swipe left/right** on lock screen to switch
- Each vault has **separate encryption keys**
- Separate **IndexedDB database** per vault
- Perfect for **decoy/duress scenarios**

### Auto Favicons
Automatic site icon fetching with intelligent fallback:
- **Providers**: Google, DuckDuckGo, Yandex
- **Service Detection**: 50+ common services mapped
- **Fallback**: Color-coded styled initials
- **Caching**: 7-day localStorage cache

---

## 🎲 Password Generator

8 generation modes for every use case:

| Mode | Description | Example |
|------|-------------|---------|
| 🔒 **Maximum Security** | All character types, 24+ chars | `Kx#9$mZp@2Qw!nL5` |
| ⚛️ **Quantum Level** | XOR-mixed entropy pools | `äXp#7ß@kLm&2` |
| 🧠 **Memorable** | Word combinations | `Cosmic-Dragon-Forge428!` |
| 🎲 **Diceware** | Dictionary passphrase | `Cabin-Chess-delta-Crisp45` |
| 🗣️ **Pronounceable** | Easy to speak/type | `Tobisake72` |
| 🔢 **PIN** | Numeric only | `847293` |
| 🔑 **Hexadecimal** | Crypto key format | `A7F3B2E94C1D` |
| 🌐 **Base64** | URL-safe format | `xK9mPq2nLw5z` |

### Strength Analysis
- **Real-time strength meter** (0-100%)
- **Crack time estimation** (based on 1T guesses/sec)
- **Entropy calculation** in bits

---

## 📚 API Reference

### Crypto Module (`src/crypto/`)

#### `argon2.js`
```javascript
// Create password hash
createPasswordHash(password) → { hash, salt }

// Verify password
verifyStoredPassword(password, hash, salt) → boolean

// Get encryption key material
getEncryptionKey(password, salt) → Uint8Array
```

#### `aes.js`
```javascript
// Encrypt data
encrypt(data, key) → { ciphertext, iv }

// Decrypt data
decrypt(ciphertext, iv, key) → string

// Import key for Web Crypto
importKey(keyMaterial) → CryptoKey
```

#### `generator.js`
```javascript
// Generate passwords
generateMaxSecurity(length) → string
generateQuantum(length) → string
generateMemorable(wordCount, numbers, symbols) → string
generateDiceware(wordCount, capitalize, addNumber) → string
generatePronounceable(length) → string
generatePIN(length) → string
generateHex(length) → string
generateBase64(length) → string

// Analysis
calculateStrength(password) → number (0-100)
estimateCrackTime(password) → string
getEntropyBits(password) → number
```

### Storage Module (`src/storage/`)

#### `db.js`
```javascript
// Initialize database
initDatabase() → Promise<IDBDatabase>

// Credentials CRUD
addCredential(credential) → Promise<number>
updateCredential(credential) → Promise<void>
deleteCredential(id) → Promise<void>
getAllCredentials() → Promise<Credential[]>

// Settings
getSetting(key, default) → Promise<any>
setSetting(key, value) → Promise<void>

// Export/Import
exportAllData() → Promise<object>
importAllData(data) → Promise<void>
```

#### `vaults.js`
```javascript
// Vault management
getAllVaults() → Vault[]
createVault(name, options) → Vault
deleteVault(vaultId) → Promise<void>
getCurrentVaultId() → string
setCurrentVault(vaultId) → void

// Navigation
getNextVault(currentId) → Vault
getPreviousVault(currentId) → Vault
```

---

## 🗺️ Roadmap

### ✅ Phase 1: Foundation (COMPLETE)
- [x] Project structure (HTML, CSS, JS modules)
- [x] Design system (dark/light themes, gold accents, glassmorphism)
- [x] IndexedDB with AES-256-GCM encryption
- [x] Master password with Argon2id key derivation
- [x] Service Worker for offline PWA

### ✅ Phase 2: Core UI & CRUD (COMPLETE)
- [x] Lock/unlock screen with branding
- [x] Credential list with "Tap Flow"
- [x] Add/edit credential modal
- [x] Copy-to-clipboard with haptic feedback
- [x] Search functionality
- [x] Context menu (long-press)

### ✅ Phase 3: Security & Backup (COMPLETE)
- [x] Auto-lock (configurable timeout)
- [x] Clipboard auto-clear
- [x] Encrypted export (AES-GCM)
- [x] Password-protected import

### ✅ Phase 4: Advanced Generator (COMPLETE)
- [x] 8-mode password generator
- [x] Strength meter with crack time
- [x] Generator presets modal

### ✅ Phase 5: Multi-Vault (COMPLETE)
- [x] Auto favicon fetching (3 providers)
- [x] Styled initial fallback
- [x] Decoy vaults (isolated databases)
- [x] Swipe-to-switch vault navigation
- [x] Vault indicator dots

### 🔄 Phase 6: Security Dashboard (IN PROGRESS)
- [ ] Weak password detection
- [ ] Duplicate password warnings
- [ ] Old password alerts (>90 days)
- [ ] HaveIBeenPwned integration (k-anonymity API)

### 📋 Phase 7: Stealth Mode (PLANNED)
- [ ] Notepad disguise UI
- [ ] Secret trigger phrase ("L2VAULT")
- [ ] Optional activation in settings
- [ ] Functional fake calculator/notes

### 📋 Phase 8: Duress Mode (PLANNED)
- [ ] Panic password option
- [ ] Show fake/decoy credentials
- [ ] Silent data wipe option
- [ ] Hidden deactivation gesture

### 📋 Phase 9: Time-Based Access (PLANNED)
- [ ] Per-credential schedules
- [ ] Day of week restrictions
- [ ] Time range visibility
- [ ] Hidden outside schedule

### 📋 Phase 10: QR Sync (PLANNED)
- [ ] QR code generation for credentials
- [ ] Camera-based QR scanning
- [ ] Encrypted transfer without master password
- [ ] Temporary session keys

### 🔮 Phase 11: Native Port (FUTURE)
- [ ] Android Studio + Kotlin setup
- [ ] Jetpack Compose UI
- [ ] Android Keystore integration
- [ ] Biometric authentication (fingerprint/face)
- [ ] SQLCipher encrypted database

### 🔮 Phase 12: Advanced Security (FUTURE)
- [ ] TOTP 2FA generator (Google Authenticator compatible)
- [ ] Secure keyboard (anti-keylogger)
- [ ] Root/jailbreak detection
- [ ] Tamper detection (signature verification)
- [ ] Self-destruct on invalid attempts

### 🚀 Phase 13: Android Release (FINAL)
- [ ] Complete translation of PWA code to Kotlin
- [ ] Verification and testing in Android Studio
- [ ] ProGuard/R8 configuration (obfuscation)
- [ ] APK signing with production keystore
- [ ] Release build (AAB for Play Store)
- [ ] Testing on physical devices
- [ ] Publication on Google Play Store

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Commit Convention
We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Formatting
- `refactor:` Code restructure
- `test:` Tests
- `chore:` Maintenance

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with 🔐 by L2 Systems</strong><br>
  <em>"Your secrets deserve a fortress."</em>
</p>

<p align="center">
  <a href="https://github.com/L2-ootm/L2-Password-Manager">⭐ Star this repo</a> •
  <a href="https://github.com/L2-ootm/L2-Password-Manager/issues">🐛 Report Bug</a> •
  <a href="https://github.com/L2-ootm/L2-Password-Manager/issues">💡 Request Feature</a>
</p>
