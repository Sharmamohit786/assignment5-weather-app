const { createServer } = require('./server');
const { loadConfig } = require('./config');
const { createWeatherProvider } = require('./weather-provider');
const { createSummaryGenerator } = require('./summary-generator');

const config = loadConfig();
const server = createServer({
  weatherProvider: createWeatherProvider({
    apiKey: config.openWeatherApiKey,
  }),
  summaryGenerator: createSummaryGenerator({
    apiKey: config.openAiApiKey,
    model: config.openAiModel,
  }),
});

server.listen(config.port, () => {
  process.stdout.write(`Weather app listening on http://localhost:${config.port}\n`);
});
