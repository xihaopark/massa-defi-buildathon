/**
 * Practical Market State Detector - Rule-based approach for real-time trading
 * Practical market state detector - rule-based real-time trading method
 */

import { Storage, Context, generateEvent } from '@massalabs/massa-as-sdk';
import { Args } from '@massalabs/as-types';

// Market state enumeration
export enum PracticalMarketState {
  HIGH_VOLATILITY = 0,    // High volatility
  LOW_VOLATILITY = 1,     // Low volatility  
  TRENDING_UP = 2,        // Uptrend
  TRENDING_DOWN = 3,      // Downtrend
  SIDEWAYS = 4,          // Sideways
  BREAKOUT = 5,          // Breakout
  REVERSAL = 6           // Reversal
}

// Detection result
export class DetectionResult {
  constructor(
    public state: PracticalMarketState,
    public confidence: u32,           // Confidence 0-100
    public signal: TradingSignal,     // Trading signal
    public urgency: u32,             // Urgency 0-100
    public reasoning: string         // Decision reasoning
  ) {}
}

// Trading signal
export enum TradingSignal {
  STRONG_BUY = 0,
  BUY = 1,
  HOLD = 2,
  SELL = 3,
  STRONG_SELL = 4,
  WAIT = 5
}

// Market features
class MarketFeatures {
  constructor(
    public volatility: i32,      // Volatility (fixed point * 1000)
    public trend: i32,           // Trend strength (-1000 to 1000)
    public momentum: i32,        // Momentum (-1000 to 1000)
    public volume: i32,          // Volume change rate
    public support: i32,         // Support level strength
    public resistance: i32       // Resistance level strength
  ) {}
}

export class PracticalMarketDetector {
  
  // 阈值参数（可调节）
  private static readonly HIGH_VOLATILITY_THRESHOLD: i32 = 300;  // 3%
  private static readonly LOW_VOLATILITY_THRESHOLD: i32 = 50;    // 0.5%
  private static readonly STRONG_TREND_THRESHOLD: i32 = 200;     // 2%
  private static readonly BREAKOUT_THRESHOLD: i32 = 150;        // 1.5%
  private static readonly VOLUME_SURGE_THRESHOLD: i32 = 200;    // 2x normal
  
  // 时间窗口
  private static readonly SHORT_WINDOW: i32 = 5;   // 5个观测点
  private static readonly MEDIUM_WINDOW: i32 = 20; // 20个观测点
  private static readonly LONG_WINDOW: i32 = 50;   // 50个观测点
  
  /**
   * 主要检测函数 - 基于最新观测数据判断市场状态
   */
  static detectMarketState(
    observations: i32[],
    volumes: i32[] = [],
    timestamp: u64 = 0
  ): DetectionResult {
    
    if (observations.length < PracticalMarketDetector.SHORT_WINDOW) {
      return new DetectionResult(
        PracticalMarketState.SIDEWAYS,
        50,
        TradingSignal.WAIT,
        0,
        'Insufficient data for analysis'
      );
    }
    
    // 提取市场特征
    const features = this.extractMarketFeatures(observations, volumes);
    
    // 执行规则检测
    return this.applyDetectionRules(features, observations);
  }
  
  /**
   * 提取市场特征
   */
  private static extractMarketFeatures(
    observations: i32[],
    volumes: i32[]
  ): MarketFeatures {
    
    const len = observations.length;
    
    // 1. 计算波动率（最近5个点的标准差）
    const startIdx = Math.max(0, len - this.SHORT_WINDOW) as i32;
    const volatility = this.calculateVolatility(
      observations.slice(startIdx)
    );
    
    // 2. 计算趋势（线性回归斜率）
    const trendStartIdx = Math.max(0, len - this.MEDIUM_WINDOW) as i32;
    const trend = this.calculateTrend(
      observations.slice(trendStartIdx)
    );
    
    // 3. 计算动量（价格变化率）
    const momentum = this.calculateMomentum(observations);
    
    // 4. 计算成交量变化
    const volumeChange = volumes.length > 0 ? 
      this.calculateVolumeChange(volumes) : 0;
    
    // 5. 识别支撑阻力位
    const support = this.findSupportLevel(observations);
    const resistance = this.findResistanceLevel(observations);
    
    return new MarketFeatures(
      volatility,
      trend,
      momentum,
      volumeChange,
      support,
      resistance
    );
  }
  
