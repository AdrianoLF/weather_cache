const { createClient } = require("redis");

class RedisConfig {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = createClient({
        host: process.env.REDIS_HOST || "localhost",
        port: process.env.REDIS_PORT || 6379,
      });

      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("Connected to Redis");
        this.isConnected = true;
      });

      this.client.on("ready", () => {
        console.log("Redis client ready");
      });

      this.client.on("end", () => {
        console.log("Redis connection ended");
        this.isConnected = false;
      });

      await this.client.connect();
      return this.client;
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  getClient() {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client not connected");
    }
    return this.client;
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
    }
  }
}

module.exports = new RedisConfig();
