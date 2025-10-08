/**
 * 冲突解决器
 * 实现智能的冲突解决策略
 */
import { database } from '../index'
import { Q } from '@nozbe/watermelondb'

export interface ConflictResolutionStrategy {
  // 启动时策略：服务器优先
  onStartup: 'server' | 'local' | 'timestamp'
  // 用户操作后策略：本地优先  
  afterUserAction: 'server' | 'local' | 'timestamp'
  // 时间戳比较策略
  timestampComparison: boolean
}

export class ConflictResolver {
  private strategy: ConflictResolutionStrategy = {
    onStartup: 'server',        // 启动时服务器优先
    afterUserAction: 'local',  // 用户操作后本地优先
    timestampComparison: true   // 启用时间戳比较
  }

  /**
   * 解决数据冲突
   * @param localData 本地数据
   * @param serverData 服务器数据
   * @param context 上下文（启动时/用户操作后）
   */
  async resolveConflict(
    localData: any,
    serverData: any,
    context: 'startup' | 'user_action'
  ): Promise<any> {
    // 如果没有冲突，直接返回
    if (!this.hasConflict(localData, serverData)) {
      return serverData || localData
    }

    const strategy = context === 'startup' 
      ? this.strategy.onStartup 
      : this.strategy.afterUserAction

    switch (strategy) {
      case 'server':
        console.log(`[ConflictResolver] 使用服务器优先策略 (${context})`)
        return serverData

      case 'local':
        console.log(`[ConflictResolver] 使用本地优先策略 (${context})`)
        return localData

      case 'timestamp':
        return this.resolveByTimestamp(localData, serverData)

      default:
        return serverData
    }
  }

  /**
   * 检查是否存在冲突
   */
  private hasConflict(localData: any, serverData: any): boolean {
    if (!localData || !serverData) return false
    
    // 比较关键字段
    const keyFields = ['name', 'content', 'description', 'title']
    for (const field of keyFields) {
      if (localData[field] !== serverData[field]) {
        return true
      }
    }
    
    return false
  }

  /**
   * 基于时间戳解决冲突
   */
  private resolveByTimestamp(localData: any, serverData: any): any {
    if (!this.strategy.timestampComparison) {
      return serverData
    }

    const localTime = new Date(localData.updatedAt || localData.createdAt).getTime()
    const serverTime = new Date(serverData.updated_at || serverData.created_at).getTime()

    if (localTime > serverTime) {
      console.log('[ConflictResolver] 本地数据更新，使用本地数据')
      return localData
    } else {
      console.log('[ConflictResolver] 服务器数据更新，使用服务器数据')
      return serverData
    }
  }

  /**
   * 合并数据（用于复杂冲突）
   */
  async mergeData(localData: any, serverData: any): Promise<any> {
    const merged = { ...serverData }
    
    // 保留本地的重要字段
    const localFields = ['synced', 'local_created_at']
    for (const field of localFields) {
      if (localData[field] !== undefined) {
        merged[field] = localData[field]
      }
    }

    // 使用较新的时间戳
    const localTime = new Date(localData.updatedAt || localData.createdAt).getTime()
    const serverTime = new Date(serverData.updated_at || serverData.created_at).getTime()
    
    if (localTime > serverTime) {
      merged.updated_at = localData.updatedAt
    }

    return merged
  }

  /**
   * 设置冲突解决策略
   */
  setStrategy(strategy: Partial<ConflictResolutionStrategy>) {
    this.strategy = { ...this.strategy, ...strategy }
    console.log('[ConflictResolver] 冲突解决策略已更新:', this.strategy)
  }

  /**
   * 获取当前策略
   */
  getStrategy(): ConflictResolutionStrategy {
    return { ...this.strategy }
  }
}

// 创建全局冲突解决器实例
export const conflictResolver = new ConflictResolver()
