import { randomUUID } from "node:crypto";
import { mkdir, rename, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

import { QueueEntriesSchema, QueueEntry, QueueEntrySchema, QueueStatus, QueueStatusSchema } from "./types/queueEntry";
import z from "zod";

export class QueueFileManager {
    #queueFilePath: string;
    #queueContent: QueueEntry[];
    #pendingUpdates: Promise<void> = Promise.resolve();

    constructor(queueFilePath: string = process.env.QUEUE_FILE ?? "./data/queue.json") {
        this.#queueFilePath = queueFilePath;

        if (!existsSync(dirname(this.queueFilePath))) {
            throw new Error(`Specified queue file path ${this.#queueFilePath} does not exist`);
        }

        try {
            const raw = readFileSync(this.queueFilePath, 'utf-8');
            const parsed = QueueEntriesSchema.safeParse(JSON.parse(raw));
            this.#queueContent = parsed.success ? parsed.data : [];
        }
        catch (err) {
            throw err;
        }
    }

    get queueFilePath(): string {
        return this.#queueFilePath;
    }

    get queueContent(): QueueEntry[] {
        return Array.isArray(this.#queueContent) ? this.#queueContent : [];
    }

    async enqueue(url: string): Promise<{ entry: QueueEntry; duplicate: boolean }> {
        return this.#serialize(async () => {
            const existing = this.#queueContent.find((entry) => entry.url === url);
            if (existing) {
                return { entry: existing, duplicate: true };
            }
            const entry: QueueEntry = {
                id: randomUUID(),
                url,
                status: "pending",
                submittedAt: new Date(),
            };
            try {
                QueueEntrySchema.parse(entry);
            }
            catch (err) {
                console.error(`Internal error - format of generated QueueEntry failed validation: ${err}`);
                throw err;
            }
            this.#queueContent.unshift(entry);
            await this.#saveQueue();
            return { entry, duplicate: false };
        });
    }

    async markEntry(id: string, status: QueueStatus, extra?: Partial<QueueEntry>): Promise<QueueEntry | null> {
        return this.#serialize(async () => {
            const entry = this.#queueContent.find((item) => item.id == id);
            if (!entry) {
                console.error(`Specified id is not present ${id}`);
                return null;
            }

            const statusCheck = QueueStatusSchema.safeParse(status);
            if (!statusCheck.success) {
                console.error(`Invalid status passed: ${status}`);
                return null;
            }

            entry.status = status;
            Object.assign(entry, extra);
            await this.#saveQueue();
            return entry;
        });
    }

    #serialize<T>(operation: () => Promise<T>): Promise<T> {
        const result = this.#pendingUpdates.then(operation);
        this.#pendingUpdates = result.then(() => undefined, () => undefined);
        return result;
    }

    async #saveQueue() {
        const file = this.#queueFilePath;
        await mkdir(dirname(file), { recursive: true });
        const tmp = `${file}.${process.pid}.tmp`;
        await writeFile(tmp, JSON.stringify(this.queueContent, null, 2) + "\n", "utf8");
        await rename(tmp, file);
    }
}
