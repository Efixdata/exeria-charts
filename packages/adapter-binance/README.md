# @efixdata/connector-binance

A data adapter for [@efixdata/exeria-chart](https://github.com/Efixdata/exeria-charts) that provides real-time and historical cryptocurrency price data from Binance.

## Features

- 📊 Historical OHLC data from Binance REST API
- 📡 Real-time price updates via Binance WebSocket streams
- 🔄 Automatic reconnection with exponential backoff
- 🪙 Support for multiple cryptocurrency pairs
- ⚡ No API key required - uses public Binance API
- 📈 Support for multiple timeframes: minute, hour, day, week, month

## Installation

```bash
npm install @efixdata/connector-binance
```

## Quick Start

```typescript
import { Chart } from "@efixdata/exeria-chart";
import { BinanceAdapter } from "@efixdata/connector-binance";

// Create adapter instance
const adapter = new BinanceAdapter();

// Initialize chart with adapter
const chart = new Chart({
  container: "#chart",
  dataAdapter: adapter,
});

// Load historical data for Bitcoin
await chart.loadData("BTCUSDT", {
  interval: "1d",
  limit: 1000,
});

// Subscribe to real-time price updates
chart.subscribeToUpdates("BTCUSDT");
```

## Configuration

The adapter accepts optional configuration:

```typescript
const adapter = new BinanceAdapter({
  // Override the REST API base URL (default: https://api.binance.com)
  baseUrl: "https://api.binance.com",

  // Override the WebSocket URL (default: wss://stream.binance.com:9443)
  wsUrl: "wss://stream.binance.com:9443",

  // Request timeout in milliseconds (default: 5000)
  requestTimeout: 5000,

  // Maximum number of retries for failed requests (default: 3)
  maxRetries: 3,

  // Delay between retries in milliseconds (default: 1000)
  retryDelay: 1000,
});
```

## Supported Symbols

Any trading pair available on Binance. Examples:

- `BTCUSDT` - Bitcoin/USDT
- `ETHUSDT` - Ethereum/USDT
- `BNBUSDT` - Binance Coin/USDT
- `ADAUSDT` - Cardano/USDT
- `SOLLUSDT` - Solana/USDT

For a full list of available symbols, visit [Binance Trading Pairs](https://www.binance.com/en/trade).

## Supported Timeframes

- `1m` - 1-minute candles
- `1h` - 1-hour candles
- `1d` - Daily candles
- `1w` - Weekly candles
- `1M` - Monthly candles

## API Reference

### BinanceAdapter

#### Constructor

```typescript
new BinanceAdapter(config?: BinanceAdapterConfig)
```

#### Methods

All methods are inherited from the `DataAdapter` interface:

- `initialize(config: AdapterConfig): Promise<void>` - Initialize adapter
- `getHistoricalData(symbol: string, options: LoadDataOptions): Promise<Candle[]>` - Fetch historical data
- `getCurrentPrice(symbol: string): Promise<Tick>` - Get latest price
- `subscribeToUpdates(symbol: string, callback: (update: Tick) => void): () => void` - Subscribe to updates
- `disconnect(): Promise<void>` - Disconnect and cleanup

## Examples

### Loading historical data

```typescript
const chart = new Chart({
  container: "#chart",
  dataAdapter: new BinanceAdapter(),
});

// Load 1 year of daily Bitcoin data
await chart.loadData("BTCUSDT", {
  from: new Date("2023-01-01"),
  to: new Date("2024-01-01"),
  interval: "1d",
});
```

### Real-time updates

```typescript
const adapter = new BinanceAdapter();
const chart = new Chart({
  container: "#chart",
  dataAdapter: adapter,
});

// Load historical data
await chart.loadData("ETHUSDT", {
  from: new Date("2024-01-01"),
  to: new Date("2024-12-31"),
  interval: "1h",
});

// Subscribe to real-time price updates
const unsubscribe = chart.subscribeToUpdates("ETHUSDT");

// Later, unsubscribe when done
// unsubscribe();
```

### Error handling

```typescript
const adapter = new BinanceAdapter();

try {
  const chart = new Chart({
    container: "#chart",
    dataAdapter: adapter,
  });

  await chart.loadData("BTCUSDT", {
    from: new Date("2024-01-01"),
    to: new Date("2024-12-31"),
    interval: "1d",
  });
} catch (error) {
  console.error("Failed to load chart data:", error);
}

// Listen for adapter errors
chart.on("adapter:error", (error) => {
  console.error("Adapter error:", error);
});
```

### Multiple symbols

```typescript
const chart = new Chart({
  container: "#chart",
  dataAdapter: new BinanceAdapter(),
});

// Load Bitcoin data
await chart.loadData("BTCUSDT", {
  from: new Date("2024-01-01"),
  to: new Date("2024-12-31"),
  interval: "1d",
});

// Update chart to Ethereum
await chart.loadData("ETHUSDT", {
  from: new Date("2024-01-01"),
  to: new Date("2024-12-31"),
  interval: "1d",
});
```

## Rate Limiting

Binance API has rate limits:

- **REST API**: 1,200 requests per minute (20 requests per second)
- **WebSocket**: No hard limit, but streams may be rate-limited if creating too many

The adapter handles rate limiting gracefully with automatic retries and exponential backoff.

## Security

- **No API Keys Required**: This adapter uses Binance's public API endpoints
- **Public Data Only**: Only historical and current price data are fetched
- **HTTPS/WSS**: All connections use encrypted protocols

## Browser Compatibility

This adapter works in:
- Modern browsers (with WebSocket support)
- Node.js 14+

For browser environments, ensure your bundler includes WebSocket support or provides a polyfill.

## Known Limitations

- **Historical Data Limit**: Binance API returns maximum 1000 candles per request. For longer time periods, multiple requests are made automatically.
- **WebSocket Connection**: Only one WebSocket connection is maintained per adapter instance. Multiple symbols subscribe to the same connection.
- **Rate Limits**: Heavy usage may hit Binance API rate limits

## Troubleshooting

### WebSocket connection fails

Check that:
- Your network allows WebSocket connections
- The WebSocket URL is accessible from your location
- No proxy/firewall is blocking the connection

### No price updates received

Ensure:
- The symbol exists and is valid (e.g., `BTCUSDT`, not `BTC`)
- The WebSocket connection is established (check `console` for errors)
- The adapter hasn't been disconnected

### Historical data is empty

Verify:
- The symbol is correct and trades on Binance
- The date range is valid and has trading data
- The timeframe is supported

## Contributing

To contribute improvements to this adapter:

1. Fork the repository
2. Create a feature branch
3. Make your changes and add tests
4. Submit a pull request

## License

MIT - See LICENSE file for details

## Support

For issues or questions:
- GitHub Issues: [Efixdata/exeria-charts/issues](https://github.com/Efixdata/exeria-charts/issues)
- Documentation: [Data Adapters Guide](../docs/)

## Disclaimer

This adapter uses Binance's public API. Binance may change their API without notice. Always refer to [Binance API Documentation](https://binance-docs.github.io/apidocs/) for the latest information.
