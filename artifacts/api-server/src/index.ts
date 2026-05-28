import app from "./app";
import { logger } from "./lib/logger";

// Define PORT once, as a number
const PORT = Number(process.env.PORT) || 3000;

// Single listen call
app.listen(PORT, "0.0.0.0", () => {
  logger.info(`🚀 API Server successfully listening on http://127.0.0.1:${PORT}`);
});
