/**
 * Virtual Market Generator - 虚拟市场生成器
 * 生成虚拟市场数据并与链上ASC进行真实交互
 */

import { Storage, generateEvent, Context } from '@massalabs/massa-as-sdk';
import { StrategyManager, StrategyType } from '../core/StrategyManager';

// 市场数据点
export class MarketDataPoint {
    public price: i32;
    public volume: i32;
    public timestamp: u64;
    
    constructor(price: i32, volume: i32, timestamp: u64) {
        this.price = price;
        this.volume = volume;
        this.timestamp = timestamp;
    }
}

// 市场状态
export class MarketStatus {
    public currentPrice: i32;
    public priceChange: f64;
    public volume: i32;
    public volatility: f64;
    public trend: string;
    public lastUpdate: u64;
    
    constructor() {
        this.currentPrice = 1000;
        this.priceChange = 0.0;
        this.volume = 100;
        this.volatility = 0.02;
        this.trend = 'SIDEWAYS';
        this.lastUpdate = Context.timestamp();
    }
}

export class VirtualMarketGenerator {
    // 存储键
    private static readonly MARKET_DATA_KEY: string = 'virtual_market_data';
    private static readonly MARKET_STATUS_KEY: string = 'virtual_market_status';
    private static readonly PRICE_HISTORY_KEY: string = 'price_history';
    private static readonly INTERACTION_LOG_KEY: string = 'interaction_log';
    
    // 市场参数
    private static readonly MAX_PRICE_HISTORY: i32 = 100;
    private static readonly BASE_PRICE: i32 = 1000;
    private static readonly MAX_VOLATILITY: f64 = 0.1;
    private static readonly MIN_VOLUME: i32 = 50;
    private static readonly MAX_VOLUME: i32 = 500;
    
    /**
     * 生成新的市场数据点
     */
    static generateMarketData(): MarketDataPoint {
        const currentStatus = this.getMarketStatus();
        const timestamp = Context.timestamp();
        
        // 生成价格变化（基于当前波动率）
        const randomFactor = (Math.random() - 0.5) * 2; // -1 到 1
        const priceChange = currentStatus.volatility * randomFactor * (currentStatus.currentPrice as f64);
        const newPrice = Math.max(100, currentStatus.currentPrice + (priceChange as i32)) as i32;
        
        // 生成成交量（基于价格变化幅度）
        const priceChangePercent = Math.abs(priceChange / (currentStatus.currentPrice as f64));
        const volumeMultiplier = 1 + priceChangePercent * 3; // 价格变化越大，成交量越大
        const newVolume = Math.min(
            this.MAX_VOLUME,
            Math.max(this.MIN_VOLUME, ((currentStatus.volume as f64) * volumeMultiplier) as i32)
        ) as i32;
        
        const dataPoint = new MarketDataPoint(newPrice, newVolume, timestamp);
        
        // 更新市场状态
        this.updateMarketStatus(newPrice, newVolume, priceChange);
        
        // 保存数据点到历史
        this.saveToPriceHistory(dataPoint);
        
        generateEvent(`[VirtualMarket] New data: Price=${newPrice}, Volume=${newVolume}, Change=${priceChange}`);
        
        return dataPoint;
    }
    
    /**
     * 获取当前市场状态
     */
    static getMarketStatus(): MarketStatus {
        const statusStr = Storage.get(this.MARKET_STATUS_KEY);
        
        if (statusStr.length === 0) {
            // 初始化默认状态
            const defaultStatus = new MarketStatus();
            this.saveMarketStatus(defaultStatus);
            return defaultStatus;
        }
        
        // 解析状态字符串
        const parts = statusStr.split('|');
        if (parts.length < 6) {
            return new MarketStatus();
        }
        
        const status = new MarketStatus();
        status.currentPrice = parseInt(parts[0]) as i32;
        status.priceChange = parseFloat(parts[1]);
        status.volume = parseInt(parts[2]) as i32;
        status.volatility = parseFloat(parts[3]);
        status.trend = parts[4];
        status.lastUpdate = parseInt(parts[5]) as u64;
        
        return status;
    }
    
    /**
     * 更新市场状态
     */
    private static updateMarketStatus(newPrice: i32, newVolume: i32, priceChange: f64): void {
        const status = this.getMarketStatus();
        
        status.currentPrice = newPrice;
        status.priceChange = priceChange;
        status.volume = newVolume;
        status.lastUpdate = Context.timestamp();
        
        // 动态调整波动率
        const changePercent = Math.abs(priceChange / (status.currentPrice as f64));
        if (changePercent > 0.05) {
            // 大幅变化时增加波动率
            status.volatility = Math.min(this.MAX_VOLATILITY, status.volatility * 1.1);
        } else {
            // 小幅变化时减少波动率
            status.volatility = Math.max(0.005, status.volatility * 0.98);
        }
        
        // 更新趋势
        status.trend = this.determineTrend(priceChange);
        
        this.saveMarketStatus(status);
    }
    
    /**
     * 确定市场趋势
     */
    private static determineTrend(priceChange: f64): string {
        if (priceChange > 5) {
            return 'BULLISH';
        } else if (priceChange < -5) {
            return 'BEARISH';
        } else {
            return 'SIDEWAYS';
        }
    }
    
    /**
     * 保存市场状态
     */
    private static saveMarketStatus(status: MarketStatus): void {
        const statusStr = `${status.currentPrice}|${status.priceChange}|${status.volume}|${status.volatility}|${status.trend}|${status.lastUpdate}`;
        Storage.set(this.MARKET_STATUS_KEY, statusStr);
    }
    
