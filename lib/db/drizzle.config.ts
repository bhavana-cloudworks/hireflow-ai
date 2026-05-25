import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  // Fixed: Paths are now relative to the lib/db workspace directory
  schema: "./src/schema/**/*",
  out: "./drizzle",
  dbCredentials: {
    url: "postgresql://postgres:spsg7@127.0.0.1:5433/hireflow", 
  },
});