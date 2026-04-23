# System Pipeline and Data Flow

## Overview
The weather AI application follows a structured pipeline that transforms raw weather data into actionable recommendations.

## Pipeline Steps

### 1. User Input
The user enters a city name through the web interface.

### 2. Weather API Ingestion
The system calls an external weather API to fetch real-time weather data.

### 3. Data Transformation (ETL)
The raw weather data is processed and normalized into a structured format including:
- temperature
- humidity
- weather condition
- wind speed

### 4. Storage
The processed weather data is stored temporarily as a structured record.

### 5. Rule-Based Risk Detection
The system applies deterministic logic to detect risks such as:
- heavy rain
- extreme heat
- snow or slippery conditions
- low visibility (mist/fog)

### 6. AI Processing
The structured data is passed into an AI model to generate:
- natural language summary
- user-friendly recommendations

### 7. Output Rendering
The final output is displayed to the user through the FastAPI-based web interface.

## Source of Truth
The normalized weather data is the primary source of truth used for reasoning and output generation.

## Possible Failure Points
- invalid user input (city name)
- API request failure
- missing or incomplete weather data
- incorrect condition mapping
- weak or unclear recommendations

## Debug Information
The system can track:
- user input
- API response
- transformed data
- generated output
- error messages

This helps in evaluation and debugging of the system.
