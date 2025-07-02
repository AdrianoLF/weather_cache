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

// DELETE /weather/cache - Reset all cache
router.delete(
  "/cache",
  validationMiddleware.validateRedisConnection,
  weatherController.resetCache
);

module.exports = router;
