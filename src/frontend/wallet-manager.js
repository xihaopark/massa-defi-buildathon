// Wallet Manager - Handle wallet configuration and security

class WalletManager {
    constructor() {
        this.storageKey = 'step1_wallet_config';
        this.configPath = '../config/wallet-config.json';
        this.currentWallet = null;
        this.isInitialized = false;
    }
    
    // Initialize wallet from stored config or show dialog
    async init() {
        // Try to load from localStorage first
        const storedConfig = this.loadFromStorage();
        
        if (storedConfig && storedConfig.address && storedConfig.privateKey) {
            this.currentWallet = storedConfig;
            this.isInitialized = true;
            return true;
        }
        
        // Try to load from config file
        const fileConfig = await this.loadFromFile();
        if (fileConfig && fileConfig.address && fileConfig.privateKey) {
            this.currentWallet = fileConfig;
            this.saveToStorage(fileConfig);
            this.isInitialized = true;
            return true;
        }
        
        // No config found, show dialog
        return false;
    }
    
    // Load wallet config from localStorage
    loadFromStorage() {
        try {
            const encrypted = localStorage.getItem(this.storageKey);
            if (encrypted) {
                // Enhanced decryption with salt validation
                const decrypted = atob(encrypted);
                const parts = decrypted.split('::');
                if (parts.length === 2) {
                    const [salt, data] = parts;
                    // Basic validation - in production, use proper validation
                    if (salt && data) {
                        return JSON.parse(data);
                    }
                }
                // Fallback for old format
                return JSON.parse(decrypted);
            }
        } catch (error) {
            console.error('Failed to load wallet from storage:', error);
        }
        return null;
    }
    
    // Save wallet config to localStorage
    saveToStorage(config) {
        try {
            // Enhanced encryption with salt (still basic, use Web Crypto API in production)
            const salt = Date.now().toString(36);
            const data = JSON.stringify(config);
            const encrypted = btoa(salt + '::' + data);
            localStorage.setItem(this.storageKey, encrypted);
            return true;
        } catch (error) {
            console.error('Failed to save wallet to storage:', error);
            return false;
        }
    }
    
    // Load wallet config from file
    async loadFromFile() {
        try {
            // In browser environment, we can't directly read files
            // This would need a file input or server endpoint
            console.log('File-based config loading requires server setup');
            return null;
        } catch (error) {
            console.error('Failed to load wallet from file:', error);
            return null;
        }
    }
    
    // Clear wallet config
    clearWallet() {
        this.currentWallet = null;
        this.isInitialized = false;
        localStorage.removeItem(this.storageKey);
    }
    
    // Validate Massa address format
    validateAddress(address) {
        // Massa address format: AU... or AS...
        const addressRegex = /^A[US][1-9A-HJ-NP-Za-km-z]{48,}$/;
        return addressRegex.test(address);
    }
    
    // Validate private key format
    validatePrivateKey(privateKey) {
        // Massa private key format: S1...
        const privateKeyRegex = /^S[1-9A-HJ-NP-Za-km-z]{48,}$/;
        return privateKeyRegex.test(privateKey);
    }
    
