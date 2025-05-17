import { useEffect, useState } from 'react';
import { 
  Grid, 
  Typography, 
  Card, 
  CardContent,
  IconButton,
  CircularProgress,
  Alert,
  LinearProgress,
  Button,
  Skeleton
} from '@mui/material';
import { 
  Book as CourseIcon,
  Schedule as ClockIcon,
  EmojiEvents as AchievementIcon,
  Menu as MenuIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import DataCard from '../components/DataCard';
import UserMenu from '../components/UserMenu';
import { fetchLearningStats, fetchOngoingCourses, fetchRecommendations } from '../api/learning';
import OngoingCoursesCard from '../components/OngoingCoursesCard';
import { Box } from '@mui/material';

// 新增骨架屏组件
const DashboardSkeleton = () => (
  <div style={{ maxWidth: 1440, margin: '0 auto' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
      <Box>
        <Skeleton variant="text" width={300} height={50} />
        <Skeleton variant="text" width={200} height={30} />
      </Box>
      <Skeleton variant="circular" width={40} height={40} />
    </Box>
    
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card variant="outlined">
          <CardContent>
            <Skeleton variant="text" width={200} height={40} />
            {[...Array(2)].map((_, i) => (
              <Box key={i} sx={{ mt: 2 }}>
                <Skeleton variant="rectangular" height={100} />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12} md={4}>
        <Grid container spacing={2}>
          {[...Array(3)].map((_, i) => (
            <Grid item xs={12} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
    
    <Box sx={{ mt: 3 }}>
      <Skeleton variant="rectangular" height={200} />
    </Box>
  </div>
);

// 新增错误提示组件
const ErrorAlert = ({ error, onRetry }) => (
  <Alert 
    severity="error" 
    action={
      <Button 
        color="inherit" 
        size="small"
        startIcon={<RefreshIcon />}
        onClick={onRetry}
      >
        重试
      </Button>
    }
    sx={{ mb: 3 }}
  >
    数据加载失败: {error}
  </Alert>
);

const RecommendCourseItem = ({ course }) => (
  <Card variant="outlined" sx={{ 
    height: 120,
    display: 'flex',
    alignItems: 'center',
    padding: 2,
    transition: 'all 0.3s',
    '&:hover': {
      boxShadow: 3,
      transform: 'translateY(-3px)'
    }
  }}>
    <CardContent>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        {course?.title || '新课程'}
      </Typography>
      <Typography variant="caption" color="textSecondary">
        {course?.category || '推荐课程'}
      </Typography>
    </CardContent>
  </Card>
);

const Dashboard = ({ sidebarCollapsed, setIsSidebarCollapsed }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [ongoingCourses, setOngoingCourses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState({
    stats: true,
    courses: true,
    recs: true
  });
  const [errors, setErrors] = useState({
    stats: null,
    courses: null,
    recs: null
  });

  // 默认值配置
  const defaultStats = {
    completed_courses: 0,
    dailyStudy: 0,
    weeklyGoal: 600,
    totalTime: 0,
    dailyGoal: 120
  };

  // 安全合并统计数据
  const safeStats = {
    ...defaultStats,
    ...stats,
    coursesCompleted: stats?.coursesCompleted ?? defaultStats.coursesCompleted,
    dailyStudy: stats?.dailyStudy ?? defaultStats.dailyStudy,
    totalTime: stats?.totalTime ?? defaultStats.totalTime
  };

  const {
    coursesCompleted,
    dailyStudy,
    weeklyGoal,
    totalTime,
    dailyGoal
  } = safeStats;

  const weeklyProgress = weeklyGoal > 0 
    ? Math.min((dailyStudy / weeklyGoal) * 100, 100)
    : 0;

  const loadData = async () => {
    try {
      setErrors({ stats: null, courses: null, recs: null });
      
      // 独立加载每个数据源
      try {
        const statsRes = await fetchLearningStats(user.userId);
        //console.log("已学时长:",statsRes)
        setStats(statsRes);
      } catch (err) {
        console.error('统计加载失败:', err);
        setErrors(prev => ({ ...prev, stats: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, stats: false }));
      }

      try {
        const coursesRes = await fetchOngoingCourses(user.userId);
        setOngoingCourses(Array.isArray(coursesRes) ? coursesRes : []);
      } catch (err) {
        console.error('课程加载失败:', err);
        setErrors(prev => ({ ...prev, courses: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, courses: false }));
      }

      try {
        const recRes = await fetchRecommendations(user.userId);
        setRecommendations(Array.isArray(recRes) ? recRes : []);
      } catch (err) {
        console.error('推荐加载失败:', err);
        setErrors(prev => ({ ...prev, recs: err.message }));
      } finally {
        setLoading(prev => ({ ...prev, recs: false }));
      }

    } catch (err) {
      console.error('未知错误:', err);
    }
  };

  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
      return;
    }
    loadData();
  }, [user]);

  if (Object.values(loading).some(v => v)) {
    return <DashboardSkeleton />;
  }

  return (    
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      {/* 错误提示区域 */}
      {Object.values(errors).map((error, i) => error && (
        <ErrorAlert 
          key={i} 
          error={error} 
          onRetry={loadData} 
        />
      ))}

      {/* 头部区域 */}
      <div style={{ 
        marginBottom: 32,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <IconButton 
            onClick={() => setIsSidebarCollapsed(!sidebarCollapsed)}
            sx={{ 
              display: { xs: 'flex', md: 'none' },
              color: 'text.primary'
            }}
          >
            <MenuIcon />
          </IconButton>
          <div>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              {user ? `欢迎回来，${user.user_name}！` : '正在加载...'}
            </Typography>
            <Typography color="textSecondary" sx={{ fontSize: 18 }}>
              今日建议学习时长：{dailyGoal}分钟
            </Typography>
          </div>
        </div>
        <UserMenu />
      </div>

      {/* 主体内容 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          {errors.courses ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              课程加载失败，请稍后重试
            </Alert>
          ) : (
            <OngoingCoursesCard 
              courses={ongoingCourses}
              title="进行中的课程"
              emptyMessage={
                <Alert severity="info">
                  还没有进行中的课程，立即去<Button href="/courses">选课</Button>开始学习吧！
                </Alert>
              }
            />
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Grid container spacing={4.2}>
            <Grid item xs={12}>
              <DataCard
                title="已学课程"
                value={`${coursesCompleted} 门`}
                icon={<CourseIcon fontSize="medium" />}
                color="#4CAF50"
                error={errors.stats}
              />
            </Grid>
            <Grid item xs={12}>
              <DataCard
                title="今日已学"
                value={`${dailyStudy} 分钟`}
                subValue={`本周目标 ${weeklyGoal} 分钟`}
                icon={<ClockIcon fontSize="medium" />}
                color="#2196F3"
                progress={weeklyProgress}
                error={errors.stats}
              />
            </Grid>
            <Grid item xs={12}>
              <DataCard
                title="学习总时长"
                value={`${totalTime} 分钟`}
                icon={<AchievementIcon fontSize="medium" />}
                color="#FFC107"
                error={errors.stats}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* 推荐课程 */}
      <Card sx={{ 
        mt: 3,
        borderRadius: 3,
        boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            为你推荐
          </Typography>
          {errors.recs ? (
            <Alert severity="warning">
              推荐课程加载失败，<Button onClick={loadData}>点击重试</Button>
            </Alert>
          ) : recommendations.length > 0 ? (
            <Grid container spacing={2}>
              {recommendations.map((course, index) => (
                <Grid item xs={12} sm={6} md={4} key={course.materialId || `rec-${index}`}>
                  <RecommendCourseItem course={course} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              还没有学习记录，完成课程后获取个性化推荐！
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;