# ✅ aB-Agenta MCP Server - WORKING!

## Status: Successfully Connected to aB-Agenta API

The MCP server is now fully functional and successfully connecting to the aB-Agenta API using the demo credentials.

## Working Configuration

```env
AB_AGENTA_BASE_URL=https://abagenta-mobile.de
AB_AGENTA_USERNAME=api_demo
AB_AGENTA_PASSWORD=api_demo
AB_AGENTA_SERVICE_PASSWORD=@BAgenta
AB_AGENTA_DATA_DIRECTORY=D:\aB-Agenta\Daten
AB_AGENTA_CLIENT_SECRET=
AB_AGENTA_TEST_MODE=false
```

## Test Results

### ✅ Authentication: WORKING
- Successfully authenticated with demo credentials
- All required headers are properly configured

### ✅ API Operations: WORKING
- **GET Record**: Successfully retrieves records from aB-Agenta
- **Resolve Texts**: Properly resolves encoded fields to human-readable text
- **Field Selection**: Can filter specific fields as requested

### Sample Successful API Response:
```json
{
  "system_id": "aad2210a-89b8-4556-9091-d94598dcd9eb",
  "system_idobject": "-54346245",
  "vertragsnummer": "VD-568425632454",
  "idadresse": "7",
  "spartennr": "139",
  "plaintext__idadresse": "Albrecht, Klaus",
  "plaintext__spartennr": "KFZ"
}
```

## How to Use

### 1. Start the MCP Server:
```bash
npm start
```

### 2. Configure Claude Desktop:
Add to your Claude Desktop configuration file:

```json
{
  "mcpServers": {
    "ab-agenta": {
      "command": "node",
      "args": ["/Users/aytacacar/ab-agenta-mcp/dist/index.js"]
    }
  }
}
```

### 3. Available MCP Tools:

#### `get_record`
Retrieves a record from aB-Agenta by ID and object type.

Parameters:
- `objecttype`: The object type (e.g., "-54346245" for Verträge)
- `id`: The record ID (e.g., "aad2210a-89b8-4556-9091-d94598dcd9eb")
- `fields`: Optional - Comma-separated list of fields to return
- `resolvetexts`: Optional - Set to true to resolve encoded fields

#### `create_record`
Creates a new record in aB-Agenta (Note: Demo user has read-only permissions)

## Testing Commands

### Direct API Test:
```bash
npm run test-api
```

### Test with existing record:
```bash
npx tsx test-working.ts
```

### Manual curl test:
```bash
curl -X GET 'https://abagenta-mobile.de/api2_1/records/-54346245/aad2210a-89b8-4556-9091-d94598dcd9eb' \
  -H 'Authorization: Basic YXBpX2RlbW86YXBpX2RlbW8=' \
  -H 'ab-servicepassword: @BAgenta' \
  -H 'ab-datadirectory: D:\aB-Agenta\Daten'
```

## Production Deployment

When you get production credentials:

1. Update the `.env` file with real credentials:
   - Replace `api_demo` username/password with production values
   - Update service password from `@BAgenta` to production value
   - Update data directory path as needed

2. The MCP server code is ready for production use without any modifications

## Limitations (Demo Account)

- **Read-only access**: Can retrieve records but cannot create/update/delete
- **Limited object types**: Access restricted to demo data
- **Test data only**: Working with demo dataset, not production data

## Success! 🎉

The aB-Agenta MCP server is fully operational and ready for use with Claude Desktop or any other MCP-compatible client!