  /**
   * 应用检测规则
   */
  private static applyDetectionRules(
    features: MarketFeatures,
    observations: i32[]
  ): DetectionResult {
    
    const currentPrice = observations[observations.length - 1];
    
    // 规则1: 突破检测（最高优先级）
    if (this.detectBreakout(features, currentPrice)) {
      const direction = features.trend > 0 ? 'upward' : 'downward';
      return new DetectionResult(
        PracticalMarketState.BREAKOUT,
        90,
        features.trend > 0 ? TradingSignal.STRONG_BUY : TradingSignal.STRONG_SELL,
        95,
        `${direction} breakout detected with high volume`
      );
    }
    
    // 规则2: 反转检测
    if (this.detectReversal(features, observations)) {
      return new DetectionResult(
        PracticalMarketState.REVERSAL,
        80,
        features.momentum > 0 ? TradingSignal.BUY : TradingSignal.SELL,
        85,
        'Market reversal pattern detected'
      );
    }
    
    // 规则3: 高波动检测
    if (features.volatility > this.HIGH_VOLATILITY_THRESHOLD) {
      return new DetectionResult(
        PracticalMarketState.HIGH_VOLATILITY,
        85,
        TradingSignal.HOLD,
        70,
        `High volatility: ${features.volatility / 10}%`
      );
    }
    
    // 规则4: 强趋势检测
    if (Math.abs(features.trend) > this.STRONG_TREND_THRESHOLD) {
      const state = features.trend > 0 ? 
        PracticalMarketState.TRENDING_UP : 
        PracticalMarketState.TRENDING_DOWN;
      const signal = features.trend > 0 ? TradingSignal.BUY : TradingSignal.SELL;
      
      return new DetectionResult(
        state,
        75,
        signal,
        60,
        `Strong ${features.trend > 0 ? 'upward' : 'downward'} trend`
      );
    }
    
    // 规则5: 低波动横盘
    if (features.volatility < this.LOW_VOLATILITY_THRESHOLD) {
      return new DetectionResult(
        PracticalMarketState.LOW_VOLATILITY,
        70,
        TradingSignal.WAIT,
        20,
        'Low volatility consolidation phase'
      );
    }
    
    // 默认：横盘
    return new DetectionResult(
      PracticalMarketState.SIDEWAYS,
      60,
      TradingSignal.HOLD,
      30,
      'Normal market conditions'
    );
  }
  
  /**
   * 突破检测
   */
  private static detectBreakout(features: MarketFeatures, currentPrice: i32): boolean {
    // 条件1: 价格突破阻力位或跌破支撑位
    const priceBreakout = (currentPrice > features.resistance + this.BREAKOUT_THRESHOLD) ||
                         (currentPrice < features.support - this.BREAKOUT_THRESHOLD);
    
    // 条件2: 成交量放大
    const volumeConfirm = features.volume > this.VOLUME_SURGE_THRESHOLD;
    
    // 条件3: 有明确方向性
    const directional = Math.abs(features.trend) > 100;
    
    return priceBreakout && volumeConfirm && directional;
  }
  
  /**
   * 反转检测
   */
  private static detectReversal(features: MarketFeatures, observations: i32[]): boolean {
    if (observations.length < 10) return false;
    
    // 检测价格和动量背离
    const recentPrices = observations.slice(-5);
    const priceDirection = recentPrices[recentPrices.length - 1] - recentPrices[0];
    const momentumDirection = features.momentum;
    
    // 价格上涨但动量下降，或价格下跌但动量上升
    const divergence = (priceDirection > 0 && momentumDirection < -50) ||
                      (priceDirection < 0 && momentumDirection > 50);
    
    // 接近支撑或阻力位
    const nearLevel = Math.abs(observations[observations.length - 1] - features.support) < 50 ||
                     Math.abs(observations[observations.length - 1] - features.resistance) < 50;
    
    return divergence && nearLevel;
  }
  
