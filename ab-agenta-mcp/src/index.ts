#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosInstance } from "axios";
import express from "express";
import cors from "cors";

interface AbAgentaConfig {
  baseUrl: string;
  username?: string;
  password?: string;
  servicePassword?: string;
  dataDirectory?: string;
  clientSecret?: string;
  testMode?: boolean;
}

interface RecordResponse {
  system_id?: string;
  system_idobject?: string;
  [key: string]: any;
}

class AbAgentaClient {
  private api: AxiosInstance;
  private testMode: boolean;

  constructor(config: AbAgentaConfig) {
    this.testMode = config.testMode || false;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (config.servicePassword) {
      headers["ab-servicepassword"] = config.servicePassword;
    }
    if (config.dataDirectory) {
      headers["ab-datadirectory"] = config.dataDirectory;
    }
    if (config.clientSecret) {
      headers["ab-client-secret"] = config.clientSecret;
    }

    this.api = axios.create({
      baseURL: config.baseUrl,
      headers,
      auth: config.username && config.password
        ? {
            username: config.username,
            password: config.password,
          }
        : undefined,
    });
  }

  async getRecord(
    objecttype: string,
    id: string,
    fields?: string,
    resolvetexts?: boolean
  ): Promise<RecordResponse> {
    if (this.testMode) {
      console.error(`[TEST MODE] GET Record - objecttype: ${objecttype}, id: ${id}`);
      const mockRecord: RecordResponse = {
        system_id: id,
        system_idobject: objecttype,
        vertragsnummer: "VD-TEST-123456",
        idadresse: "7",
        spartennr: "139",
        beitraginclst: 21.55,
        test_mode: true,
        requested_fields: fields || "all",
        resolvetexts: resolvetexts || false
      };

      if (resolvetexts) {
        mockRecord.plaintext__idadresse = "Test User, John";
        mockRecord.plaintext__spartennr = "KFZ";
      }

      if (fields) {
        const fieldList = fields.split(',').map(f => f.trim());
        const filteredRecord: RecordResponse = {};
        fieldList.forEach(field => {
          if (mockRecord[field] !== undefined) {
            filteredRecord[field] = mockRecord[field];
          }
        });
        return filteredRecord;
      }

      return mockRecord;
    }

    const params: Record<string, any> = {};
    if (fields) params.fields = fields;
    if (resolvetexts !== undefined) params.resolvetexts = resolvetexts;

    const response = await this.api.get(
      `/api2_1/records/${objecttype}/${id}`,
      { params }
    );
    return response.data;
  }

  async getRecords(
    objecttype: string,
    fields?: string,
    order?: string,
    limit?: number,
    offset?: number,
    resolvetexts?: boolean,
    deletedrecords?: 1 | 2 | 3,
    archivedrecords?: 1 | 2 | 3
  ): Promise<{ records: RecordResponse[]; totalCount?: number; contentRange?: string }> {
    if (this.testMode) {
      console.error(`[TEST MODE] GET Records - objecttype: ${objecttype}`);
      const mockRecords: RecordResponse[] = [
        {
          system_id: "test-id-1",
          system_idobject: objecttype,
          vertragsnummer: "VD-TEST-123456",
          idadresse: "7",
          spartennr: "139",
          beitraginclst: 21.55,
          test_mode: true
        },
        {
          system_id: "test-id-2",
          system_idobject: objecttype,
          vertragsnummer: "VD-TEST-789012",
          idadresse: "8",
          spartennr: "140",
          beitraginclst: 45.20,
          test_mode: true
        }
      ];

      if (resolvetexts) {
        mockRecords.forEach(record => {
          record.plaintext__idadresse = "Test User, John";
          record.plaintext__spartennr = "KFZ";
        });
      }

      const actualLimit = limit || 10;
      const actualOffset = offset || 0;
      const limitedRecords = mockRecords.slice(actualOffset, actualOffset + actualLimit);

      return {
        records: limitedRecords,
        totalCount: mockRecords.length,
        contentRange: `items ${actualOffset}-${actualOffset + limitedRecords.length - 1}/${mockRecords.length}`
      };
    }

    const params: Record<string, any> = {};
    if (fields) params.fields = fields;
    if (order) params.order = order;
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    if (resolvetexts !== undefined) params.resolvetexts = resolvetexts;
    if (deletedrecords !== undefined) params.deletedrecords = deletedrecords;
    if (archivedrecords !== undefined) params.archivedrecords = archivedrecords;

    const response = await this.api.get(
      `/api2_1/records/${objecttype}`,
      { params }
    );

    return {
      records: response.data,
      totalCount: response.headers['ab-totalcount'] ? parseInt(response.headers['ab-totalcount']) : undefined,
      contentRange: response.headers['content-range']
    };
  }

