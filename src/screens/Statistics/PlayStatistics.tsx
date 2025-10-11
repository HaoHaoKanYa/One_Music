import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { withObservables } from '@nozbe/watermelondb/react'
import { Q } from '@nozbe/watermelondb'
import { database } from '@/database'
import { RequireAuth } from '@/components/common/RequireAuth'

interface DailyStats {
  date: string
  total_plays: number
  total_duration: number
  unique_songs: number
  unique_artists: number
}

interface ArtistStats {
  artist: string
  play_count: number
  total_duration: number
  last_played_at: string
}

// 使用API中的SongStats类型

interface PlayStatisticsScreenProps {
  componentId: string
}

const PlayStatisticsScreenComponent: React.FC<PlayStatisticsScreenProps & {
  playHistory: any[]
  playStatistics: any[]
  artistPlayStats: any[]
  dailyPlayStats: any[]
  favorites: any[]
  playlists: any[]
}> = ({ componentId, playHistory, favorites, playlists }) => {
  const theme = useTheme()
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30'>('7')

  // 计算统计数据
  const overallStats = {
    total_plays: playHistory?.length || 0,
    total_duration: playHistory?.reduce((sum, record) => sum + (record.playDuration || 0), 0) || 0,
    unique_songs: new Set(playHistory?.map(record => record.songId)).size || 0,
    unique_artists: new Set(playHistory?.map(record => record.artist)).size || 0,
    total_favorites: favorites?.length || 0,
    total_playlists: playlists?.length || 0
  }

  // 从播放历史计算每日统计
  const dailyStats = React.useMemo(() => {
    console.log('[PlayStatistics] ========== 开始计算每日统计 ==========')
    console.log('[PlayStatistics] 播放历史数量:', playHistory?.length || 0)

    if (!playHistory || playHistory.length === 0) {
      console.log('[PlayStatistics] 播放历史为空，返回空数组')
      return []
    }

    // 打印前几条播放历史数据
    if (playHistory.length > 0) {
      console.log('[PlayStatistics] 播放历史示例数据（前3条）:')
      playHistory.slice(0, 3).forEach((record: any, idx: number) => {
        console.log(`  [${idx}] songName: ${record.songName}, playedAt: ${record.playedAt}, playDuration: ${record.playDuration}`)
      })
    }

    const dailyMap = new Map<string, DailyStats>()
    const songsByDate = new Map<string, Set<string>>()
    const artistsByDate = new Map<string, Set<string>>()

    playHistory.forEach((record: any) => {
      // 确保 playedAt 是有效的日期
      const playedAt = record.playedAt
      if (!playedAt) {
        console.log('[PlayStatistics] 跳过无效记录（无playedAt）:', record)
        return
      }

      const date = new Date(playedAt)
      if (isNaN(date.getTime())) {
        console.log('[PlayStatistics] 跳过无效日期:', playedAt)
        return
      }

      // 使用本地时间格式化日期，避免时区问题
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          date: dateStr,
          total_plays: 0,
          total_duration: 0,
          unique_songs: 0,
          unique_artists: 0
        })
        songsByDate.set(dateStr, new Set())
        artistsByDate.set(dateStr, new Set())
      }

      const stat = dailyMap.get(dateStr)!
      stat.total_plays++
      stat.total_duration += record.playDuration || 0

      // 记录唯一歌曲和歌手
      if (record.songId) {
        songsByDate.get(dateStr)!.add(record.songId)
      }
      if (record.artist) {
        artistsByDate.get(dateStr)!.add(record.artist)
      }
    })

    // 更新唯一歌曲和歌手数量
    dailyMap.forEach((stat, dateStr) => {
      stat.unique_songs = songsByDate.get(dateStr)?.size || 0
      stat.unique_artists = artistsByDate.get(dateStr)?.size || 0
    })

    const result = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    console.log('[PlayStatistics] 每日统计结果（共', result.length, '天）:')
    result.forEach(d => {
      console.log(`  ${d.date}: ${d.total_plays}次播放, ${d.total_duration}秒, ${d.unique_songs}首歌, ${d.unique_artists}位歌手`)
    })

    return result
  }, [playHistory])

  // 从播放历史计算歌手统计
  const artistStats = React.useMemo(() => {
    console.log('[PlayStatistics] 计算歌手统计，播放历史数量:', playHistory?.length || 0)

    if (!playHistory || playHistory.length === 0) {
      console.log('[PlayStatistics] 播放历史为空，返回空数组')
      return []
    }

    const artistMap = new Map<string, ArtistStats>()

    playHistory.forEach((record: any) => {
      const artist = record.artist || '未知歌手'

      if (!artistMap.has(artist)) {
        artistMap.set(artist, {
          artist,
          play_count: 0,
          total_duration: 0,
          last_played_at: record.playedAt
        })
      }

      const stat = artistMap.get(artist)!
      stat.play_count++
      stat.total_duration += record.playDuration || 0

      // 更新最后播放时间
      if (new Date(record.playedAt) > new Date(stat.last_played_at)) {
        stat.last_played_at = record.playedAt
      }
    })

    // 按播放次数排序，取前10
    const result = Array.from(artistMap.values())
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 10)

    console.log('[PlayStatistics] 歌手统计结果:', result.map(a => `${a.artist}: ${a.play_count}次`).join(', '))

    return result
  }, [playHistory])

  // 从播放历史计算歌曲统计
  const songStats = React.useMemo(() => {
    if (!playHistory || playHistory.length === 0) return []

    const songMap = new Map<string, any>()

    playHistory.forEach((record: any) => {
      const songId = record.songId

      if (!songMap.has(songId)) {
        songMap.set(songId, {
          song_id: songId,
          song_name: record.songName,
          artist: record.artist,
          play_count: 0,
          total_duration: 0,
          last_played_at: record.playedAt
        })
      }

      const stat = songMap.get(songId)!
      stat.play_count++
      stat.total_duration += record.playDuration || 0

      // 更新最后播放时间
      if (new Date(record.playedAt) > new Date(stat.last_played_at)) {
        stat.last_played_at = record.playedAt
      }
    })

    // 按播放次数排序，取前10
    return Array.from(songMap.values())
      .sort((a, b) => b.play_count - a.play_count)
      .slice(0, 10)
  }, [playHistory])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`
    }
    return `${minutes}分钟`
  }

  const renderOverallStats = () => {
    if (!overallStats) return null

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>总体统计</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme['c-primary-font'] }]}>
              {overallStats.total_plays}
            </Text>
            <Text style={[styles.statLabel, { color: theme['c-350'] }]}>总播放次数</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme['c-primary-font'] }]}>
              {formatDuration(overallStats.total_duration)}
            </Text>
            <Text style={[styles.statLabel, { color: theme['c-350'] }]}>总播放时长</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme['c-primary-font'] }]}>
              {overallStats.total_favorites}
            </Text>
            <Text style={[styles.statLabel, { color: theme['c-350'] }]}>收藏歌曲</Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme['c-primary-font'] }]}>
              {overallStats.total_playlists}
            </Text>
            <Text style={[styles.statLabel, { color: theme['c-350'] }]}>创建歌单</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === '7' && styles.periodButtonActive,
        ]}
        onPress={() => {
          setSelectedPeriod('7')
        }}
      >
        <Text
          style={[
            styles.periodButtonText,
            selectedPeriod === '7' && styles.periodButtonTextActive,
          ]}
        >
          最近7天
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === '30' && styles.periodButtonActive,
        ]}
        onPress={() => {
          setSelectedPeriod('30')
        }}
      >
        <Text
          style={[
            styles.periodButtonText,
            selectedPeriod === '30' && styles.periodButtonTextActive,
          ]}
        >
          最近30天
        </Text>
      </TouchableOpacity>
    </View>
  )

  const renderDailyChart = () => {
    console.log('[PlayStatistics] ========== 开始渲染图表 ==========')
    console.log('[PlayStatistics] dailyStats 原始数据长度:', dailyStats.length)

    // 填充缺失的日期，确保连续性，以今天为结束日期
    const days = selectedPeriod === '7' ? 7 : 30
    const today = new Date()

    // 使用本地日期字符串，避免时区问题
    const formatDate = (date: Date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    // 设置日期范围：从 startDate 到 endDate（今天）
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - days + 1)

    console.log('[PlayStatistics] 日期范围:', formatDate(startDate), '到', formatDate(endDate))

    // 创建日期到统计数据的映射
    const statsMap = new Map(dailyStats.map(s => [s.date, s]))
    console.log('[PlayStatistics] statsMap keys:', Array.from(statsMap.keys()).join(', '))

    // 填充所有日期，包括没有数据的日期
    const filledData: DailyStats[] = []
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      const dateStr = formatDate(currentDate)

      const existingStat = statsMap.get(dateStr)
      filledData.push(existingStat || {
        date: dateStr,
        total_plays: 0,
        total_duration: 0,
        unique_songs: 0,
        unique_artists: 0,
      })
    }

    console.log('[PlayStatistics] 填充后数据（共', filledData.length, '天）:')
    filledData.forEach(d => {
      console.log(`  ${d.date}: ${d.total_plays}次`)
    })

    // 计算Y轴刻度：根据数据自适应
    const maxPlays = Math.max(...filledData.map(s => s.total_plays), 1)
    console.log('[PlayStatistics] 最大播放次数:', maxPlays)

    // 计算合适的Y轴最大值和刻度间隔
    const calculateYAxisScale = (maxValue: number) => {
      if (maxValue <= 5) return { max: 5, step: 1 }
      if (maxValue <= 10) return { max: 10, step: 2 }
      if (maxValue <= 20) return { max: 20, step: 5 }
      if (maxValue <= 50) return { max: 50, step: 10 }
      if (maxValue <= 100) return { max: 100, step: 20 }
      if (maxValue <= 200) return { max: 200, step: 50 }
      if (maxValue <= 500) return { max: 500, step: 100 }
      // 对于更大的值，向上取整到最近的100
      const roundedMax = Math.ceil(maxValue / 100) * 100
      return { max: roundedMax, step: roundedMax / 5 }
    }

    const yAxisScale = calculateYAxisScale(maxPlays)
    const yAxisMax = yAxisScale.max
    const yAxisStep = yAxisScale.step
    const yAxisTicks = Array.from({ length: Math.floor(yAxisMax / yAxisStep) + 1 }, (_, i) => i * yAxisStep)

    console.log('[PlayStatistics] Y轴配置: max=', yAxisMax, ', step=', yAxisStep, ', ticks=', yAxisTicks)

    const chartHeight = 150
    const pointWidth = 50
    const chartWidth = filledData.length * pointWidth
    const paddingLeft = 35
    const paddingBottom = 50

    // 计算今天的索引
    const todayStr = formatDate(endDate)
    const todayIndex = filledData.findIndex(d => d.date === todayStr)

    console.log('[PlayStatistics] 图表参数: chartWidth=', chartWidth, ', chartHeight=', chartHeight, ', todayIndex=', todayIndex, ', todayStr=', todayStr)

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
          播放趋势
        </Text>
        {renderPeriodSelector()}

        <View style={{ marginTop: 16, marginHorizontal: -16, overflow: 'hidden' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: paddingLeft, paddingRight: 20 }}
          >
            <View style={{
              width: chartWidth,
              height: chartHeight + paddingBottom + 40,
              backgroundColor: 'transparent'
            }}>
              {/* Y轴参考线和标签 */}
              {yAxisTicks.map((value) => {
                // 从顶部计算：value越大，top越小（越靠上），加20px顶部边距
                const top = 20 + chartHeight - (value / yAxisMax) * chartHeight

                return (
                  <View key={`grid-${value}`}>
                    {/* 网格线 */}
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        top: top,
                        height: value === 0 ? 2 : 1,
                        backgroundColor: value === 0 ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)',
                      }}
                    />
                    {/* Y轴标签 */}
                    <Text
                      style={{
                        position: 'absolute',
                        left: -28,
                        top: top - 8,
                        fontSize: 11,
                        color: theme['c-350'],
                        fontWeight: value === 0 || value === yAxisMax ? 'bold' : 'normal',
                      }}
                    >
                      {value}
                    </Text>
                  </View>
                )
              })}



              {/* 绘制折线路径 */}
              {filledData.map((stat, index) => {
                if (index === filledData.length - 1) return null

                const x1 = index * pointWidth + pointWidth / 2
                const y1Ratio = stat.total_plays / yAxisMax
                const top1 = 20 + chartHeight - (y1Ratio * chartHeight)

                const nextStat = filledData[index + 1]
                const x2 = (index + 1) * pointWidth + pointWidth / 2
                const y2Ratio = nextStat.total_plays / yAxisMax
                const top2 = 20 + chartHeight - (y2Ratio * chartHeight)

                const dx = x2 - x1
                const dy = top2 - top1
                const length = Math.sqrt(dx * dx + dy * dy)
                const angle = Math.atan2(dy, dx) * (180 / Math.PI)

                if (index < 3) {
                  console.log(`[折线 ${index}→${index + 1}] ${stat.date}(${stat.total_plays}次)→${nextStat.date}(${nextStat.total_plays}次): from (${x1.toFixed(1)}, ${top1.toFixed(1)}) to (${x2.toFixed(1)}, ${top2.toFixed(1)}), length=${length.toFixed(1)}, angle=${angle.toFixed(1)}°`)
                }

                return (
                  <View
                    key={`line-${index}`}
                    style={{
                      position: 'absolute',
                      left: x1,
                      top: top1,
                      width: length,
                      height: 3,
                      backgroundColor: '#FF8C42',
                      transformOrigin: 'left center',
                      transform: [{ rotate: `${angle}deg` }],
                    }}
                  />
                )
              })}

              {/* 数据点和标签 */}
              {filledData.map((stat, index) => {
                const x = index * pointWidth + pointWidth / 2
                const yRatio = stat.total_plays / yAxisMax
                const top = 20 + chartHeight - (yRatio * chartHeight)
                const date = new Date(stat.date)
                const isToday = stat.date === todayStr
                const dayOfMonth = date.getDate()

                if (index < 3 || stat.total_plays > 0) {
                  console.log(`[数据点 ${index}] ${stat.date}(${dayOfMonth}日): plays=${stat.total_plays}, yRatio=${yRatio.toFixed(3)}, x=${x.toFixed(1)}, top=${top.toFixed(1)}`)
                }

                return (
                  <View key={`point-${index}`}>
                    {/* 数据点 */}
                    <View
                      style={{
                        position: 'absolute',
                        left: x - 6,
                        top: top - 6,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#FF8C42',
                        borderWidth: 3,
                        borderColor: '#FFF',
                        elevation: 3,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                      }}
                    />

                    {/* 数据标注（在点上方） */}
                    {stat.total_plays > 0 && (
                      <Text
                        style={{
                          position: 'absolute',
                          left: x + 10,
                          top: top - 8,
                          fontSize: 12,
                          fontWeight: 'bold',
                          color: '#FF8C42',
                        }}
                      >
                        {stat.total_plays}
                      </Text>
                    )}

                    {/* X轴日期标签 */}
                    <Text
                      style={{
                        position: 'absolute',
                        left: x - 15,
                        top: 20 + chartHeight + 10,
                        width: 30,
                        textAlign: 'center',
                        fontSize: 12,
                        color: isToday ? '#FF8C42' : theme['c-350'],
                        fontWeight: isToday ? 'bold' : 'normal',
                      }}
                    >
                      {dayOfMonth}
                    </Text>

                    {/* 今天标记 */}
                    {isToday && (
                      <Text
                        style={{
                          position: 'absolute',
                          left: x - 15,
                          top: 20 + chartHeight + 28,
                          width: 30,
                          textAlign: 'center',
                          fontSize: 9,
                          color: '#FF8C42',
                          fontWeight: 'bold',
                        }}
                      >
                        今天
                      </Text>
                    )}
                  </View>
                )
              })}
            </View>
          </ScrollView>
        </View>
      </View>
    )
  }

  const renderArtistRanking = () => {
    if (artistStats.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
            最常听的歌手 Top 10
          </Text>
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme['c-350'] }]}>
              暂无歌手数据
            </Text>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
          最常听的歌手 Top 10
        </Text>

        {artistStats.map((artist, index) => (
          <View key={index} style={styles.artistItem}>
            <View style={styles.rankBadge}>
              <Text style={[styles.rankNumber, { color: theme['c-primary-font'] }]}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.artistAvatar}>
              <Text style={styles.avatarText}>
                {artist.artist.charAt(0)}
              </Text>
            </View>
            <View style={styles.artistInfo}>
              <Text style={[styles.artistName, { color: theme['c-font'] }]}>
                {artist.artist}
              </Text>
              <Text style={[styles.artistStats, { color: theme['c-350'] }]}>
                播放{artist.play_count}次 · {formatDuration(artist.total_duration)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    )
  }

  const renderSongRanking = () => {
    if (songStats.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
            最常听的歌曲 Top 10
          </Text>
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: theme['c-350'] }]}>
              暂无歌曲数据
            </Text>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
          最常听的歌曲 Top 10
        </Text>

        {songStats.map((song: any, index: number) => (
          <View key={index} style={styles.artistItem}>
            <View style={styles.rankBadge}>
              <Text style={[styles.rankNumber, { color: theme['c-primary-font'] }]}>
                {index + 1}
              </Text>
            </View>
            {song.cover_url ? (
              <Image source={{ uri: song.cover_url }} style={styles.songCover} />
            ) : (
              <View style={styles.songCoverPlaceholder}>
                <Text style={styles.coverText}>♪</Text>
              </View>
            )}
            <View style={styles.artistInfo}>
              <Text style={[styles.artistName, { color: theme['c-font'] }]} numberOfLines={1}>
                {song.song_name}
              </Text>
              <Text style={[styles.artistStats, { color: theme['c-350'] }]} numberOfLines={1}>
                {song.artist} · 播放{song.play_count}次
              </Text>
            </View>
          </View>
        ))}
      </View>
    )
  }

  return (
    <RequireAuth componentId={componentId}>
      <ScrollView
        style={[styles.container, { backgroundColor: theme['c-content-background'] }]}
        contentContainerStyle={styles.content}
      >
        {renderOverallStats()}
        {renderDailyChart()}
        {renderArtistRanking()}
        {renderSongRanking()}
      </ScrollView>
    </RequireAuth>
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
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  chartScrollView: {
    marginHorizontal: -16,
  },
  lineChartContainer: {
    position: 'relative',
    marginVertical: 8,
  },
  gridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  linePathContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  linePath: {
    position: 'absolute',
    height: 2,
    transformOrigin: 'left center',
  },
  dataPoint: {
    position: 'absolute',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  pointLabel: {
    fontSize: 10,
    marginTop: 8,
  },
  pointValue: {
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 2,
  },
  artistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  rankBadge: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  artistAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  songCover: {
    width: 48,
    height: 48,
    borderRadius: 6,
    marginRight: 12,
  },
  songCoverPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  coverText: {
    fontSize: 24,
    color: '#999',
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  artistStats: {
    fontSize: 12,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  periodButtonActive: {
    backgroundColor: '#4A90E2',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  emptyChart: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
  },
})

// 使用withObservables包装组件，实现响应式数据
const PlayStatisticsScreen = withObservables([], () => ({
  playHistory: database.get('play_history')
    .query()
    .observe(),
  playStatistics: database.get('play_statistics')
    .query()
    .observe(),
  artistPlayStats: database.get('artist_play_stats')
    .query()
    .observe(),
  dailyPlayStats: database.get('daily_play_stats')
    .query()
    .observe(),
  favorites: database.get('favorites')
    .query()
    .observe(),
  playlists: database.get('playlists')
    .query(Q.where('is_deleted', false))
    .observe()
}))(PlayStatisticsScreenComponent)

export { PlayStatisticsScreen }
