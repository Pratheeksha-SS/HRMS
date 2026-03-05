// src/components/StatCard.jsx
const StatCard = ({ title, value, change, icon }) => {
  const isPositive = change?.includes('+');
  
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ color: '#666' }}>{title}</span>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <span style={{ fontSize: '24px', fontWeight: 'bold' }}>{value}</span>
        {change && (
          <span style={{ 
            marginLeft: '8px', 
            color: isPositive ? '#10b981' : '#ef4444',
            fontSize: '14px'
          }}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatCard;