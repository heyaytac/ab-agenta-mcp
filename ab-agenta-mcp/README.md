# aB-Agenta MCP Server

An MCP (Model Context Protocol) server for interacting with the aB-Agenta API. This server provides tools to retrieve and create records, manage documents, and interact with the aB-Agenta system.

## Features

- **Get Record**: Retrieve a single record by ID and object type
- **Get Records**: Retrieve multiple records with filtering, pagination, and sorting
- **Filter Records**: Retrieve records using MongoDB-like query filters
- **Create Record**: Create new records with arbitrary fields
- **Download Document**: Download documents by ID
- **Upload Document**: Upload files as new documents
- **Get Object Types**: Retrieve all objecttype definitions
- **Filter Object Types**: Retrieve objecttype definitions with filters
- **Get Object Type**: Retrieve a single objecttype definition
- **Get Properties**: Retrieve property definitions for an objecttype

## Installation

1. Clone or navigate to this directory
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Configuration

The server uses environment variables for configuration. Create a `.env` file or set the following environment variables:

```bash
# Server Configuration
PORT=3000  # Port for HTTP server (default: 3000)

# Required - Base URL of your aB-Agenta instance
AB_AGENTA_BASE_URL=https://your-server:port

# Authentication - Choose one or more authentication methods:

# Basic Authentication
AB_AGENTA_USERNAME=your-username
AB_AGENTA_PASSWORD=your-password

# API Key Authentication
AB_AGENTA_SERVICE_PASSWORD=your-service-password
AB_AGENTA_DATA_DIRECTORY=your-data-directory
AB_AGENTA_CLIENT_SECRET=your-client-secret
```

## Deployment

### Remote Deployment (Render)

This MCP server can be deployed as a remote HTTP service on platforms like Render.

1. Push your code to a Git repository (GitHub, GitLab, etc.)

2. Create a new Web Service on Render:
   - Connect your repository
   - Set **Build Command**: `npm install && npm run build`
   - Set **Start Command**: `npm start`
   - Add environment variables in the Render dashboard:
     - `AB_AGENTA_BASE_URL`
     - `AB_AGENTA_USERNAME`
     - `AB_AGENTA_PASSWORD`
     - `AB_AGENTA_SERVICE_PASSWORD` (if needed)
     - `AB_AGENTA_DATA_DIRECTORY` (if needed)
     - `AB_AGENTA_CLIENT_SECRET` (if needed)

3. Deploy and note your service URL (e.g., `https://your-app.onrender.com`)

4. Configure Claude Desktop to use the remote server:

### Claude Desktop Configuration (Remote Server)

#### macOS
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ab-agenta": {
      "url": "https://your-app.onrender.com/sse"
    }
  }
}
```

#### Windows
Edit `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "ab-agenta": {
      "url": "https://your-app.onrender.com/sse"
    }
  }
}
```

### Local Development

You can still run the server locally for development:

```bash
npm run build
npm start
```

The server will be available at `http://localhost:3000` (or the PORT you configure).

## Available Tools

### get_record
Retrieve a single record by ID and object type from aB-Agenta.

**Parameters:**
- `objecttype` (required): The objecttype of the record to retrieve (e.g., "-54346245")
- `id` (required): The unique ID of the record to retrieve (e.g., "aad2210a-89b8-4556-9091-d94598dcd9eb")
- `fields` (optional): Comma-separated list of specific fields to load (e.g., "system_id,idadresse,spartennr"). Use "*" or omit for all fields
- `resolvetexts` (optional): Boolean flag to resolve encoded fields and references into human-readable text. Resolved fields are prefixed with `plaintext__` (e.g., `plaintext__idadresse` contains the resolved text of `idadresse`)

**Example:**
```
Get record with objecttype "-54346245" and id "aad2210a-89b8-4556-9091-d94598dcd9eb" with resolved text fields
```

### get_records
Retrieve multiple records by object type with filtering, pagination, and sorting.

**Parameters:**
- `objecttype` (required): The objecttype of records to retrieve (e.g., "-54346245")
- `fields` (optional): Comma-separated list of specific fields to load (e.g., "system_id,idadresse,ablauf,spartennr")
- `order` (optional): Comma-separated list of fields to sort by. Use " DESC" suffix for descending order (e.g., "spartennr,ablauf DESC")
- `limit` (optional): Maximum number of records to return (default: 10)
- `offset` (optional): Number of records to skip for pagination (default: 0)
- `resolvetexts` (optional): Boolean flag to resolve encoded fields to human-readable text with `plaintext__` prefix
- `deletedrecords` (optional): Filter for deleted records:
  - `1` = active records only (default)
  - `2` = deleted records only
  - `3` = active and deleted records
- `archivedrecords` (optional): Filter for archived records:
  - `1` = active records only (default)
  - `2` = archived records only
  - `3` = active and archived records

