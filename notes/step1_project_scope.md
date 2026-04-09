# Assignment 5 - Step 1 Project Scope

## Project idea
An AI-powered weather assistant that helps users understand weather conditions and plan daily activities based on forecast data.

## What my app does
My app takes weather data from a public weather API, processes it into a clean and structured format, and uses an LLM to explain the forecast in simple language. Instead of only showing raw temperature and weather values, the app helps users understand what the weather means for their day, such as whether they should carry an umbrella, avoid travel, or prepare for extreme heat or cold.

## Supported user tasks
- Task 1: Check current weather and short-term forecast for a city
- Task 2: Get simple AI-generated advice based on weather conditions
- Task 3: Ask practical questions like whether it is a good day for travel, walking, or outdoor activity

## Data source
Weather data will come from the OpenWeatherMap API.

## ETL / transformation
Raw weather API data will be extracted in JSON format, cleaned, and transformed into structured fields such as city, temperature, humidity, wind speed, weather condition, and forecast summary. Only the most relevant fields will be passed to the reasoning layer.

## Storage
Processed weather data will be stored locally in JSON or SQLite for simple retrieval and reuse during the app session.

## LLM / reasoning layer
The LLM will convert structured weather data into user-friendly explanations and recommendations. It will answer simple weather-related questions, summarize forecast conditions, and provide activity suggestions based on the data.

## UI
The user will see a simple interface where they can enter a city name, view current weather details, see forecast information, and read AI-generated weather advice in plain language.

## Out of scope
- Real-time severe weather emergency alert system
- Highly accurate long-range forecasting beyond API support
- Full travel booking or route optimization features