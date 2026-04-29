import { Buffer } from "node:buffer";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv, type ViteDevServer } from "vite";
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

type LocalApiRoute = {
  allowMessage: string;
  errorMessage: string;
  handlerPath: string;
  path: string;
};

const projectRoot = dirname(fileURLToPath(import.meta.url));

function registerLocalApiRoute(server: ViteDevServer, route: LocalApiRoute) {
  server.middlewares.use(route.path, async (request, response) => {
    if (request.method !== "POST") {
      response.setHeader("Allow", "POST");
      response.statusCode = 405;
      response.end(JSON.stringify({ error: route.allowMessage }));
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
        const handlerUrl = new URL(route.handlerPath, import.meta.url);
        handlerUrl.searchParams.set("t", String(Date.now()));
        const { default: handler } = (await import(handlerUrl.href)) as {
          default: GenerateHandler;
        };

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
        response.end(JSON.stringify({ error: route.errorMessage }));
      }
    });
  });
}

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
          [
            {
              allowMessage: "Use POST to generate visuals.",
              errorMessage: "The visuals could not be generated. Try again.",
              handlerPath: "./api/generate.js",
              path: "/api/generate",
            },
            {
              allowMessage: "Use POST to describe reference images.",
              errorMessage: "The reference images could not be described. Try again.",
              handlerPath: "./api/describe-reference-images.js",
              path: "/api/describe-reference-images",
            },
          ].forEach((route) => {
            registerLocalApiRoute(server, route);
          });
        },
      },
    ],
  };
});
