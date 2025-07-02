# Weather Cache Server

Simple Node.js server that caches Brazilian cities weather data using Redis and OpenWeatherMap API with modular architecture.

## 🚀 Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**
   Create a `.env` file in the project root and update the necessary options

```bash
cp .env.example .env
```

3. **Start Redis with Docker:**

```bash
docker compose up -d
```

4. **Start the server:**

```bash
# (auto-reload)
npm run dev
```

## 🎯 API Endpoints

### Health Check

```
GET /
```

Returns server status

## 🗄️ Cache Configuration

### Cache Key Format

```
city_{{cityname_lowercase}}
```

Examples:

- São Paulo → `city_saopaulo`
- Rio de Janeiro → `city_riodejaneiro`
- Belo Horizonte → `city_belohorizonte`

### TTL (Time To Live)

- **Default**: 600 seconds (10 minutes)
- **Configurable**: Set `CACHE_TTL_SECONDS` in `.env`

## 🇧🇷 Brazilian Cities Only

This server is specifically designed for Brazilian cities:

- All API calls include the `BR` country code
- Weather data is fetched from OpenWeatherMap for Brazilian locations only
- City names are automatically validated against Brazilian cities

## 🛡️ Middleware Validations

Before processing requests, the system validates:

1. **Redis Connection**: Ensures cache service is available
2. **API Key Configuration**: Validates OpenWeatherMap API key is set
3. **Request Parameters**: Validates required city field

## 🔄 Development

### Auto-reload Configuration

The server uses `nodemon` to automatically restart when files change:

- **Watches**: `src/`, `server.js`, `.env`
- **Extensions**: `.js`, `.json`, `.env`
- **Delay**: 500ms after change detection

### Environment Variables

```env
# Required
OPENWEATHER_API_KEY=your_api_key_here

# Optional
PORT=3000                    # Server port
CACHE_TTL_SECONDS=600       # Default cache TTL (10 minutes)
REDIS_HOST=localhost        # Redis host
REDIS_PORT=6379            # Redis port
```
