const redisConfig = require("../config/redis");

class CacheService {
  #defaultTTL;

  constructor() {
    this.#defaultTTL = parseInt(process.env.CACHE_TTL_SECONDS) || 600;
  }

  async get(key) {
    try {
      const data = await this.#getRawData(key);
      if (!data) return null;

      const parsed = JSON.parse(data);
      return parsed.data;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  }

  async set(key, value, ttl = this.#defaultTTL) {
    try {
      const valueWithExpiration = this.#prepareDataForCache(value, ttl);
      const serializedValue = JSON.stringify(valueWithExpiration);

      await this.#getClient().setEx(key, ttl, serializedValue);
      console.log(`Cache set: ${key} (TTL: ${ttl}s)`);
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  async delete(key) {
    try {
      const result = await this.#getClient().del(key);
      console.log(`Cache delete: ${key} (deleted: ${result})`);
      return result > 0;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  async update(key, value, extendTTL = false, newTTL = this.#defaultTTL) {
    try {
      if (!(await this.exists(key))) {
        return false;
      }

      const valueWithExpiration = this.#prepareDataForCache(value, newTTL);
      const serializedValue = JSON.stringify(valueWithExpiration);

      if (extendTTL) {
        await this.#getClient().setEx(key, newTTL, serializedValue);
        console.log(
          `Cache update with TTL extension: ${key} (TTL: ${newTTL}s)`
        );
      } else {
        const currentTTL = await this.#getCurrentTTL(key);
        if (currentTTL > 0) {
          await this.#getClient().setEx(key, currentTTL, serializedValue);
        } else {
          await this.#getClient().set(key, serializedValue);
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
      return await this.#getClient().exists(key);
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }

  async getAllCityData() {
    try {
      const keys = await this.#getKeysByPattern("city_*");
      const cities = [];

      for (const key of keys) {
        const fullData = await this.getDataWithExpiration(key);
        if (!fullData) continue;

        const ttl = await this.#getCurrentTTL(key);
        const cityName = this.#extractCityName(fullData.data, key);

        cities.push({
          city: cityName,
          key: key,
          data: fullData.data,
          ttl: ttl.ttl,
          expiresAt: fullData.expiresAt,
        });
      }

      return cities;
    } catch (error) {
      console.error("Get all cities error:", error);
      return [];
    }
  }

  createCacheKey(prefix, identifier) {
    return `${prefix}_${this.#normalizeIdentifier(identifier)}`;
  }

  async getDataWithExpiration(key) {
    const data = await this.#getRawData(key);
    return data ? JSON.parse(data) : null;
  }

  #getClient() {
    return redisConfig.getClient();
  }

  async #getRawData(key) {
    return await this.#getClient().get(key);
  }

  #prepareDataForCache(value, ttl) {
    const expirationDate = new Date(Date.now() + ttl * 1000);
    return {
      data: value,
      expiresAt: this.#formatDate(expirationDate),
    };
  }

  async #getCurrentTTL(key) {
    try {
      const ttl = await this.#getClient().ttl(key);

      if (ttl > 0) {
        const expirationDate = new Date(Date.now() + ttl * 1000);
        return {
          ttl,
          expiresAt: this.#formatDate(expirationDate),
        };
      }

      return {
        ttl: -1,
        expiresAt: null,
      };
    } catch (error) {
      console.error("Cache TTL error:", error);
      return {
        ttl: -1,
        expiresAt: null,
      };
    }
  }

  async #getKeysByPattern(pattern = "*") {
    try {
      return await this.#getClient().keys(pattern);
    } catch (error) {
      console.error("Cache keys error:", error);
      return [];
    }
  }

  #normalizeIdentifier(identifier) {
    return identifier
      .toLowerCase()
      .replace(/\s+/g, "_")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  #formatDate(date) {
    return date.toISOString().split(".")[0] + "Z";
  }

  #extractCityName(data, key) {
    return data?.name || key.replace("city_", "");
  }

  async refreshCache(key) {
    try {
      const data = await this.getDataWithExpiration(key);
      if (!data) {
        throw new Error("Cache key not found");
      }

      const cityName = this.#extractCityName(data.data, key);

      return {
        key,
        cityName,
        previousData: data,
      };
    } catch (error) {
      console.error("Refresh cache error:", error);
      throw error;
    }
  }

  async resetCache() {
    try {
      await this.#getClient().flushAll();
      console.log("Cache reset: All data cleared");
      return true;
    } catch (error) {
      console.error("Cache reset error:", error);
      return false;
    }
  }
}

module.exports = new CacheService();
