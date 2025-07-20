/**
 * Enhanced Data Aggregator - Real-time Performance Optimized
 * High-performance data aggregator - optimized for real-time performance
 */

import { Storage, Context, generateEvent } from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';
import { PriceOracle, PriceData } from '../oracles/PriceOracle';

// Aggregated data structure
export class AggregatedData {
  constructor(
    public vwap: i32,           // Volume Weighted Average Price
    public volatility: i32,     // Volatility (fixed point * 1000)
    public trend: i32,          // Trend strength (-1000 to 1000)
    public liquidity: i32,      // Liquidity indicator
    public volume24h: i64,      // 24-hour volume
    public priceChange24h: i32, // 24-hour price change
    public timestamp: u64,      // Timestamp
    public confidence: u32,     // Data reliability (0-100)
    public sources: string[]    // Data source list
  ) {}
}

// Data source validation result
class DataValidationResult {
  constructor(
    public isValid: boolean,
    public confidence: u32,
    public issues: string[]
  ) {}
}

// Ring buffer implementation - for efficient storage of historical data
export class RingBuffer<T> {
  private buffer: Array<T>;
  private head: u32 = 0;
  private tail: u32 = 0;
  private size: u32 = 0;
  private capacity: u32;

  constructor(capacity: u32) {
    this.capacity = capacity;
    this.buffer = new Array<T>(capacity);
  }

  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    
    if (this.size < this.capacity) {
      this.size++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  getLatest(count: u32): Array<T> {
    const result = new Array<T>();
    const actualCount = Math.min(count, this.size) as u32;
    
    for (let i = 0; i < actualCount; i++) {
      const idx = (this.tail - 1 - i + this.capacity) % this.capacity;
      result.push(this.buffer[idx]);
    }
    
    return result;
  }

  getSize(): u32 {
    return this.size;
  }

  isFull(): boolean {
    return this.size === this.capacity;
  }
}

// Optimized data aggregator
export class OptimizedDataAggregator {
  private static readonly PRICE_BUFFER_SIZE: u32 = 100;
  private static readonly VOLUME_BUFFER_SIZE: u32 = 50;
  private static readonly MAX_DATA_AGE_SECONDS: u64 = 300; // 5分钟
  private static readonly MIN_SOURCES_REQUIRED: u32 = 2;
  
  // Storage keys
  private static readonly PRICE_BUFFER_KEY: string = 'agg_price_buffer';
  private static readonly VOLUME_BUFFER_KEY: string = 'agg_volume_buffer';
  private static readonly LAST_AGGREGATION_KEY: string = 'agg_last_run';
  private static readonly CACHE_KEY: string = 'agg_cache';
  private static readonly CACHE_TIMESTAMP_KEY: string = 'agg_cache_ts';

  /**
   * High-performance data aggregation - Main entry function
   */
  static aggregateMarketData(): AggregatedData {
    const startTime = Context.timestamp();
    
    // Check cache
    const cachedData = this.getCachedData();
    if (cachedData !== null) {
      generateEvent('Using cached aggregated data');
      return cachedData;
    }

    // Collect multi-source data
    const dataSources = this.collectMultiSourceData();
    
    // Data validation and cleaning
    const validatedData = this.validateAndCleanData(dataSources);
    
    // Calculate aggregated metrics
    const aggregatedData = this.computeAggregatedMetrics(validatedData);
    
    // Cache results
    this.cacheAggregatedData(aggregatedData);
    
    // Performance monitoring
    const processingTime = Context.timestamp() - startTime;
    generateEvent(`Data aggregation completed in ${processingTime}ms with confidence ${aggregatedData.confidence}%`);
    
    return aggregatedData;
  }

  /**
   * 收集多源数据
   */
  private static collectMultiSourceData(): MultiSourceData {
    const sources = new MultiSourceData();
    
    // 源1: 主要价格预言机
    const primaryData = PriceOracle.fetchPrice('MAS');
    if (primaryData.isValid()) {
      sources.addSource('primary_oracle', primaryData.price, primaryData.volume, primaryData.confidence);
    }

    // 源2: 历史平均价格
    const historicalData = this.getHistoricalAveragePrice();
    if (historicalData.isValid) {
      sources.addSource('historical_avg', historicalData.price, historicalData.volume, 80);
    }

    // 源3: 备用数据源 (可以是其他DEX或API)
    const backupData = this.getBackupPriceData();
    if (backupData.isValid) {
      sources.addSource('backup_source', backupData.price, backupData.volume, 70);
    }

    // 源4: 链上流动性池数据 (模拟)
    const poolData = this.getLiquidityPoolData();
    if (poolData.isValid) {
      sources.addSource('liquidity_pool', poolData.price, poolData.volume, 85);
    }

    return sources;
  }

