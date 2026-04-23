# Weather AI Application – Assignment 6

## Overview

This project extends my Assignment 5 weather AI application. The system allows a user to input a city and receive a structured weather summary along with practical recommendations.

The application processes live weather data, transforms it into a structured format, applies rule-based logic for risk detection, and generates user-friendly output using AI.

## What the App Supports

* Weather summary for a given city
* Actionable recommendations (e.g., clothing, safety tips)
* Basic risk alerts (rain, heat, wind conditions)
* Web interface deployed on Vercel

## What the App Does NOT Support

* Long-term forecasting
* Severe weather emergency prediction
* Personalized historical tracking
* Medical or legal advice

## Architecture Classification

This system is classified as a **Hybrid architecture**.

It combines:

* Deterministic weather API ingestion
* ETL (data transformation and normalization)
* Rule-based risk detection
* AI-generated summaries and recommendations

## Why Hybrid Was Chosen

A hybrid approach was chosen because:

* Weather data is structured and benefits from deterministic processing
* Risk conditions (e.g., heavy rain, heat) are better handled with explicit rules
* AI is useful for generating readable summaries
* Easier debugging compared to prompt-only systems

## Alternative Not Chosen

A prompt-first architecture was considered, where raw weather data is directly passed into a model.

This approach was not chosen because:

* Raw API data is noisy
* Harder to control output quality
* Less consistent recommendations
* More difficult to debug

## Important Capability Not Implemented

Retrieval (RAG) or tool-calling was not implemented.

This is because:

* The current system uses live structured weather data
* No large document dataset is required

In the future, retrieval could be added for:

* Historical weather insights
* City-specific safety guidelines
* Advanced recommendation systems

## Pipeline and Data Flow

1. User inputs city name
2. Weather API fetches raw weather data
3. ETL layer normalizes and structures the data
4. Data is stored as a structured record
5. Rule-based logic evaluates risk conditions
6. AI generates summary and recommendations
7. Output is displayed via FastAPI UI

## Source of Truth

The normalized weather data is used as the main source of truth for reasoning and output generation.

## Possible Error Points

* Invalid city input
* API request failure
* Missing weather fields
* Incorrect condition mapping
* Weak or generic recommendations

## Evaluation

This repository includes:

* Representative test cases
* Failure cases
* Baseline comparison
* Evaluation results
* Improvement notes

## Improvement Based on Evidence

After evaluation, the system was improved by:

* Enhancing risk detection logic
* Improving error handling
* Making recommendations more actionable

## Deployment

The application is deployed using Vercel.

## Repository Structure

* app/ → main application logic
* tests/ → backend testing
* playwright-tests/ → UI testing
* evaluation/ → evaluation cases and results
* docs/ → architecture and pipeline explanation

## Conclusion

This project demonstrates a practical AI system that combines structured data processing with AI-generated insights, while being evaluated and improved based on real evidence.
