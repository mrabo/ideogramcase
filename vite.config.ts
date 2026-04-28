import { Buffer } from "node:buffer";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

type GenerateHandler = (
  request: { method?: string; body?: unknown },
  response: {
    setHeader: (name: string, value: string) => void;
    status: (statusCode: number) => {
      json: (payload: unknown) => void;
    };
  },
) => Promise<void>;

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, projectRoot, ""));

  return {
    resolve: {
      preserveSymlinks: true,
    },
    plugins: [
      react(),
      {
        name: "brandbloom-local-api",
        configureServer(server) {
          server.middlewares.use("/api/generate", async (request, response) => {
            if (request.method !== "POST") {
              response.setHeader("Allow", "POST");
              response.statusCode = 405;
              response.end(JSON.stringify({ error: "Use POST to generate visuals." }));
              return;
            }

            const chunks: Buffer[] = [];

            request.on("data", (chunk) => {
              chunks.push(Buffer.from(chunk));
            });

            request.on("end", async () => {
              try {
                const bodyText = Buffer.concat(chunks).toString("utf8");
                const body = bodyText ? JSON.parse(bodyText) : {};
                const { default: handler } = (await import(
                  new URL("./api/generate.js", import.meta.url).href
                )) as { default: GenerateHandler };

                await handler(
                  { method: request.method, body },
                  {
                    setHeader: response.setHeader.bind(response),
                    status(statusCode: number) {
                      response.statusCode = statusCode;
                      return {
                        json(payload: unknown) {
                          response.setHeader("Content-Type", "application/json");
                          response.end(JSON.stringify(payload));
                        },
                      };
                    },
                  },
                );
              } catch (error) {
                server.config.logger.error(error instanceof Error ? error.message : String(error));
                response.statusCode = 500;
                response.setHeader("Content-Type", "application/json");
                response.end(JSON.stringify({ error: "The visuals could not be generated. Try again." }));
              }
            });
          });
        },
      },
    ],
  };
});