  async filterRecords(
    objecttype: string,
    filter: Record<string, any>,
    fields?: string,
    order?: string,
    limit?: number,
    offset?: number,
    resolvetexts?: boolean,
    deletedrecords?: 1 | 2 | 3,
    archivedrecords?: 1 | 2 | 3
  ): Promise<{ records: RecordResponse[]; totalCount?: number; contentRange?: string }> {
    if (this.testMode) {
      console.error(`[TEST MODE] FILTER Records - objecttype: ${objecttype}`);
      console.error(`[TEST MODE] Filter:`, JSON.stringify(filter, null, 2));
      const mockRecords: RecordResponse[] = [
        {
          system_id: "test-id-1",
          system_idobject: objecttype,
          vertragsnummer: "VD-TEST-123456",
          idadresse: "7",
          spartennr: "139",
          ablauf: "2025-12-31T00:00:00.000",
          beitraginclst: 21.55,
          test_mode: true,
          filter_applied: true
        },
        {
          system_id: "test-id-2",
          system_idobject: objecttype,
          vertragsnummer: "VD-TEST-789012",
          idadresse: "8",
          spartennr: "140",
          ablauf: "2026-06-30T00:00:00.000",
          beitraginclst: 45.20,
          test_mode: true,
          filter_applied: true
        }
      ];

      if (resolvetexts) {
        mockRecords.forEach(record => {
          record.plaintext__idadresse = "Test User, John";
          record.plaintext__spartennr = "KFZ";
        });
      }

      const actualLimit = limit || 10;
      const actualOffset = offset || 0;
      const limitedRecords = mockRecords.slice(actualOffset, actualOffset + actualLimit);

      return {
        records: limitedRecords,
        totalCount: mockRecords.length,
        contentRange: `items ${actualOffset}-${actualOffset + limitedRecords.length - 1}/${mockRecords.length}`
      };
    }

    const params: Record<string, any> = {};
    if (fields) params.fields = fields;
    if (order) params.order = order;
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    if (resolvetexts !== undefined) params.resolvetexts = resolvetexts;
    if (deletedrecords !== undefined) params.deletedrecords = deletedrecords;
    if (archivedrecords !== undefined) params.archivedrecords = archivedrecords;

    const response = await this.api.post(
      `/api2_1/records/${objecttype}`,
      filter,
      { params }
    );

    return {
      records: response.data,
      totalCount: response.headers['ab-totalcount'] ? parseInt(response.headers['ab-totalcount']) : undefined,
      contentRange: response.headers['content-range']
    };
  }

