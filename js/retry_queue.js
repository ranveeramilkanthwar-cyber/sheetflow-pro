// SheetFlow Retry Queue with Jitter
function getBackoff(attempt) { return Math.min(30000, Math.pow(2, attempt) * 1000 + Math.random() * 500); }
