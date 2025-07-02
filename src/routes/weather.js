const express = require("express");
const weatherController = require("../controllers/weatherController");
const validationMiddleware = require("../middleware/validationMiddleware");

const router = express.Router();

// POST /weather - Create city data in cache (from API or manual)
router.post(
  "/",
  validationMiddleware.validateWeatherRequest,
  weatherController.createCity
);

// GET /weather - Get all cached Brazilian cities
router.get(
  "/",
  validationMiddleware.validateRedisConnection,
  weatherController.getAllCachedCities
);

// DELETE /weather/cache/all - Reset all cache
router.delete(
  "/cache/all",
  validationMiddleware.validateRedisConnection,
  weatherController.resetCache
);

// DELETE /weather/cache/:key - Delete specific cache key
router.delete(
  "/cache/:key",
  validationMiddleware.validateRedisConnection,
  weatherController.deleteKey
);

// PUT /weather/cache/:key/refresh - Refresh specific city cache
router.put(
  "/cache/:key/refresh",
  validationMiddleware.validateWeatherRequest,
  weatherController.refreshCityCache
);

module.exports = router;