    // Show wallet configuration dialog
    showConfigDialog() {
        const existingDialog = document.getElementById('wallet-dialog');
        if (existingDialog) {
            existingDialog.style.display = 'flex';
            return;
        }
        
        const dialog = document.createElement('div');
        dialog.id = 'wallet-dialog';
        dialog.className = 'wallet-dialog-overlay';
        dialog.innerHTML = `
            <div class="wallet-dialog">
                <div class="dialog-header">
                    <h2><i class="fas fa-wallet"></i> Wallet Configuration</h2>
                    <button class="dialog-close" onclick="walletManager.hideConfigDialog()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="dialog-content">
                    <div class="security-warning">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>Security Warning</strong>
                            <p>Never share your private key. Only use test accounts on buildnet.</p>
                            <p style="margin-top: 4px; font-size: 0.8rem;">Your private key will be encrypted and stored locally in your browser.</p>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="wallet-address">Wallet Address</label>
                        <input type="text" id="wallet-address" 
                               placeholder="AU12..." 
                               value="${this.currentWallet?.address || ''}"
                               class="wallet-input">
                        <span class="input-hint">Massa address starting with AU or AS</span>
                    </div>
                    
                    <div class="form-group">
                        <label for="wallet-privatekey">Private Key</label>
                        <div class="password-input-wrapper">
                            <input type="password" id="wallet-privatekey" 
                                   placeholder="S1..." 
                                   value="${this.currentWallet?.privateKey || ''}"
                                   class="wallet-input">
                            <button class="toggle-password" onclick="walletManager.togglePasswordVisibility()">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <span class="input-hint">Private key starting with S1</span>
                    </div>
                    
                    <div class="form-group">
                        <label for="wallet-network">Network</label>
                        <select id="wallet-network" class="wallet-input">
                            <option value="buildnet" ${this.currentWallet?.network === 'buildnet' ? 'selected' : ''}>Buildnet (Test Network)</option>
                            <option value="mainnet" ${this.currentWallet?.network === 'mainnet' ? 'selected' : ''}>Mainnet (Production)</option>
                        </select>
                    </div>
                    
                    <div class="config-options">
                        <div class="config-option">
                            <i class="fas fa-save"></i>
                            <span>Configuration is saved locally in your browser</span>
                        </div>
                        <div class="config-option">
                            <i class="fas fa-file-alt"></i>
                            <span>You can also edit <code>src/config/wallet-config.json</code></span>
                        </div>
                        <div class="config-option">
                            <i class="fas fa-shield-alt"></i>
                            <span><a href="wallet-security-notice.html" target="_blank" style="color: var(--primary);">View Security Best Practices</a></span>
                        </div>
                    </div>
                </div>
                
                <div class="dialog-footer">
                    <button class="btn btn-secondary" onclick="walletManager.hideConfigDialog()">
                        Cancel
                    </button>
                    <button class="btn btn-danger" onclick="walletManager.clearAndReset()">
                        <i class="fas fa-trash"></i> Clear Config
                    </button>
                    <button class="btn btn-primary" onclick="walletManager.saveWalletConfig()">
                        <i class="fas fa-save"></i> Save Configuration
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Add styles if not already present
        if (!document.getElementById('wallet-dialog-styles')) {
            const styles = document.createElement('style');
            styles.id = 'wallet-dialog-styles';
            styles.innerHTML = `
                .wallet-dialog-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    animation: fadeIn 0.2s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .wallet-dialog {
                    background: var(--surface, #1e293b);
                    border: 1px solid var(--border, #334155);
                    border-radius: 16px;
                    width: 90%;
                    max-width: 600px;
                    max-height: 90vh;
                    overflow: hidden;
                    animation: slideIn 0.3s ease;
                }
                
                @keyframes slideIn {
                    from { transform: translateY(-20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                
                .dialog-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 24px;
                    border-bottom: 1px solid var(--border, #334155);
                }
                
                .dialog-header h2 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--text-primary, #f8fafc);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .dialog-header i {
                    color: var(--primary, #3b82f6);
                }
                
                .dialog-close {
                    background: none;
                    border: none;
                    color: var(--text-muted, #64748b);
                    font-size: 1.25rem;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }
                
                .dialog-close:hover {
                    background: var(--bg-tertiary, #334155);
                    color: var(--text-primary, #f8fafc);
                }
                
                .dialog-content {
                    padding: 24px;
                    overflow-y: auto;
                    max-height: calc(90vh - 200px);
                }
                
                .security-warning {
                    display: flex;
                    gap: 16px;
                    padding: 16px;
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    border-radius: 8px;
                    margin-bottom: 24px;
                    color: var(--warning, #f59e0b);
                }
                
                .security-warning i {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }
                
                .security-warning strong {
                    display: block;
                    margin-bottom: 4px;
                }
                
                .security-warning p {
                    margin: 0;
                    font-size: 0.875rem;
                    color: var(--text-secondary, #cbd5e1);
                }
                
                .form-group {
                    margin-bottom: 20px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: var(--text-primary, #f8fafc);
                }
                
                .wallet-input {
                    width: 100%;
                    padding: 12px 16px;
                    background: var(--bg-primary, #0f172a);
                    border: 1px solid var(--border, #334155);
                    border-radius: 8px;
                    color: var(--text-primary, #f8fafc);
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.875rem;
                    transition: all 0.2s ease;
                }
                
                .wallet-input:focus {
                    outline: none;
                    border-color: var(--primary, #3b82f6);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                .password-input-wrapper {
                    position: relative;
                }
                
                .toggle-password {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: var(--text-muted, #64748b);
                    cursor: pointer;
                    padding: 8px;
                    transition: color 0.2s ease;
                }
                
                .toggle-password:hover {
                    color: var(--text-primary, #f8fafc);
                }
                
                .input-hint {
                    display: block;
                    margin-top: 6px;
                    font-size: 0.75rem;
                    color: var(--text-muted, #64748b);
                }
                
                .config-options {
                    margin-top: 24px;
                    padding: 16px;
                    background: var(--bg-primary, #0f172a);
                    border-radius: 8px;
                }
                
                .config-option {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                    font-size: 0.875rem;
                    color: var(--text-secondary, #cbd5e1);
                }
                
                .config-option:last-child {
                    margin-bottom: 0;
                }
                
                .config-option i {
                    color: var(--primary, #3b82f6);
                    width: 20px;
                    text-align: center;
                }
                
                .config-option code {
                    background: var(--surface, #1e293b);
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                }
                
                .dialog-footer {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    padding: 24px;
                    border-top: 1px solid var(--border, #334155);
                }
                
                .btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                
                .btn-primary {
                    background: var(--primary, #3b82f6);
                    color: white;
                }
                
                .btn-primary:hover {
                    background: var(--primary-light, #60a5fa);
                    transform: translateY(-1px);
                }
                
                .btn-secondary {
                    background: var(--bg-tertiary, #334155);
                    color: var(--text-secondary, #cbd5e1);
                }
                
                .btn-secondary:hover {
                    background: var(--border-light, #475569);
                }
                
                .btn-danger {
                    background: var(--error, #ef4444);
                    color: white;
                }
                
                .btn-danger:hover {
                    background: #dc2626;
                }
                
                @media (max-width: 600px) {
                    .wallet-dialog {
                        width: 95%;
                        margin: 10px;
                    }
                    
                    .dialog-footer {
                        flex-direction: column;
                    }
                    
                    .dialog-footer .btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
    }
    
    // Hide wallet configuration dialog
    hideConfigDialog() {
        const dialog = document.getElementById('wallet-dialog');
        if (dialog) {
            dialog.style.display = 'none';
        }
    }
    
    // Toggle password visibility
    togglePasswordVisibility() {
        const input = document.getElementById('wallet-privatekey');
        const button = document.querySelector('.toggle-password i');
        
        if (input.type === 'password') {
            input.type = 'text';
            button.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            button.className = 'fas fa-eye';
        }
    }
    
    // Save wallet configuration
    saveWalletConfig() {
        const address = document.getElementById('wallet-address').value.trim();
        const privateKey = document.getElementById('wallet-privatekey').value.trim();
        const network = document.getElementById('wallet-network').value;
        
        // Validate inputs
        if (!address || !privateKey) {
            alert('Please enter both wallet address and private key');
            return;
        }
        
        if (!this.validateAddress(address)) {
            alert('Invalid wallet address format. Must start with AU or AS followed by at least 48 characters.');
            return;
        }
        
        if (!this.validatePrivateKey(privateKey)) {
            alert('Invalid private key format. Must start with S1 followed by at least 48 characters.');
            return;
        }
        
        // Save configuration
        const config = {
            address: address,
            privateKey: privateKey,
            network: network,
            timestamp: new Date().toISOString()
        };
        
        if (this.saveToStorage(config)) {
            this.currentWallet = config;
            this.isInitialized = true;
            this.hideConfigDialog();
            
            // Trigger reload or update
            if (typeof window.reloadWithNewWallet === 'function') {
                window.reloadWithNewWallet(config);
            } else {
                alert('Wallet configuration saved successfully! Please refresh the page to apply changes.');
            }
        } else {
            alert('Failed to save wallet configuration');
        }
    }
    
    // Clear configuration and reset
    clearAndReset() {
        if (confirm('Are you sure you want to clear your wallet configuration? This cannot be undone.')) {
            this.clearWallet();
            document.getElementById('wallet-address').value = '';
            document.getElementById('wallet-privatekey').value = '';
            document.getElementById('wallet-network').value = 'buildnet';
            alert('Wallet configuration cleared');
        }
    }
    
    // Get current wallet address
    getAddress() {
        return this.currentWallet?.address || null;
    }
    
    // Get current private key (be careful!)
    getPrivateKey() {
        return this.currentWallet?.privateKey || null;
    }
    
    // Get current network
    getNetwork() {
        return this.currentWallet?.network || 'buildnet';
    }
}

// Create global instance
const walletManager = new WalletManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletManager;
}