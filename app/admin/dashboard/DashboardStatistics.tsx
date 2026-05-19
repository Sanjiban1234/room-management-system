'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#171717', '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardStatistics({ registrations }: { registrations: any[] }) {
  if (!registrations || registrations.length === 0) {
    return (
      <div className="glass-panel text-center" style={{ padding: '2rem' }}>
        <p className="text-muted text-sm">No performance registrations available to compute statistics.</p>
      </div>
    );
  }

  // Calculate statistics
  const totalPerformances = registrations.length;
  
  const totalPerformers = registrations.reduce((sum, reg) => {
    if (reg.type === 'Solo') {
      return sum + 1;
    } else {
      return sum + 1 + (reg.groupMembers?.length || 0);
    }
  }, 0);

  const typeCounts = registrations.reduce((acc, reg) => {
    const type = reg.performanceType === 'Other' ? reg.otherPerformanceType || 'Other' : reg.performanceType;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const soloGroupCounts = registrations.reduce((acc, reg) => {
    acc[reg.type] = (acc[reg.type] || 0) + 1;
    return acc;
  }, { Solo: 0, Group: 0 } as Record<string, number>);

  const pieData = [
    { name: 'Solo Acts', value: soloGroupCounts.Solo },
    { name: 'Group Acts', value: soloGroupCounts.Group }
  ];

  const barData = Object.entries(typeCounts).map(([name, count]) => ({
    name,
    count: count as number
  }));

  return (
    <div className="flex-col gap-6" style={{ marginTop: '2rem' }}>
      <h2 className="text-xl font-bold">Performance Registration Insights</h2>

      {/* Mini stats cards */}
      <div className="flex flex-wrap gap-4">
        <div className="glass-panel" style={{ padding: '1.25rem', flex: '1 1 200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 className="text-muted text-xs">Total Stage Acts</h4>
          <p className="text-xl font-bold" style={{ marginTop: '0.25rem' }}>{totalPerformances}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem', flex: '1 1 200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 className="text-muted text-xs">Total Performers/Participants</h4>
          <p className="text-xl font-bold" style={{ color: 'var(--accent-color)', marginTop: '0.25rem' }}>{totalPerformers}</p>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem', flex: '1 1 200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h4 className="text-muted text-xs">Solo vs Group Ratio</h4>
          <p className="text-xl font-bold" style={{ color: 'var(--success-color)', marginTop: '0.25rem' }}>
            {soloGroupCounts.Solo} : {soloGroupCounts.Group}
          </p>
        </div>
      </div>

      {/* Visual representations */}
      <div className="flex gap-4 flex-wrap">
        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, minWidth: '320px', height: '320px' }}>
          <h3 className="text-sm font-bold" style={{ marginBottom: '1rem' }}>Acts by Category</h3>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '0.85rem' }} />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, minWidth: '320px', height: '320px', display: 'flex', flexDirection: 'column' }}>
          <h3 className="text-sm font-bold" style={{ marginBottom: '1rem' }}>Solo vs Group Acts</h3>
          <div style={{ flex: 1, height: '90%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                  style={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '0.85rem' }} />
                <Legend verticalAlign="bottom" height={24} iconSize={10} wrapperStyle={{ fontSize: '0.75rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
