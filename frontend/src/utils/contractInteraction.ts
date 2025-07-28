/**
 * Contract Interaction Utilities
 * 与智能合约交互的工具函数
 */

import * as massa from '@massalabs/massa-web3';
import { Args } from '@massalabs/as-types';

// 策略类型枚举（与合约保持一致）
export enum StrategyType {
    MULTI_THREAD_ATTENTION = 0,
    MEAN_REVERSION = 1
}

// 合约地址（从环境变量或addresses.json获取）
export const getContractAddresses = () => {
    return {
        main: 'AS12FWRKui3k2T8pi7pjF4KxUnueGWixnj85kn9j9EXADt6NvAXY1',
        threads: [
            'AS12Pm77Wf5pVkhvXGcGeMKXdm5HssgkWvFRC1xPVDtrrygQgaeXw',
            'AS1Xo9XY1kxQD8Mqxri82JNxk97PXPazLZnnnD4foBUjBVMwL2AW',
            'AS124TYaaap2mH3ZgPyhkTATNhS9X4kHY8tqqxe2FLAJZ8awJFaMZ'
        ],
        vault: 'AS12shXJLaEJiv8da5Bc35b5xq9r9szkar9i3BtnMMKnd2fjJHGad',
        dex: 'AS12Da1qWr1ndnTZrkr38DeWeoH5gFcRcqnripYhKy7UkPggX72ME'
    };
};

// 合约交互结果类型
export interface ContractResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface MarketStatus {
    currentPrice: number;
    priceChange: number;
    volume: number;
    volatility: number;
    trend: string;
    lastUpdate: number;
}

export interface StrategyResult {
    state: number;
    confidence: number;
    signal: string;
}

export interface InteractionRecord {
    timestamp: number;
    signal: string;
    confidence: number;
    state: number;
}

/**
 * 合约交互类
 */
export class ContractInteraction {
    private provider: any;
    private account: any;
    private addresses = getContractAddresses();

    constructor(provider: any, account: any) {
        this.provider = provider;
        this.account = account;
    }

    /**
     * 切换策略
     */
    async switchStrategy(strategyType: StrategyType): Promise<ContractResult<boolean>> {
        try {
            const contract = new massa.SmartContract(this.provider, this.addresses.main);
            const args = new Args();
            args.add(strategyType as number);

            await contract.call('switchStrategy', args, {
                coins: massa.Mas.fromString('0.01')
            });

            return { success: true, data: true };
        } catch (error) {
            console.error('Switch strategy failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to switch strategy'
            };
        }
    }

    /**
     * 获取活跃策略
     */
    async getActiveStrategy(): Promise<ContractResult<{ type: StrategyType; name: string }>> {
        try {
            const contract = new massa.SmartContract(this.provider, this.addresses.main);
            const result = await contract.read('getActiveStrategy', new Args());

            const args = new Args(result);
            const strategyType = args.nextU8().expect('Strategy type expected') as StrategyType;
            const strategyName = args.nextString().expect('Strategy name expected');

            return {
                success: true,
                data: { type: strategyType, name: strategyName }
            };
        } catch (error) {
            console.error('Get active strategy failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get active strategy'
            };
        }
    }

    /**
     * 获取可用策略列表
     */
    async getAvailableStrategies(): Promise<ContractResult<string[]>> {
        try {
            const contract = new massa.SmartContract(this.provider, this.addresses.main);
            const result = await contract.read('getAvailableStrategies', new Args());

            const args = new Args(result);
            const count = args.nextU8().expect('Strategy count expected');
            const strategies: string[] = [];

            for (let i = 0; i < count; i++) {
                strategies.push(args.nextString().expect(`Strategy ${i} expected`));
            }

            return { success: true, data: strategies };
        } catch (error) {
            console.error('Get available strategies failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get available strategies'
            };
        }
    }

    /**
     * 执行策略
     */
    async executeStrategy(): Promise<ContractResult<StrategyResult>> {
        try {
            const contract = new massa.SmartContract(this.provider, this.addresses.main);
            const result = await contract.call('executeStrategy', new Args(), {
                coins: massa.Mas.fromString('0.01')
            });

            const args = new Args(result);
            const state = args.nextU8().expect('State expected');
            const confidence = args.nextF64().expect('Confidence expected');
            const signal = args.nextString().expect('Signal expected');

            return {
                success: true,
                data: { state, confidence, signal }
            };
        } catch (error) {
            console.error('Execute strategy failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to execute strategy'
            };
        }
    }

