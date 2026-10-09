import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import type { Request, Response } from 'express';
import http from 'node:http';
import https from 'node:https';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const adminBasePath = '/admin';
const apiBaseUrl = normalizeApiBaseUrl(
  process.env['API_BASE_URL'] || process.env['GATEWAY_API_BASE_URL'] || 'http://gateway-service:9090/api',
);

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use('/api', (req, res) => proxyApiRequest(req, res, apiBaseUrl));

app.get('/health', (_req, res) => {
  res.status(200).send('ok');
});

app.get(/^\/admin$/, (_req, res) => {
  res.redirect(`${adminBasePath}/`);
});

app.use(
  adminBasePath,
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle admin requests by rendering the Angular application under /admin.
 */
app.use(adminBasePath, (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Handle local development routes such as /login when the app is served at root.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

function proxyApiRequest(req: Request, res: Response, targetBaseUrl: string): void {
  const targetUrl = buildProxyTargetUrl(req, targetBaseUrl);
  const transport = targetUrl.protocol === 'https:' ? https : http;
  const headers: http.OutgoingHttpHeaders = {
    ...req.headers,
    host: targetUrl.host,
  };

  const proxyReq = transport.request(
    targetUrl,
    {
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.status(proxyRes.statusCode ?? 502);
      for (const [name, value] of Object.entries(proxyRes.headers)) {
        if (value !== undefined) {
          res.setHeader(name, value);
        }
      }
      proxyRes.pipe(res);
    },
  );

  proxyReq.on('error', (error: Error) => {
    if (res.headersSent) {
      res.end();
      return;
    }

    res.status(502).json({
      message: 'Gateway proxy failed',
      target: targetBaseUrl,
      error: error.message,
    });
  });

  req.pipe(proxyReq);
}

function buildProxyTargetUrl(req: Request, targetBaseUrl: string): URL {
  const targetUrl = new URL(targetBaseUrl);
  const [originalPath, query = ''] = req.originalUrl.split('?');
  const apiPath = (originalPath || '/api').replace(/^\/api(?=\/|$)/, '');
  const basePath = targetUrl.pathname.replace(/\/+$/, '');
  const requestPath = apiPath.replace(/^\/+/, '');

  targetUrl.pathname = requestPath ? `${basePath}/${requestPath}` : basePath || '/';
  targetUrl.search = query ? `?${query}` : '';

  return targetUrl;
}

function normalizeApiBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}
