/**
 * Strategy Manager - 策略管理器
 * 管理和切换不同的交易策略
 */

import { Storage, generateEvent } from '@massalabs/massa-as-sdk';
import { PracticalMarketDetector, PracticalMarketState, DetectionResult as PracticalDetectionResult, TradingSignal as PracticalTradingSignal } from '../algorithms/PracticalMarketDetector';
import { MeanReversionStrategy, DetectionResult as MeanReversionDetectionResult, TradingSignal as MeanReversionTradingSignal } from '../algorithms/MeanReversionStrategy';
import { MarketState } from '../types';

// 策略类型枚举
export enum StrategyType {
    MULTI_THREAD_ATTENTION = 0,
    MEAN_REVERSION = 1
}

// 统一的策略检测结果
export class UnifiedDetectionResult {
    public state: MarketState;
    public confidence: f64;
    public signal: string;
    public metadata: Map<string, string> = new Map<string, string>();
    
    constructor(state: MarketState, confidence: f64, signal: string) {
        this.state = state;
        this.confidence = confidence;
        this.signal = signal;
    }
}

export class StrategyManager {
    // 存储键
    private static readonly ACTIVE_STRATEGY_KEY: string = 'active_strategy';
    private static readonly STRATEGY_CONFIG_KEY: string = 'strategy_config';
    
    /**
     * 设置活跃策略
     */
    static setActiveStrategy(strategyType: StrategyType): void {
        Storage.set(this.ACTIVE_STRATEGY_KEY, strategyType.toString());
        generateEvent(`[StrategyManager] Active strategy changed to: ${this.getStrategyName(strategyType)}`);
    }
    
    /**
     * 获取活跃策略
     */
    static getActiveStrategy(): StrategyType {
        const strategyStr = Storage.get(this.ACTIVE_STRATEGY_KEY);
        if (strategyStr.length === 0) {
            return StrategyType.MULTI_THREAD_ATTENTION; // 默认策略
        }
        
        const strategyNum = parseInt(strategyStr);
        if (strategyNum === 1) {
            return StrategyType.MEAN_REVERSION;
        }
        
        return StrategyType.MULTI_THREAD_ATTENTION;
    }
    
    /**
     * 执行活跃策略的检测
     */
    static executeActiveStrategy(
        prices: i32[],
        volumes: i32[] = []
    ): UnifiedDetectionResult {
        const activeStrategy = this.getActiveStrategy();
        
        generateEvent(`[StrategyManager] Executing strategy: ${this.getStrategyName(activeStrategy)}`);
        
        switch (activeStrategy) {
            case StrategyType.MEAN_REVERSION:
                return this.executeMeanReversionStrategy(prices, volumes);
                
            case StrategyType.MULTI_THREAD_ATTENTION:
            default:
                return this.executeMultiThreadAttentionStrategy(prices, volumes);
        }
    }
    
    /**
     * 执行多线程注意力策略
     */
    private static executeMultiThreadAttentionStrategy(
        prices: i32[],
        volumes: i32[] = []
    ): UnifiedDetectionResult {
        const result = PracticalMarketDetector.detectMarketState(prices, volumes);
        
        // 转换PracticalMarketState到MarketState
        let marketState: MarketState = MarketState.SIDEWAYS;
        switch (result.state) {
            case PracticalMarketState.TRENDING_UP:
                marketState = MarketState.BULL;
                break;
            case PracticalMarketState.TRENDING_DOWN:
                marketState = MarketState.BEAR;
                break;
            case PracticalMarketState.SIDEWAYS:
            case PracticalMarketState.LOW_VOLATILITY:
            default:
                marketState = MarketState.SIDEWAYS;
                break;
        }
        
        // 转换TradingSignal到字符串
        let signalStr: string = 'HOLD';
        switch (result.signal) {
            case PracticalTradingSignal.STRONG_BUY:
                signalStr = 'STRONG_BUY';
                break;
            case PracticalTradingSignal.BUY:
                signalStr = 'BUY';
                break;
            case PracticalTradingSignal.SELL:
                signalStr = 'SELL';
                break;
            case PracticalTradingSignal.STRONG_SELL:
                signalStr = 'STRONG_SELL';
                break;
            case PracticalTradingSignal.WAIT:
                signalStr = 'WAIT';
                break;
            default:
                signalStr = 'HOLD';
                break;
        }
        
        const unifiedResult = new UnifiedDetectionResult(
            marketState,
            result.confidence as f64 / 100.0, // Convert to 0-1 range
            signalStr
        );
        
        unifiedResult.metadata.set('strategy', 'MultiThreadAttention');
        unifiedResult.metadata.set('urgency', result.urgency.toString());
        unifiedResult.metadata.set('reasoning', result.reasoning);
        
        return unifiedResult;
    }
    
