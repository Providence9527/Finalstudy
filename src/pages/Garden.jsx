// src/pages/Garden.jsx
import { useState, useEffect } from 'react';
import DataCard from '../components/DataCard';
import TimeRangeTabs from '../components/TimeRangeTabs';
import KnowledgeGraph from '../components/KnowledgeGraph';
import { fetchReport } from '../api/learning';
import { useAuth } from '../contexts/AuthContext';
import { useTimeTracking } from '../hooks/useTimeTracking';
import '../styles/main.css';

const Garden = () => {
  useTimeTracking();
  const { user } = useAuth();
  const [activeRange, setActiveRange] = useState('weekly');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEmptyData, setIsEmptyData] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!user?.userId) return;
      
      setIsLoading(true);
      setError(null);
      setIsEmptyData(false);

      try {
        const data = await fetchReport(user?.userId, activeRange);
        if (data) {
          const hasNodes = data.graph?.nodes?.length > 0;
          const hasLinks = data.graph?.links?.length > 0;
          setIsEmptyData(!hasNodes && !hasLinks);
          setReportData(data);
        } else {
          setError('暂时没有可用的学习报告');
        }
      } catch (err) {
        console.error('数据加载失败:', err);
        setError('获取数据失败，请检查网络连接');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeRange, user?.userId]);

  const handleGraphClick = () => {
    setIsExpanded(prev => !prev);
    if (!isExpanded) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>正在生成知识图谱...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="graph-error">
          <div className="error-icon">⚠️</div>
          <p>无法加载知识图谱</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            重试
          </button>
        </div>
      );
    }

    if (isEmptyData) {
      return (
        <div className="empty-graph">
          <div className="empty-icon">📭</div>
          <h4>当前没有可视化数据</h4>
          <p>完成更多学习任务后会自动生成知识图谱</p>
        </div>
      );
    }

    return (
      <KnowledgeGraph 
        data={{ 
          nodes: reportData?.graph?.nodes || [], 
          links: reportData?.graph?.links || [] 
        }}
        isFullscreen={isExpanded}
      />
    );
  };

  return (
    <div className="garden-container">
      <div className={`report-header ${isExpanded ? 'hidden' : ''}`}>
        <TimeRangeTabs
          activeRange={activeRange}
          onChange={setActiveRange}
        />

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {!reportData && !isLoading && (
          <div className="empty-container">
            <div className="empty-icon">📚</div>
            <h3>还没有学习记录哦</h3>
            <p>开始你的第一个学习任务吧！</p>
          </div>
        )}

        {reportData && (
          <div className="stats-panel">
            <DataCard
              title="学习时长"
              value={reportData.stats.duration || '0h'}
              theme="blue"
            />
            <DataCard
              title="掌握概念"
              value={reportData.stats.concepts || 0}
              unit="个"
              theme="green"
            />
            <DataCard
              title="重点领域"
              value={reportData.stats.focusArea || '未检测到'}
              theme="orange"
            />
            <div className="advice-card">
              <h4>学习建议</h4>
              <p>{reportData.advice || '暂无个性化建议'}</p>
            </div>
          </div>
        )}
      </div>

      <div 
        className={`graph-panel ${isExpanded ? 'expanded' : ''}`}
        onClick={handleGraphClick}
      >
        <h2 className="panel-title">{activeRange}知识结构图谱</h2>
        <div className="graph-container">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Garden;