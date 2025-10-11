import { memo } from 'react'
import { View, TouchableOpacity } from 'react-native'

import Section from '../components/Section'

import { createStyle } from '@/utils/tools'
import { useTheme } from '@/store/theme/hook'
import { useI18n } from '@/lang'
import Text from '@/components/common/Text'
import { showPactModal } from '@/core/common'

export default memo(() => {
  const theme = useTheme()
  const t = useI18n()

  const openPactModal = () => {
    showPactModal()
  }

  return (
    <Section title={t('setting_about')}>
      {/* 标题 */}
      <View style={styles.centerPart}>
        <Text style={styles.titleText}>One_Music 软件使用说明</Text>
      </View>

      {/* 一、品牌定位与致谢 */}
      <View style={styles.part}>
        <Text style={styles.sectionTitle}>一、One_Music 品牌定位与致谢</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>One_Music Mobile 是由我们为了打造更专业的音乐播放工具，核心目标是为每一位用户打造更优质、更流畅的音乐聆听体验。在此特别感谢原作者 lyswhut（落雪无痕）及其团队，其在音乐工具开发领域的经验为 One_Music 的优化提供了重要参考。</Text>
      </View>

      {/* 二、免费属性与官方渠道声明 */}
      <View style={styles.part}>
        <Text style={styles.sectionTitle}>二、One_Music 免费属性与官方渠道声明</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>One_Music 全程坚持<Text style={styles.boldText}>免费提供服务</Text>，任何以付费形式售卖 "One_Music" 相关产品的行为均未获得官方授权。若您不慎通过付费渠道获取，建议立即申请退款，并对该违规渠道进行反馈，维护自身权益。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>目前 One_Music 唯一官方原始发布渠道<Text style={styles.boldText}>仅为公众号【壹来了】</Text>，无其他官方代码发布平台或应用分发渠道。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>请注意：<Text style={styles.boldText}>所有手机应用商店中出现的 "One_Music" 相关应用，均为非官方假冒产品</Text>；请警惕各类虚假账号的诈骗行为。</Text>
      </View>

      {/* 三、数据来源与音源规则 */}
      <View style={styles.part}>
        <Text style={styles.sectionTitle}>三、One_Music 数据来源与音源规则</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}><Text style={styles.boldText}>数据获取说明：</Text>使用 One_Music 过程中涉及的各官方平台在线数据，均从对应平台公开服务器拉取（与未登录状态下通过该平台官方 APP 获取的数据完全一致），仅经过简单筛选与合并后呈现。对于此类数据的合法性、准确性，One_Music 不承担相关责任。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}><Text style={styles.boldText}>音源获取规则：</Text>One_Music 本身不自带音频数据获取功能，也无任何内置音源资源，属于无内置内容的工具载体。使用过程中所需的在线音频数据，均来自软件设置内用户"自定义源"选项所选择的来源。</Text>
      </View>

      {/* 四、版权保护与数据处理要求 */}
      <View style={styles.part}>
        <Text style={styles.sectionTitle}>四、One_Music 版权保护与数据处理要求</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}><Text style={styles.boldText}>版权数据处理：</Text>使用 One_Music 可能会产生涉及版权的相关数据，One_Music 不拥有该类数据的所有权。为避免产生侵权风险，每位使用者需在该类数据产生后的 <Text style={styles.boldText}>24 小时内完成清除操作</Text>。</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}><Text style={styles.boldText}>正版呼吁：</Text>音乐平台的内容建设与运营需投入大量成本，One_Music 在此倡导所有用户尊重音乐版权，主动选择正版音乐服务，共同维护健康的音乐生态。</Text>
      </View>

      {/* 五、免责声明 */}
      <View style={styles.part}>
        <Text style={styles.sectionTitle}>五、One_Music 免责声明</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>因使用 One_Music 引发的各类损害（包括但不限于商誉损失、设备停工、计算机故障导致的经济赔偿，以及其他商业领域的损害或损失），无论损害性质为直接、间接、特殊、偶然或结果性，均由使用者自行承担全部责任，One_Music 开发团队不承担相关责任。</Text>
      </View>

      {/* 六、使用协议接受条款 */}
      <View style={styles.part}>
        <Text style={styles.sectionTitle}>六、One_Music 使用协议接受条款</Text>
      </View>
      <View style={styles.part}>
        <Text style={styles.text}>若您选择下载、安装并使用 One_Music，即视为您已完整阅读、充分理解并自愿接受本说明中的所有条款，包括但不限于免费属性、渠道规则、版权要求及免责声明。</Text>
      </View>

      {/* 署名 */}
      <View style={styles.rightPart}>
        <Text style={styles.text}>By: </Text>
        <Text style={styles.boldText}>One_Music</Text>
      </View>
    </Section>
  )
})

const styles = createStyle({
  part: {
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  centerPart: {
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightPart: {
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlignVertical: 'bottom',
    marginBottom: 5,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlignVertical: 'bottom',
    marginTop: 5,
    marginBottom: 3,
  },
  text: {
    fontSize: 14,
    textAlignVertical: 'bottom',
  },
  boldText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlignVertical: 'bottom',
  },
  throughText: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    textAlignVertical: 'bottom',
  },
  btn: {
    flexDirection: 'row',
  },
})
