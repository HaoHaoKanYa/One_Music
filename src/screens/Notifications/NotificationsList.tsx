import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native'
import { Navigation } from 'react-native-navigation'
import { Icon } from '@/components/common/Icon'
import { useTheme } from '@/store/theme/hook'
import { notificationsAPI, Notification } from '@/services/api/notifications'

interface NotificationsListScreenProps {
  componentId: string
}

export const NotificationsListScreen: React.FC<NotificationsListScreenProps> = ({ componentId }) => {
  const theme = useTheme()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadNotifications()
    
    // 订阅实时通知
    notificationsAPI.subscribeToNotifications((notification) => {
      setNotifications(prev => [notification, ...prev])
    })

    // 清理函数
    return () => {
      // Supabase会自动清理订阅
    }
  }, [])

  const loadNotifications = async () => {
    try {
      const data = await notificationsAPI.getNotifications(50)
      setNotifications(data)
    } catch (error: any) {
      Alert.alert('错误', error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleNotificationPress = async (notification: Notification) => {
    // 标记为已读
    if (!notification.is_read) {
      try {
        await notificationsAPI.markAsRead(notification.id)
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        )
      } catch (error) {
        console.error('标记已读失败:', error)
      }
    }

    // 根据通知类型跳转
    // TODO: 实现跳转逻辑
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      Alert.alert('成功', '已全部标记为已读')
    } catch (error: any) {
      Alert.alert('错误', error.message)
    }
  }

  const handleDelete = async (notificationId: string) => {
    Alert.alert(
      '确认删除',
      '确定要删除这条通知吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationsAPI.deleteNotification(notificationId)
              setNotifications(prev => prev.filter(n => n.id !== notificationId))
            } catch (error: any) {
              Alert.alert('错误', error.message)
            }
          },
        },
      ]
    )
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow':
        return 'love'
      case 'comment':
        return 'comment'
      case 'like':
        return 'thumbs-up'
      case 'vip_expire':
        return 'help'
      default:
        return 'help'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return date.toLocaleDateString()
  }

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        { backgroundColor: item.is_read ? 'transparent' : theme['c-primary-light-100'] + '20' },
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme['c-primary-font'] + '20' }]}>
        <Icon name={getNotificationIcon(item.type)} size={24} color={theme['c-primary-font']} />
      </View>

      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: theme['c-font'] }]}>{item.title}</Text>
        <Text style={[styles.content, { color: theme['c-350'] }]} numberOfLines={2}>
          {item.content}
        </Text>
        <Text style={[styles.time, { color: theme['c-350'] }]}>{formatTime(item.created_at)}</Text>
      </View>

      {!item.is_read && (
        <View style={[styles.unreadDot, { backgroundColor: theme['c-primary-font'] }]} />
      )}

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id)}
      >
        <Icon name="close" size={16} color={theme['c-350']} />
      </TouchableOpacity>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer]}>
        <ActivityIndicator size="large" color={theme['c-primary-font']} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme['c-content-background'] }]}>
      {notifications.length > 0 && (
        <View style={[styles.header, { backgroundColor: theme['c-primary-light-100'] + '33' }]}>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={[styles.markAllText, { color: theme['c-primary-font'] }]}>
              全部标记为已读
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true)
              loadNotifications()
            }}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="help" size={64} color={theme['c-350']} />
            <Text style={[styles.emptyText, { color: theme['c-350'] }]}>暂无通知</Text>
          </View>
        }
      />
    </View>
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
  header: {
    padding: 12,
    alignItems: 'flex-end',
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  content: {
    fontSize: 14,
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
})
