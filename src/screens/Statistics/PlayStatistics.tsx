import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { statisticsAPI, type SongStats as APISongStats } from '@/services/api/statistics'

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

export const PlayStatisticsScreen: React.FC<PlayStatisticsScreenProps> = () => {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [artistStats, setArtistStats] = useState<ArtistStats[]>([])
  const [songStats, setSongStats] = useState<APISongStats[]>([])
  const [overallStats, setOverallStats] = useState<any>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30'>('7')

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const days = selectedPeriod === '7' ? 7 : 30
      const [daily, artists, songs, overall] = await Promise.all([
        statisticsAPI.getDailyStats(days),
        statisticsAPI.getArtistStats(10),
        statisticsAPI.getSongStats(10),
        statisticsAPI.getOverallStats(),
      ])
      setDailyStats(daily)
      setArtistStats(artists)
      setSongStats(songs)
      setOverallStats(overall)
    } catch (error: any) {
      Alert.alert('错误', error.message)
    } finally {
      setLoading(false)
    }
  }

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
          setLoading(true)
          loadStatistics()
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
          setLoading(true)
          loadStatistics()
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
    
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - days + 1)

    const filledData: DailyStats[] = []
    const statsMap = new Map(dailyStats.map(s => [s.date, s]))

    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      const dateStr = formatDate(currentDate)

      filledData.push(statsMap.get(dateStr) || {
        date: dateStr,
        total_plays: 0,
        total_duration: 0,
        unique_songs: 0,
        unique_artists: 0,
      })
    }

    console.log('[PlayStatistics] ========== 开始渲染图表 ==========')
    console.log('[PlayStatistics] 原始数据长度:', dailyStats.length)
    console.log('[PlayStatistics] 原始数据:', JSON.stringify(dailyStats))
    console.log('[PlayStatistics] 填充后数据:', filledData.map(d => `${d.date}: ${d.total_plays}`).join(', '))

    // 如果最大值太小，设置一个最小刻度以便更好地显示
    const maxPlays = Math.max(...filledData.map(s => s.total_plays), 5)
    console.log('[PlayStatistics] maxPlays:', maxPlays)
    const chartHeight = 150
    const pointWidth = 50
    const chartWidth = filledData.length * pointWidth
    const paddingLeft = 35
    const paddingBottom = 50

    // 计算今天的索引，用于初始滚动位置
    const todayStr = formatDate(endDate)
    const todayIndex = filledData.findIndex(d => d.date === todayStr)
    
    console.log('[PlayStatistics] 图表参数:', { 
      days, 
      maxPlays, 
      chartWidth, 
      chartHeight,
      todayIndex, 
      todayStr,
      dataCount: filledData.length 
    })

    // 计算有数据的天数
    const daysWithData = filledData.filter(d => d.total_plays > 0).length
    
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
          播放趋势
        </Text>
        {renderPeriodSelector()}
        
        {daysWithData < 3 && (
          <Text style={{ fontSize: 12, color: theme['c-350'], marginBottom: 8, fontStyle: 'italic' }}>
            💡 继续使用应用，积累更多播放数据后，趋势图会更加丰富
          </Text>
        )}

        <View style={{ marginTop: 10, marginHorizontal: -16, overflow: 'hidden' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: paddingLeft, paddingRight: 20 }}
          >
            <View style={{ 
              width: chartWidth, 
              height: chartHeight + paddingBottom + 20,
              backgroundColor: 'transparent'
            }}>
              {/* Y轴参考线 */}
              {[1, 0.75, 0.5, 0.25, 0].map((ratio, i) => (
                <View
                  key={`grid-${i}`}
                  style={{
                    position: 'absolute',
                    left: 0,
                    width: chartWidth,
                    bottom: ratio * chartHeight + paddingBottom,
                    height: 1,
                    backgroundColor: i === 4 ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)',
                  }}
                />
              ))}

              {/* Y轴标签 */}
              <Text
                style={{
                  position: 'absolute',
                  left: -30,
                  bottom: chartHeight + paddingBottom - 8,
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: theme['c-350'],
                }}
              >
                {maxPlays}
              </Text>
              <Text
                style={{
                  position: 'absolute',
                  left: -30,
                  bottom: chartHeight * 0.5 + paddingBottom - 8,
                  fontSize: 10,
                  color: theme['c-350'],
                }}
              >
                {Math.floor(maxPlays / 2)}
              </Text>
              <Text
                style={{
                  position: 'absolute',
                  left: -18,
                  bottom: paddingBottom - 8,
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: theme['c-350'],
                }}
              >
                0
              </Text>

              {/* 绘制折线路径 */}
              {filledData.map((stat, index) => {
                if (index === filledData.length - 1) return null

                const x1 = index * pointWidth + pointWidth / 2
                const y1 = (stat.total_plays / maxPlays) * chartHeight
                const nextStat = filledData[index + 1]
                const x2 = (index + 1) * pointWidth + pointWidth / 2
                const y2 = (nextStat.total_plays / maxPlays) * chartHeight

                const dx = x2 - x1
                const dy = y2 - y1
                const length = Math.sqrt(dx * dx + dy * dy)
                const angle = Math.atan2(dy, dx) * (180 / Math.PI)

                console.log(`[Line ${index}] from (${x1}, ${y1}) to (${x2}, ${y2}), length: ${length}, angle: ${angle}`)

                return (
                  <View
                    key={`line-${index}`}
                    style={{
                      position: 'absolute',
                      left: x1,
                      bottom: paddingBottom + y1,
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
                const y = (stat.total_plays / maxPlays) * chartHeight
                const date = new Date(stat.date)
                const isToday = stat.date === todayStr
                const dayOfMonth = date.getDate()

                console.log(`[Point ${index}] ${dayOfMonth}: plays=${stat.total_plays}, x=${x}, y=${y}`)

                return (
                  <View key={`point-${index}`}>
                    {/* 数据点 */}
                    <View
                      style={{
                        position: 'absolute',
                        left: x - 6,
                        bottom: paddingBottom + y - 6,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#FF8C42',
                        borderWidth: 3,
                        borderColor: '#FFF',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        elevation: 3,
                      }}
                    />

                    {/* 数据标注（在点上方） */}
                    <Text
                      style={{
                        position: 'absolute',
                        left: x - 20,
                        bottom: paddingBottom + y + 12,
                        width: 40,
                        textAlign: 'center',
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: '#FF8C42',
                      }}
                    >
                      {stat.total_plays}
                    </Text>

                    {/* X轴日期标签 */}
                    <Text
                      style={{
                        position: 'absolute',
                        left: x - 20,
                        bottom: 5,
                        width: 40,
                        textAlign: 'center',
                        fontSize: 11,
                        color: isToday ? '#FF8C42' : theme['c-350'],
                        fontWeight: isToday ? 'bold' : 'normal',
                      }}
                    >
                      {dayOfMonth}
                    </Text>

                    {/* 今天标记 */}
                    {isToday && (
                      <View
                        style={{
                          position: 'absolute',
                          left: x - 20,
                          bottom: -15,
                          width: 40,
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            color: '#FF8C42',
                            fontWeight: 'bold',
                          }}
                        >
                          今天
                        </Text>
                      </View>
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

        {songStats.map((song, index) => (
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
      {renderOverallStats()}
      {renderDailyChart()}
      {renderArtistRanking()}
      {renderSongRanking()}
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
