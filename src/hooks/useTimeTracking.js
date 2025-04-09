// src/hooks/useTimeTracking.js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TimeTracker } from '../utils/timeTracker';
import { useAuth } from '../contexts/AuthContext';

export const useTimeTracking = () => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // 定义需要跟踪的路径模式
    const trackPaths = [
      '/book/', // 匹配所有/book/开头的路径
      '/diy',
      '/garden',
      '/explore'
    ];
    //console.log("进入跟踪状态")
    // 检查当前路径是否需要跟踪
    const shouldTrack = trackPaths.some(path => 
      location.pathname.startsWith(path)
    );
    //console.log("跟踪信息  ",shouldTrack, user.userId )
    if (!shouldTrack || !user?.userId) return;
   
    const tracker = new TimeTracker(user.userId);
    //console.log("需要跟踪  ",tracker )
    return () => {
      tracker.cleanup();
      tracker.sendData(); // 仅在组件卸载时发送一次
    };
  }, [location.pathname, user?.userId]); // 路径或用户变化时重新触发
};