  async createRecord(
    objecttype: string,
    data: Record<string, any>,
    idempotencyKey?: string
  ): Promise<string> {
    if (this.testMode) {
      console.error(`[TEST MODE] CREATE Record - objecttype: ${objecttype}`);
      console.error(`[TEST MODE] Data:`, JSON.stringify(data, null, 2));
      if (idempotencyKey) {
        console.error(`[TEST MODE] Idempotency Key: ${idempotencyKey}`);
      }
      const mockId = `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      console.error(`[TEST MODE] Generated Record ID: ${mockId}`);
      return mockId;
    }

    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers["ab-idempotency-key"] = idempotencyKey;
    }

    const response = await this.api.post(
      `/api2_1/records/${objecttype}/new`,
      data,
      { headers }
    );
    return response.data;
  }

  async downloadDocument(id: string): Promise<{ data: Buffer; contentType?: string; filename?: string }> {
    if (this.testMode) {
      console.error(`[TEST MODE] DOWNLOAD Document - id: ${id}`);
      const mockContent = Buffer.from("Mock PDF document content for testing", "utf-8");
      return {
        data: mockContent,
        contentType: "application/pdf",
        filename: "test-document.pdf"
      };
    }

    const response = await this.api.get(`/api2_1/documents/${id}`, {
      responseType: "arraybuffer",
    });

    return {
      data: Buffer.from(response.data),
      contentType: response.headers["content-type"],
      filename: response.headers["content-disposition"]?.match(/filename="?(.+?)"?$/)?.[1]
    };
  }

  async uploadDocument(
    addressid: string,
    fileContent: Buffer,
    filename?: string,
    referenceid?: string,
    referenceobjecttype?: string,
    info?: string,
    type?: string,
    changedate?: string,
    idempotencyKey?: string
  ): Promise<string> {
    if (this.testMode) {
      console.error(`[TEST MODE] UPLOAD Document`);
      console.error(`[TEST MODE] Address ID: ${addressid}`);
      console.error(`[TEST MODE] Filename: ${filename || "unknown"}`);
      console.error(`[TEST MODE] File size: ${fileContent.length} bytes`);
      if (referenceid) console.error(`[TEST MODE] Reference ID: ${referenceid}`);
      if (referenceobjecttype) console.error(`[TEST MODE] Reference Object Type: ${referenceobjecttype}`);
      if (info) console.error(`[TEST MODE] Info: ${info}`);
      if (type) console.error(`[TEST MODE] Type: ${type}`);
      if (changedate) console.error(`[TEST MODE] Change Date: ${changedate}`);
      if (idempotencyKey) console.error(`[TEST MODE] Idempotency Key: ${idempotencyKey}`);

      const mockDocId = `doc-test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      console.error(`[TEST MODE] Generated Document ID: ${mockDocId}`);
      return mockDocId;
    }

    const params: Record<string, string> = {
      addressid,
    };
    if (referenceid) params.referenceid = referenceid;
    if (referenceobjecttype) params.referenceobjecttype = referenceobjecttype;
    if (filename) params.filename = filename;
    if (info) params.info = info;
    if (type) params.type = type;
    if (changedate) params.changedate = changedate;

    const headers: Record<string, string> = {
      "Content-Type": "application/octet-stream",
    };
    if (idempotencyKey) {
      headers["ab-idempotency-key"] = idempotencyKey;
    }

    const response = await this.api.post(
      `/api2_1/documents/new`,
      fileContent,
      { params, headers }
    );

    return response.data;
  }

  async getObjectTypes(): Promise<any[]> {
    if (this.testMode) {
      console.error(`[TEST MODE] GET Object Types`);
      return [
        {
          system_id: "-54346245",
          name: "Vertragsdaten",
          basicidobject: "-54346245"
        },
        {
          system_id: "-54346246",
          name: "Adressdaten",
          basicidobject: "-54346246"
        }
      ];
    }

    const response = await this.api.get(`/api2_1/objecttypes`);
    return response.data;
  }

  async filterObjectTypes(filter: Record<string, any>): Promise<any[]> {
    if (this.testMode) {
      console.error(`[TEST MODE] FILTER Object Types`);
      console.error(`[TEST MODE] Filter:`, JSON.stringify(filter, null, 2));
      return [
        {
          system_id: "-54346245",
          name: "Vertragsdaten",
          basicidobject: "-54346245"
        }
      ];
    }

    const response = await this.api.post(`/api2_1/objecttypes`, filter);
    return response.data;
  }

