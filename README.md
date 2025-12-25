Recriar generenciador de senhas perdido:

L2 Vault (Codename: Fortress) - Project Blueprint

Versão do Documento: 1.0
Autor: L2 Systems AI Assistant
Status: Iniciação
Filosofia: Zero-Knowledge, Local-First, Security by Design.

1. Visão Geral & Core Philosophy

O objetivo é recriar o gerenciador de senhas do zero, mantendo a operação 100% offline, mas elevando o nível de segurança para padrões militares e modernizando a UI. O app não deve confiar em servidores. O dispositivo do usuário é o único cofre.

Os 3 Pilares do Projeto

Simplicidade Radical: O usuário não quer configurar servidores. Ele quer abrir, desbloquear e copiar.

Fortaleza Local: Se o celular for roubado e "dumpar" a memória, os dados devem ser lixo ilegível sem a chave mestra.

Anti-Tamper: O app deve resistir a tentativas de modificação e análise externa.

2. Stack Tecnológica Recomendada (Nível Elite)

Para maximizar a performance e a dificuldade de engenharia reversa:

Linguagem: Kotlin (Android Nativo).

UI Framework: Jetpack Compose (Moderno, declarativo, lindas animações).

Banco de Dados: Room (SQLite) + SQLCipher (para encriptação transparente do banco de dados em repouso - AES-256).

Criptografia: Tink (Google) ou Bouncy Castle.

Segurança de Hardware: Android Keystore System (TEE - Trusted Execution Environment).

3. Arquitetura de Segurança & Criptografia

O Problema da "Chave Escondida" (Hardcoded Key)

O Desafio: Você mencionou esconder uma chave dentro do app para descriptografar backups.
A Realidade: Segurança por obscuridade falha. Se a chave está no código (mesmo em C++ ou ofuscada), um hacker experiente com ferramentas como Frida ou Ghidra vai encontrá-la.
A Solução L2 (Secure Way): Não escondemos a chave no código. Usamos a Derivação de Chave.

Como vai funcionar o Export/Import Seguro:

Exportar: O usuário digita a Senha Mestra (ou cria uma senha específica para o backup). O app usa um algoritmo (Argon2id) para transformar essa senha em uma chave de criptografia. O arquivo é gerado.

Importar: O usuário seleciona o arquivo e precisa digitar a senha usada na exportação. O app recria a chave na hora e tenta abrir o arquivo.

Resultado: Mesmo se decompilarem o app, não acham a chave, porque a chave só existe na cabeça do usuário.

Anti-Engenharia Reversa (Obfuscation)

Para tornar a vida de quem tentar clonar ou hackear o app um inferno:

R8 / ProGuard (Agressivo): Renomeia todas as classes e métodos para letras aleatórias (a.b(), x.z()).

NDK (Native Development Kit): Escrever as funções críticas de criptografia em C++. É muito mais difícil ler Assembly de C++ do que bytecode de Java/Kotlin.

Checagem de Assinatura (Tamper Detection): O app verifica em tempo de execução se a assinatura digital dele mesmo é a original da L2 Systems. Se alguém modificar o APK e re-assinar, o app se recusa a abrir ou apaga o banco de dados local (Self-Destruct).

Root Detection: Avisar ou bloquear o uso em aparelhos rooteados (opcional, mas recomendado para segurança máxima).

4. UI/UX 2.0: Design Moderno (Conceito "Glass & Neon")

O design anterior era funcional, mas "padrão". Vamos para algo premium.

Estilo: Dark Mode Profundo (Preto OLED #000000) com elementos em Glassmorphism (efeito de vidro fosco) cinza chumbo.

A Cor Accent: Um Verde Neon Cibernético ou Laranja Lava (foge do azul padrão de apps corporativos).

Navegação:

Remover abas desnecessárias. Focar em uma Bottom Bar Flutuante.

Search-First: A barra de busca fica na parte inferior da tela (mais fácil para o polegar), similar aos navegadores modernos.

Fluxo de Cópia (The "Tap Flow")

Lista de senhas mostra apenas Ícone + Nome do Serviço.

Toque Simples: Copia a senha e mostra um toast "Copiado" + vibração hápitca suave.

Toque Longo: Abre os detalhes para editar/ver.

Isso elimina botões pequenos de "copy" e limpa a interface.

5. Novas Funcionalidades (Brainstorm L2)

Além do básico, aqui estão ideias para diferenciar o app:

A. Modo "Duress" (Pânico)

Se alguém te obrigar a desbloquear o celular (assalto/polícia em regimes autoritários):

Você cadastra uma Senha de Pânico (ex: 0000).

Se digitada no login, o app abre, mas mostra um cofre falso vazio ou apaga silenciosamente os dados sensíveis reais.

B. Stealth Mode (Camuflagem de App)

Opção para mudar o ícone do app na home screen para parecer uma "Calculadora" ou "Notas".

Ao abrir, parece uma calculadora funcional. Só abre o cofre se digitar uma equação específica (ex: 55 + 55 = abre cofre).

C. Teclado Seguro Incógnito

O app implementa um teclado próprio customizado para quando você for digitar uma nova senha dentro dele, impedindo que teclados de terceiros (Gboard, SwiftKey) aprendam ou salvem o que você digita.

D. Offline QR Transfer

Quer passar a senha do Wi-Fi para um amigo que também tem o app?

O app gera um QR Code criptografado na sua tela. O amigo escaneia. A senha é transferida sem passar pela internet/bluetooth.

E. TOTP Integrado (2FA)

Além de guardar a senha, o app gera os códigos de 6 dígitos (como o Google Authenticator).

Vantagem: Ao copiar a senha, o app já copia automaticamente o código 2FA para o clipboard logo em seguida.

6. Roadmap de Desenvolvimento (Começando Hoje)

Fase 1: A Fundação (Dia 1-2)

[ ] Setup do Projeto Android Studio (Kotlin + Compose).

[ ] Implementação do Room Database + SQLCipher (Criptografia do DB).

[ ] Criação da tela de Login e Lógica de Chave Mestra (Argon2id).

Fase 2: CRUD & UI (Dia 3-5)

[ ] Criar a lista de senhas (LazyColumn em Compose).

[ ] Criar formulário de Adicionar/Editar.

[ ] Implementar o "Tap Flow" (copiar ao tocar).

[ ] Implementar Biometria (Fingerprint/FaceID).

Fase 3: Segurança Avançada & Backup (Dia 6-7)

[ ] Implementar Export/Import com senha customizada (JSON Criptografado AES-GCM).

[ ] Implementar Auto-Lock e Limpeza de Clipboard.

Fase 4: Polimento & Obfuscation (Dia 8+)

[ ] Configurar regras do R8 (Obfuscation).

[ ] Testes de "Tamper" (tentar hackear o próprio app).

[ ] Implementar ícone customizado/Stealth Mode.

Anexo: Estrutura de Dados (Sugestão)

@Entity(tableName = "credentials")
data class Credential(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val title: String,          // Ex: Google
    val username: String,       // Ex: usuario@gmail.com
    val encryptedPassword: String, // Blob criptografado
    val iv: String,             // Initialization Vector (para criptografia)
    val category: String,       // Ex: Social, Work
    val iconId: String,         // Identificador do ícone
    val createdAt: Long,
    val isFavorite: Boolean = false
)