**Returns:**
- List of records matching the criteria
- Total count of records (from `ab-totalcount` header)
- Content-Range information (e.g., "items 5-9/524")

**Example:**
```
Get 50 records of objecttype "-54346245", ordered by spartennr descending, showing only active records
```

### filter_records
Retrieve records by object type with advanced filter criteria using MongoDB-like query syntax.

**Parameters:**
- `objecttype` (required): The objecttype of records to retrieve (e.g., "-54346245")
- `filter` (required): Filter criteria object using MongoDB-like query syntax. Supports operators like:
  - `$or`: Logical OR between multiple conditions
  - `$and`: Logical AND between multiple conditions
  - `$gt`: Greater than
  - `$gte`: Greater than or equal to
  - `$lt`: Less than
  - `$lte`: Less than or equal to
  - `$ne`: Not equal
  - `$in`: Value in array
  - `$nin`: Value not in array
- `fields` (optional): Comma-separated list of specific fields to load (e.g., "system_id,idadresse,ablauf,spartennr")
- `order` (optional): Comma-separated list of fields to sort by. Use " DESC" suffix for descending order (e.g., "spartennr,ablauf DESC")
- `limit` (optional): Maximum number of records to return (default: 10)
- `offset` (optional): Number of records to skip for pagination (default: 0)
- `resolvetexts` (optional): Boolean flag to resolve encoded fields to human-readable text with `plaintext__` prefix
- `deletedrecords` (optional): Filter for deleted records (1=active only, 2=deleted only, 3=both) (default: 1)
- `archivedrecords` (optional): Filter for archived records (1=active only, 2=archived only, 3=both) (default: 1)

**Returns:**
- List of records matching the filter criteria
- Total count of records (from `ab-totalcount` header)
- Content-Range information (e.g., "items 5-9/524")

**Examples:**
```
Filter records where idadresse is "7" OR ablauf is after 2010-01-01:
{
  "$or": [
    {"idadresse": "7"},
    {"ablauf": {"$gt": "2010-01-01T00:00:00.000"}}
  ]
}
```

```
Filter records with multiple conditions:
{
  "$and": [
    {"spartennr": "139"},
    {"beitraginclst": {"$gte": 20.0, "$lte": 50.0}}
  ]
}
```

### create_record
Create a new record in aB-Agenta.

**Parameters:**
- `objecttype` (required): The objecttype of the record to create (e.g., "-54346245")
- `data` (required): Object containing the fields of the new record
- `idempotencyKey` (optional): A unique key to prevent duplicate record creation if the request is retried. Highly recommended for production use

**Returns:**
- The unique ID of the newly created record

**Example:**
```
Create a new record with objecttype "-54346245" and data:
{
  "vertragsnummer": "VD-568425632454",
  "idadresse": "7",
  "spartennr": "139",
  "beitraginclst": 21.55
}
```

### download_document
Download a document by its ID from aB-Agenta.

**Parameters:**
- `id` (required): The unique ID of the document to download (e.g., "8573a0d3-f6ea-4029-86d4-7a5359e054cc")

**Returns:**
- Document content as base64-encoded data
- Content-Type (MIME type of the document)
- Filename (if available from Content-Disposition header)
- Size in bytes

**Example:**
```
Download document with ID "8573a0d3-f6ea-4029-86d4-7a5359e054cc"
```

### upload_document
Upload a file as a new document in aB-Agenta.

**Parameters:**
- `addressid` (required): ID of the address record to which the document belongs (e.g., "7")
- `filepath` (required): Local file path to the file to upload
- `filename` (optional): Custom filename for the document. If omitted, uses the basename of filepath (e.g., "scan_2022_1_1.pdf")
- `referenceid` (optional): ID of another record to which the document also belongs (e.g., "aad2210a-89b8-4556-9091-d94598dcd9eb")
- `referenceobjecttype` (optional): Objecttype of the reference record (e.g., "-54346245"). Required if `referenceid` is provided
- `info` (optional): Descriptive info text about the document (e.g., "correspondence", "invoice")
- `type` (optional): Type classification of the document (e.g., "scan", "letter", "contract")
- `changedate` (optional): ISO 8601 datetime of last change of the document (e.g., "2022-01-01T00:00:00")
- `idempotencyKey` (optional): A unique key to prevent duplicate uploads if the request is retried. Highly recommended for production use

**Returns:**
- The unique ID of the newly uploaded document
- Location header with the URL of the document

**Example:**
```
Upload a PDF scan for address ID "7" with reference to contract record "aad2210a-89b8-4556-9091-d94598dcd9eb"
```

### get_objecttypes
Load list of all objecttype definitions from aB-Agenta.

**Parameters:**
- No parameters required