  /**
   * 数据验证与异常值检测
   */
  private static validateAndCleanData(sources: MultiSourceData): MultiSourceData {
    const validatedSources = new MultiSourceData();
    const dataPoints = sources.getAllPrices();
    
    if (dataPoints.length < this.MIN_SOURCES_REQUIRED) {
      generateEvent('Insufficient data sources for reliable aggregation');
      // 使用备用数据
      return this.getFallbackData();
    }

    // 计算价格中位数用于异常值检测
    const sortedPrices = dataPoints.slice().sort((a, b) => a - b);
    const median = this.calculateMedian(sortedPrices);
    const mad = this.calculateMAD(sortedPrices, median);

    // 过滤异常值 (使用MAD方法)
    const threshold = 3 * mad;
    
    for (let i = 0; i < sources.sources.length; i++) {
      const source = sources.sources[i];
      const deviation = Math.abs(source.price - median);
      
      if (deviation <= threshold) {
        // 数据有效，调整置信度
        const adjustedConfidence = this.adjustConfidenceBasedOnDeviation(
          source.confidence, 
          deviation, 
          mad
        );
        
        validatedSources.addSource(
          source.name, 
          source.price, 
          source.volume, 
          adjustedConfidence
        );
      } else {
        generateEvent(`Outlier detected and removed: ${source.name}, price=${source.price}, median=${median}`);
      }
    }

    return validatedSources;
  }

  /**
   * 计算聚合指标
   */
  private static computeAggregatedMetrics(sources: MultiSourceData): AggregatedData {
    // 计算成交量加权平均价 (VWAP)
    const vwap = this.calculateVWAP(sources);
    
    // 计算波动率
    const volatility = this.calculateVolatility(sources);
    
    // 计算趋势
    const trend = this.calculateTrend();
    
    // 计算流动性指标
    const liquidity = this.calculateLiquidity(sources);
    
    // 计算24小时统计
    const volume24h = this.calculate24HourVolume(sources);
    const priceChange24h = this.calculate24HourPriceChange(vwap);
    
    // 计算总体置信度
    const confidence = this.calculateOverallConfidence(sources);
    
    // 获取数据源名称
    const sourceNames = sources.getSourceNames();

    return new AggregatedData(
      vwap,
      volatility,
      trend,
      liquidity,
      volume24h,
      priceChange24h,
      Context.timestamp(),
      confidence,
      sourceNames
    );
  }

  /**
   * 计算VWAP (成交量加权平均价)
   */
  private static calculateVWAP(sources: MultiSourceData): i32 {
    let totalValueWeighted: i64 = 0;
    let totalVolume: i64 = 0;

    for (let i = 0; i < sources.sources.length; i++) {
      const source = sources.sources[i];
      const weight = (source.confidence as i64) * (source.volume as i64);
      totalValueWeighted += (source.price as i64) * weight;
      totalVolume += weight;
    }

    if (totalVolume === 0) {
      return sources.sources.length > 0 ? sources.sources[0].price : 10000;
    }

    return (totalValueWeighted / totalVolume) as i32;
  }

  /**
   * 计算波动率 (基于价格分散度)
   */
  private static calculateVolatility(sources: MultiSourceData): i32 {
    if (sources.sources.length < 2) return 0;

    const prices = sources.getAllPrices();
    const mean = this.calculateMean(prices);
    
    let variance: i64 = 0;
    for (let i = 0; i < prices.length; i++) {
      const diff = (prices[i] as i64) - (mean as i64);
      variance += diff * diff;
    }
    
    variance = variance / (prices.length as i64);
    const stdDev = this.sqrt(variance);
    
    // 返回波动率百分比 * 1000
    return ((stdDev * 1000) / (mean as i64)) as i32;
  }