  /**
   * 计算波动率 (标准差 * 1000)
   */
  private static calculateVolatility(prices: i32[]): i32 {
    if (prices.length < 2) return 0;
    
    let sum: i64 = 0;
    for (let i = 0; i < prices.length; i++) {
      sum += prices[i];
    }
    const mean = sum / (prices.length as i64);
    
    let variance: i64 = 0;
    for (let i = 0; i < prices.length; i++) {
      const diff = (prices[i] as i64) - mean;
      variance += diff * diff;
    }
    
    variance = variance / (prices.length as i64);
    
    // 简化的平方根计算 (牛顿法)
    const stdDev = this.sqrt(variance);
    
    // 返回波动率百分比 * 1000
    return ((stdDev * 1000) / mean) as i32;
  }
  
  /**
   * 计算趋势 (线性回归斜率 * 1000)
   */
  private static calculateTrend(prices: i32[]): i32 {
    if (prices.length < 2) return 0;
    
    const n = prices.length;
    let sumX: i32 = 0;
    let sumY: i64 = 0;
    let sumXY: i64 = 0;
    let sumX2: i32 = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += prices[i];
      sumXY += (i as i64) * (prices[i] as i64);
      sumX2 += i * i;
    }
    
    const denominator = (n as i64) * (sumX2 as i64) - (sumX as i64) * (sumX as i64);
    if (denominator === 0) return 0;
    
    const slope = ((n as i64) * sumXY - (sumX as i64) * sumY) / denominator;
    
    // 返回斜率 * 1000
    return (slope * 1000) as i32;
  }
  
  /**
   * 计算动量 (价格变化率 * 1000)
   */
  private static calculateMomentum(prices: i32[]): i32 {
    if (prices.length < 5) return 0;
    
    const current = prices[prices.length - 1];
    const past = prices[prices.length - 5];
    
    if (past === 0) return 0;
    
    return ((current - past) * 1000) / past;
  }
  
  /**
   * 计算成交量变化率
   */
  private static calculateVolumeChange(volumes: i32[]): i32 {
    if (volumes.length < 5) return 0;
    
    const recentAvg = this.average(volumes.slice(-3));
    const pastAvg = this.average(volumes.slice(-10, -3));
    
    if (pastAvg === 0) return 0;
    
    return ((recentAvg - pastAvg) * 1000) / pastAvg;
  }
  
  /**
   * 寻找支撑位
   */
  private static findSupportLevel(prices: i32[]): i32 {
    if (prices.length < 10) return prices[0] || 0;
    
    let minPrice = prices[0];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] < minPrice) {
        minPrice = prices[i];
      }
    }
    
    return minPrice;
  }
  
  /**
   * 寻找阻力位
   */
  private static findResistanceLevel(prices: i32[]): i32 {
    if (prices.length < 10) return prices[0] || 0;
    
    let maxPrice = prices[0];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > maxPrice) {
        maxPrice = prices[i];
      }
    }
    
    return maxPrice;
  }
  
  /**
   * 辅助函数：计算平均值
   */
  private static average(values: i32[]): i32 {
    if (values.length === 0) return 0;
    
    let sum: i64 = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
    }
    
    return (sum / (values.length as i64)) as i32;
  }
  
  /**
   * 简化的平方根计算 (牛顿法)
   */
  private static sqrt(value: i64): i64 {
    if (value <= 0) return 0;
    if (value === 1) return 1;
    
    let x = value;
    let y = (x + 1) / 2;
    
    // 5次迭代足够精确
    for (let i = 0; i < 5; i++) {
      y = (x + value / x) / 2;
      x = y;
    }
    
    return y;
  }
}

/**
 * 简化的注意力权重计算器
 */
export class PracticalAttentionCalculator {
  
