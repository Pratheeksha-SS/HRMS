const StatCard = ({ title, value, change, icon }) => {
  const isPositive = change?.includes('+');
  
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <span style={{ color: '#666', fontSize: '14px' }}>{title}</span>
        <span style={{ fontSize: '24px' }}>{icon}</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'baseline' }}>
        <span style={{ 
          fontSize: '28px', 
          fontWeight: '700',
          color: '#1a1a1a',
          marginRight: '8px'
        }}>
          {value}
        </span>
        {change && (
          <span style={{ 
            fontSize: '13px',
            color: isPositive ? '#10b981' : '#ef4444',
            fontWeight: '500'
          }}>
            {change}
          </span>
        )}
      </div>

      {/* Mini sparkline/indicator */}
      <div style={{
        marginTop: '12px',
        display: 'flex',
        gap: '4px'
      }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              width: '3px',
              height: Math.random() * 20 + 4,
              backgroundColor: i > 15 ? '#4361ee' : '#e5e7eb',
              borderRadius: '2px'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default StatCard;