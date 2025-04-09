// src/pages/Garden.jsx
import { useState, useEffect } from 'react';
import DataCard from '../components/DataCard';
import TimeRangeTabs from '../components/TimeRangeTabs';
import KnowledgeGraph from '../components/KnowledgeGraph';
import { mockReports } from '../data/mockReports';
import { useTimeTracking } from '../hooks/useTimeTracking';

const Garden = () => {
  useTimeTracking(); 
  const [activeRange, setActiveRange] = useState('weekly');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadData = () => {
      setIsLoading(true);
      setTimeout(() => {
        setReportData(mockReports[activeRange]);
        setIsLoading(false);
      }, 300);
    };
    loadData();
  }, [activeRange]);

  return (
    <div className="garden-container">
      {/* 顶部报告区域 */}
      <div className="report-header">
        <TimeRangeTabs
          activeRange={activeRange}
          onChange={setActiveRange}
        />
        
        {!isLoading && reportData && (
          <div className="stats-panel">
            <DataCard
              title="学习时长"
              value={reportData.stats.duration}
              theme="blue"
            />
            <DataCard
              title="掌握概念"
              value={reportData.stats.concepts}
              unit="个"
              theme="green"
            />
            <DataCard
              title="重点领域"
              value={reportData.stats.focusArea}
              theme="orange"
            />
            <div className="advice-card">
              <h4>学习建议</h4>
              <p>{reportData.advice}</p>
            </div>
          </div>
        )}
      </div>

      {/* 知识图谱面板 */}
      <div className="graph-panel">
        <h2 className="panel-title">{activeRange}知识结构图谱</h2>
        <div className="graph-container">
          {isLoading ? (
            <div className="loading-indicator">数据加载中...</div>
          ) : (
            <KnowledgeGraph data={reportData?.graph || { nodes: [], links: [] }} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Garden;