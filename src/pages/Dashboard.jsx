import { useEffect, useState } from 'react';
import { 
  Grid, 
  Typography, 
  Card, 
  CardContent,
  IconButton,
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material';
import { 
  Book as CourseIcon,
  Schedule as ClockIcon,
  EmojiEvents as AchievementIcon,
  Menu as MenuIcon
  
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import DataCard from '../components/DataCard';
import UserMenu from '../components/UserMenu';
import { fetchLearningStats, fetchOngoingCourses, fetchRecommendations } from '../api/learning';
import OngoingCoursesCard from '../components/OngoingCoursesCard';
import { 
  Box
} from '@mui/material';

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 默认值配置
  const defaultStats = {
    completed_courses: 0,
    dailyStudy: 0,     // 今日学习分钟数
    weeklyGoal: 600,   // 默认周目标600分钟（10小时）
    totalTime: 0,      // 总学习分钟数
    dailyGoal: 120     // 默认每日目标120分钟
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

  useEffect(() => {
    if (!user) {
      window.location.href = '/login';
      return;
    }

    const loadData = async () => {
      try {
        const [statsRes, coursesRes, recRes] = await Promise.all([
          fetchLearningStats(user.userId),
          fetchOngoingCourses(user.userId),
          fetchRecommendations(user.userId)
        ]);
         //console.log("实际展示",statsRes)
        // 数据转换处理
       //console.log("课程信息",coursesRes)
        setStats(statsRes);
        setOngoingCourses(Array.isArray(coursesRes) ? coursesRes : []);
        setRecommendations(Array.isArray(recRes) ? recRes : []);
      } catch (err) {
        console.error('数据加载错误:', err);
        setError(err.message || '数据加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert severity="error">错误: {error}</Alert>
      </div>
    );
  }

  return (
    
    <div style={{ maxWidth: 1440, margin: '0 auto' }}>
      
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

      <Grid container spacing={3} >
        <Grid item xs={12} md={8} >
          <OngoingCoursesCard 
            courses={ongoingCourses}
            title="进行中的课程"
          />
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Grid container spacing={4.2}>
            <Grid item xs={12}>
              <DataCard
                title="已学课程"
                value={`${coursesCompleted} 门`}
                icon={<CourseIcon fontSize="medium" />}
                color="#4CAF50"
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
              />
            </Grid>
            <Grid item xs={12}>
              <DataCard
                title="学习总时长"
                value={`${totalTime} 分钟`}
                icon={<AchievementIcon fontSize="medium" />}
                color="#FFC107"
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Card sx={{ 
        mt: 3,
        borderRadius: 3,
        boxShadow: '0 8px 16px rgba(0,0,0,0.05)'
      }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            为你推荐
          </Typography>
          {recommendations.length > 0 ? (
            <Grid container spacing={2}>
              {recommendations.map((course, index) => (
                <Grid item xs={12} sm={6} md={4} key={course.materialId || `rec-${index}`}>
                  <RecommendCourseItem course={course} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Alert severity="info" sx={{ mt: 2 }}>
              暂无推荐课程，请先完成一些学习记录
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;