import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from "zod";

const server = new McpServer({
  name: "Weather Server",
  version: "1.0.0"
});

server.tool(
  'get-weather',
  'Tool to get the weather of a city',
  {
    city: z.string().describe("The name of the city to get the weather for")
  },
  async({ city }) => {
    // For a real integration, fetch from an API like Open-Meteo
    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
      );
      const geoData = await geoResponse.json();
      if (!geoData.results || geoData.results.length === 0) {
        return {
          content: [
            { type: "text", text: `Sorry, couldn't find "${city}".` }
          ]
        };
      }
      const { latitude, longitude } = geoData.results[0];
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );
      const weatherData = await weatherResponse.json();
      const { temperature, weathercode } = weatherData.current_weather;
      let description;
      if (weathercode === 0) description = "Clear sky";
      else if (weathercode <= 3) description = "Cloudy";
      else description = "Rainy or stormy";
      return {
        content: [
          { type: "text", text: `The weather in ${city} is ${description} with ${temperature}°C.` }
        ]
      };
    } catch (error) {
      return {
        content: [
          { type: "text", text: `Error fetching weather: ${error.message}` }
        ]
      };
    }
  }
);

const transport = new StdioServerTransport();
server.connect(transport);