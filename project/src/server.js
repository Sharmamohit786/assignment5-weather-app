const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createWeatherProvider } = require('./weather-provider');
const { normalizeWeather } = require('./weather-normalizer');
const { createWeatherStore } = require('./weather-store');
const { createSummaryGenerator } = require('./summary-generator');

const publicDir = path.join(__dirname, 'public');

function createServer({
  weatherProvider = createWeatherProvider(),
  weatherStore = createWeatherStore(),
  summaryGenerator = createSummaryGenerator(),
} = {}) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');

    if (request.method === 'GET' && url.pathname === '/') {
      return sendHtml(response, renderIndexPage());
    }

    if (request.method === 'GET' && url.pathname === '/app.js') {
      return sendStaticFile(response, path.join(publicDir, 'app.js'), 'application/javascript; charset=utf-8');
    }

    if (request.method === 'GET' && url.pathname === '/styles.css') {
      return sendStaticFile(response, path.join(publicDir, 'styles.css'), 'text/css; charset=utf-8');
    }

    if (request.method === 'GET' && url.pathname === '/weather/latest') {
      const weather = await weatherStore.getLatest();

      if (!weather) {
        return sendJson(response, 404, {
          error: 'No weather data has been stored yet.',
        });
      }

      return sendJson(response, 200, {
        ok: true,
        weather,
      });
    }

    if (request.method === 'POST' && url.pathname === '/weather') {
      const body = await readJsonBody(request);
      const city = typeof body.city === 'string' ? body.city.trim() : '';

      if (!city) {
        return sendJson(response, 400, {
          error: 'City is required.',
        });
      }

      try {
        const providerWeather = await weatherProvider.getCurrentWeather(city);
        const weather = normalizeWeather(providerWeather);
        await weatherStore.saveLatest(weather);
        const storedWeather = weatherStore.getLatest ? await weatherStore.getLatest() : weather;

        try {
          const summary = await summaryGenerator.generate(storedWeather);

          return sendJson(response, 200, {
            ok: true,
            weather: storedWeather,
            summaryStatus: 'available',
            summary,
          });
        } catch (error) {
          if (error && error.code === 'SUMMARY_GENERATION_FAILED') {
            return sendJson(response, 200, {
              ok: true,
              weather: storedWeather,
              summaryStatus: 'unavailable',
              summary: {
                text: 'Weather summary is unavailable right now. Showing the latest stored weather details instead.',
                suggestions: [],
              },
            });
          }

          throw error;
        }
      } catch (error) {
        if (error && error.code === 'CITY_NOT_FOUND') {
          return sendJson(response, 404, {
            error: 'City not found.',
          });
        }

        if (error && (error.code === 'UPSTREAM_FAILURE' || error.code === 'NETWORK_ERROR')) {
          return sendJson(response, 502, {
            error: 'Weather provider is unavailable.',
          });
        }

        throw error;
      }
    }

    sendJson(response, 404, {
      error: 'Not found',
    });
  });
}

async function readJsonBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function sendHtml(response, html) {
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
  });
  response.end(html);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function sendStaticFile(response, filePath, contentType) {
  const contents = fs.readFileSync(filePath, 'utf8');
  response.writeHead(200, {
    'Content-Type': contentType,
  });
  response.end(contents);
}

function renderIndexPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Weather Insights</title>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <main class="page">
      <section class="hero">
        <p>Assignment 5</p>
        <h1>Weather insights, minus the clutter.</h1>
        <p class="lede">Search for a city, send the request to the backend, and inspect the starter response flow before the weather pipeline is added.</p>
        <form id="weather-form">
          <label for="city-input">City</label>
          <input id="city-input" name="city" type="text" placeholder="Enter a city" autocomplete="off" required>
          <button type="submit">Check weather</button>
        </form>
        <p id="status" class="status">Ready</p>
        <section id="weather" class="result-panel" aria-live="polite">
          <p>Weather details will appear here after a successful search.</p>
        </section>
        <section id="summary" class="result-panel" aria-live="polite">
          <p>The AI or fallback summary will appear here after a successful search.</p>
        </section>
      </section>
    </main>
    <script src="/app.js"></script>
  </body>
</html>`;
}

module.exports = {
  createServer,
};
