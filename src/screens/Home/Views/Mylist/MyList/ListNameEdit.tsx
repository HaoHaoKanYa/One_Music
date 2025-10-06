import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import ConfirmAlert, { type ConfirmAlertType } from '@/components/common/ConfirmAlert'
import Text from '@/components/common/Text'
import { View } from 'react-native'
import Input, { type InputType } from '@/components/common/Input'
import { createUserList, updateUserList } from '@/core/list'
import { confirmDialog, createStyle, toast } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import listState from '@/store/list/state'
import { createPlaylistWithSync, updatePlaylistWithSync } from '@/services/playlistSync'

interface NameInputType {
  setName: (text: string) => void
  getText: () => string
  focus: () => void
}
const NameInput = forwardRef<NameInputType, {}>((props, ref) => {
  const theme = useTheme()
  const [text, setText] = useState('')
  const [placeholder, setPlaceholder] = useState('')
  const inputRef = useRef<InputType>(null)

  useImperativeHandle(ref, () => ({
    getText() {
      return text.trim()
    },
    setName(text) {
      setText(text)
      setPlaceholder(text || global.i18n.t('list_create_input_placeholder'))
    },
    focus() {
      inputRef.current?.focus()
    },
  }))

  return (
    <Input
      ref={inputRef}
      placeholder={placeholder}
      value={text}
      onChangeText={setText}
      style={{ ...styles.input, backgroundColor: theme['c-primary-input-background'] }}
    />
  )
})


export interface ListNameEditType {
  showCreate: (position: number) => void
  show: (listInfo: LX.List.UserListInfo) => void
}
const initSelectInfo = {}


export default forwardRef<ListNameEditType, {}>((props, ref) => {
  const alertRef = useRef<ConfirmAlertType>(null)
  const nameInputRef = useRef<NameInputType>(null)
  const [position, setPosition] = useState(0)
  const selectedListInfo = useRef<LX.List.UserListInfo>(initSelectInfo as LX.List.UserListInfo)
  const [visible, setVisible] = useState(false)

  const handleShow = () => {
    alertRef.current?.setVisible(true)
    const name = position == -1 ? '' : (selectedListInfo.current.name ?? '')
    requestAnimationFrame(() => {
      nameInputRef.current?.setName(name)
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 300)
    })
  }
  useImperativeHandle(ref, () => ({
    showCreate(position) {
      setPosition(position)
      if (visible) handleShow()
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow()
        })
      }
    },
    show(listInfo) {
      setPosition(-1)
      selectedListInfo.current = listInfo
      if (visible) handleShow()
      else {
        setVisible(true)
        requestAnimationFrame(() => {
          handleShow()
        })
      }
    },
  }))

  const handleRename = async () => {
    let name = nameInputRef.current?.getText() ?? ''
    if (!name.length) return
    if (name.length > 100) name = name.substring(0, 100)
    
    try {
      if (position == -1) {
        // 更新歌单
        const listId = selectedListInfo.current.id
        if (listId.startsWith('cloud_')) {
          await updatePlaylistWithSync(listId, { name })
        } else {
          await updateUserList([{ ...selectedListInfo.current, name }])
        }
      } else {
        // 创建歌单
        const confirmed = listState.userList.some(l => l.name == name) 
          ? await confirmDialog({ message: global.i18n.t('list_duplicate_tip') })
          : true
        
        if (!confirmed) return
        
        // 创建云端歌单
        await createPlaylistWithSync(name)
      }
      alertRef.current?.setVisible(false)
    } catch (error: any) {
      toast(error.message || '操作失败')
    }
  }

  return (
    visible
      ? <ConfirmAlert
          ref={alertRef}
          onConfirm={handleRename}
        >
          <View style={styles.renameContent}>
            <Text style={{ marginBottom: 5 }}>{ position == -1 ? global.i18n.t('list_rename_title') : global.i18n.t('list_create')}</Text>
            <NameInput ref={nameInputRef} />
          </View>
        </ConfirmAlert>
      : null
  )
})


const styles = createStyle({
  renameContent: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'column',
  },
  input: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 290,
    borderRadius: 4,
    // paddingTop: 2,
    // paddingBottom: 2,
  },
})


