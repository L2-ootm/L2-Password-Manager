<p align="center">
  <a href="README.md">🇧🇷 Português</a> •
  <a href="README.en.md">🇺🇸 English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Versão-1.0.0-gold?style=for-the-badge" alt="Versão">
  <img src="https://img.shields.io/badge/Licença-MIT-green?style=for-the-badge" alt="Licença">
  <img src="https://img.shields.io/badge/PWA-Pronto-blue?style=for-the-badge" alt="PWA">
  <img src="https://img.shields.io/badge/Segurança-Nível%20Militar-red?style=for-the-badge" alt="Segurança">
</p>

<h1 align="center">🔐 L2 Vault</h1>
<h3 align="center">Protocolo Fortaleza • Gerenciador de Senhas Zero-Knowledge</h3>

<p align="center">
  <strong>100% Offline • Criptografia Militar • Progressive Web App</strong>
</p>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura de Segurança](#-arquitetura-de-segurança)
- [Stack Tecnológica](#%EF%B8%8F-stack-tecnológica)
- [Instalação](#-instalação)
- [Guia de Uso](#-guia-de-uso)
- [Funcionalidades Avançadas](#-funcionalidades-avançadas)
- [Gerador de Senhas](#-gerador-de-senhas)
- [Referência da API](#-referência-da-api)
- [Roadmap](#%EF%B8%8F-roadmap)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🏰 Visão Geral

**L2 Vault** (Codinome: *Fortress*) é um gerenciador de senhas de próxima geração construído com filosofia **Zero-Knowledge, Local-First**. Seus segredos nunca saem do seu dispositivo. Sem servidores. Sem sincronização. Sem necessidade de confiança.

### Filosofia Central

| Princípio | Descrição |
|-----------|-----------|
| **🔒 Zero-Knowledge** | Seus dados são criptografados com chaves derivadas da SUA senha. Mesmo se alguém roubar o banco de dados, será ilegível. |
| **📱 Local-First** | Todos os dados vivem no seu dispositivo. Sem nuvem, sem criação de conta, sem superfície de ataque. |
| **🛡️ Segurança by Design** | Criptografia de nível militar (AES-256-GCM + Argon2id) desde o primeiro dia, não como uma reflexão posterior. |
| **⚡ Simplicidade Radical** | Abrir → Desbloquear → Copiar. Sem configuração necessária. |

---

## ✨ Funcionalidades

### Funcionalidades Principais
- ✅ **Armazenamento Seguro** - Senhas criptografadas com AES-256-GCM no IndexedDB
- ✅ **Senha Mestra** - Derivação de chave com Argon2id (recomendado pela OWASP)
- ✅ **Toque para Copiar** - Um toque copia a senha, mostra notificação toast
- ✅ **Duplo-toque para Email** - Duplo toque copia usuário/email
- ✅ **Menu de Contexto** - Editar, copiar ou excluir com feedback visual (toque longo)
- ✅ **Busca** - Filtragem em tempo real por título, usuário ou categoria
- ✅ **Categorias** - Organize senhas por tipo (social, trabalho, banco, etc.)
- ✅ **Favicons Automáticos** - Ícones de sites automaticamente com fallback estilizado
- ✅ **Temas Claro/Escuro** - Modo escuro OLED-friendly com acentos dourados

### Funcionalidades de Segurança
- ✅ **Auto-Lock** - Timeout configurável (1-30 minutos)
- ✅ **Limpeza de Clipboard** - Limpa senhas copiadas após timeout
- ✅ **Export/Import Criptografado** - Backup com arquivos protegidos por senha
- ✅ **Service Worker** - Funcionalidade 100% offline

### Funcionalidades Avançadas (NOVO!)
- ✅ **Gerador de Senhas 8-Modos** - De quântico a memorável
- ✅ **Cofres Decoy** - Múltiplos cofres isolados, deslize para trocar
- ✅ **Medidor de Força** - Análise em tempo real com estimativa de tempo para quebrar

---

## 🔒 Arquitetura de Segurança

### Stack de Criptografia

```
┌─────────────────────────────────────────────────────────────┐
│                   SENHA MESTRA DO USUÁRIO                    │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Derivação de Chave Argon2id                                 │
│  ├─ Memória: 64MB                                            │
│  ├─ Iterações: 3                                             │
│  ├─ Paralelismo: 4                                           │
│  └─ Salt: Criptograficamente aleatório (128-bit)             │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Chave de Criptografia 256-bit                               │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  Criptografia AES-256-GCM                                    │
│  ├─ Modo: Galois/Counter Mode (autenticado)                  │
│  ├─ IV: Aleatório 96-bit por criptografia                    │
│  └─ Tag: Tag de autenticação 128-bit                         │
└─────────────────────────────────────────────────────────────┘
```

### Garantias de Segurança

| Ameaça | Proteção |
|--------|----------|
| Roubo de banco de dados | Criptografia AES-256-GCM torna dados ilegíveis |
| Força bruta | Argon2id torna quebra de senha computacionalmente inviável |
| Dump de memória | Chaves existem apenas durante sessão, limpas ao bloquear |
| Interceptação de rede | 100% offline, sem requisições de rede para dados sensíveis |
| Clipboard sniffing | Auto-clear após timeout configurável |

---

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia | Propósito |
|------------|-----------|
| **Vanilla JavaScript** | Lógica central (ES Modules) |
| **CSS3** | Design glassmorphism, animações |
| **HTML5** | Marcação semântica |

### Criptografia
| Biblioteca | Propósito |
|------------|-----------|
| **Web Crypto API** | Criptografia/descriptografia AES-256-GCM |
| **argon2-browser** | Hash de senha Argon2id |

### Armazenamento
| Tecnologia | Propósito |
|------------|-----------|
| **IndexedDB** | Armazenamento criptografado de credenciais |
| **LocalStorage** | Configurações e cache de favicons |

### PWA
| Funcionalidade | Implementação |
|----------------|---------------|
| **Service Worker** | Cache offline (estratégia cache-first) |
| **Web App Manifest** | App instalável com ícones |

---

## 📦 Instalação

### Opção 1: Usar Online (PWA)
```bash
# Simplesmente visite a versão hospedada e instale como PWA
# (Adicionar à Tela Inicial no mobile)
```

### Opção 2: Auto-Hospedar
```bash
# Clone o repositório
git clone https://github.com/L2-ootm/L2-Password-Manager.git
cd L2-Password-Manager

# Sirva com qualquer servidor HTTP estático
npx http-server -p 3000 -c-1

# Abra no navegador
open http://localhost:3000
```

### Opção 3: Desenvolvimento
```bash
# Clone e instale dependências
git clone https://github.com/L2-ootm/L2-Password-Manager.git
cd L2-Password-Manager

# Instale dependências dev (opcional)
npm install

# Inicie servidor de desenvolvimento com live reload
npm run dev
```

---

## 📖 Guia de Uso

### Primeira Configuração
1. Abra o L2 Vault
2. Crie uma **Senha Mestra** (mínimo 8 caracteres)
3. Seu cofre está criado e criptografado

### Uso Diário
| Ação | Resultado |
|------|-----------|
| **Toque único** na credencial | Copia senha |
| **Toque duplo** na credencial | Copia email/usuário |
| **Toque longo** na credencial | Abre menu de contexto |
| **Clique direito** (desktop) | Abre menu de contexto |
| **Clique + (FAB)** | Adiciona nova credencial |
| **Deslize esquerda/direita** (tela de bloqueio) | Troca entre cofres |

### Atalhos de Teclado
| Atalho | Ação |
|--------|------|
| `Enter` | Enviar formulário |
| `Escape` | Fechar modal |

---

## 🚀 Funcionalidades Avançadas

### Multi-Cofre (Cofres Decoy)
Crie múltiplos cofres isolados, cada um com sua própria senha:
- **Deslize esquerda/direita** na tela de bloqueio para trocar
- Cada cofre tem **chaves de criptografia separadas**
- Banco de dados **IndexedDB separado** por cofre
- Perfeito para **cenários de decoy/coação**

### Favicons Automáticos
Busca automática de ícones de sites com fallback inteligente:
- **Provedores**: Google, DuckDuckGo, Yandex
- **Detecção de Serviços**: 50+ serviços comuns mapeados
- **Fallback**: Iniciais estilizadas com cores
- **Cache**: Cache em localStorage de 7 dias

---

## 🎲 Gerador de Senhas

8 modos de geração para cada caso de uso:

| Modo | Descrição | Exemplo |
|------|-----------|---------|
| 🔒 **Segurança Máxima** | Todos os tipos de caracteres, 24+ chars | `Kx#9$mZp@2Qw!nL5` |
| ⚛️ **Nível Quântico** | Pools de entropia misturados com XOR | `äXp#7ß@kLm&2` |
| 🧠 **Memorável** | Combinações de palavras | `Cosmic-Dragon-Forge428!` |
| 🎲 **Diceware** | Passphrase de dicionário | `Cabin-Chess-delta-Crisp45` |
| 🗣️ **Pronunciável** | Fácil de falar/digitar | `Tobisake72` |
| 🔢 **PIN** | Apenas numérico | `847293` |
| 🔑 **Hexadecimal** | Formato de chave cripto | `A7F3B2E94C1D` |
| 🌐 **Base64** | Formato URL-safe | `xK9mPq2nLw5z` |

### Análise de Força
- **Medidor de força em tempo real** (0-100%)
- **Estimativa de tempo para quebrar** (baseado em 1T tentativas/seg)
- **Cálculo de entropia** em bits

---

## 📚 Referência da API

### Módulo Crypto (`src/crypto/`)

#### `argon2.js`
```javascript
// Criar hash de senha
createPasswordHash(password) → { hash, salt }

// Verificar senha
verifyStoredPassword(password, hash, salt) → boolean

// Obter material de chave de criptografia
getEncryptionKey(password, salt) → Uint8Array
```

#### `aes.js`
```javascript
// Criptografar dados
encrypt(data, key) → { ciphertext, iv }

// Descriptografar dados
decrypt(ciphertext, iv, key) → string

// Importar chave para Web Crypto
importKey(keyMaterial) → CryptoKey
```

#### `generator.js`
```javascript
// Gerar senhas
generateMaxSecurity(length) → string
generateQuantum(length) → string
generateMemorable(wordCount, numbers, symbols) → string
generateDiceware(wordCount, capitalize, addNumber) → string
generatePronounceable(length) → string
generatePIN(length) → string
generateHex(length) → string
generateBase64(length) → string

// Análise
calculateStrength(password) → number (0-100)
estimateCrackTime(password) → string
getEntropyBits(password) → number
```

### Módulo Storage (`src/storage/`)

#### `db.js`
```javascript
// Inicializar banco de dados
initDatabase() → Promise<IDBDatabase>

// CRUD de Credenciais
addCredential(credential) → Promise<number>
updateCredential(credential) → Promise<void>
deleteCredential(id) → Promise<void>
getAllCredentials() → Promise<Credential[]>

// Configurações
getSetting(key, default) → Promise<any>
setSetting(key, value) → Promise<void>

// Export/Import
exportAllData() → Promise<object>
importAllData(data) → Promise<void>
```

#### `vaults.js`
```javascript
// Gerenciamento de cofres
getAllVaults() → Vault[]
createVault(name, options) → Vault
deleteVault(vaultId) → Promise<void>
getCurrentVaultId() → string
setCurrentVault(vaultId) → void

// Navegação
getNextVault(currentId) → Vault
getPreviousVault(currentId) → Vault
```

---

## 🗺️ Roadmap

### ✅ Fase 1: Fundação (COMPLETA)
- [x] Estrutura do projeto (HTML, CSS, módulos JS)
- [x] Sistema de design (temas claro/escuro, acentos dourados, glassmorphism)
- [x] IndexedDB com criptografia AES-256-GCM
- [x] Senha mestra com derivação de chave Argon2id
- [x] Service Worker para PWA offline

### ✅ Fase 2: UI Principal & CRUD (COMPLETA)
- [x] Tela de bloqueio/desbloqueio com branding
- [x] Lista de credenciais com "Tap Flow"
- [x] Modal de adicionar/editar credencial
- [x] Copiar para clipboard com feedback háptico
- [x] Funcionalidade de busca
- [x] Menu de contexto (toque longo)

### ✅ Fase 3: Segurança & Backup (COMPLETA)
- [x] Auto-lock (timeout configurável)
- [x] Limpeza automática de clipboard
- [x] Export criptografado (AES-GCM)
- [x] Import protegido por senha

### ✅ Fase 4: Gerador Avançado (COMPLETA)
- [x] Gerador de senhas 8-modos
- [x] Medidor de força com tempo para quebrar
- [x] Modal de presets do gerador

### ✅ Fase 5: Multi-Cofre (COMPLETA)
- [x] Busca automática de favicons (3 provedores)
- [x] Fallback de iniciais estilizadas
- [x] Cofres decoy (bancos de dados isolados)
- [x] Navegação por deslize para trocar cofres
- [x] Indicadores de cofre (pontos)

### ✅ Fase 6: Dashboard de Segurança (COMPLETA)
- [x] Detecção de senhas fracas
- [x] Alertas de senhas duplicadas
- [x] Alertas de senhas antigas (>90 dias)
- [x] Integração HaveIBeenPwned (API k-anonymity)

### ✅ Fase 7: Modo Stealth (COMPLETA)
- [x] UI disfarçada de bloco de notas
- [x] Frase secreta de gatilho ("L2VAULT")
- [x] Ativação opcional nas configurações
- [ ] Calculadora/notas fake funcionais

### ✅ Fase 8: Modo Duress (COMPLETA)
- [x] Opção de senha de pânico
- [x] Mostrar credenciais fake/decoy
- [ ] Opção de wipe silencioso de dados
- [ ] Gesto oculto de desativação

### � Fase 9: Acesso Baseado em Tempo (EM PROGRESSO)
- [x] Agendamentos por credencial (módulo pronto)
- [x] Restrições por dia da semana
- [x] Visibilidade por intervalo de tempo
- [ ] Página de configurações dedicada (opcional)

### 📋 Fase 10: Sync via QR (PLANEJADA)
- [x] Geração de QR code para credenciais (módulo pronto)
- [x] Scanner de QR via câmera (módulo pronto)
- [ ] UI de transferência criptografada
- [ ] Chaves de sessão temporárias

### 🔮 Fase 11: Port Nativo (FUTURO)
- [ ] Setup Android Studio + Kotlin
- [ ] UI com Jetpack Compose
- [ ] Integração Android Keystore
- [ ] Autenticação biométrica (impressão digital/face)
- [ ] Banco de dados criptografado SQLCipher

### 🔮 Fase 12: Segurança Avançada (FUTURO)
- [ ] Gerador TOTP 2FA (compatível Google Authenticator)
- [ ] Teclado seguro (anti-keylogger)
- [ ] Detecção de root/jailbreak
- [ ] Detecção de tamper (verificação de assinatura)
- [ ] Auto-destruição após tentativas inválidas

### 🚀 Fase 13: Release Android (FINAL)
- [ ] Tradução completa do código PWA para Kotlin
- [ ] Verificação e testes no Android Studio
- [ ] Configuração de ProGuard/R8 (ofuscação)
- [ ] Assinatura do APK com keystore de produção
- [ ] Build de release (AAB para Play Store)
- [ ] Testes em dispositivos físicos
- [ ] Publicação na Google Play Store

### 📧 Fase 14: Sistema de Recuperação (FUTURO)
- [ ] Configuração de email padrão da conta
- [ ] Email de recuperação secundário
- [ ] Backup criptografado automático para email
- [ ] Integração com auto-destruição (enviar backup antes de apagar)
- [ ] Decriptação de backup recebido por email
- [ ] Verificação de identidade antes de recuperação

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, siga estes passos:

1. **Fork** o repositório
2. **Crie** uma branch de feature (`git checkout -b feature/funcionalidade-incrivel`)
3. **Commit** suas mudanças (`git commit -m 'feat: Adiciona funcionalidade incrível'`)
4. **Push** para a branch (`git push origin feature/funcionalidade-incrivel`)
5. **Abra** um Pull Request

### Convenção de Commits
Seguimos [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Reestruturação de código
- `test:` Testes
- `chore:` Manutenção

---

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

<p align="center">
  <strong>Construído com 🔐 por L2 Systems</strong><br>
  <em>"Seus segredos merecem uma fortaleza."</em>
</p>

<p align="center">
  <a href="https://github.com/L2-ootm/L2-Password-Manager">⭐ Dê uma estrela</a> •
  <a href="https://github.com/L2-ootm/L2-Password-Manager/issues">🐛 Reportar Bug</a> •
  <a href="https://github.com/L2-ootm/L2-Password-Manager/issues">💡 Sugerir Feature</a>
</p>
