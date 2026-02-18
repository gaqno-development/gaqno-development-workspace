import { defineConfig } from "drizzle-kit";
import * as path from "path";

export default defineConfig({
  schema: path.join(__dirname, "src/database/schema.ts"),
  out: path.join(__dirname, "src/database/migrations"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
