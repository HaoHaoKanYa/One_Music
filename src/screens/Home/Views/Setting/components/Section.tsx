import { View, TouchableOpacity } from 'react-native'
import { useState } from 'react'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import Text from '@/components/common/Text'


interface Props {
  title: string
  children: React.ReactNode | React.ReactNode[]
}

export default ({ title, children }: Props) => {
  const theme = useTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.titleContainer}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <Text style={{ ...styles.title, borderLeftColor: theme['c-primary'] }} size={16}>{title}</Text>
        <Text size={18} color={theme['c-font']}>
          {isExpanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.content}>
          {children}
        </View>
      )}
    </View>
  )
}


const styles = createStyle({
  container: {
    marginBottom: 10,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingRight: 10,
  },
  title: {
    borderLeftWidth: 5,
    paddingLeft: 12,
    flex: 1,
  },
  content: {
    paddingTop: 5,
  },
})
