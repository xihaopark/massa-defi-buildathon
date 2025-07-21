# Wallet Configuration Guide

## 🔐 Security First

**IMPORTANT**: Never commit your private keys to version control!

## Configuration Methods

### Method 1: Browser Dialog (Recommended for Testing)

1. Open the Step1 DeFi interface
2. Click "Configure Wallet" button
3. Enter your wallet credentials:
   - **Address**: Your Massa address (starts with AU or AS)
   - **Private Key**: Your private key (starts with S1)
   - **Network**: Choose buildnet or mainnet

The configuration is saved securely in your browser's local storage.

### Method 2: Configuration File (For Development)

1. Edit `wallet-config.json` in this directory:

```json
{
  "wallet": {
    "address": "AU12bZJtxqWUgNtJ66MrmWbSFRgn6UrezqJahr5b62vEgVioMsmJM",
    "privateKey": "S1267XN94bHcUxCHUeJz8KTXQXXrt76gRLZYJkgckek6wz2hnyDF",
    "network": "buildnet"
  }
}
```

2. **CRITICAL**: Add to `.gitignore`:
```
src/config/wallet-config.json
```

### Method 3: Environment Variables (Production)

For production deployments, use environment variables:

```bash
export MASSA_WALLET_ADDRESS="AU12..."
export MASSA_WALLET_PRIVATE_KEY="S1..."
export MASSA_NETWORK="buildnet"
```

## Security Best Practices

1. **Test Accounts Only**: Only use test accounts on buildnet
2. **Never Share**: Never share your private key with anyone
3. **Secure Storage**: Use encrypted storage for production
4. **Hardware Wallets**: Consider hardware wallets for mainnet
5. **Regular Rotation**: Rotate keys regularly

## Wallet Validation

- **Address Format**: `AU` or `AS` + 48+ characters
- **Private Key Format**: `S1` + 48+ characters
- **Example Address**: `AU12bZJtxqWUgNtJ66MrmWbSFRgn6UrezqJahr5b62vEgVioMsmJM`
- **Example Private Key**: `S1267XN94bHcUxCHUeJz8KTXQXXrt76gRLZYJkgckek6wz2hnyDF`

## Network Configuration

### Buildnet (Test Network)
- RPC URL: `https://buildnet.massa.net/api/v2`
- Chain ID: 77658377
- Use for: Testing and development

### Mainnet (Production)
- RPC URL: `https://mainnet.massa.net/api/v2`
- Chain ID: 77658366
- Use for: Production deployments

## Troubleshooting

### "Invalid wallet address format"
- Ensure address starts with AU or AS
- Check for minimum 48 characters after prefix

### "Failed to load wallet configuration"
- Check if wallet-config.json exists
- Verify JSON syntax is correct
- Ensure file permissions allow reading

### "Cannot connect to network"
- Verify network selection matches your intention
- Check internet connection
- Confirm RPC endpoint is accessible

## Emergency Actions

### Clear Wallet Configuration
1. Click "Configure Wallet"
2. Click "Clear Config"
3. Confirm the action

### Reset Browser Storage
```javascript
localStorage.removeItem('step1_wallet_config');
```

### Manual Override
In browser console:
```javascript
walletManager.currentWallet = {
  address: "YOUR_ADDRESS",
  privateKey: "YOUR_KEY",
  network: "buildnet"
};
```

---

**Remember**: Your private key is like your password - keep it secret, keep it safe!