# Buildnet Data Storage

This directory stores real blockchain data from Massa Buildnet:

## Files
- `account_history.json` - Account balance change history
- `contract_logs.json` - Smart contract execution logs  
- `asc_cycles.json` - ASC execution cycle data
- `trade_records.json` - Real trading transaction records
- `error_logs.json` - System error and exception logs

## Data Sources
- Massa Buildnet JSON-RPC API
- Smart contract datastore entries
- Transaction events and logs
- Account balance queries

## Data Format
All files use JSON format with timestamps in ISO 8601 format.
Real blockchain addresses and transaction hashes are preserved.