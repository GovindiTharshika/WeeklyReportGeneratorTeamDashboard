"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import { Users, FileCheck, AlertTriangle, Filter, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

/**
 * DashboardPage Component
 * Provides a high-level overview of team progress, reports, and metrics.
 * Designed primarily for Managers to review submissions and workload.
 */
export default function DashboardPage() {
  const { user } = useAuth(); // Access global user context
  
  // Dashboard Metrics State
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Advanced Analysis State
  const [teamReports, setTeamReports] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  
  // Filters
  const [filterUser, setFilterUser] = useState('');
  const [filterProject, setFilterProject] = useState('');
  
  // Default to current week for filters
  const getStartOfWeek = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().split('T')[0];
  };
  const getEndOfWeek = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 6);
    return d.toISOString().split('T')[0];
  };
  
  const [startDate, setStartDate] = useState(getStartOfWeek());
  const [endDate, setEndDate] = useState(getEndOfWeek());

  // Socket
  useEffect(() => {
    if (!user || user.role !== 'Manager') return;
    const socket = io('http://localhost:5000');
    socket.on('reportChanged', () => {
      fetchMetrics();
      fetchFilteredReports();
    });
    return () => socket.disconnect();
  }, [user]);

  // Initial Fetch
  useEffect(() => {
    if (!user || user.role !== 'Manager') return;
    fetchMetrics();
    fetchFilterData();
  }, [user]);

  // Refetch reports and metrics when filters change
  useEffect(() => {
    if (!user || user.role !== 'Manager') return;
    fetchFilteredReports();
    fetchMetrics();
  }, [filterUser, filterProject, startDate, endDate, user]);

  const fetchMetrics = async () => {
    try {
      let query = '?';
      if (filterUser) query += `userId=${filterUser}&`;
      if (filterProject) query += `projectId=${filterProject}&`;
      if (startDate) query += `startDate=${startDate}&`;
      if (endDate) query += `endDate=${endDate}&`;

      const res = await fetch(`http://localhost:5000/api/dashboard/metrics${query}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setMetrics(data);
      else setMetrics({ error: `API Error: HTTP ${res.status} - ${data.message || 'Unknown error'}` });
    } catch (err) {
      console.error('Failed to fetch metrics', err);
      setMetrics({ error: `Fetch Error: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [uRes, pRes] = await Promise.all([
        fetch('http://localhost:5000/api/users', { headers: { 'Authorization': `Bearer ${user.token}` }}),
        fetch('http://localhost:5000/api/projects', { headers: { 'Authorization': `Bearer ${user.token}` }})
      ]);
      if (uRes.ok) setAllUsers(await uRes.json());
      if (pRes.ok) setAllProjects(await pRes.json());
    } catch (err) {
      console.error('Failed to fetch filter data', err);
    }
  };

  const fetchFilteredReports = async () => {
    try {
      let query = '?';
      if (filterUser) query += `userId=${filterUser}&`;
      if (filterProject) query += `projectId=${filterProject}&`;
      if (startDate) query += `startDate=${startDate}&`;
      if (endDate) query += `endDate=${endDate}&`;
      
      const res = await fetch(`http://localhost:5000/api/reports${query}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (res.ok) {
        setTeamReports(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch filtered reports', err);
    }
  };

  if (!user || user.role !== 'Manager') {
    return <div className="p-8 text-center text-red-500">Access Denied. Managers only.</div>;
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-card rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-card rounded-xl"></div><div className="h-32 bg-card rounded-xl"></div><div className="h-32 bg-card rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (metrics?.error) {
    return (
      <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">
        <div className="bg-red-100 text-red-800 p-4 rounded-md">
          <h2 className="font-bold">Error loading dashboard</h2>
          <p>{metrics.error}</p>
        </div>
      </div>
    );
  }

  // Fallbacks for charts
  const summary = metrics?.summary || { totalReportsSubmitted: 0, complianceRate: 0, openBlockers: 0 };
  const statusData = metrics?.charts?.submissionStatus || [{ name: 'Submitted', value: 0 }, { name: 'Pending', value: 0 }];
  const projectData = metrics?.charts?.workloadByProject || [];
  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  // Calculate Team Analysis Data
  const teamMembers = allUsers.filter(u => u.role !== 'Manager'); // usually managers don't submit, or we can include everyone
  
  const analysisData = teamMembers.map(member => {
    const memberReports = teamReports.filter(r => r.userId?._id === member._id);
    const hasSubmitted = memberReports.length > 0;
    
    let status = 'Pending';
    if (hasSubmitted) status = 'Submitted';
    else if (endDate && new Date(endDate) < new Date()) status = 'Late';

    const totalHours = memberReports.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
    const projects = [...new Set(memberReports.map(r => r.projectId?.name || 'Unknown'))].join(', ');

    return {
      member,
      reports: memberReports,
      status,
      totalHours,
      projects
    };
  });

  // Apply frontend filters for User and Project
  const displayData = analysisData.filter(d => {
    if (filterUser && d.member._id !== filterUser) return false;
    
    if (filterProject) {
      const selectedProj = allProjects.find(p => p._id === filterProject);
      const isMember = selectedProj?.members?.some(m => m._id === d.member._id);
      if (!isMember && d.reports.length === 0) return false;
    }
    
    return true;
  });

  return (
    // Outer container with responsive padding
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of team progress and report submissions.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-4 bg-blue-500/10 text-blue-500 rounded-full"><FileCheck size={24} /></div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Reports (This Week)</p>
            <h3 className="text-2xl font-bold">{summary.totalReportsSubmitted ?? 0}</h3>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-4 bg-green-500/10 text-green-500 rounded-full"><Users size={24} /></div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Compliance Rate</p>
            <h3 className="text-2xl font-bold">{summary.complianceRate}%</h3>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border flex items-center gap-4 shadow-sm">
          <div className="p-4 bg-red-500/10 text-red-500 rounded-full"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Open Blockers</p>
            <h3 className="text-2xl font-bold">{summary.openBlockers}</h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Workload Distribution by Project</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" tick={{fill: '#888'}} />
                <YAxis stroke="#888" tick={{fill: '#888'}} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="reports" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Report Submission Status</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Advanced Team Reports Analysis Section */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-border bg-muted/20">
          <h3 className="text-xl font-semibold mb-4">Team Reports Analysis</h3>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Filter size={12}/> Team Member</label>
              <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">All Members</option>
                {teamMembers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Filter size={12}/> Project</label>
              <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">All Projects</option>
                {allProjects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Calendar size={12}/> Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Calendar size={12}/> End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Team Member</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Hours Logged</th>
                <th className="px-6 py-4 font-medium">Projects</th>
                <th className="px-6 py-4 font-medium">Blockers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-muted-foreground">
                    No team members found.
                  </td>
                </tr>
              ) : (
                displayData.map((row) => (
                  <tr key={row.member._id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-foreground">{row.member.name}</div>
                      <div className="text-xs text-muted-foreground">{row.member.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      {row.status === 'Submitted' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                          <CheckCircle2 size={12} /> Submitted
                        </span>
                      )}
                      {row.status === 'Pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                      {row.status === 'Late' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                          <XCircle size={12} /> Late
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {row.totalHours > 0 ? `${row.totalHours} hrs` : '-'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {row.projects || '-'}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-[200px] truncate">
                      {row.reports.map(r => r.blockers).filter(b => b).join(', ') || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
