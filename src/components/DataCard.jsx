// src/components/DataCard.jsx
import PropTypes from 'prop-types';
import { Card, CardContent, Avatar, LinearProgress, Typography } from '@mui/material';

const DataCard = ({ title, value, icon, color, progress }) => (
  <Card sx={{ 
    height: '100%', 
    borderLeft: `4px solid ${color}`,
    transition: 'transform 0.2s',
    '&:hover': { transform: 'translateY(-2px)' }
  }}>
    <CardContent>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Avatar sx={{ 
          bgcolor: `${color}20`, 
          color,
          width: 48,
          height: 48
        }}>
          {icon}
        </Avatar>
        <div>
          <Typography variant="subtitle2" color="textSecondary">{title}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </Typography>
          {progress !== undefined && (
            <LinearProgress
              variant="determinate"
              value={progress || 0}
              sx={{ 
                mt: 1.5,
                height: 8,
                borderRadius: 4,
                backgroundColor: '#f5f5f5',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4
                }
              }}
            />
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

DataCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number
  ]).isRequired,
  icon: PropTypes.element.isRequired,
  color: PropTypes.string,
  progress: PropTypes.number
};

DataCard.defaultProps = {
  color: '#4CAF50',
  progress: undefined
};

export default DataCard;