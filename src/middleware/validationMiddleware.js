const redisConfig = require("../config/redis");

const validateRedisConnection = (req, res, next) => {
  try {
    if (!redisConfig.isConnected) {
      return res.status(503).json({
        error: "Redis service unavailable",
        message: "Cache service is not connected",
      });
    }
    next();
  } catch (error) {
    console.error("Redis validation error:", error);
    return res.status(503).json({
      error: "Redis connection error",
      message: "Unable to validate cache connection",
    });
  }
};

const validateApiKey = (req, res, next) => {
  const API_KEY = process.env.OPENWEATHER_API_KEY;

  if (!API_KEY || API_KEY === "your_openweathermap_api_key_here") {
    return res.status(500).json({
      error: "API Key not configured",
      message: "OpenWeatherMap API key is missing or invalid",
    });
  }

  next();
};

const validateWeatherRequest = (req, res, next) => {
  validateRedisConnection(req, res, (err) => {
    if (err) return;
    validateApiKey(req, res, next);
  });
};

module.exports = {
  validateRedisConnection,
  validateApiKey,
  validateWeatherRequest,
};