    /**
     * 保存到价格历史
     */
    private static saveToPriceHistory(dataPoint: MarketDataPoint): void {
        const historyStr = Storage.get(this.PRICE_HISTORY_KEY);
        let prices: i32[] = [];
        let volumes: i32[] = [];
        
        if (historyStr.length > 0) {
            const parts = historyStr.split(';');
            if (parts.length >= 2) {
                const priceStr = parts[0];
                const volumeStr = parts[1];
                
                if (priceStr.length > 0) {
                    const priceParts = priceStr.split(',');
                    for (let i = 0; i < priceParts.length; i++) {
                        prices.push(parseInt(priceParts[i]) as i32);
                    }
                }
                
                if (volumeStr.length > 0) {
                    const volumeParts = volumeStr.split(',');
                    for (let i = 0; i < volumeParts.length; i++) {
                        volumes.push(parseInt(volumeParts[i]) as i32);
                    }
                }
            }
        }
        
        // 添加新数据点
        prices.push(dataPoint.price);
        volumes.push(dataPoint.volume);
        
        // 限制历史长度
        if (prices.length > this.MAX_PRICE_HISTORY) {
            prices = prices.slice(prices.length - this.MAX_PRICE_HISTORY);
            volumes = volumes.slice(volumes.length - this.MAX_PRICE_HISTORY);
        }
        
        // 保存更新的历史
        const newPriceStr = prices.join(',');
        const newVolumeStr = volumes.join(',');
        const newHistoryStr = `${newPriceStr};${newVolumeStr}`;
        Storage.set(this.PRICE_HISTORY_KEY, newHistoryStr);
    }
    
    /**
     * 获取价格历史
     */
    static getPriceHistory(): i32[] {
        const historyStr = Storage.get(this.PRICE_HISTORY_KEY);
        if (historyStr.length === 0) return [];
        
        const parts = historyStr.split(';');
        if (parts.length === 0) return [];
        
        const priceStr = parts[0];
        if (priceStr.length === 0) return [];
        
        const priceParts = priceStr.split(',');
        const prices: i32[] = [];
        for (let i = 0; i < priceParts.length; i++) {
            prices.push(parseInt(priceParts[i]) as i32);
        }
        
        return prices;
    }
    
    /**
     * 获取成交量历史
     */
    static getVolumeHistory(): i32[] {
        const historyStr = Storage.get(this.PRICE_HISTORY_KEY);
        if (historyStr.length === 0) return [];
        
        const parts = historyStr.split(';');
        if (parts.length < 2) return [];
        
        const volumeStr = parts[1];
        if (volumeStr.length === 0) return [];
        
        const volumeParts = volumeStr.split(',');
        const volumes: i32[] = [];
        for (let i = 0; i < volumeParts.length; i++) {
            volumes.push(parseInt(volumeParts[i]) as i32);
        }
        
        return volumes;
    }
    
    /**
     * 与ASC进行策略交互
     */
    static interactWithASC(): string {
        const prices = this.getPriceHistory();
        const volumes = this.getVolumeHistory();
        
        if (prices.length < 5) {
            // 如果历史数据不足，生成一些初始数据
            for (let i = 0; i < 10; i++) {
                this.generateMarketData();
            }
            return 'Generating initial market data...';
        }
        
        // 执行活跃策略
        const result = StrategyManager.executeActiveStrategy(prices, volumes);
        
        // 记录交互
        const interactionRecord = `${Context.timestamp()}|${result.signal}|${result.confidence}|${result.state}`;
        this.logInteraction(interactionRecord);
        
        generateEvent(`[VirtualMarket] ASC Interaction: ${result.signal} (confidence: ${result.confidence})`);
        
        return `Strategy: ${result.signal}, Confidence: ${result.confidence}, State: ${result.state}`;
    }
    
    /**
     * 记录交互日志
     */
    private static logInteraction(record: string): void {
        const logStr = Storage.get(this.INTERACTION_LOG_KEY);
        let logs: string[] = [];
        
        if (logStr.length > 0) {
            logs = logStr.split(';;');
        }
        
        logs.push(record);
        
        // 保留最近50条记录
        if (logs.length > 50) {
            logs = logs.slice(logs.length - 50);
        }
        
        Storage.set(this.INTERACTION_LOG_KEY, logs.join(';;'));
    }
    
    /**
     * 获取交互历史
     */
    static getInteractionHistory(): string[] {
        const logStr = Storage.get(this.INTERACTION_LOG_KEY);
        if (logStr.length === 0) return [];
        
        return logStr.split(';;');
    }
    
    /**
     * 模拟市场震荡
     */
    static simulateMarketShock(intensity: f64): void {
        const status = this.getMarketStatus();
        
        // 增加波动率
        status.volatility = Math.min(this.MAX_VOLATILITY, status.volatility * (1 + intensity));
        
        // 产生突然的价格变化
        const shockChange = intensity * (status.currentPrice as f64) * (Math.random() > 0.5 ? 1 : -1);
        const newPrice = Math.max(100, status.currentPrice + (shockChange as i32)) as i32;
        
        // 增加成交量
        const shockVolume = ((status.volume as f64) * (1 + intensity * 2)) as i32;
        
        this.updateMarketStatus(newPrice, shockVolume, shockChange);
        
        generateEvent(`[VirtualMarket] Market shock simulated: ${intensity * 100}% intensity`);
    }
}