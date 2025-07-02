const axios = require("axios");
const cacheService = require("../services/cacheService");

class WeatherController {
  async createCity(req, res) {
    try {
      const { city } = req.body;

      if (!city) {
        return res.status(400).json({ error: "City parameter is required" });
      }

      const normalizedCity = city
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      const cacheKey = cacheService.createCacheKey("city", normalizedCity);

      const API_KEY = process.env.OPENWEATHER_API_KEY;
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${normalizedCity},BR&appid=${API_KEY}&units=metric&lang=en`;

      const response = await axios.get(url);
      const weatherData = response.data;

      await cacheService.set(cacheKey, weatherData);

      console.log("API call for Brazilian city:", weatherData.name);
      res.status(201).json({
        message: "Brazilian city data cached successfully",
        city: weatherData.name,
        key: cacheKey,
        ttl: cacheService.defaultTTL,
        data: weatherData,
      });
    } catch (error) {
      console.error("Create city error:", error.message);

      if (error.response && error.response.status === 404) {
        console.log(error.response.data);
        return res
          .status(404)
          .json({ error: "Brazilian city not found in weather API" });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getAllCachedCities(req, res) {
    try {
      const cities = await cacheService.getAllCityData();

      res.json({
        message: "All cached Brazilian cities",
        count: cities.length,
        cities: cities,
      });
    } catch (error) {
      console.error("Get all cities error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async resetCache(req, res) {
    try {
      const success = await cacheService.resetCache();

      if (success) {
        res.json({
          message: "Cache reset successfully",
          status: "success",
        });
      } else {
        res.status(500).json({
          error: "Failed to reset cache",
          status: "error",
        });
      }
    } catch (error) {
      console.error("Reset cache error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new WeatherController();