    /**
     * 生成虚拟市场数据
     */
    async generateMarketData(): Promise<ContractResult<{ price: number; volume: number; timestamp: number }>> {
        try {
            const contract = new massa.SmartContract(this.provider, this.addresses.main);
            const result = await contract.call('generateMarketData', new Args(), {
                coins: massa.Mas.fromString('0.01')
            });

            const args = new Args(result);
            const price = args.nextI32().expect('Price expected');
            const volume = args.nextI32().expect('Volume expected');
            const timestamp = args.nextU64().expect('Timestamp expected');

            return {
                success: true,
                data: { price, volume, timestamp: Number(timestamp) }
            };
        } catch (error) {
            console.error('Generate market data failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate market data'
            };
        }
    }

    /**
     * 获取虚拟市场状态
     */
    async getVirtualMarketStatus(): Promise<ContractResult<MarketStatus>> {
        try {
            const contract = new massa.SmartContract(this.provider, this.addresses.main);
            const result = await contract.read('getVirtualMarketStatus', new Args());

            const args = new Args(result);
            const currentPrice = args.nextI32().expect('Current price expected');
            const priceChange = args.nextF64().expect('Price change expected');
            const volume = args.nextI32().expect('Volume expected');
            const volatility = args.nextF64().expect('Volatility expected');
            const trend = args.nextString().expect('Trend expected');
            const lastUpdate = args.nextU64().expect('Last update expected');

            return {
                success: true,
                data: {
                    currentPrice,
                    priceChange,
                    volume,
                    volatility,
                    trend,
                    lastUpdate: Number(lastUpdate)
                }
            };
        } catch (error) {
            console.error('Get virtual market status failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get virtual market status'
            };
        }
    }

    /**
     * 获取价格历史
     */
    async getPriceHistory(): Promise<ContractResult<number[]>> {
        try {
            const contract = new massa.SmartContract(this.provider, this.addresses.main);
            const result = await contract.read('getPriceHistory', new Args());

            const args = new Args(result);
            const count = args.nextU8().expect('Price count expected');
            const prices: number[] = [];

            for (let i = 0; i < count; i++) {
                prices.push(args.nextI32().expect(`Price ${i} expected`));
            }

            return { success: true, data: prices };
        } catch (error) {
            console.error('Get price history failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get price history'
            };
        }
    }

    /**
     * 与虚拟市场交互
     */
    async interactWithVirtualMarket(): Promise<ContractResult<string>> {
        try {
            const contract = new massa.SmartContract(this.provider, this.addresses.main);
            const result = await contract.call('interactWithVirtualMarket', new Args(), {
                coins: massa.Mas.fromString('0.01')
            });

            // 解析字符串结果
            const decoder = new TextDecoder();
            const resultStr = decoder.decode(result);

            return { success: true, data: resultStr };
        } catch (error) {
            console.error('Interact with virtual market failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to interact with virtual market'
            };
        }
    }

    /**
     * 获取交互历史
     */
    async getInteractionHistory(): Promise<ContractResult<InteractionRecord[]>> {
        try {
            const contract = new massa.SmartContract(this.provider, this.addresses.main);
            const result = await contract.read('getInteractionHistory', new Args());

            const args = new Args(result);
            const count = args.nextU8().expect('History count expected');
            const history: InteractionRecord[] = [];

            for (let i = 0; i < count; i++) {
                const record = args.nextString().expect(`History record ${i} expected`);
                const parts = record.split('|');
                if (parts.length >= 4) {
                    history.push({
                        timestamp: parseInt(parts[0]),
                        signal: parts[1],
                        confidence: parseFloat(parts[2]),
                        state: parseInt(parts[3])
                    });
                }
            }

            return { success: true, data: history };
        } catch (error) {
            console.error('Get interaction history failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get interaction history'
            };
        }
    }

    /**
     * 模拟市场震荡
     */
    async simulateMarketShock(intensity: number): Promise<ContractResult<boolean>> {
        try {
            const contract = new massa.SmartContract(this.provider, this.addresses.main);
            const args = new Args();
            args.add(intensity);

            await contract.call('simulateMarketShock', args, {
                coins: massa.Mas.fromString('0.01')
            });

            return { success: true, data: true };
        } catch (error) {
            console.error('Simulate market shock failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to simulate market shock'
            };
        }
    }

    /**
     * 获取系统状态
     */
    async getSystemStatus(): Promise<ContractResult<any>> {
        try {
            const contract = new massa.SmartContract(this.provider, this.addresses.main);
            const result = await contract.read('getSystemStatus', new Args());

            const args = new Args(result);
            const state = args.nextString().expect('State expected');
            const cycleCount = args.nextString().expect('Cycle count expected');
            const decisionCount = args.nextString().expect('Decision count expected');
            const timestamp = args.nextString().expect('Timestamp expected');

            return {
                success: true,
                data: { state, cycleCount, decisionCount, timestamp }
            };
        } catch (error) {
            console.error('Get system status failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get system status'
            };
        }
    }
}