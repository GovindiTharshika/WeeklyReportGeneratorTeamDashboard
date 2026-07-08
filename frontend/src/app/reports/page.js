"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Plus, AlertCircle, FileText, FolderKanban, ChevronRight,
  Clock3, SendHorizonal, CalendarRange, Layers, CheckCircle,
  PenLine, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

function StatusBadge({ status }) {
  const isSubmitted = status?.toLowerCase() === 'submitted';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      isSubmitted
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
    }`}>
      {isSubmitted ? <CheckCircle size={12} /> : <Clock3 size={12} />}
      {isSubmitted ? 'Submitted' : 'Draft'}
    </span>
  );
}

function groupReportsByWeek(reports) {
  const groups = {};
  reports.forEach(r => {
    const key = new Date(r.weekStartDate).toISOString().split('T')[0];
    if (!groups[key]) groups[key] = [];
    groups[key].push(r);
  });
  return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
}

function formatWeek(startDate) {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', { ...opts, year: 'numeric' })}`;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    if (!user) return;
    try {
      const res = await fetch('http://localhost:5000/api/reports', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      if (res.ok) setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [user]);

  if (!user) return null;

  const drafts = reports.filter(r => r.status?.toLowerCase() === 'draft');
  const submitted = reports.filter(r => r.status?.toLowerCase() === 'submitted');
  const weekGroups = groupReportsByWeek(submitted);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Reports</h1>
          <p className="text-muted-foreground mt-1">Create and track your weekly progress reports.</p>
        </div>
        <Link
          href="/reports/new"
          className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 rounded-md font-medium flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus size={18} />
          New Report
        </Link>
      </div>

      {/* Stats Strip */}
      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <Layers size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Reports</p>
              <p className="text-2xl font-bold">{reports.length}</p>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <SendHorizonal size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Submitted</p>
              <p className="text-2xl font-bold">{submitted.length}</p>
            </div>
          </div>
          <div className={`rounded-xl border p-4 flex items-center gap-4 ${
            drafts.length > 0 ? 'bg-yellow-500/5 border-yellow-500/30' : 'bg-card border-border'
          }`}>
            <div className={`p-3 rounded-lg ${
              drafts.length > 0 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-yellow-500/10 text-yellow-400'
            }`}>
              <Clock3 size={20} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Drafts</p>
              <p className={`text-2xl font-bold ${drafts.length > 0 ? 'text-yellow-400' : ''}`}>{drafts.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-card rounded-xl border border-border" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && reports.length === 0 && (
        <div className="text-center py-24 bg-card rounded-xl border border-border border-dashed flex flex-col items-center">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
            <FileText size={36} className="text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No reports yet</h3>
          <p className="text-muted-foreground max-w-sm text-center mb-6">
            You haven't submitted any weekly reports. Create your first report to start tracking your progress.
          </p>
          <Link
            href="/reports/new"
            className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 rounded-md font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Create Your First Report
          </Link>
        </div>
      )}

      {/* ── DRAFTS SECTION ─────────────────────────────────────────────── */}
      {!loading && drafts.length > 0 && (
        <div>
          {/* Alert Banner */}
          <div className="flex items-center gap-3 mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-5 py-3">
            <Clock3 size={18} className="text-yellow-400 shrink-0" />
            <p className="text-sm text-yellow-300 font-medium">
              You have <span className="font-bold">{drafts.length} draft{drafts.length > 1 ? 's' : ''}</span> that {drafts.length > 1 ? 'have' : 'has'} not been submitted yet.
            </p>
          </div>

          {/* Draft Cards */}
          <div className="space-y-3">
            {drafts.map(report => (
              <div
                key={report._id}
                className="bg-card rounded-xl border border-yellow-500/30 shadow-sm overflow-hidden"
                style={{ boxShadow: '0 0 0 1px rgba(234,179,8,0.15), 0 4px 16px rgba(234,179,8,0.06)' }}
              >
                <div className="px-5 py-3 bg-yellow-500/5 border-b border-yellow-500/20 flex items-center gap-2">
                  <PenLine size={13} className="text-yellow-400" />
                  <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Draft — Not Submitted</span>
                </div>

                <div className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-lg shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-foreground">
                          {report.projectId?.name || 'No Project'}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CalendarRange size={11} />
                          {formatWeek(report.weekStartDate)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {report.tasksCompleted?.substring(0, 120) || 'No tasks listed yet.'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/reports/${report._id}`}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-semibold transition-colors"
                    >
                      Complete & Submit
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* Missing fields hint */}
                <div className="px-5 pb-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertCircle size={12} className="text-yellow-500/60 shrink-0" />
                  <span>Open to review your draft and submit it when ready.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SUBMITTED REPORTS SECTION ──────────────────────────────────── */}
      {!loading && submitted.length > 0 && (
        <div className="space-y-6">
          {/* Section header only shown when drafts also exist */}
          {drafts.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <CheckCircle size={15} className="text-emerald-400" />
                Submitted Reports
              </div>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}

          {weekGroups.map(([weekKey, weekReports]) => (
            <div key={weekKey}>
              {/* Week Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <CalendarRange size={15} />
                  Week of {formatWeek(weekKey)}
                </div>
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  {weekReports.length} report{weekReports.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Report Cards */}
              <div className="space-y-3">
                {weekReports.map(report => (
                  <Link
                    key={report._id}
                    href={`/reports/${report._id}`}
                    className="block bg-card rounded-xl border border-border hover:border-emerald-500/30 hover:shadow-md transition-all group"
                  >
                    <div className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0">
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <span className="font-semibold text-foreground">
                              {report.projectId?.name || 'No Project'}
                            </span>
                            <StatusBadge status={report.status} />
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {report.tasksCompleted?.substring(0, 100) || 'No tasks listed'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        {report.hoursWorked && (
                          <div className="text-right hidden md:block">
                            <p className="text-xs text-muted-foreground">Hours</p>
                            <p className="font-bold text-foreground">{report.hoursWorked}h</p>
                          </div>
                        )}
                        <ChevronRight size={18} className="text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                      </div>
                    </div>
                    {report.blockers && (
                      <div className="px-5 pb-4 flex items-start gap-2 text-xs text-red-400/70">
                        <AlertCircle size={13} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-1 italic">Blocker: {report.blockers}</span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
