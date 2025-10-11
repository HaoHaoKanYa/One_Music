import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native'
import { Navigation } from 'react-native-navigation'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Icon } from '@/components/common/Icon'
import { supabase } from '../../lib/supabase'
import { SIGN_UP_SCREEN, FORGOT_PASSWORD_SCREEN } from '@/navigation/screenNames'

const appLogo = require('@/theme/themes/images/one_logo.png')

interface SignInScreenProps {
  componentId: string
}

const STORAGE_KEYS = {
  REMEMBER_EMAIL: '@remember_email',
  REMEMBER_PASSWORD: '@remember_password',
  AUTO_LOGIN: '@auto_login',
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ componentId }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberAccount, setRememberAccount] = useState(false)
  const [autoLogin, setAutoLogin] = useState(false)

  useEffect(() => {
    loadSavedCredentials()
  }, [])

  const loadSavedCredentials = async () => {
    try {
      const [savedEmail, savedPassword, savedAutoLogin] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL),
        AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_PASSWORD),
        AsyncStorage.getItem(STORAGE_KEYS.AUTO_LOGIN),
      ])

      if (savedEmail) {
        setEmail(savedEmail)
        setRememberAccount(true)
      }

      if (savedPassword) {
        setPassword(savedPassword)
      }

      if (savedAutoLogin === 'true' && savedEmail && savedPassword) {
        setAutoLogin(true)
        // 自动登录
        await performSignIn(savedEmail, savedPassword)
      }
    } catch (error) {
      console.log('加载保存的凭据失败:', error)
    }
  }

  const saveCredentials = async (email: string, password: string) => {
    try {
      if (rememberAccount) {
        await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, email)
        if (autoLogin) {
          await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_PASSWORD, password)
          await AsyncStorage.setItem(STORAGE_KEYS.AUTO_LOGIN, 'true')
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_PASSWORD)
          await AsyncStorage.removeItem(STORAGE_KEYS.AUTO_LOGIN)
        }
      } else {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.REMEMBER_EMAIL,
          STORAGE_KEYS.REMEMBER_PASSWORD,
          STORAGE_KEYS.AUTO_LOGIN,
        ])
      }
    } catch (error) {
      console.log('保存凭据失败:', error)
    }
  }

  const performSignIn = async (loginEmail: string, loginPassword: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (error) throw error

      // 登录成功后，同步用户数据到本地数据库
      if (data.user) {
        await syncUserProfile(data.user.id)
        await syncUserData(data.user.id)
      }

      // 加载收藏列表到内存
      const { loadFavoritesFromDatabase } = require('@/core/list/favoritesIntegration')
      await loadFavoritesFromDatabase()

      // 从本地数据库加载用户歌单到内存
      const { loadPlaylistsFromDatabase } = require('@/core/list/playlistsIntegration')
      await loadPlaylistsFromDatabase()

      // 先关闭Modal，再显示成功提示
      Navigation.dismissModal(componentId)
      setTimeout(() => {
        Alert.alert('成功', '登录成功！')
        // 触发全局事件，刷新UI
        global.app_event.userProfileUpdated()
        global.app_event.favoritesUpdated()
        global.app_event.playlistsUpdated()
        global.app_event.playHistoryUpdated()
      }, 300)
    } catch (error: any) {
      Alert.alert('登录失败', error.message)
      throw error
    }
  }

  const syncUserProfile = async (userId: string) => {
    try {
      // 从云端获取用户资料
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (profileError) {
        console.log('获取用户资料失败:', profileError)
        return
      }

      if (!profileData) return

      // 导入数据库
      const { database } = require('@/database')

      // 检查本地是否已存在该用户资料
      const existingProfiles = await database.get('user_profiles')
        .query()
        .fetch()

      await database.write(async () => {
        if (existingProfiles.length > 0) {
          // 更新现有资料
          const profile = existingProfiles[0]
          await profile.update((record: any) => {
            record.userId = profileData.user_id
            record.username = profileData.username
            record.displayName = profileData.display_name
            record.email = profileData.email
            record.avatarUrl = profileData.avatar_url
            record.bio = profileData.bio
            record.gender = profileData.gender
            record.birthday = profileData.birthday ? new Date(profileData.birthday) : undefined
            record.location = profileData.location
            record.website = profileData.website
            record.totalPlayTime = profileData.total_play_time || 0
            record.totalSongs = profileData.total_songs || 0
            record.totalPlaylists = profileData.total_playlists || 0
            record.followingCount = profileData.following_count || 0
            record.followersCount = profileData.followers_count || 0
            record.isPublic = profileData.is_public !== false
            record.showPlayHistory = profileData.show_play_history !== false
            record.showPlaylists = profileData.show_playlists !== false
            record.vipStatus = profileData.vip_status || 'free'
            record.vipExpireAt = profileData.vip_expire_at ? new Date(profileData.vip_expire_at) : undefined
            record.updatedAt = new Date()
            record.synced = true
          })
        } else {
          // 创建新资料
          await database.get('user_profiles').create((record: any) => {
            record.userId = profileData.user_id
            record.username = profileData.username
            record.displayName = profileData.display_name
            record.email = profileData.email
            record.avatarUrl = profileData.avatar_url
            record.bio = profileData.bio
            record.gender = profileData.gender
            record.birthday = profileData.birthday ? new Date(profileData.birthday) : undefined
            record.location = profileData.location
            record.website = profileData.website
            record.totalPlayTime = profileData.total_play_time || 0
            record.totalSongs = profileData.total_songs || 0
            record.totalPlaylists = profileData.total_playlists || 0
            record.followingCount = profileData.following_count || 0
            record.followersCount = profileData.followers_count || 0
            record.isPublic = profileData.is_public !== false
            record.showPlayHistory = profileData.show_play_history !== false
            record.showPlaylists = profileData.show_playlists !== false
            record.vipStatus = profileData.vip_status || 'free'
            record.vipExpireAt = profileData.vip_expire_at ? new Date(profileData.vip_expire_at) : undefined
            record.createdAt = new Date(profileData.created_at)
            record.updatedAt = new Date()
            record.synced = true
          })
        }
      })

      console.log('[SignIn] 用户资料已同步到本地数据库')
    } catch (error) {
      console.error('[SignIn] 同步用户资料失败:', error)
    }
  }

  const syncUserData = async (userId: string) => {
    try {
      const { database } = require('@/database')

      // 同步收藏
      const { data: favoritesData } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)

      if (favoritesData && favoritesData.length > 0) {
        await database.write(async () => {
          for (const fav of favoritesData) {
            const existing = await database.get('favorites')
              .query()
              .fetch()
            
            const found = existing.find((f: any) => f.songId === fav.song_id)
            
            if (!found) {
              await database.get('favorites').create((record: any) => {
                record.userId = fav.user_id
                record.songId = fav.song_id
                record.songName = fav.song_name
                record.artist = fav.artist
                record.album = fav.album
                record.source = fav.source
                record.createdAt = new Date(fav.created_at)
                record.synced = true
              })
            }
          }
        })
        console.log(`[SignIn] 已同步 ${favoritesData.length} 条收藏`)
      }

      // 同步歌单
      const { data: playlistsData } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', userId)
        .eq('is_deleted', false)

      if (playlistsData && playlistsData.length > 0) {
        await database.write(async () => {
          for (const playlist of playlistsData) {
            const existing = await database.get('playlists')
              .query()
              .fetch()
            
            const found = existing.find((p: any) => p.userId === playlist.user_id && p.name === playlist.name)
            
            if (!found) {
              await database.get('playlists').create((record: any) => {
                record.userId = playlist.user_id
                record.name = playlist.name
                record.description = playlist.description
                record.coverUrl = playlist.cover_url
                record.isPublic = playlist.is_public
                record.songCount = playlist.song_count || 0
                record.playCount = playlist.play_count || 0
                record.likeCount = playlist.like_count || 0
                record.commentCount = playlist.comment_count || 0
                record.isDeleted = false
                record.createdAt = new Date(playlist.created_at)
                record.updatedAt = new Date(playlist.updated_at)
                record.synced = true
              })
            }
          }
        })
        console.log(`[SignIn] 已同步 ${playlistsData.length} 个歌单`)
      }

      console.log('[SignIn] 用户数据同步完成')
    } catch (error) {
      console.error('[SignIn] 同步用户数据失败:', error)
    }
  }

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('错误', '请填写邮箱和密码')
      return
    }

    setLoading(true)

    try {
      await saveCredentials(email, password)
      await performSignIn(email, password)
    } catch (error: any) {
      // 错误已在performSignIn中处理
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    Navigation.showModal({
      stack: {
        children: [{
          component: {
            name: FORGOT_PASSWORD_SCREEN,
            options: {
              topBar: {
                title: { text: '忘记密码' },
                leftButtons: [{
                  id: 'close',
                  text: '关闭',
                }],
              },
            },
          },
        }],
      },
    })
  }

  const handleSignUp = () => {
    Navigation.showModal({
      stack: {
        children: [{
          component: {
            name: SIGN_UP_SCREEN,
            options: {
              topBar: {
                title: { text: '注册' },
                leftButtons: [{
                  id: 'close',
                  text: '关闭',
                }],
              },
            },
          },
        }],
      },
    })
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={appLogo} style={styles.logo} />
          <Text style={styles.appName}>One Music</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>欢迎回来</Text>
        <Text style={styles.subtitle}>登录以继续</Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="邮箱"
            placeholderTextColor="#9E9E9E"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="密码"
            placeholderTextColor="#9E9E9E"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        {/* Options Row: Remember Account, Auto Login, Forgot Password */}
        <View style={styles.optionsRow}>
          {/* Remember Account Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setRememberAccount(!rememberAccount)}
            disabled={loading}
          >
            <Icon
              name={rememberAccount ? "checkbox-marked" : "checkbox-blank-outline"}
              size={18}
              color="#2196F3"
            />
            <Text style={styles.checkboxLabel}>记住账号</Text>
          </TouchableOpacity>

          {/* Auto Login Checkbox */}
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => {
              if (!rememberAccount) {
                Alert.alert('提示', '请先勾选"记住账号"')
                return
              }
              setAutoLogin(!autoLogin)
            }}
            disabled={loading}
          >
            <Icon
              name={autoLogin ? "checkbox-marked" : "checkbox-blank-outline"}
              size={18}
              color="#2196F3"
            />
            <Text style={styles.checkboxLabel}>自动登录</Text>
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text style={styles.forgotPasswordText}>忘记密码？</Text>
          </TouchableOpacity>
        </View>

        {/* Sign In Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>登录</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>或</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>还没有账号？ </Text>
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.footerLink}>立即注册</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 32,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    height: 56,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#212121',
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#757575',
    marginLeft: 6,
  },
  forgotPassword: {
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: '#2196F3',
    fontSize: 13,
  },
  button: {
    height: 56,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#757575',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    color: '#757575',
    fontSize: 16,
  },
  footerLink: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
})
