import React, { useEffect, useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    Image,
    Platform,
} from 'react-native'
import { Navigation } from 'react-native-navigation'
import { launchImageLibrary } from 'react-native-image-picker'
import { supabase } from '../../lib/supabase'

interface EditProfileScreenProps {
    componentId: string
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ componentId }) => {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [username, setUsername] = useState('')
    const [displayName, setDisplayName] = useState('')
    const [bio, setBio] = useState('')
    const [location, setLocation] = useState('')
    const [website, setWebsite] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('未登录')

            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single()

            if (error) throw error

            setUsername(data.username)
            setDisplayName(data.display_name || '')
            setBio(data.bio || '')
            setLocation(data.location || '')
            setWebsite(data.website || '')
            setAvatarUrl(data.avatar_url || '')
        } catch (error: any) {
            Alert.alert('错误', error.message)
        } finally {
            setLoading(false)
        }
    }

    const pickImage = async () => {
        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 1000,
                maxHeight: 1000,
                includeBase64: false,
                selectionLimit: 1,
            })

            if (result.didCancel) {
                return
            }

            if (result.errorCode) {
                Alert.alert('错误', result.errorMessage || '选择图片失败')
                return
            }

            if (result.assets && result.assets[0]) {
                const asset = result.assets[0]
                if (asset.uri) {
                    await uploadAvatar(asset.uri, asset.fileName || 'avatar.jpg', asset.type || 'image/jpeg')
                }
            }
        } catch (error: any) {
            Alert.alert('错误', error.message)
        }
    }

    const uploadAvatar = async (uri: string, fileName: string, mimeType: string) => {
        setUploading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('未登录')

            // 创建唯一文件名
            const fileExt = fileName.split('.').pop() || 'jpg'
            const timestamp = Date.now()
            const filePath = `${user.id}/avatar_${timestamp}.${fileExt}`

            // 读取文件
            const response = await fetch(uri)
            const blob = await response.blob()

            // 上传到 Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, blob, {
                    contentType: mimeType,
                    cacheControl: '3600',
                    upsert: true,
                })

            if (uploadError) throw uploadError

            // 获取公开 URL
            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // 删除旧头像（如果存在）
            if (avatarUrl) {
                try {
                    const oldPath = avatarUrl.split('/avatars/')[1]
                    if (oldPath) {
                        await supabase.storage.from('avatars').remove([oldPath])
                    }
                } catch (e) {
                    console.log('删除旧头像失败:', e)
                }
            }

            setAvatarUrl(data.publicUrl)
            Alert.alert('成功', '头像上传成功')
        } catch (error: any) {
            Alert.alert('上传失败', error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert('错误', '请输入显示名称')
            return
        }

        setSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('未登录')

            const { error } = await supabase
                .from('user_profiles')
                .update({
                    display_name: displayName.trim(),
                    bio: bio.trim(),
                    location: location.trim(),
                    website: website.trim(),
                    avatar_url: avatarUrl,
                })
                .eq('user_id', user.id)

            if (error) throw error

            Navigation.dismissModal(componentId)
            setTimeout(() => {
                Alert.alert('成功', '资料已更新')
            }, 300)
        } catch (error: any) {
            Alert.alert('保存失败', error.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
            </View>
        )
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} disabled={uploading}>
                        {avatarUrl ? (
                            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {displayName?.[0] || username[0]}
                                </Text>
                            </View>
                        )}
                        {uploading && (
                            <View style={styles.uploadingOverlay}>
                                <ActivityIndicator color="#fff" />
                            </View>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity onPress={pickImage} disabled={uploading}>
                        <Text style={styles.changeAvatarText}>
                            {uploading ? '上传中...' : '更换头像'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Username (不可编辑) */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>用户名</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled]}
                        value={username}
                        editable={false}
                    />
                    <Text style={styles.hint}>用户名不可修改</Text>
                </View>

                {/* Display Name */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>显示名称 *</Text>
                    <TextInput
                        style={styles.input}
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="输入显示名称"
                        maxLength={100}
                    />
                </View>

                {/* Bio */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>个人简介</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="介绍一下自己..."
                        multiline
                        numberOfLines={4}
                        maxLength={500}
                    />
                    <Text style={styles.hint}>{bio.length}/500</Text>
                </View>

                {/* Location */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>所在地</Text>
                    <TextInput
                        style={styles.input}
                        value={location}
                        onChangeText={setLocation}
                        placeholder="例如：北京"
                        maxLength={100}
                    />
                </View>

                {/* Website */}
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>个人网站</Text>
                    <TextInput
                        style={styles.input}
                        value={website}
                        onChangeText={setWebsite}
                        placeholder="https://..."
                        keyboardType="url"
                        autoCapitalize="none"
                        maxLength={255}
                    />
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.saveButtonText}>保存</Text>
                    )}
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => Navigation.dismissModal(componentId)}
                    disabled={saving}
                >
                    <Text style={styles.cancelButtonText}>取消</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 24,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 40,
        color: '#fff',
        fontWeight: 'bold',
    },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    changeAvatarText: {
        marginTop: 12,
        color: '#2196F3',
        fontSize: 16,
        fontWeight: '600',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#212121',
        marginBottom: 8,
    },
    input: {
        height: 48,
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#212121',
    },
    inputDisabled: {
        backgroundColor: '#EEEEEE',
        color: '#9E9E9E',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
        textAlignVertical: 'top',
    },
    hint: {
        fontSize: 12,
        color: '#9E9E9E',
        marginTop: 4,
    },
    saveButton: {
        height: 48,
        backgroundColor: '#2196F3',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    cancelButtonText: {
        color: '#757575',
        fontSize: 16,
    },
})
