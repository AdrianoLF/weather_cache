require("dotenv").config();
const express = require("express");
const redisConfig = require("./src/config/redis");
const weatherRoutes = require("./src/routes/weather");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/weather", weatherRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Weather Cache Server is running!",
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
