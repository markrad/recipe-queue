export type QueueStatus = "pending" | "done" | "failed";

export interface QueueEntry {
    id: string;
    url: string;
    status: QueueStatus;
    submittedAt: Date;
    mealieSlug?: string;
    error?: string;
}
