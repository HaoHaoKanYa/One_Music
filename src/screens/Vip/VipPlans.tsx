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
    const isVip = plan.type === 'vip'
    const features = plan.features as any

    return (
      <View
        key={plan.id}
        style={styles.planCard}
      >
        <View style={styles.planHeader}>
          <Text style={[styles.planName, { color: theme['c-font'] }]}>{plan.name}</Text>
          {plan.type === 'svip' && (
            <View style={[styles.badge, { backgroundColor: '#FFD700' }]}>
              <Text style={styles.badgeText}>推荐</Text>
            </View>
          )}
        </View>

        <View style={styles.priceContainer}>
          <Text style={[styles.price, { color: theme['c-primary-font'] }]}>
            ¥{plan.price}
          </Text>
          {plan.original_price && (
            <Text style={[styles.originalPrice, { color: theme['c-350'] }]}>
              ¥{plan.original_price}
            </Text>
          )}
        </View>

        <View style={styles.featuresContainer}>
          {features.quality && (
            <View style={styles.featureItem}>
              <Icon name="music_time" size={16} color={theme['c-primary-font']} />
              <Text style={[styles.featureText, { color: theme['c-font'] }]}>
                {features.quality === 'lossless' ? '无损音质' : '高品质音质'}
              </Text>
            </View>
          )}
          {features.download && (
            <View style={styles.featureItem}>
              <Icon name="download-2" size={16} color={theme['c-primary-font']} />
              <Text style={[styles.featureText, { color: theme['c-font'] }]}>
                下载歌曲
              </Text>
            </View>
          )}
          {features.ad_free && (
            <View style={styles.featureItem}>
              <Icon name="remove" size={16} color={theme['c-primary-font']} />
              <Text style={[styles.featureText, { color: theme['c-font'] }]}>
                无广告
              </Text>
            </View>
          )}
          {features.exclusive && (
            <View style={styles.featureItem}>
              <Icon name="love" size={16} color={theme['c-primary-font']} />
              <Text style={[styles.featureText, { color: theme['c-font'] }]}>
                专属内容
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.purchaseButton}
          onPress={() => handlePurchase(plan)}
          disabled={purchasing}
        >
          <Text style={styles.purchaseButtonText}>
            {purchasing ? '处理中...' : '立即购买'}
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
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 16,
    textDecorationLine: 'line-through',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
  },
  purchaseButton: {
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
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