  async getObjectType(objecttype: string): Promise<any> {
    if (this.testMode) {
      console.error(`[TEST MODE] GET Object Type - objecttype: ${objecttype}`);
      return {
        system_id: objecttype,
        name: "Vertragsdaten",
        basicidobject: objecttype
      };
    }

    const response = await this.api.get(`/api2_1/objecttype/${objecttype}`);
    return response.data;
  }

  async getProperties(objecttype: string): Promise<any[]> {
    if (this.testMode) {
      console.error(`[TEST MODE] GET Properties - objecttype: ${objecttype}`);
      return [
        {
          system_ID: "prop-1",
          idobject: objecttype,
          name: "vertragsnummer",
          bound_on: "field1",
          datatype_user: 1,
          plaintext__datatype_user: "Text",
          type: 0,
          plaintext__type: "Standard",
          idlist: "",
          plaintext__idlist: ""
        },
        {
          system_ID: "prop-2",
          idobject: objecttype,
          name: "idadresse",
          bound_on: "field2",
          datatype_user: 2,
          plaintext__datatype_user: "Number",
          type: 1,
          plaintext__type: "Reference",
          idlist: "list-123",
          plaintext__idlist: "Address List"
        }
      ];
    }

    const response = await this.api.get(`/api2_1/properties/${objecttype}`);
    return response.data;
  }
}

