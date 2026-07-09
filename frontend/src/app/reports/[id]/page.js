"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Save, SendHorizonal, Edit2, Lock, CalendarDays,
  FolderKanban, CheckSquare, ListTodo, Siren, Timer, StickyNote,
  Info, CheckCircle2, Clock3, RotateCcw
} from 'lucide-react';
import Link from 'next/link';

function formatDateRange(start, end) {
  if (!start) return '';
  const s = new Date(start);
  const e = end ? new Date(end) : null;
  const opts = { month: 'long', day: 'numeric', year: 'numeric' };
  if (e) return `${s.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} – ${e.toLocaleDateString('en-US', opts)}`;
  return s.toLocaleDateString('en-US', opts);
}

function StatusBadge({ status }) {
  const isSubmitted = status?.toLowerCase() === 'submitted';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${
      isSubmitted
        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
    }`}>
      {isSubmitted ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}
      {isSubmitted ? 'Submitted' : 'Draft'}
    </span>
  );
}

function ReadField({ icon: Icon, label, value, highlight }) {
  if (!value) return null;
  return (
    <div className={`space-y-2 ${highlight ? 'md:col-span-2' : ''}`}>
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Icon size={14} className="text-muted-foreground" />
        {label}
      </h4>
      <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-muted/30 px-4 py-3 rounded-lg border border-border">
        {value}
      </p>
    </div>
  );
}

/**
 * ReportDetailPage Component
 * Displays the details of a specific weekly report.
 * Allows the author or a manager to edit and update the report.
 */
export default function ReportDetailPage() {
  const { user } = useAuth(); // Global user context
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [report, setReport] = useState(null);
  const [projects, setProjects] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || !id) return;
    Promise.all([
      fetch(`http://localhost:5000/api/reports/${id}`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      }).then(r => r.json()),
      fetch('http://localhost:5000/api/projects', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      }).then(r => r.json()),
    ])
      .then(([reportData, projectsData]) => {
        setReport(reportData);
        if (Array.isArray(projectsData)) setProjects(projectsData);
        setFormData({
          weekStartDate: reportData.weekStartDate?.split('T')[0] || '',
          projectId: reportData.projectId?._id || reportData.projectId || '',
          tasksCompleted: reportData.tasksCompleted || '',
          tasksPlanned: reportData.tasksPlanned || '',
          blockers: reportData.blockers || '',
          hoursWorked: reportData.hoursWorked || '',
          notes: reportData.notes || '',
        });
      })
      .catch(err => setError('Failed to load report.'))
      .finally(() => setLoading(false));
  }, [user, id]);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async (newStatus) => {
    if (!formData.projectId || !formData.tasksCompleted || !formData.tasksPlanned) {
      setError('Please fill in all required fields.');
      return;
    }
    setSaving(true);
    setError('');

    const startDate = new Date(formData.weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const payload = {
      ...formData,
      status: newStatus || report.status,
      weekEndDate: endDate.toISOString().split('T')[0],
    };
    if (!payload.hoursWorked) delete payload.hoursWorked;

    try {
      const res = await fetch(`http://localhost:5000/api/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update report');
      setReport(data);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const isManager = user?.role === 'Manager';
  const isOwner = report?.userId?._id === user?._id || report?.userId === user?._id;
  const canEdit = isManager || isOwner;
  const isSubmitted = report?.status?.toLowerCase() === 'submitted';

  if (!user) return null;
  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto animate-pulse space-y-4">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-10 w-64 bg-muted rounded" />
        <div className="h-64 bg-card rounded-xl border border-border" />
      </div>
    );
  }
  if (!report || report.message) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20">
          {report?.message || 'Report not found.'}
        </div>
      </div>
    );
  }

  return (
    // Outer container with responsive padding
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <Link href="/reports" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors gap-1.5">
        <ArrowLeft size={15} /> Back to Reports
      </Link>

      {/* Report Header */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6 flex flex-col sm:flex-row items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Weekly Report</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {formatDateRange(report.weekStartDate, report.weekEndDate)}
          </h1>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {report.projectId && (
              <span className="inline-flex items-center gap-1.5 text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-full">
                <FolderKanban size={12} />
                {report.projectId?.name || 'Unknown'}
              </span>
            )}
            <StatusBadge status={report.status} />
            {report.hoursWorked && (
              <span className="inline-flex items-center gap-1.5 text-sm bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full">
                <Timer size={12} />
                {report.hoursWorked} hrs
              </span>
            )}
          </div>
        </div>
        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 px-4 h-9 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium transition-colors shrink-0"
          >
            <Edit2 size={14} /> Edit
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
          <Siren size={16} className="mt-0.5 shrink-0" /> {error}
        </div>
      )}

      {/* Read Mode */}
      {!editing && (
        <div className="space-y-4">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Work Summary</h3>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <ReadField icon={CheckSquare} label="Tasks Completed" value={report.tasksCompleted} highlight />
              <ReadField icon={ListTodo} label="Tasks Planned for Next Week" value={report.tasksPlanned} highlight />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Blockers & Notes</h3>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-6">
              <ReadField icon={Siren} label="Blockers / Challenges" value={report.blockers || 'None reported'} highlight />
              {report.notes && <ReadField icon={StickyNote} label="Notes / Links" value={report.notes} />}
            </div>
          </div>

          {isSubmitted && (
            <div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-lg">
              <Lock size={14} className="shrink-0" />
              This report has been submitted. You can still edit and resubmit it.
            </div>
          )}
        </div>
      )}

      {/* Edit Mode */}
      {editing && (
        <div className="space-y-6">
          {[
            {
              title: 'Week & Project',
              fields: [
                { id: 'weekStartDate', label: 'Week Start Date', type: 'date', icon: CalendarDays, half: true, required: true },
                { id: 'projectId', label: 'Project / Category', type: 'select', icon: FolderKanban, half: true, required: true },
              ]
            },
            {
              title: 'Work Summary',
              fields: [
                { id: 'tasksCompleted', label: 'Tasks Completed', type: 'textarea', icon: CheckSquare, rows: 4, required: true },
                { id: 'tasksPlanned', label: 'Tasks Planned for Next Week', type: 'textarea', icon: ListTodo, rows: 4, required: true },
              ]
            },
            {
              title: 'Blockers & Hours',
              fields: [
                { id: 'blockers', label: 'Blockers / Challenges', type: 'textarea', icon: Siren, rows: 3 },
                { id: 'hoursWorked', label: 'Hours Worked', type: 'number', icon: Timer, half: true },
                { id: 'notes', label: 'Notes / Links', type: 'text', icon: StickyNote, half: true },
              ]
            }
          ].map(section => (
            <div key={section.title} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/20">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{section.title}</h3>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-6">
                {section.fields.map(field => {
                  const Icon = field.icon;
                  const cls = field.half ? '' : 'md:col-span-2';
                  return (
                    <div key={field.id} className={`space-y-1.5 ${cls}`}>
                      <label htmlFor={`edit-${field.id}`} className="text-sm font-medium flex items-center gap-2">
                        <Icon size={13} className="text-muted-foreground" />
                        {field.label}
                        {field.required && <span className="text-destructive text-xs">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select id={`edit-${field.id}`} name={field.id} value={formData[field.id]} onChange={handleChange} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all">
                          <option value="">Select a project…</option>
                          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea id={`edit-${field.id}`} name={field.id} value={formData[field.id]} onChange={handleChange} rows={field.rows || 3} className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none" />
                      ) : (
                        <input id={`edit-${field.id}`} name={field.id} type={field.type} value={formData[field.id]} onChange={handleChange} min={field.type === 'number' ? 0 : undefined} max={field.type === 'number' ? 168 : undefined} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Sticky Action Bar */}
          <div className="sticky bottom-4 sm:bottom-6 z-10">
            <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={() => { setEditing(false); setError(''); }}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw size={14} /> Cancel
              </button>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={() => handleSave('Draft')}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-10 px-4 transition-colors gap-2 disabled:opacity-50"
                >
                  <Save size={15} /> Save Draft
                </button>
                <button
                  onClick={() => handleSave('submitted')}
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 transition-colors gap-2 disabled:opacity-50"
                >
                  <SendHorizonal size={15} />
                  {saving ? 'Saving…' : 'Save & Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
