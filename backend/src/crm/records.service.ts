import { Injectable } from '@nestjs/common';

// In-memory storage for demo (replace with Prisma later)
const RECORDS_STORE = new Map<string, any[]>();

@Injectable()
export class CRMRecordsService {
    // Generate record number
    private generateRecordNumber(moduleSlug: string, tenantId: string): string {
        const prefix = moduleSlug.substring(0, 3).toUpperCase();
        const existing = this.getRecords(tenantId, moduleSlug);
        const count = existing.length + 1;
        return `${prefix}-${String(count).padStart(6, '0')}`;
    }

    // Get storage key
    private getKey(tenantId: string, moduleSlug: string): string {
        return `${tenantId}:${moduleSlug}`;
    }

    // Get all records for a module
    getRecords(tenantId: string, moduleSlug: string) {
        const key = this.getKey(tenantId, moduleSlug);
        return RECORDS_STORE.get(key) || [];
    }

    // Get a single record
    getRecord(tenantId: string, moduleSlug: string, recordId: string) {
        const records = this.getRecords(tenantId, moduleSlug);
        const record = records.find((r) => r.id === recordId);
        if (!record) {
            throw new Error(`Record not found: ${recordId}`);
        }
        return record;
    }

    // Create a new record
    createRecord(tenantId: string, moduleSlug: string, data: any, userId: string) {
        const key = this.getKey(tenantId, moduleSlug);
        const existing = RECORDS_STORE.get(key) || [];

        const newRecord = {
            id: crypto.randomUUID(),
            tenantId,
            moduleSlug,
            recordNumber: this.generateRecordNumber(moduleSlug, tenantId),
            data,
            createdByUserId: userId,
            updatedByUserId: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false,
        };

        existing.push(newRecord);
        RECORDS_STORE.set(key, existing);

        return newRecord;
    }

    // Update a record
    updateRecord(tenantId: string, moduleSlug: string, recordId: string, data: any, userId: string) {
        const key = this.getKey(tenantId, moduleSlug);
        const existing = RECORDS_STORE.get(key) || [];
        const index = existing.findIndex((r) => r.id === recordId);

        if (index === -1) {
            throw new Error(`Record not found: ${recordId}`);
        }

        existing[index] = {
            ...existing[index],
            data: { ...existing[index].data, ...data },
            updatedByUserId: userId,
            updatedAt: new Date().toISOString(),
        };

        RECORDS_STORE.set(key, existing);
        return existing[index];
    }

    // Delete a record (soft delete)
    deleteRecord(tenantId: string, moduleSlug: string, recordId: string, userId: string) {
        const key = this.getKey(tenantId, moduleSlug);
        const existing = RECORDS_STORE.get(key) || [];
        const index = existing.findIndex((r) => r.id === recordId);

        if (index === -1) {
            throw new Error(`Record not found: ${recordId}`);
        }

        existing[index] = {
            ...existing[index],
            isDeleted: true,
            deletedByUserId: userId,
            deletedAt: new Date().toISOString(),
        };

        RECORDS_STORE.set(key, existing);
        return { success: true, recordId };
    }

    // Search records
    searchRecords(tenantId: string, moduleSlug: string, query: string) {
        const records = this.getRecords(tenantId, moduleSlug);
        if (!query) return records;

        const lowerQuery = query.toLowerCase();
        return records.filter((record) => {
            const dataStr = JSON.stringify(record.data).toLowerCase();
            return dataStr.includes(lowerQuery) || record.recordNumber.toLowerCase().includes(lowerQuery);
        });
    }
}
