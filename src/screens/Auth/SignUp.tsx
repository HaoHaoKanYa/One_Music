import React, { useState } from 'react'
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
  ScrollView,
  Image,
} from 'react-native'
import { Navigation } from 'react-native-navigation'
import { supabase } from '../../lib/supabase'
import { SIGN_IN_SCREEN } from '@/navigation/screenNames'

const appLogo = require('@/theme/themes/images/one_logo.png')

interface SignUpScreenProps {
  componentId: string
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ componentId }) => {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const validateInputs = () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('错误', '请填写所有字段')
      return false
    }

    if (username.length < 2 || username.length > 50) {
      Alert.alert('错误', '用户名长度必须在 2-50 个字符之间')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('错误', '请输入有效的邮箱地址')
      return false
    }

    if (password.length < 8) {
      Alert.alert('错误', '密码长度至少为 8 个字符')
      return false
    }

    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      Alert.alert('错误', '密码必须包含字母和数字')
      return false
    }

    if (password !== confirmPassword) {
      Alert.alert('错误', '两次输入的密码不一致')
      return false
    }

    return true
  }

  const handleSignUp = async () => {
    if (!validateInputs()) return

    setLoading(true)

    try {
      // 注册用户（触发器会自动创建profile和settings）
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: username,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('注册失败')

      Alert.alert(
        '注册成功',
        '请查看您的邮箱以验证账号',
        [
          {
            text: '确定',
            onPress: () => {
              Navigation.dismissModal(componentId)
            },
          },
        ]
      )
    } catch (error: any) {
      Alert.alert('注册失败', error.message)
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrength = () => {
    if (password.length < 8) return { text: '弱', color: '#F44336' }

    let strength = 0
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[!@#$%^&*]/.test(password)) strength++

    if (strength >= 3 && password.length >= 12) {
      return { text: '强', color: '#4CAF50' }
    } else if (strength >= 2 && password.length >= 8) {
      return { text: '中', color: '#FF9800' }
    }
    return { text: '弱', color: '#F44336' }
  }

  const passwordStrength = password ? getPasswordStrength() : null

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image source={appLogo} style={styles.logo} />
          <Text style={styles.appName}>One Music</Text>
        </View>

        <Text style={styles.title}>创建账号</Text>
        <Text style={styles.subtitle}>注册以开始使用</Text>

        {/* Username */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="用户名"
            placeholderTextColor="#9E9E9E"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        {/* Email */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="邮箱"
            placeholderTextColor="#9E9E9E"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="密码（至少8位，包含字母和数字）"
            placeholderTextColor="#9E9E9E"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />
          {passwordStrength && (
            <View style={styles.strengthContainer}>
              <View style={styles.strengthBar}>
                <View
                  style={[
                    styles.strengthFill,
                    {
                      width:
                        passwordStrength.text === '强'
                          ? '100%'
                          : passwordStrength.text === '中'
                            ? '66%'
                            : '33%',
                      backgroundColor: passwordStrength.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                {passwordStrength.text}
              </Text>
            </View>
          )}
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="确认密码"
            placeholderTextColor="#9E9E9E"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>注册</Text>
          )}
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>已有账号？ </Text>
          <TouchableOpacity
            onPress={() => {
              Navigation.dismissModal(componentId)
              setTimeout(() => {
                Navigation.showModal({
                  stack: {
                    children: [{
                      component: {
                        name: SIGN_IN_SCREEN,
                        options: {
                          topBar: {
                            title: { text: '登录' },
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
              }, 300)
            }}
            disabled={loading}
          >
            <Text style={styles.footerLink}>立即登录</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 24,
    paddingTop: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    height: 56,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