  /**
   * 计算趋势 (基于历史价格)
   */
  private static calculateTrend(): i32 {
    const historicalPrices = this.getHistoricalPrices(20);
    if (historicalPrices.length < 5) return 0;

    // 简单的线性回归斜率
    const n = historicalPrices.length;
    let sumX: i32 = 0;
    let sumY: i64 = 0;
    let sumXY: i64 = 0;
    let sumX2: i32 = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += historicalPrices[i];
      sumXY += (i as i64) * (historicalPrices[i] as i64);
      sumX2 += i * i;
    }

    const denominator = (n as i64) * (sumX2 as i64) - (sumX as i64) * (sumX as i64);
    if (denominator === 0) return 0;

    const slope = ((n as i64) * sumXY - (sumX as i64) * sumY) / denominator;
    
    // 标准化趋势到 -1000 到 1000
    return Math.max(-1000, Math.min(1000, (slope * 100) as i32));
  }

  /**
   * 计算流动性指标
   */
  private static calculateLiquidity(sources: MultiSourceData): i32 {
    let totalVolume: i64 = 0;
    let totalSources: u32 = 0;

    for (let i = 0; i < sources.sources.length; i++) {
      const source = sources.sources[i];
      totalVolume += source.volume;
      totalSources++;
    }

    if (totalSources === 0) return 0;

    // 流动性 = 平均成交量 * 数据源数量 (多样性加成)
    const avgVolume = totalVolume / (totalSources as i64);
    const diversityBonus = Math.min(totalSources, 5); // 最多5倍加成
    
    return (avgVolume * (diversityBonus as i64) / 1000) as i32; // 缩放到合理范围
  }

  /**
   * 缓存管理
   */
  private static getCachedData(): AggregatedData | null {
    if (!Storage.has(this.CACHE_KEY) || !Storage.has(this.CACHE_TIMESTAMP_KEY)) {
      return null;
    }

    const cacheTimestamp = U64.parseInt(Storage.get(this.CACHE_TIMESTAMP_KEY));
    const currentTime = Context.timestamp();
    
    // 缓存有效期30秒
    if (currentTime - cacheTimestamp > 30) {
      return null;
    }

    // 解析缓存数据
    const cacheData = Storage.get(this.CACHE_KEY).split('|');
    if (cacheData.length < 9) return null;

    return new AggregatedData(
      I32.parseInt(cacheData[0]),  // vwap
      I32.parseInt(cacheData[1]),  // volatility
      I32.parseInt(cacheData[2]),  // trend
      I32.parseInt(cacheData[3]),  // liquidity
      I64.parseInt(cacheData[4]),  // volume24h
      I32.parseInt(cacheData[5]),  // priceChange24h
      U64.parseInt(cacheData[6]),  // timestamp
      U32.parseInt(cacheData[7]),  // confidence
      cacheData[8].split(',')      // sources
    );
  }

  private static cacheAggregatedData(data: AggregatedData): void {
    const cacheString = `${data.vwap}|${data.volatility}|${data.trend}|${data.liquidity}|${data.volume24h}|${data.priceChange24h}|${data.timestamp}|${data.confidence}|${data.sources.join(',')}`;
    
    Storage.set(this.CACHE_KEY, cacheString);
    Storage.set(this.CACHE_TIMESTAMP_KEY, Context.timestamp().toString());
  }

  /**
   * 辅助函数
   */
  private static calculateMedian(sortedValues: i32[]): i32 {
    const len = sortedValues.length;
    if (len === 0) return 0;
    
    if (len % 2 === 0) {
      return (sortedValues[len / 2 - 1] + sortedValues[len / 2]) / 2;
    } else {
      return sortedValues[len / 2];
    }
  }

  private static calculateMAD(values: i32[], median: i32): i32 {
    const deviations: i32[] = [];
    for (let i = 0; i < values.length; i++) {
      deviations.push(Math.abs(values[i] - median));
    }
    deviations.sort((a, b) => a - b);
    return this.calculateMedian(deviations);
  }

  private static calculateMean(values: i32[]): i32 {
    if (values.length === 0) return 0;
    
    let sum: i64 = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
    }
    
