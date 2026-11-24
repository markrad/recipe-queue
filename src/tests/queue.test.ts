// src/tests/queue.test.ts
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { QueueFileManager } from "../queue.ts";

describe("QueueFileManager", () => {
    let tempDir: string;
    let queueFilePath: string;
    let queue: QueueFileManager;

    beforeEach(async () => {
        tempDir = await mkdtemp(join(tmpdir(), "recipe-queue-test-"));
        queueFilePath = join(tempDir, "queue.json");

        // QueueFileManager expects the queue file to exist when it starts.
        await writeFile(queueFilePath, "[]", "utf8");
        queue = new QueueFileManager(queueFilePath);
    });

    afterEach(async () => {
        await rm(tempDir, { recursive: true, force: true });
    });

    it("saves a new entry and does not add the same URL twice", async () => {
        const url = "https://www.facebook.com/share/r/example/";

        const first = await queue.enqueue(url);

        expect(first.duplicate).toBe(false);
        expect(first.entry.status).toBe("pending");
        expect(queue.queueContent).toHaveLength(1);

        const saved = JSON.parse(await readFile(queueFilePath, "utf8"));
        expect(saved).toHaveLength(1);

        const second = await queue.enqueue(url);

        expect(second.duplicate).toBe(true);
        expect(queue.queueContent).toHaveLength(1);
    });
});