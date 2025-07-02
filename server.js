require("dotenv").config();
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const redisConfig = require("./src/config/redis");
const weatherRoutes = require("./src/routes/weather");

const app = express();
const PORT = process.env.PORT || 3000;

const swaggerDocument = YAML.load("./openapi.yaml");

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/weather", weatherRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Weather Cache Server is running!",
    documentation: "GET /api-docs - Swagger UI documentation",
    endpoints: {
      createCity: 'POST /weather - Body: { "city": "SaoPaulo" }',
      getAllCities: "GET /weather - Returns all cached Brazilian cities",
      resetCache: "DELETE /weather/cache/all - Reset all cache",
      deleteKey: "DELETE /weather/cache/{key} - Delete specific cache key",
      refreshCache: "PUT /weather/cache/{key}/refresh - Refresh specific cache",
    },
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.use("*", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

async function startServer() {
  try {
    await redisConfig.connect();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await redisConfig.disconnect();
  process.exit(0);
});

startServer();
