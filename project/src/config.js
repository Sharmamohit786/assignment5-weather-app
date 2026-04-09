const fs = require('node:fs');
const path = require('node:path');

function loadConfig() {
  loadEnvFile(path.join(process.cwd(), '.env'));

  return {
    port: Number(process.env.PORT || 3000),
    openWeatherApiKey: process.env.OPENWEATHER_API_KEY || '',
    openAiApiKey: process.env.OPENAI_API_KEY || '',
    openAiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  };
}

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const fileContents = fs.readFileSync(envPath, 'utf8');
  for (const line of fileContents.split(/\r?\n/)) {
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

module.exports = {
  loadConfig,
};
