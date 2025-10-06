import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Dimensions,
  TouchableOpacity,
} from 'react-native'
import { useTheme } from '@/store/theme/hook'
import { statisticsAPI } from '@/services/api/statistics'

const { width } = Dimensions.get('window')

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

interface SongStats {
  song_id: string
  title: string
  artist: string
  play_count: number
  total_duration: number
  last_played_at: string
}

interface PlayStatisticsScreenProps {
  componentId: string
}

export const PlayStatisticsScreen: React.FC<PlayStatisticsScreenProps> = () => {
  const theme = useTheme()
  const [loading, setLoading] = useState(true)
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
  const [artistStats, setArtistStats] = useState<ArtistStats[]>([])
  const [songStats, setSongStats] = useState<SongStats[]>([])
  const [overallStats, setOverallStats] = useState<any>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30'>('7')

  useEffect(() => {
    loadStatistics()
  }, [])

  const loadStatistics = async () => {
    try {
      const days = selectedPeriod === '7' ? 7 : 30
      const [daily, artists, overall] = await Promise.all([
        statisticsAPI.getDailyStats(days),
        statisticsAPI.getArtistStats(10),
        statisticsAPI.getOverallStats(),
      ])
      setDailyStats(daily)
      setArtistStats(artists)
      setOverallStats(overall)
      
      // 模拟歌曲统计数据（实际项目中需要从API获取）
      setSongStats([
        { song_id: '1', title: '示例歌曲1', artist: '示例歌手1', play_count: 25, total_duration: 750, last_played_at: new Date().toISOString() },
        { song_id: '2', title: '示例歌曲2', artist: '示例歌手2', play_count: 20, total_duration: 600, last_played_at: new Date().toISOString() },
        { song_id: '3', title: '示例歌曲3', artist: '示例歌手3', play_count: 18, total_duration: 540, last_played_at: new Date().toISOString() },
      ])
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
      <View style={[styles.section, { backgroundColor: theme['c-primary-light-100'] + '33' }]}>
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
          selectedPeriod === '7' && { backgroundColor: theme['c-primary-font'] },
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
            { color: selectedPeriod === '7' ? '#fff' : theme['c-font'] },
          ]}
        >
          最近7天
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === '30' && { backgroundColor: theme['c-primary-font'] },
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
            { color: selectedPeriod === '30' ? '#fff' : theme['c-font'] },
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
        <View style={[styles.section, { backgroundColor: theme['c-primary-light-100'] + '33' }]}>
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

    const maxPlays = Math.max(...dailyStats.map(s => s.total_plays))
    const chartHeight = 150
    const displayData = selectedPeriod === '7' ? dailyStats.slice(-7) : dailyStats

    return (
      <View style={[styles.section, { backgroundColor: theme['c-primary-light-100'] + '33' }]}>
        <Text style={[styles.sectionTitle, { color: theme['c-font'] }]}>
          播放趋势
        </Text>
        {renderPeriodSelector()}

        <View style={styles.chartContainer}>
          {displayData.map((stat, index) => {
            const height = (stat.total_plays / maxPlays) * chartHeight
            const date = new Date(stat.date)
            const label = `${date.getMonth() + 1}/${date.getDate()}`

            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: height || 2,
                        backgroundColor: theme['c-primary-font'],
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, { color: theme['c-350'] }]}>
                  {label}
                </Text>
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  const renderArtistRanking = () => {
    if (artistStats.length === 0) {
      return (
        <View style={[styles.section, { backgroundColor: theme['c-primary-light-100'] + '33' }]}>
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
      <View style={[styles.section, { backgroundColor: theme['c-primary-light-100'] + '33' }]}>
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
        <View style={[styles.section, { backgroundColor: theme['c-primary-light-100'] + '33' }]}>
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
      <View style={[styles.section, { backgroundColor: theme['c-primary-light-100'] + '33' }]}>
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
                {song.title}
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
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '80%',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 4,
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
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
