import app from "./app";
import { logger } from "./lib/logger";

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 API Server successfully listening on http://127.0.0.1:${PORT}`);
  console.log(`🚀 API Server successfully listening on http://127.0.0.1:${PORT}`);
});