async function main() {
  const isTestMode = process.env.AB_AGENTA_TEST_MODE === "true";
  const PORT = process.env.PORT || 3000;

  const config: AbAgentaConfig = {
    baseUrl: process.env.AB_AGENTA_BASE_URL || "https://abagenta-mobile.de",
    username: process.env.AB_AGENTA_USERNAME,
    password: process.env.AB_AGENTA_PASSWORD,
    servicePassword: process.env.AB_AGENTA_SERVICE_PASSWORD,
    dataDirectory: process.env.AB_AGENTA_DATA_DIRECTORY,
    clientSecret: process.env.AB_AGENTA_CLIENT_SECRET,
    testMode: isTestMode,
  };

  if (isTestMode) {
    console.error("\n🧪 Running in TEST MODE - No actual API calls will be made\n");
  }

  const client = new AbAgentaClient(config);

  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = new Server(
    {
      name: "ab-agenta-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "get_record",
          description: "Retrieve a record by ID and object type from aB-Agenta",
          inputSchema: {
            type: "object",
            properties: {
              objecttype: {
                type: "string",
                description: "The objecttype of the record to retrieve (e.g., -54346245)",
              },
              id: {
                type: "string",
                description: "The ID of the record to retrieve (e.g., aad2210a-89b8-4556-9091-d94598dcd9eb)",
              },
              fields: {
                type: "string",
                description: "Comma-separated list of record fields to load; omit to load all fields",
              },
              resolvetexts: {
                type: "boolean",
                description: "Resolve encoded fields and references to nice text",
              },
            },
            required: ["objecttype", "id"],
          },
        },
        {
          name: "get_records",
          description: "Retrieve multiple records by object type from aB-Agenta",
          inputSchema: {
            type: "object",
            properties: {
              objecttype: {
                type: "string",
                description: "The objecttype of records to retrieve (e.g., -54346245)",
              },
              fields: {
                type: "string",
                description: "Comma-separated list of fields to load (e.g., 'system_id,idadresse,ablauf,spartennr')",
              },
              order: {
                type: "string",
                description: "Comma-separated list of fields to order by (e.g., 'spartennr,ablauf desc')",
              },
              limit: {
                type: "number",
                description: "Maximal number of records to return (default: 10)",
              },
              offset: {
                type: "number",
                description: "Number of records to skip (default: 0)",
              },
              resolvetexts: {
                type: "boolean",
                description: "Resolve encoded fields and references to nice text with 'plaintext__' prefix",
              },
              deletedrecords: {
                type: "number",
                description: "Whether deleted records are loaded: 1=active only, 2=deleted only, 3=active and deleted (default: 1)",
                enum: [1, 2, 3],
              },
              archivedrecords: {
                type: "number",
                description: "Whether archived records are loaded: 1=active only, 2=archived only, 3=active and archived (default: 1)",
                enum: [1, 2, 3],
              },
            },
            required: ["objecttype"],
          },
        },
        {
          name: "filter_records",
          description: "Retrieve records by object type with filter criteria from aB-Agenta",
          inputSchema: {
            type: "object",
            properties: {
              objecttype: {
                type: "string",
                description: "The objecttype of records to retrieve (e.g., -54346245)",
              },
              filter: {
                type: "object",
                description: "Filter criteria in MongoDB-like query format (e.g., {'$or': [{'idadresse': '7'}, {'ablauf': {'$gt': '2010-01-01T00:00:00.000'}}]})",
                additionalProperties: true,
              },
              fields: {
                type: "string",
                description: "Comma-separated list of fields to load (e.g., 'system_id,idadresse,ablauf,spartennr')",
              },
              order: {
                type: "string",
                description: "Comma-separated list of fields to order by (e.g., 'spartennr,ablauf desc')",
              },
              limit: {
                type: "number",
                description: "Maximal number of records to return (default: 10)",
              },
              offset: {
                type: "number",
                description: "Number of records to skip (default: 0)",
              },
              resolvetexts: {
                type: "boolean",
                description: "Resolve encoded fields and references to nice text with 'plaintext__' prefix",
              },
              deletedrecords: {
                type: "number",
                description: "Whether deleted records are loaded: 1=active only, 2=deleted only, 3=active and deleted (default: 1)",
                enum: [1, 2, 3],
              },
              archivedrecords: {
                type: "number",
                description: "Whether archived records are loaded: 1=active only, 2=archived only, 3=active and archived (default: 1)",
                enum: [1, 2, 3],
              },
            },
            required: ["objecttype", "filter"],
          },
        },
        {
          name: "create_record",
          description: "Create a new record in aB-Agenta",
          inputSchema: {
            type: "object",
            properties: {
              objecttype: {
                type: "string",
                description: "The objecttype of the record to create (e.g., -54346245)",
              },
              data: {
                type: "object",
                description: "The fields of the new record",
                additionalProperties: true,
              },
              idempotencyKey: {
                type: "string",
                description: "A unique key to realize idempotent behaviour (optional but recommended)",
              },
            },
            required: ["objecttype", "data"],
          },
        },
        {
          name: "download_document",
          description: "Download a document by ID from aB-Agenta",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "ID of the document to download (e.g., 8573a0d3-f6ea-4029-86d4-7a5359e054cc)",
              },
            },
            required: ["id"],
          },
        },
        {
          name: "upload_document",
          description: "Upload a file as a new document in aB-Agenta",
          inputSchema: {
            type: "object",
            properties: {
              addressid: {
                type: "string",
                description: "ID of address-record to which the document belongs (e.g., 7)",
              },
              filepath: {
                type: "string",
                description: "Path to the file to upload",
              },
              filename: {
                type: "string",
                description: "Filename for the document (e.g., scan_2022_1_1.pdf)",
              },
              referenceid: {
                type: "string",
                description: "ID of another record to which the document also belongs",
              },
              referenceobjecttype: {
                type: "string",
                description: "Objecttype of the reference record (e.g., -54346245)",
              },
              info: {
                type: "string",
                description: "Info text of the document (e.g., correspondence)",
              },
              type: {
                type: "string",
                description: "Type of the document (e.g., scan)",
              },
              changedate: {
                type: "string",
                description: "Datetime of last change of the document (ISO 8601 format, e.g., 2022-01-01T00:00:00)",
              },
              idempotencyKey: {
                type: "string",
                description: "A unique key to realize idempotent behaviour (optional but recommended)",
              },
            },
            required: ["addressid", "filepath"],
          },
        },
        {
          name: "get_objecttypes",
          description: "Load list of all objecttype definitions from aB-Agenta",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "filter_objecttypes",
          description: "Load list of objecttype definitions according to a filter from aB-Agenta",
          inputSchema: {
            type: "object",
            properties: {
              filter: {
                type: "object",
                description: "Filter criteria in MongoDB-like query format (e.g., {'name': {'$endsWith': 'daten'}})",
                additionalProperties: true,
              },
            },
            required: ["filter"],
          },
        },
        {
          name: "get_objecttype",
          description: "Load a single objecttype definition from aB-Agenta",
          inputSchema: {
            type: "object",
            properties: {
              objecttype: {
                type: "string",
                description: "The objecttype to retrieve (e.g., -54346245)",
              },
            },
            required: ["objecttype"],
          },
        },
        {
          name: "get_properties",
          description: "Load list of property definitions for an objecttype from aB-Agenta",
          inputSchema: {
            type: "object",
            properties: {
              objecttype: {
                type: "string",
                description: "The objecttype whose properties to load (e.g., -54346245)",
              },
            },
            required: ["objecttype"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      if (name === "get_record") {
        const { objecttype, id, fields, resolvetexts } = args as any;

        if (!objecttype || !id) {
          throw new Error("objecttype and id are required parameters");
        }

        const record = await client.getRecord(
          objecttype,
          id,
          fields,
          resolvetexts
        );

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(record, null, 2),
            },
          ],
        };
      } else if (name === "get_records") {
        const { objecttype, fields, order, limit, offset, resolvetexts, deletedrecords, archivedrecords } = args as any;

        if (!objecttype) {
          throw new Error("objecttype is a required parameter");
        }

        const result = await client.getRecords(
          objecttype,
          fields,
          order,
          limit,
          offset,
          resolvetexts,
          deletedrecords,
          archivedrecords
        );

        let responseText = JSON.stringify(result.records, null, 2);
        if (result.totalCount !== undefined) {
          responseText += `\n\nTotal Count: ${result.totalCount}`;
        }
        if (result.contentRange) {
          responseText += `\nContent-Range: ${result.contentRange}`;
        }

        return {
          content: [
            {
              type: "text",
              text: responseText,
            },
          ],
        };
      } else if (name === "filter_records") {
        const { objecttype, filter, fields, order, limit, offset, resolvetexts, deletedrecords, archivedrecords } = args as any;

        if (!objecttype || !filter) {
          throw new Error("objecttype and filter are required parameters");
        }

        const result = await client.filterRecords(
          objecttype,
          filter,
          fields,
          order,
          limit,
          offset,
          resolvetexts,
          deletedrecords,
          archivedrecords
        );

        let responseText = JSON.stringify(result.records, null, 2);
        if (result.totalCount !== undefined) {
          responseText += `\n\nTotal Count: ${result.totalCount}`;
        }
        if (result.contentRange) {
          responseText += `\nContent-Range: ${result.contentRange}`;
        }

        return {
          content: [
            {
              type: "text",
              text: responseText,
            },
          ],
        };
      } else if (name === "create_record") {
        const { objecttype, data, idempotencyKey } = args as any;

        if (!objecttype || !data) {
          throw new Error("objecttype and data are required parameters");
        }

        const recordId = await client.createRecord(
          objecttype,
          data,
          idempotencyKey
        );

        return {
          content: [
            {
              type: "text",
              text: `Record created successfully with ID: ${recordId}`,
            },
          ],
        };
      } else if (name === "download_document") {
        const { id } = args as any;

        if (!id) {
          throw new Error("id is a required parameter");
        }

        const result = await client.downloadDocument(id);

        return {
          content: [
            {
              type: "text",
              text: `Document downloaded successfully\nContent-Type: ${result.contentType || "unknown"}\nFilename: ${result.filename || "unknown"}\nSize: ${result.data.length} bytes\n\nData (base64): ${result.data.toString("base64")}`,
            },
          ],
        };
      } else if (name === "upload_document") {
        const { addressid, filepath, filename, referenceid, referenceobjecttype, info, type, changedate, idempotencyKey } = args as any;

        if (!addressid || !filepath) {
          throw new Error("addressid and filepath are required parameters");
        }

        const fs = await import("fs/promises");
        const path = await import("path");

        const fileContent = await fs.readFile(filepath);
        const actualFilename = filename || path.basename(filepath);

        const documentId = await client.uploadDocument(
          addressid,
          fileContent,
          actualFilename,
          referenceid,
          referenceobjecttype,
          info,
          type,
          changedate,
          idempotencyKey
        );

        return {
          content: [
            {
              type: "text",
              text: `Document uploaded successfully with ID: ${documentId}`,
            },
          ],
        };
      } else if (name === "get_objecttypes") {
        const objecttypes = await client.getObjectTypes();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(objecttypes, null, 2),
            },
          ],
        };
      } else if (name === "filter_objecttypes") {
        const { filter } = args as any;

        if (!filter) {
          throw new Error("filter is a required parameter");
        }

        const objecttypes = await client.filterObjectTypes(filter);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(objecttypes, null, 2),
            },
          ],
        };
      } else if (name === "get_objecttype") {
        const { objecttype } = args as any;

        if (!objecttype) {
          throw new Error("objecttype is a required parameter");
        }

        const objecttypeData = await client.getObjectType(objecttype);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(objecttypeData, null, 2),
            },
          ],
        };
      } else if (name === "get_properties") {
        const { objecttype } = args as any;

        if (!objecttype) {
          throw new Error("objecttype is a required parameter");
        }

        const properties = await client.getProperties(objecttype);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(properties, null, 2),
            },
          ],
        };
      } else {
        throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const axiosError = error as any;

      let detailedError = errorMessage;
      if (axiosError?.response) {
        const status = axiosError.response.status;
        const data = axiosError.response.data;

        detailedError = `API Error: ${status}`;

        if (status === 401) {
          detailedError += '\nAuthentication failed. ';
          if (typeof data === 'string') {
            if (data.includes('service-password')) {
              detailedError += 'The service password is invalid or incorrectly formatted.';
            } else if (data.includes('Authorization')) {
              detailedError += 'Basic authentication (username/password) is missing or invalid.';
            } else {
              detailedError += `Server message: ${data}`;
            }
          } else {
            detailedError += `Server response: ${JSON.stringify(data)}`;
          }
          detailedError += '\n\nPlease verify your credentials in the .env file:';
          detailedError += '\n- AB_AGENTA_USERNAME and AB_AGENTA_PASSWORD for basic auth';
          detailedError += '\n- AB_AGENTA_SERVICE_PASSWORD for API access';
          detailedError += '\n- AB_AGENTA_DATA_DIRECTORY and AB_AGENTA_CLIENT_SECRET if required';
        } else {
          detailedError += ` - ${data?.message || data || axiosError.response.statusText}`;
        }

        // Add request details for debugging
        if (process.env.DEBUG === 'true') {
          detailedError += `\n\nDebug info:`;
          detailedError += `\n- URL: ${axiosError.config?.url}`;
          detailedError += `\n- Headers sent: ${JSON.stringify(axiosError.config?.headers, null, 2)}`;
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `Error: ${detailedError}`,
          },
        ],
        isError: true,
      };
    }
  });

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", testMode: isTestMode });
  });

  // SSE endpoint for MCP
  app.get("/sse", async (_req, res) => {
    console.error("New SSE connection established");
    const transport = new SSEServerTransport("/message", res);
    await server.connect(transport);
    console.error("SSE transport connected to MCP server");
  });

  // Message endpoint for MCP
  app.post("/message", async (req, res) => {
    console.error("Received message on /message endpoint:", req.body);
    res.status(200).end();
  });

  app.listen(PORT, () => {
    console.error(`aB-Agenta MCP server running on port ${PORT}${isTestMode ? " (TEST MODE)" : ""}`);
    console.error(`Health check: http://localhost:${PORT}/health`);
    console.error(`SSE endpoint: http://localhost:${PORT}/sse`);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});