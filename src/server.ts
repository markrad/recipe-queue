import express, { type Request, type Response } from "express";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { QueueFileManager } from "./queue.ts";

const app = express();
const port = Number(process.env.PORT ?? 3010);
const queueToken = process.env.QUEUE_TOKEN ?? "";
const queue = new QueueFileManager();

app.set("view engine", "pug");
app.set("views", join(dirname(fileURLToPath(import.meta.url)), "..", "views"));
app.use("/styles", express.static(join(dirname(fileURLToPath(import.meta.url)), "..", "styles")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

function requireQueueToken(req: Request, res: Response): boolean {
    if (!queueToken) return true;
    const supplied = req.header("x-queue-token") ?? req.query.token;
    if (supplied === queueToken) return true;
    res.status(401).json({ error: "Unauthorized" });
    return false;
}

app.get("/", async (_req: Request, res: Response) => {
    const entries = queue.queueContent;
    res.render("index", { entries, error: null, duplicate: false });
});

app.post("/submit", async (req: Request, res: Response) => {
    const url = String(req.body.url ?? "").trim();
    const entries = queue.queueContent;
    if (!url) {
        res.status(400).render("index", { entries, error: "Please paste a Facebook link.", duplicate: false });
        return;
    }
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" || !parsed.hostname.endsWith("facebook.com")) {
            throw new Error("Not a Facebook link");
        }
    } catch {
        res.status(400).render("index", { entries, error: "That does not look like a Facebook link. Please paste a facebook.com link.", duplicate: false });
        return;
    }
    const { duplicate } = await queue.enqueue(url);
    res.render("index", { entries: queue.queueContent, error: null, duplicate });
});

// Read-only queue feed for the scheduled Muse processor.
// If QUEUE_TOKEN is set, callers must send it as x-queue-token.
app.get("/queue", async (req: Request, res: Response) => {
    if (!requireQueueToken(req, res)) return;
    res.json({ entries: queue.queueContent });
});

// Optional status update, also guarded by QUEUE_TOKEN when set.
// The Muse processor can also simply keep its own processed list
// and leave this endpoint unused.
app.post("/queue/:id/complete", async (req: Request, res: Response) => {
    if (!requireQueueToken(req, res)) return;
    const status = req.body.status === "failed" ? "failed" : "done";
    const entry = await queue.markEntry(req.params.id, status, {
        mealieSlug: typeof req.body.mealieSlug === "string" ? req.body.mealieSlug : undefined,
        error: typeof req.body.error === "string" ? req.body.error : undefined,
    });
    if (!entry) {
        res.status(404).json({ error: "Entry not found" });
        return;
    }
    res.json({ entry });
});

app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true });
});

app.listen(port, () => {
    console.log(`Recipe queue listening on port ${port}`);
});
