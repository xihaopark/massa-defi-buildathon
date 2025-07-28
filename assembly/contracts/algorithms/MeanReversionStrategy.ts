/**
 * Mean Reversion Strategy - 均值回归策略
 * 经典的加密货币交易策略，基于价格会回归到其历史平均值的理论
 */

import { Storage, generateEvent } from '@massalabs/massa-as-sdk';
import { Result } from '../utils/Result';
import { MarketState } from '../types';

// 交易信号枚举
export enum TradingSignal {
    STRONG_BUY = 0,
    BUY = 1,
    HOLD = 2,
    SELL = 3,
    STRONG_SELL = 4,
    WAIT = 5
}

// 检测结果类
export class DetectionResult {
    public state: MarketState;
    public confidence: f64;
    public signal: TradingSignal;
    public metadata: Map<string, string> = new Map<string, string>();
    
    constructor(state: MarketState, confidence: f64, signal: TradingSignal = TradingSignal.HOLD) {
        this.state = state;
        this.confidence = confidence;
        this.signal = signal;
    }
}

export class MeanReversionStrategy {
    // 策略参数
    private static readonly MA_PERIOD: i32 = 20;           // 移动平均周期
    private static readonly DEVIATION_THRESHOLD: f64 = 2.0; // 标准差倍数阈值
    private static readonly MIN_CONFIDENCE: f64 = 0.65;     // 最小置信度
    
    // 存储键
    private static readonly PRICE_HISTORY_KEY: string = 'mr_price_history';
    private static readonly STRATEGY_STATE_KEY: string = 'mr_strategy_state';
    
    /**
     * 均值回归策略检测
     * @param prices 价格数组
     * @param volumes 成交量数组（可选）
     * @returns 检测结果
     */
    static detectMeanReversion(
        prices: i32[],
        volumes: i32[] = []
    ): Result<DetectionResult> {
        generateEvent('[MeanReversion] Starting mean reversion analysis');
        
        if (prices.length < this.MA_PERIOD) {
            return Result.error<DetectionResult>('Insufficient price data for mean reversion analysis');
        }
        
        // 计算移动平均
        const ma = this.calculateMA(prices);
        
        // 计算标准差
        const stdDev = this.calculateStandardDeviation(prices, ma);
        
        // 获取当前价格
        const currentPrice = prices[prices.length - 1];
        
        // 计算偏离度
        const deviation = (currentPrice as f64 - ma) / stdDev;
        
        // 确定市场状态和交易信号
        let state: MarketState;
        let confidence: f64;
        let signal: TradingSignal = TradingSignal.HOLD;
        let action: string = 'HOLD';
        
        if (deviation > this.DEVIATION_THRESHOLD) {
            // 价格过高，预期回归 - 卖出信号
            state = MarketState.BEAR; // Using existing MarketState enum
            confidence = Math.min(0.95, 0.65 + (deviation - this.DEVIATION_THRESHOLD) * 0.1);
            signal = TradingSignal.SELL;
            action = 'SELL';
            generateEvent(`[MeanReversion] Overbought condition detected. Deviation: ${deviation}`);
        } else if (deviation < -this.DEVIATION_THRESHOLD) {
            // 价格过低，预期回归 - 买入信号
            state = MarketState.BULL; // Using existing MarketState enum
            confidence = Math.min(0.95, 0.65 + (-deviation - this.DEVIATION_THRESHOLD) * 0.1);
            signal = TradingSignal.BUY;
            action = 'BUY';
            generateEvent(`[MeanReversion] Oversold condition detected. Deviation: ${deviation}`);
        } else if (Math.abs(deviation) < 0.5) {
            // 价格接近均值 - 稳定状态
            state = MarketState.SIDEWAYS;
            confidence = 0.7;
            signal = TradingSignal.HOLD;
            action = 'HOLD';
        } else {
            // 价格偏离但未达到阈值 - 不确定状态
            state = MarketState.SIDEWAYS;
            confidence = 0.5;
            signal = TradingSignal.WAIT;
            action = 'HOLD';
        }
        
        // 考虑成交量（如果提供）
        if (volumes.length > 0) {
            confidence = this.adjustConfidenceByVolume(confidence, volumes, action);
        }
        
        // 存储策略状态
        this.saveStrategyState(ma, stdDev, deviation, action);
        
        const result = new DetectionResult(state, confidence, signal);
        // Add metadata
        result.metadata.set('strategy', 'MeanReversion');
        result.metadata.set('ma', ma.toString());
        result.metadata.set('stdDev', stdDev.toString());
        result.metadata.set('deviation', deviation.toString());
        result.metadata.set('action', action);
        result.metadata.set('threshold', this.DEVIATION_THRESHOLD.toString());
        
        generateEvent(`[MeanReversion] Analysis complete: ${action} with confidence ${confidence}`);
        
        return Result.ok(result);
    }
    