    /**
     * 执行均值回归策略
     */
    private static executeMeanReversionStrategy(
        prices: i32[],
        volumes: i32[] = []
    ): UnifiedDetectionResult {
        const resultWrapper = MeanReversionStrategy.detectMeanReversion(prices, volumes);
        
        if (resultWrapper.isError()) {
            generateEvent(`[StrategyManager] Mean reversion strategy failed: ${resultWrapper.getError()}`);
            // 返回默认结果
            const defaultResult = new UnifiedDetectionResult(MarketState.SIDEWAYS, 0.5, 'WAIT');
            defaultResult.metadata.set('strategy', 'MeanReversion');
            defaultResult.metadata.set('error', resultWrapper.getError());
            return defaultResult;
        }
        
        const result = resultWrapper.unwrap();
        
        // 转换信号
        let signalStr: string = 'HOLD';
        switch (result.signal) {
            case MeanReversionTradingSignal.STRONG_BUY:
                signalStr = 'STRONG_BUY';
                break;
            case MeanReversionTradingSignal.BUY:
                signalStr = 'BUY';
                break;
            case MeanReversionTradingSignal.SELL:
                signalStr = 'SELL';
                break;
            case MeanReversionTradingSignal.STRONG_SELL:
                signalStr = 'STRONG_SELL';
                break;
            case MeanReversionTradingSignal.WAIT:
                signalStr = 'WAIT';
                break;
            default:
                signalStr = 'HOLD';
                break;
        }
        
        const unifiedResult = new UnifiedDetectionResult(
            result.state,
            result.confidence,
            signalStr
        );
        
        // 复制元数据
        const keys = result.metadata.keys();
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            unifiedResult.metadata.set(key, result.metadata.get(key));
        }
        
        return unifiedResult;
    }
    
    /**
     * 获取策略名称
     */
    static getStrategyName(strategyType: StrategyType): string {
        switch (strategyType) {
            case StrategyType.MULTI_THREAD_ATTENTION:
                return 'Multi-thread Attention';
            case StrategyType.MEAN_REVERSION:
                return 'Mean Reversion';
            default:
                return 'Unknown';
        }
    }
    
    /**
     * 获取所有可用策略
     */
    static getAvailableStrategies(): string[] {
        return [
            this.getStrategyName(StrategyType.MULTI_THREAD_ATTENTION),
            this.getStrategyName(StrategyType.MEAN_REVERSION)
        ];
    }
    
    /**
     * 获取策略配置
     */
    static getStrategyConfig(strategyType: StrategyType): Map<string, string> {
        const config = new Map<string, string>();
        
        switch (strategyType) {
            case StrategyType.MULTI_THREAD_ATTENTION:
                config.set('name', 'Multi-thread Attention');
                config.set('description', 'Uses multiple observation threads with attention weights');
                config.set('type', 'rule-based');
                config.set('timeframe', 'real-time');
                break;
                
            case StrategyType.MEAN_REVERSION:
                config.set('name', 'Mean Reversion');
                config.set('description', 'Classic cryptocurrency trading strategy based on mean reversion');
                config.set('type', 'statistical');
                config.set('timeframe', '20-period MA');
                break;
        }
        
        return config;
    }
    
    /**
     * 保存策略执行结果
     */
    static saveStrategyResult(result: UnifiedDetectionResult): void {
        const timestamp = Date.now().toString();
        const resultStr = `${result.state}|${result.confidence}|${result.signal}|${timestamp}`;
        Storage.set('last_strategy_result', resultStr);
        
        generateEvent(`[StrategyManager] Strategy result saved: ${result.signal} (confidence: ${result.confidence})`);
    }
    
    /**
     * 获取最后的策略执行结果
     */
    static getLastStrategyResult(): string {
        return Storage.get('last_strategy_result');
    }
}