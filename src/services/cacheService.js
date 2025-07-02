const redisConfig = require("../config/redis");

class CacheService {
  constructor() {
    this.defaultTTL = parseInt(process.env.CACHE_TTL_SECONDS) || 600; // 10 minutes default
  }

  getClient() {
    return redisConfig.getClient();
  }

  async get(key) {
    try {
      const client = this.getClient();
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    try {
      const client = this.getClient();
      const serializedValue = JSON.stringify(value);

      await client.setEx(key, ttl, serializedValue);
      console.log(`Cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  async delete(key) {
    try {
      const client = this.getClient();
      const result = await client.del(key);
      console.log(`Cache delete: ${key} (deleted: ${result})`);
      return result > 0;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  async update(key, value, extendTTL = false, newTTL = this.defaultTTL) {
    try {
      const client = this.getClient();
      const exists = await client.exists(key);

      if (!exists) {
        return false;
      }

      const serializedValue = JSON.stringify(value);

      if (extendTTL) {
        await client.setEx(key, newTTL, serializedValue);
        console.log(
          `Cache update with TTL extension: ${key} (TTL: ${newTTL}s)`
        );
      } else {
        const currentTTL = await client.ttl(key);
        if (currentTTL > 0) {
          await client.setEx(key, currentTTL, serializedValue);
        } else {
          await client.set(key, serializedValue);
        }
        console.log(`Cache update: ${key}`);
      }

      return true;
    } catch (error) {
      console.error("Cache update error:", error);
      return false;
    }
  }

  async exists(key) {
    try {
      const client = this.getClient();
      return await client.exists(key);
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }

  async getTTL(key) {
    try {
      const client = this.getClient();
      return await client.ttl(key);
    } catch (error) {
      console.error("Cache TTL error:", error);
      return -1;
    }
  }

  async getKeys(pattern = "*") {
    try {
      const client = this.getClient();
      return await client.keys(pattern);
    } catch (error) {
      console.error("Cache keys error:", error);
      return [];
    }
  }

  async getAllCityData() {
    try {
      const keys = await this.getKeys("city_*");
      const cities = [];

      for (const key of keys) {
        const data = await this.get(key);
        const ttl = await this.getTTL(key);

        // Use the official city name from the API data
        const cityName =
          data && data.name ? data.name : key.replace("city_", "");

        cities.push({
          city: cityName,
          key: key,
          data: data,
          ttl: ttl,
        });
      }

      return cities;
    } catch (error) {
      console.error("Get all cities error:", error);
      return [];
    }
  }

  createCacheKey(prefix, identifier) {
    // Normalize the identifier: lowercase, replace spaces with underscores, remove accents
    const normalized = identifier
      .toLowerCase()
      .replace(/\s+/g, "_")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return `${prefix}_${normalized}`;
  }

  async resetCache() {
    try {
      const client = this.getClient();
      await client.flushAll();
      console.log("Cache reset: All data cleared");
      return true;
    } catch (error) {
      console.error("Cache reset error:", error);
      return false;
    }
  }
}

module.exports = new CacheService();