    return (sum / (values.length as i64)) as i32;
  }

  private static sqrt(value: i64): i64 {
    if (value <= 0) return 0;
    if (value === 1) return 1;
    
    let x = value;
    let y = (x + 1) / 2;
    
    // 牛顿法，5次迭代
    for (let i = 0; i < 5; i++) {
      y = (x + value / x) / 2;
      x = y;
    }
    
    return y;
  }

  private static adjustConfidenceBasedOnDeviation(
    originalConfidence: u32, 
    deviation: i32, 
    mad: i32
  ): u32 {
    if (mad === 0) return originalConfidence;
    
    const deviationRatio = (deviation * 100) / mad;
    const penalty = Math.min(30, deviationRatio / 2); // 最多30%的置信度惩罚
    
    return Math.max(20, originalConfidence - penalty) as u32;
  }

  // 备用数据获取函数 (简化实现)
  private static getFallbackData(): MultiSourceData {
    const fallback = new MultiSourceData();
    fallback.addSource('mock_fallback', 10000, 1000, 50);
    return fallback;
  }

  private static getHistoricalAveragePrice(): HistoricalData {
    // 简化实现 - 实际应从存储中获取历史数据
    return new HistoricalData(true, 10000, 1000);
  }

  private static getBackupPriceData(): BackupData {
    // 简化实现 - 实际应调用备用API
    return new BackupData(true, 10000, 1000);
  }

  private static getLiquidityPoolData(): PoolData {
    // 简化实现 - 实际应查询DEX流动性池
    return new PoolData(true, 10000, 2000);
  }

  private static getHistoricalPrices(count: u32): i32[] {
    // 简化实现 - 实际应从历史数据缓冲区获取
    const prices: i32[] = [];
    for (let i = 0; i < count; i++) {
      prices.push(10000 + (i * 10) - 50); // 模拟价格变化
    }
    return prices;
  }

  private static calculate24HourVolume(sources: MultiSourceData): i64 {
    let total: i64 = 0;
    for (let i = 0; i < sources.sources.length; i++) {
      total += sources.sources[i].volume;
    }
    return total * 24; // 简化：假设当前小时成交量 * 24
  }

  private static calculate24HourPriceChange(currentPrice: i32): i32 {
    // 简化实现 - 实际应从24小时前的价格计算
    const yesterdayPrice = 9900; // 模拟昨日价格
    return ((currentPrice - yesterdayPrice) * 10000) / yesterdayPrice; // 返回基点
  }

  private static calculateOverallConfidence(sources: MultiSourceData): u32 {
    if (sources.sources.length === 0) return 0;
    
    let totalConfidence: u32 = 0;
    for (let i = 0; i < sources.sources.length; i++) {
      totalConfidence += sources.sources[i].confidence;
    }
    
    const avgConfidence = totalConfidence / sources.sources.length;
    
    // 数据源多样性加成
    const diversityBonus = Math.min(sources.sources.length * 5, 20); // 每个额外数据源+5%，最多+20%
    
    return Math.min(100, avgConfidence + diversityBonus) as u32;
  }
}

/**
 * 多源数据容器
 */
class MultiSourceData {
  sources: DataSourceInfo[] = [];

  addSource(name: string, price: i32, volume: i64, confidence: u32): void {
    this.sources.push(new DataSourceInfo(name, price, volume, confidence));
  }

  getAllPrices(): i32[] {
    const prices: i32[] = [];
    for (let i = 0; i < this.sources.length; i++) {
      prices.push(this.sources[i].price);
    }
    return prices;
  }

  getSourceNames(): string[] {
    const names: string[] = [];
    for (let i = 0; i < this.sources.length; i++) {
      names.push(this.sources[i].name);
    }
    return names;
  }
}

class DataSourceInfo {
  constructor(
    public name: string,
    public price: i32,
    public volume: i64,
    public confidence: u32
  ) {}
}

class HistoricalData {
  constructor(
    public isValid: boolean,
    public price: i32,
    public volume: i64
  ) {}
}

class BackupData {
  constructor(
    public isValid: boolean,
    public price: i32,
    public volume: i64
  ) {}
}

class PoolData {
  constructor(
    public isValid: boolean,
    public price: i32,
    public volume: i64
  ) {}
}