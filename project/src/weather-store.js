const fs = require('node:fs/promises');
const path = require('node:path');

function createWeatherStore({ filePath = path.join(process.cwd(), 'data', 'latest-weather.json') } = {}) {
  return {
    async saveLatest(weather) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(weather, null, 2), 'utf8');
    },
    async getLatest() {
      try {
        const contents = await fs.readFile(filePath, 'utf8');
        return JSON.parse(contents);
      } catch (error) {
        if (error && error.code === 'ENOENT') {
          return null;
        }

        throw error;
      }
    },
  };
}

module.exports = {
  createWeatherStore,
};
