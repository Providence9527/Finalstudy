import { 
    Card, 
    CardContent, 
    Grid, 
    Typography, 
    LinearProgress, 
    Alert,
    Box 
  } from '@mui/material';
  
  const OngoingCourseItem = ({ course }) => (
    <Card variant="outlined" sx={{ 
      borderRadius: 2,
      height: 140,
      width: '100%', // 强制宽度100%
      display: 'flex'
    }}>
      <CardContent sx={{ 
        display: 'flex',
        gap: 2,
        p: 2,
        width: '100%',
        '&:last-child': { pb: 2 }
      }}>
        <img 
          src={course?.thumbnail || '/default-book.png'}
          alt={course?.title || '课程封面'}
          style={{ 
            width: 100,
            height: 100,
            borderRadius: 6,
            objectFit: 'cover',
            flexShrink: 0
          }}
        />
        <Box sx={{ 
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              fontWeight: 500,
              lineHeight: 1.2,
              minHeight: '2.4em', // 最小高度保证
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word' // 允许单词内断行
            }}>
            {course?.title || '未命名课程'}
          </Typography>
          
          <Box sx={{ width: '100%' }}>
            <LinearProgress
              variant="determinate" 
              value={(course?.progress || 0) * 100}
              sx={{ 
                height: 8,
                borderRadius: 4,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4
                }
              }}
            />
            <Typography 
              variant="caption" 
              sx={{ 
                mt: 0.5, 
                display: 'block',
                textAlign: 'right' 
              }}>
              {Math.round((course?.progress || 0) * 100)}% 已完成
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
  
  const OngoingCoursesCard = ({ courses, title }) => {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ '&:last-child': { p: 2 } }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            {title}
          </Typography>
          <Grid container spacing={2}>
            {courses.map((course, index) => (
              <Grid 
                item 
                xs={12} 
                sm={6} 
                key={course.materialId || `course-${index}`}
                sx={{
                  display: 'flex',
                  '& > .MuiCard-root': {  // 强制卡片撑满容器
                    flex: 1,
                    minWidth: 300 // 设置最小宽度
                  }
                }}
              >
                <OngoingCourseItem course={course} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  export default OngoingCoursesCard;