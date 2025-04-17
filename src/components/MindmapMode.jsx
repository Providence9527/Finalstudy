import React, { useEffect, useRef, useState } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import IconButton from '@mui/material/IconButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { formatDistanceToNow } from 'date-fns';
import zhCN from 'date-fns/locale/zh-CN';

const MindmapMode = ({ data, lastUpdated, onRefresh }) => {
  const dataRef = useRef(data);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const svgRef = useRef(null);
  const mmRef = useRef(null);
  const transformer = useRef(new Transformer());

  // 增强版渲染逻辑
  useEffect(() => {
    console.log('[Mindmap] 收到新数据', 
              `变更标识: ${data !== dataRef.current}`,
              `长度: ${data?.length}`, `时间戳: ${lastUpdated}`);
    dataRef.current = data;
    let isMounted = true;
    let animationFrame;

    const renderMindmap = () => {
      try {
        console.group('脑图渲染流程');
        console.log('当前数据状态:', data ? `有效数据（长度${data.length}）` : '空数据');

        // 阶段1: 清理旧实例
        if (mmRef.current) {
          console.log('开始销毁旧实例');
          mmRef.current.destroy();
          // 手动清除SVG内容
          while (svgRef.current?.firstChild) {
            svgRef.current.removeChild(svgRef.current.firstChild);
          }
          mmRef.current = null;
          console.log('旧实例清理完成');
        }

        // 阶段2: 准备新实例
        if (data && typeof data === 'string' && svgRef.current) {
          console.log('初始化新实例');
          
          // 创建新的Markmap实例
          mmRef.current = new Markmap(svgRef.current, {
            duration: 300,
            zoom: true,
          });

          // 阶段3: 数据转换
          try {
            //console.log('开始转换数据',data);
            const { root } = transformer.current.transform(data);
           

            // 阶段4: 渲染视图
            mmRef.current.setData(root);
            mmRef.current.fit();
            
            // 添加二次重绘保证布局稳定
            animationFrame = requestAnimationFrame(() => {
              mmRef.current?.fit();
            });
          } catch (parseError) {
            console.error('数据转换失败:', parseError);
            setError(`数据解析错误: ${parseError.message}`);
          }
        }
      } catch (err) {
        console.error('渲染流程异常:', err);
        if (isMounted) setError(`渲染失败: ${err.message}`);
      } finally {
        console.groupEnd();
      }
    };

    // 使用微任务调度渲染
    const timer = setTimeout(() => {
      renderMindmap();
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      cancelAnimationFrame(animationFrame);
      
      // 清理资源
      if (mmRef.current) {
        mmRef.current.destroy();
        mmRef.current = null;
      }
    };
}, [data, lastUpdated]); // 仅在data变化时触发

  const handleRefresh = async () => {
    console.log("开始本地刷新...");
      setLoading(true);
      setError(null);
      try {
        onRefresh();
        console.log("主刷新完成")
      } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mindmap-container">
      <div className="toolbar">
        <IconButton
          onClick={handleRefresh}
          disabled={loading}
          size="small"
          sx={{
            color: '#666',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
          }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
        <span className="refresh-time">
          最后更新：{formatDistanceToNow(lastUpdated, {
            addSuffix: true,
            locale: zhCN
          })}
        </span>
      </div>

      {loading && (
        <div className="loading-overlay">
          <CircularProgress size={24} thickness={4} />
          <span style={{ marginLeft: 8 }}>正在刷新数据...</span>
        </div>
      )}

      {error && (
        <Alert
          severity="error"
          sx={{
            margin: 1.5,
            '& .MuiAlert-message': { overflow: 'hidden' }
          }}
        >
          {data?.includes('脑图显示失败') ? (
            <>
              <div style={{ fontWeight: 500 }}>内容解析失败</div>
              <ul style={{
                margin: '8px 0 0 16px',
                paddingLeft: 0,
                listStyleType: 'circle'
              }}>
                <li>可能为扫描版PDF文档</li>
                <li>可能为空白页面</li>
                <li>可能包含图像格式内容</li>
              </ul>
            </>
          ) : (
            error
          )}
        </Alert>
      )}

      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: 'calc(100% - 40px)',
          opacity: loading ? 0.5 : 1,
          transition: 'opacity 0.3s ease',
          backgroundColor: '#f8f9fa'
        }}
      />
    </div>
  );
};

export default MindmapMode;