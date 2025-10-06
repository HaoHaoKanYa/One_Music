import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Navigation } from 'react-native-navigation'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { vipAPI, VipPlan } from '@/services/api/vip'

interface VipPlansScreenProps {
  componentId: string
}

export const VipPlansScreen: React.FC<VipPlansScreenProps> = ({ componentId }) => {
  const theme = useTheme()
  const [plans, setPlans] = useState<VipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const data = await vipAPI.getPlans()
      setPlans(data)
    } catch (error: any) {
      Alert.alert('错误', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (plan: VipPlan) => {
    Alert.alert(
      '确认购买',
      `确定要购买${plan.name}吗？\n价格：¥${plan.price}`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            setPurchasing(true)
            try {
              // 创建订单
              const order = await vipAPI.createOrder(plan.id)

              // 模拟支付
              Alert.alert(
                '选择支付方式',
                '请选择支付方式',
                [
                  {
                    text: '支付宝',
                    onPress: async () => {
                      try {
                        await vipAPI.mockPayment(order.id, 'alipay')
                        Alert.alert('成功', '购买成功！', [
                          {
                            text: '确定',
                            onPress: () => Navigation.dismissModal(componentId),
                          },
                        ])
                      } catch (error: any) {
                        Alert.alert('支付失败', error.message)
                      }
                    },
                  },
                  {
                    text: '微信支付',
                    onPress: async () => {
                      try {
                        await vipAPI.mockPayment(order.id, 'wechat')
                        Alert.alert('成功', '购买成功！', [
                          {
                            text: '确定',
                            onPress: () => Navigation.dismissModal(componentId),
                          },
                        ])
                      } catch (error: any) {
                        Alert.alert('支付失败', error.message)
                      }
                    },
                  },
                  { text: '取消', style: 'cancel' },
                ]
              )
            } catch (error: any) {
              Alert.alert('错误', error.message)
            } finally {
              setPurchasing(false)
            }
          },
        },
      ]
    )
  }

  const renderPlanCard = (plan: VipPlan) => {
    const isSvip = plan.type === 'svip'
    const features = plan.features as any

    // 根据duration_days计算显示单位
    const getPeriodText = (days: number) => {
      if (days === 30) return '月'
      if (days === 90) return '季'
      if (days === 365) return '年'
      return `${days}天`
    }

    return (
      <View
        key={plan.id}
        style={[
          styles.planCard,
          isSvip ? styles.svipCard : styles.vipCard,
        ]}
      >
        {/* 装饰性背景元素 */}
        {isSvip ? (
          <>
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
          </>
        ) : (
          <>
            <View style={styles.vipDecorCircle1} />
            <View style={styles.vipDecorCircle2} />
          </>
        )}

        {/* 左侧：标题和价格 */}
        <View style={styles.leftSection}>
          <View style={styles.planTitleRow}>
            <Text style={[styles.planName, isSvip && styles.svipPlanName]}>
              {plan.name}
            </Text>
            {isSvip && (
              <Text style={styles.crownEmoji}>👑</Text>
            )}
          </View>

          {isSvip && (
            <View style={styles.recommendBadge}>
              <Text style={styles.badgeText}>✨ 推荐</Text>
            </View>
          )}

          <View style={styles.priceContainer}>
            <View style={styles.priceRow}>
              <Text style={[styles.priceSymbol, isSvip && styles.svipText]}>¥</Text>
              <Text style={[styles.price, isSvip && styles.svipPrice]}>
                {plan.price}
              </Text>
              <Text style={[styles.pricePeriod, isSvip && styles.svipText]}>
                /{getPeriodText(plan.duration_days)}
              </Text>
            </View>
            {plan.original_price && (
              <View style={styles.discountTag}>
                <Text style={styles.originalPrice}>
                  原价¥{plan.original_price}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 右侧：功能列表 */}
        <View style={styles.rightSection}>
          <View style={styles.featuresContainer}>
            {features.quality && (
              <View style={styles.featureItem}>
                <Text style={[styles.featureEmoji, isSvip && styles.svipEmoji]}>🎵</Text>
                <Text style={[styles.featureText, isSvip && styles.svipFeatureText]}>
                  {features.quality === 'lossless' ? '无损音质' : '高品质'}
                </Text>
              </View>
            )}
            {features.download && (
              <View style={styles.featureItem}>
                <Text style={[styles.featureEmoji, isSvip && styles.svipEmoji]}>⬇️</Text>
                <Text style={[styles.featureText, isSvip && styles.svipFeatureText]}>
                  无限下载
                </Text>
              </View>
            )}
            {features.ad_free && (
              <View style={styles.featureItem}>
                <Text style={[styles.featureEmoji, isSvip && styles.svipEmoji]}>🚫</Text>
                <Text style={[styles.featureText, isSvip && styles.svipFeatureText]}>
                  无广告
                </Text>
              </View>
            )}
            {features.exclusive && (
              <View style={styles.featureItem}>
                <Text style={[styles.featureEmoji, isSvip && styles.svipEmoji]}>⭐</Text>
                <Text style={[styles.featureText, isSvip && styles.svipFeatureText]}>
                  专属内容
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.purchaseButton, isSvip && styles.svipPurchaseButton]}
            onPress={() => handlePurchase(plan)}
            disabled={purchasing}
          >
            <Text style={styles.purchaseButtonText}>
              {purchasing ? '处理中...' : '立即开通'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={theme['c-primary-font']} />
      </View>
    )
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme['c-content-background'] }]}
      contentContainerStyle={styles.content}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme['c-font'] }]}>
          升级会员，享受更多特权
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme['c-350'] }]}>
          高品质音乐体验，尽在One Music
        </Text>
      </View>

      {plans.map(renderPlanCard)}

      <View style={styles.tipsContainer}>
        <Text style={[styles.tipsTitle, { color: theme['c-font'] }]}>购买说明</Text>
        <Text style={[styles.tipsText, { color: theme['c-350'] }]}>
          • 会员自购买之日起生效{'\n'}
          • 会员到期后自动恢复为普通用户{'\n'}
          • 支持支付宝、微信支付{'\n'}
          • 如有问题请联系客服
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  planCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    minHeight: 180,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  vipCard: {
    backgroundColor: '#F0F8FF',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  svipCard: {
    backgroundColor: '#1A1A2E',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  vipDecorCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4A90E2',
    opacity: 0.08,
    top: -30,
    right: -30,
  },
  vipDecorCircle2: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#5BA3F5',
    opacity: 0.06,
    bottom: -15,
    left: 80,
  },
  decorCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFD700',
    opacity: 0.08,
    top: -40,
    right: -40,
  },
  decorCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFA500',
    opacity: 0.06,
    bottom: -20,
    left: 100,
  },
  leftSection: {
    flex: 1,
    justifyContent: 'space-between',
    paddingRight: 16,
  },
  rightSection: {
    flex: 1,
    justifyContent: 'space-between',
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  planName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginRight: 6,
  },
  svipPlanName: {
    color: '#FFD700',
    fontSize: 24,
  },
  crownEmoji: {
    fontSize: 20,
  },
  recommendBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  priceContainer: {
    marginTop: 'auto',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  priceSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 2,
  },
  price: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A1A2E',
    letterSpacing: -1,
  },
  svipPrice: {
    color: '#FFD700',
  },
  svipText: {
    color: '#FFD700',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#999',
    marginLeft: 2,
  },
  discountTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FFE5E5',
  },
  originalPrice: {
    fontSize: 12,
    color: '#FF6B6B',
    textDecorationLine: 'line-through',
  },
  featuresContainer: {
    flex: 1,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  svipEmoji: {
    opacity: 0.9,
  },
  featureText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
  svipFeatureText: {
    color: '#D8D8D8',
  },
  purchaseButton: {
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    marginTop: 12,
  },
  svipPurchaseButton: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
  },
  purchaseButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  tipsContainer: {
    marginTop: 24,
    padding: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 22,
  },
})
