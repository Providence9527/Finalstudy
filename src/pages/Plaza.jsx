// src/pages/Plaza.jsx
import { useState, useEffect, useRef } from 'react';
import { Pagination } from '@mui/material';
import SearchBox from '../components/SearchBox';
import FilterPanel from '../components/FilterPanel';
import MaterialCard from '../components/MaterialCard';
import { fetchMaterials, fetchFilterOptions } from '../api/learning';
import '../styles/main.css';

const ITEMS_PER_PAGE = 8;
const STORAGE_KEY = 'plaza_state';

export default function Plaza() {
  // 从localStorage恢复状态
  const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  
  const [searchTerm, setSearchTerm] = useState(savedState.searchTerm || '');
  const [selectedSubjects, setSelectedSubjects] = useState(savedState.selectedSubjects || []);
  const [selectedPublishers, setSelectedPublishers] = useState(savedState.selectedPublishers || []);
  const [selectedFormats, setSelectedFormats] = useState(savedState.selectedFormats || []);
  const [selectedTags, setSelectedTags] = useState(savedState.selectedTags || []);
  const [currentPage, setCurrentPage] = useState(savedState.currentPage || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [materialsData, setMaterialsData] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    subjects: [],
    publishers: [],
    formats: [],
    tags: []
  });

  const initialShuffleDone = useRef(savedState.initialShuffle || false);

  // 保存状态到localStorage
  useEffect(() => {
    const stateToSave = {
      searchTerm,
      selectedSubjects,
      selectedPublishers,
      selectedFormats,
      selectedTags,
      currentPage,
      initialShuffle: initialShuffleDone.current
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [searchTerm, selectedSubjects, selectedPublishers, selectedFormats, selectedTags, currentPage]);

  // 初始化加载筛选选项
  useEffect(() => {
    const initializeData = async () => {
      try {
        const { data } = await fetchFilterOptions();
        setFilterOptions(data);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    initializeData();
  }, []);

  // 加载教材数据
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const { data, pagination } = await fetchMaterials({
          page: currentPage,
          search: searchTerm,
          subjects: selectedSubjects,
          publishers: selectedPublishers,
          formats: selectedFormats,
          tags: selectedTags
        });

        if (!initialShuffleDone.current) {
          const shuffledData = [...data].sort(() => Math.random() - 0.5);
          setMaterialsData(shuffledData);
          initialShuffleDone.current = true;
        } else {
          setMaterialsData(data);
        }
        
        setTotalPages(pagination.total_pages);
      } catch (error) {
        console.error('Failed to load materials:', error);
        setMaterialsData([]);
      }
    };
    
    const debounceTimer = setTimeout(() => {
      loadMaterials();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [currentPage, searchTerm, selectedSubjects, selectedPublishers, selectedFormats, selectedTags]);

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  // 页面卸载时重置初始随机状态
  useEffect(() => {
    return () => {
      if (!window.performance.navigation.type === 1) { // 非刷新情况退出页面
        localStorage.removeItem(STORAGE_KEY);
      }
    };
  }, []);

  return (
    <div className="diy-layout">
      <div className="left-panel">
        <FilterPanel 
          subjects={filterOptions.subjects}
          publishers={filterOptions.publishers}
          formats={filterOptions.formats}
          tags={filterOptions.tags}
          selectedSubjects={selectedSubjects}
          selectedPublishers={selectedPublishers}
          selectedFormats={selectedFormats}
          selectedTags={selectedTags}
          onSubjectChange={setSelectedSubjects}
          onPublisherChange={setSelectedPublishers}
          onFormatChange={setSelectedFormats}
          onTagChange={setSelectedTags}
        />
      </div>

      <div className="right-panel">
        <div className="search-container">
          <SearchBox 
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            placeholder="搜索教材名称或作者..."
          />
        </div>

        <div className="single-column-container">
          <div className="scrollable-content" style={{ 
            flex: 1, 
            overflowY: 'auto',
            paddingRight: '8px',
            marginBottom: '16px'
          }}>
            {materialsData.map((material) => (
              <MaterialCard 
                key={material._id}
                material={material}
                className="single-material-card"
              />
            ))}
          </div>
          
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            className="pagination"
            shape="rounded"
            color="primary"
            sx={{ 
              flexShrink: 0,
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'background.paper',
              py: 1,
              boxShadow: '0 -2px 8px rgba(0,0,0,0.05)'
            }}
          />
        </div>
      </div>
    </div>
  );
}