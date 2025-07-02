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
      const cachedData = await cacheService.getDataWithExpiration(cacheKey);

      res.status(201).json({
        message: "Brazilian city data cached successfully",
        city: weatherData.name,
        key: cacheKey,
        data: weatherData,
        expiresAt: cachedData.expiresAt,
      });
    } catch (error) {
      console.error("Create city error:", error.message);

      if (error.response && error.response.status === 404) {
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

  async deleteKey(req, res) {
    try {
      const { key } = req.params;

      if (!key) {
        return res
          .status(400)
          .json({ error: "Cache key parameter is required" });
      }

      const exists = await cacheService.exists(key);
      if (!exists) {
        return res.status(404).json({
          error: "Cache key not found",
          key: key,
        });
      }

      const success = await cacheService.delete(key);

      if (success) {
        res.json({
          message: "Cache key deleted successfully",
          status: "success",
          key: key,
        });
      } else {
        res.status(500).json({
          error: "Failed to delete cache key",
          status: "error",
          key: key,
        });
      }
    } catch (error) {
      console.error("Delete key error:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async refreshCityCache(req, res) {
    try {
      const { key } = req.params;

      if (!key) {
        return res
          .status(400)
          .json({ error: "Cache key parameter is required" });
      }

      const cacheInfo = await cacheService.refreshCache(key);

      const API_KEY = process.env.OPENWEATHER_API_KEY;
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${cacheInfo.cityName},BR&appid=${API_KEY}&units=metric&lang=en`;

      const response = await axios.get(url);
      const weatherData = response.data;

      await cacheService.set(key, weatherData);
      const newCachedData = await cacheService.getDataWithExpiration(key);

      res.json({
        message: "Cache refreshed successfully",
        status: "success",
        key: key,
        previousData: cacheInfo.previousData.data,
        newData: weatherData,
        expiresAt: newCachedData.expiresAt,
      });
    } catch (error) {
      console.error("Refresh cache error:", error.message);

      if (error.message === "Cache key not found") {
        return res.status(404).json({
          error: "Cache key not found",
          key: req.params.key,
        });
      }

      if (error.response && error.response.status === 404) {
        return res
          .status(404)
          .json({ error: "Brazilian city not found in weather API" });
      }

      res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new WeatherController();
