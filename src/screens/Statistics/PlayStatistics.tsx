import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
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
    if (dailyStats.length === 0) {
      return (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
            播放趋势
          </Text>
          {renderPeriodSelector()}
          <View style={styles.emptyChart}>
            <Text style={[styles.emptyText, { color: theme['c-350'] }]}>
              暂无播放数据
            </Text>
          </View>
        </View>
      )
    }

    // 填充缺失的日期，确保连续性
    const days = selectedPeriod === '7' ? 7 : 30
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days + 1)
    
    const filledData: DailyStats[] = []
    const statsMap = new Map(dailyStats.map(s => [s.date, s]))
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(startDate.getDate() + i)
      const dateStr = currentDate.toISOString().split('T')[0]
      
      filledData.push(statsMap.get(dateStr) || {
        date: dateStr,
        total_plays: 0,
        total_duration: 0,
        unique_songs: 0,
        unique_artists: 0,
      })
    }

    const maxPlays = Math.max(...filledData.map(s => s.total_plays), 1)
    const chartHeight = 140
    const pointWidth = 50 // 每个点的宽度
    const chartWidth = Math.max(filledData.length * pointWidth, 300)

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
          播放趋势
        </Text>
        {renderPeriodSelector()}

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.chartScrollView}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          <View style={[styles.lineChartContainer, { width: chartWidth, height: chartHeight + 40 }]}>
            {/* Y轴参考线 */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
              <View
                key={`line-${i}`}
                style={[
                  styles.gridLine,
                  {
                    bottom: ratio * chartHeight + 30,
                    width: chartWidth,
                  },
                ]}
              />
            ))}

            {/* 折线图路径 */}
            <View style={styles.linePathContainer}>
              {filledData.map((stat, index) => {
                if (index === 0) return null
                
                const prevStat = filledData[index - 1]
                const x1 = (index - 1) * pointWidth + pointWidth / 2
                const y1 = chartHeight - (prevStat.total_plays / maxPlays) * chartHeight
                const x2 = index * pointWidth + pointWidth / 2
                const y2 = chartHeight - (stat.total_plays / maxPlays) * chartHeight
                
                const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
                const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)
                
                return (
                  <View
                    key={`line-${index}`}
                    style={[
                      styles.linePath,
                      {
                        width: length,
                        left: x1,
                        bottom: y1 + 30,
                        transform: [{ rotate: `${angle}deg` }],
                        backgroundColor: theme['c-primary-font'],
                      },
                    ]}
                  />
                )
              })}
            </View>

            {/* 数据点和标签 */}
            {filledData.map((stat, index) => {
              const x = index * pointWidth
              const y = chartHeight - (stat.total_plays / maxPlays) * chartHeight
              const date = new Date(stat.date)
              const label = `${date.getMonth() + 1}/${date.getDate()}`

              return (
                <View
                  key={index}
                  style={[
                    styles.dataPoint,
                    {
                      left: x + pointWidth / 2 - 4,
                      bottom: y + 30 - 4,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor: stat.total_plays > 0 ? theme['c-primary-font'] : '#CCC',
                      },
                    ]}
                  />
                  <Text style={[styles.pointLabel, { color: theme['c-350'] }]}>
                    {label}
                  </Text>
                  {stat.total_plays > 0 && (
                    <Text style={[styles.pointValue, { color: theme['c-primary-font'] }]}>
                      {stat.total_plays}
                    </Text>
                  )}
                </View>
              )
            })}
          </View>
        </ScrollView>
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
            <View style={[styles.rankContainer, { backgroundColor: theme['c-primary-font'] + '20' }]}>
              <Text style={[styles.rank, { color: theme['c-primary-font'] }]}>
                {index + 1}
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
            <View style={[styles.rankContainer, { backgroundColor: theme['c-primary-font'] + '20' }]}>
              <Text style={[styles.rank, { color: theme['c-primary-font'] }]}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.artistInfo}>
              <Text style={[styles.artistName, { color: theme['c-font'] }]}>
                {song.song_name}
              </Text>
              <Text style={[styles.artistStats, { color: theme['c-350'] }]}>
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
  },
  rankContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
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