**Returns:**
- Array of objecttype definitions with fields:
  - `system_id`: The unique ID of the objecttype (e.g., "-54346245")
  - `name`: The name of the objecttype (e.g., "Vertragsdaten")
  - `basicidobject`: The base objecttype ID

**Example:**
```
Get all objecttype definitions
```

### filter_objecttypes
Load list of objecttype definitions according to a filter from aB-Agenta.

**Parameters:**
- `filter` (required): Filter criteria object using MongoDB-like query syntax. Supports operators like:
  - `$endsWith`: String ends with
  - `$startsWith`: String starts with
  - `$contains`: String contains
  - `$eq`: Equal to
  - `$ne`: Not equal to

**Returns:**
- Array of objecttype definitions matching the filter criteria

**Example:**
```
Filter objecttypes where name ends with "daten":
{
  "name": {
    "$endsWith": "daten"
  }
}
```

### get_objecttype
Load a single objecttype definition from aB-Agenta.

**Parameters:**
- `objecttype` (required): The objecttype to retrieve (e.g., "-54346245")

**Returns:**
- Objecttype definition with fields:
  - `system_id`: The unique ID of the objecttype
  - `name`: The name of the objecttype
  - `basicidobject`: The base objecttype ID

**Example:**
```
Get objecttype definition for "-54346245"
```

### get_properties
Load list of property definitions for an objecttype from aB-Agenta.

**Parameters:**
- `objecttype` (required): The objecttype whose properties to load (e.g., "-54346245")

**Returns:**
- Array of property definitions with fields:
  - `system_ID`: The unique ID of the property
  - `idobject`: The objecttype this property belongs to
  - `name`: The name/key of the property
  - `bound_on`: The field binding
  - `datatype_user`: The datatype code (e.g., 1=Text, 2=Number)
  - `plaintext__datatype_user`: Human-readable datatype
  - `type`: The property type code (e.g., 0=Standard, 1=Reference)
  - `plaintext__type`: Human-readable property type
  - `idlist`: ID of selection list if applicable
  - `plaintext__idlist`: Human-readable selection list name

**Example:**
```
Get all property definitions for objecttype "-54346245"
```

## Testing

The server includes a test mode that uses mock data instead of making real API calls:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Build and run in test mode:
   ```bash
   npm run build
   npm run test:server
   ```

This will start the server with mock responses, allowing you to test the MCP integration without connecting to a real aB-Agenta instance.

## Development

To run in development mode with auto-rebuild:
```bash
npm run dev
```

## API Reference

This MCP server implements the following endpoints from the aB-Agenta API:

### Records
- `GET /api2_1/records/{objecttype}/{id}` - Retrieve a single record by ID
- `GET /api2_1/records/{objecttype}` - Retrieve multiple records with filtering and pagination
- `POST /api2_1/records/{objecttype}` - Retrieve records according to a filter (MongoDB-like query)
- `POST /api2_1/records/{objecttype}/new` - Create a new record

### Documents
- `GET /api2_1/documents/{id}` - Download a document by ID
- `POST /api2_1/documents/new` - Upload a file as a new document

### Object Types
- `GET /api2_1/objecttypes` - Load list of all objecttype definitions
- `POST /api2_1/objecttypes` - Load list of objecttype definitions according to a filter
- `GET /api2_1/objecttype/{objecttype}` - Load a single objecttype definition
- `GET /api2_1/properties/{objecttype}` - Load list of property definitions for an objecttype

For more information about the aB-Agenta API, visit:
https://abagenta-mobile.de/api2_1/swaggerui

## Key Concepts

### Object Types
Object types are numeric identifiers (often negative numbers like "-54346245") that represent different types of records in the aB-Agenta system. Common examples include contracts, addresses, policies, etc.

### Idempotency Keys
Idempotency keys (`ab-idempotency-key` header) are unique identifiers that ensure an operation is performed only once, even if the request is retried multiple times. This is crucial for:
- Preventing duplicate record creation during network timeouts
- Preventing duplicate document uploads
- Ensuring data consistency in unreliable network conditions

Best practice: Use a UUID or a combination of timestamp and unique identifier for each operation.

### Field Resolution
When `resolvetexts` is set to `true`, encoded fields and foreign key references are resolved to human-readable text:
- Original field: `idadresse: "7"`
- Resolved field: `plaintext__idadresse: "John Doe, 123 Main St"`

This is useful for displaying data to end users without additional lookups.

### Pagination
Use `limit` and `offset` parameters to paginate through large record sets:
- First page: `limit=50, offset=0` (records 1-50)
- Second page: `limit=50, offset=50` (records 51-100)
- Third page: `limit=50, offset=100` (records 101-150)

The response includes `ab-totalcount` header showing the total number of records available.

## Error Handling

The server provides detailed error messages including:
- API response status codes
- Error messages from the aB-Agenta API
- Connection and authentication errors

## License

ISC