  /**
   * 计算实用的注意力权重
   * 基于时间衰减、异常值检测、市场重要性
   */
  static calculateAttentionWeights(
    observations: i32[],
    marketStates: PracticalMarketState[],
    volumes: i32[] = []
  ): f64[] {
    
    if (observations.length === 0) return [];
    
    const weights: f64[] = [];
    const n = observations.length;
    
    for (let i = 0; i < n; i++) {
      let weight: f64 = 1.0;
      
      // 1. 时间衰减权重 (最近的数据权重更高)
      const recencyWeight = this.calculateRecencyWeight(i, n);
      
      // 2. 异常值权重 (市场异动权重更高)
      const abnormalityWeight = this.calculateAbnormalityWeight(
        observations[i], 
        observations
      );
      
      // 3. 状态变化权重 (状态转换时权重更高)
      const stateChangeWeight = marketStates.length > i ? 
        this.calculateStateChangeWeight(i, marketStates) : 1.0;
      
      // 4. 成交量权重 (高成交量权重更高)
      const volumeWeight = volumes.length > i ? 
        this.calculateVolumeWeight(volumes[i], volumes) : 1.0;
      
      // 综合权重
      weight = recencyWeight * abnormalityWeight * stateChangeWeight * volumeWeight;
      weights.push(weight);
    }
    
    // 归一化权重
    return this.normalizeWeights(weights);
  }
  
  /**
   * 时间衰减权重 (指数衰减)
   */
  private static calculateRecencyWeight(index: i32, totalLength: i32): f64 {
    // 指数衰减，衰减因子 0.9
    const position = (index as f64) / (totalLength as f64);
    return Math.pow(0.9, (1.0 - position) * 10);
  }
  
  /**
   * 异常值权重
   */
  private static calculateAbnormalityWeight(
    value: i32, 
    allValues: i32[]
  ): f64 {
    if (allValues.length < 3) return 1.0;
    
    // 计算最近10个值的平均值和标准差
    const recentStartIdx = Math.max(0, allValues.length - 10) as i32;
    const recentValues = allValues.slice(recentStartIdx);
    
    let sum: i64 = 0;
    for (let i = 0; i < recentValues.length; i++) {
      sum += recentValues[i];
    }
    const mean = sum / (recentValues.length as i64);
    
    let variance: i64 = 0;
    for (let i = 0; i < recentValues.length; i++) {
      const diff = (recentValues[i] as i64) - mean;
      variance += diff * diff;
    }
    variance = variance / (recentValues.length as i64);
    
    const stdDev = PracticalMarketDetector.sqrt(variance);
    if (stdDev === 0) return 1.0;
    
    // Z-score计算
    const zScore = (Math.abs(((value as i64) - mean) as f64)) / (stdDev as f64);
    
    // 异常值(z-score > 2)权重提高
    if (zScore > 2) return 2.0;
    if (zScore > 1) return 1.5;
    return 1.0;
  }
  
  /**
   * 状态变化权重
   */
  private static calculateStateChangeWeight(
    index: i32, 
    states: PracticalMarketState[]
  ): f64 {
    if (index === 0 || states.length <= index) return 1.0;
    
    // 状态发生变化时权重提高
    if (states[index] !== states[index - 1]) {
      return 1.8;
    }
    
    return 1.0;
  }
  
  /**
   * 成交量权重
   */
  private static calculateVolumeWeight(volume: i32, allVolumes: i32[]): f64 {
    if (allVolumes.length < 5) return 1.0;
    
    const recentAvg = PracticalMarketDetector.average(
      allVolumes.slice(-10)
    );
    
    if (recentAvg === 0) return 1.0;
    
    const volumeRatio = (volume as f64) / (recentAvg as f64);
    
    // 成交量异常时权重提高
    if (volumeRatio > 2.0) return 1.6;
    if (volumeRatio > 1.5) return 1.3;
    if (volumeRatio < 0.5) return 0.8;
    
    return 1.0;
  }
  
  /**
   * 权重归一化
   */
  private static normalizeWeights(weights: f64[]): f64[] {
    let sum: f64 = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
    }
    
    if (sum === 0) return weights;
    
    const normalized: f64[] = [];
    for (let i = 0; i < weights.length; i++) {
      normalized.push(weights[i] / sum);
    }
    
    return normalized;
  }
}