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

    return (
      <View
        key={plan.id}
        style={[
          styles.planCard,
          isSvip ? styles.svipCard : styles.vipCard,
        ]}
      >
        {/* 装饰性背景元素 */}
        {isSvip && (
          <View style={styles.decorCircle1} />
        )}
        {isSvip && (
          <View style={styles.decorCircle2} />
        )}

        <View style={styles.planHeader}>
          <View style={styles.planTitleRow}>
            <Text style={[styles.planName, isSvip && styles.svipPlanName]}>
              {plan.name}
            </Text>
            {isSvip && (
              <View style={styles.crownIcon}>
                <Text style={styles.crownEmoji}>👑</Text>
              </View>
            )}
          </View>
          {isSvip && (
            <View style={styles.recommendBadge}>
              <Text style={styles.badgeText}>✨ 推荐</Text>
            </View>
          )}
        </View>

        <View style={styles.priceContainer}>
          <View style={styles.priceRow}>
            <Text style={styles.priceSymbol}>¥</Text>
            <Text style={[styles.price, isSvip && styles.svipPrice]}>
              {plan.price}
            </Text>
            <Text style={styles.pricePeriod}>/{plan.duration}天</Text>
          </View>
          {plan.original_price && (
            <View style={styles.discountTag}>
              <Text style={styles.originalPrice}>
                原价¥{plan.original_price}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {features.quality && (
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, isSvip && styles.svipFeatureIcon]}>
                <Icon name="music_time" size={18} color={isSvip ? '#FFD700' : '#4A90E2'} />
              </View>
              <Text style={[styles.featureText, isSvip && styles.svipFeatureText]}>
                {features.quality === 'lossless' ? '🎵 无损音质' : '高品质音质'}
              </Text>
            </View>
          )}
          {features.download && (
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, isSvip && styles.svipFeatureIcon]}>
                <Icon name="download-2" size={18} color={isSvip ? '#FFD700' : '#4A90E2'} />
              </View>
              <Text style={[styles.featureText, isSvip && styles.svipFeatureText]}>
                ⬇️ 无限下载
              </Text>
            </View>
          )}
          {features.ad_free && (
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, isSvip && styles.svipFeatureIcon]}>
                <Icon name="remove" size={18} color={isSvip ? '#FFD700' : '#4A90E2'} />
              </View>
              <Text style={[styles.featureText, isSvip && styles.svipFeatureText]}>
                🚫 无广告体验
              </Text>
            </View>
          )}
          {features.exclusive && (
            <View style={styles.featureItem}>
              <View style={[styles.featureIcon, isSvip && styles.svipFeatureIcon]}>
                <Icon name="love" size={18} color={isSvip ? '#FFD700' : '#4A90E2'} />
              </View>
              <Text style={[styles.featureText, isSvip && styles.svipFeatureText]}>
                ⭐ 专属内容
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
            {purchasing ? '处理中...' : isSvip ? '立即开通尊享会员' : '立即购买'}
          </Text>
        </TouchableOpacity>
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
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  vipCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E3F2FD',
  },
  svipCard: {
    backgroundColor: '#1A1A2E',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  decorCircle1: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#FFD700',
    opacity: 0.1,
    top: -50,
    right: -50,
  },
  decorCircle2: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFA500',
    opacity: 0.08,
    bottom: -30,
    left: -30,
  },
  planHeader: {
    marginBottom: 20,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  svipPlanName: {
    color: '#FFD700',
    fontSize: 26,
  },
  crownIcon: {
    marginLeft: 8,
  },
  crownEmoji: {
    fontSize: 24,
  },
  recommendBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFD700',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1A1A2E',
  },
  priceContainer: {
    marginBottom: 24,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  priceSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 4,
  },
  price: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#1A1A2E',
    letterSpacing: -1,
  },
  svipPrice: {
    color: '#FFD700',
  },
  pricePeriod: {
    fontSize: 16,
    color: '#999',
    marginLeft: 4,
  },
  discountTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
  },
  originalPrice: {
    fontSize: 14,
    color: '#FF6B6B',
    textDecorationLine: 'line-through',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  svipFeatureIcon: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  svipFeatureText: {
    color: '#E8E8E8',
  },
  purchaseButton: {
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    shadowColor: '#4A90E2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  svipPurchaseButton: {
    backgroundColor: '#FFD700',
    shadowColor: '#FFD700',
  },
  purchaseButtonText: {
    fontSize: 17,
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
