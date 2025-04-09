// src/components/TimeRangeTabs.jsx
import PropTypes from 'prop-types';
import { FiCalendar, FiSun, FiMoon } from 'react-icons/fi';

const TimeRangeTabs = ({ activeRange, onChange }) => {
  const tabs = [
    { id: 'daily', label: '日报', icon: <FiSun /> },
    { id: 'weekly', label: '周报', icon: <FiCalendar /> },
    { id: 'monthly', label: '月报', icon: <FiMoon /> },
  ];

  return (
    <div className="time-tabs-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`time-tab ${activeRange === tab.id ? 'active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

TimeRangeTabs.propTypes = {
  activeRange: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default TimeRangeTabs;