    /**
     * 计算移动平均
     */
    private static calculateMA(prices: i32[]): f64 {
        let sum: f64 = 0;
        const start = prices.length - this.MA_PERIOD;
        
        for (let i = start; i < prices.length; i++) {
            sum += prices[i] as f64;
        }
        
        return sum / (this.MA_PERIOD as f64);
    }
    
    /**
     * 计算标准差
     */
    private static calculateStandardDeviation(prices: i32[], ma: f64): f64 {
        let sumSquaredDiff: f64 = 0;
        const start = prices.length - this.MA_PERIOD;
        
        for (let i = start; i < prices.length; i++) {
            const diff = (prices[i] as f64) - ma;
            sumSquaredDiff += diff * diff;
        }
        
        const variance = sumSquaredDiff / (this.MA_PERIOD as f64);
        return Math.sqrt(variance);
    }
    
    /**
     * 根据成交量调整置信度
     */
    private static adjustConfidenceByVolume(
        baseConfidence: f64,
        volumes: i32[],
        action: string
    ): f64 {
        if (volumes.length < 2) return baseConfidence;
        
        // 获取最近的成交量
        const currentVolume = volumes[volumes.length - 1];
        const avgVolume = this.calculateAverageVolume(volumes);
        
        // 成交量比率
        const volumeRatio = currentVolume as f64 / avgVolume;
        
        // 高成交量增加置信度
        if (volumeRatio > 1.5 && action !== 'HOLD') {
            const boost = Math.min(0.1, (volumeRatio - 1.5) * 0.05);
            return Math.min(0.95, baseConfidence + boost);
        }
        
        // 低成交量降低置信度
        if (volumeRatio < 0.7 && action !== 'HOLD') {
            const penalty = Math.min(0.1, (0.7 - volumeRatio) * 0.1);
            return Math.max(0.5, baseConfidence - penalty);
        }
        
        return baseConfidence;
    }
    
    /**
     * 计算平均成交量
     */
    private static calculateAverageVolume(volumes: i32[]): f64 {
        let sum: f64 = 0;
        const count = Math.min(volumes.length, 10) as i32;
        const start = volumes.length - count;
        
        for (let i = start; i < volumes.length; i++) {
            sum += volumes[i] as f64;
        }
        
        return sum / (count as f64);
    }
    
    /**
     * 保存策略状态
     */
    private static saveStrategyState(
        ma: f64,
        stdDev: f64,
        deviation: f64,
        action: string
    ): void {
        const stateStr = `${ma}|${stdDev}|${deviation}|${action}|${Date.now()}`;
        Storage.set(this.STRATEGY_STATE_KEY, stateStr);
    }
    
    /**
     * 获取策略建议的头寸大小
     */
    static getPositionSize(deviation: f64, confidence: f64): f64 {
        // 基础头寸大小
        let baseSize: f64 = 0.1; // 10% 基础仓位
        
        // 根据偏离度调整
        const deviationFactor = Math.min(2.0, Math.abs(deviation) / this.DEVIATION_THRESHOLD);
        
        // 根据置信度调整
        const confidenceFactor = confidence;
        
        // 计算最终头寸大小
        const positionSize = baseSize * deviationFactor * confidenceFactor;
        
        // 限制最大头寸
        return Math.min(0.3, positionSize); // 最大30%仓位
    }
    
    /**
     * 获取止损价格
     */
    static getStopLoss(entryPrice: f64, action: string, stdDev: f64): f64 {
        const stopLossMultiplier: f64 = 1.5;
        
        if (action === 'BUY') {
            // 买入止损：入场价 - 1.5倍标准差
            return entryPrice - (stdDev * stopLossMultiplier);
        } else if (action === 'SELL') {
            // 卖出止损：入场价 + 1.5倍标准差
            return entryPrice + (stdDev * stopLossMultiplier);
        }
        
        return entryPrice;
    }
    
    /**
     * 获取止盈价格
     */
    static getTakeProfit(entryPrice: f64, action: string, ma: f64): f64 {
        if (action === 'BUY') {
            // 买入止盈：均线价格
            return ma;
        } else if (action === 'SELL') {
            // 卖出止盈：均线价格
            return ma;
        }
        
        return entryPrice;
    }
}