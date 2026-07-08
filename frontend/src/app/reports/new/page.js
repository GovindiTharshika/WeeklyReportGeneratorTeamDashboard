"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, SendHorizonal, CalendarDays, FolderKanban, CheckSquare, ListTodo, Siren, Timer, StickyNote, Info } from 'lucide-react';
import Link from 'next/link';

const FIELDS = [
  {
    section: 'Week & Project',
    fields: [
      {
        id: 'weekStartDate',
        label: 'Week Start Date',
        type: 'date',
        required: true,
        icon: CalendarDays,
        half: true,
        help: 'The Monday of the week this report covers.',
      },
      {
        id: 'projectId',
        label: 'Project / Category',
        type: 'select',
        required: true,
        icon: FolderKanban,
        half: true,
        help: 'Select the primary project or work category.',
      },
    ]
  },
  {
    section: 'Work Summary',
    fields: [
      {
        id: 'tasksCompleted',
        label: 'Tasks Completed',
        type: 'textarea',
        required: true,
        icon: CheckSquare,
        rows: 4,
        placeholder: 'List the tasks you completed this week…',
        help: 'Be specific — include ticket numbers, PR links, or brief descriptions.',
      },
      {
        id: 'tasksPlanned',
        label: 'Tasks Planned for Next Week',
        type: 'textarea',
        required: true,
        icon: ListTodo,
        rows: 4,
        placeholder: 'What are you planning to tackle next week?',
        help: 'Outline your main priorities for the upcoming week.',
      },
    ]
  },
  {
    section: 'Blockers & Hours',
    fields: [
      {
        id: 'blockers',
        label: 'Blockers / Challenges',
        type: 'textarea',
        required: false,
        icon: Siren,
        rows: 3,
        placeholder: 'Any obstacles preventing you from completing your work? Leave blank if none.',
        help: 'Flag anything that needs manager attention or support.',
      },
      {
        id: 'hoursWorked',
        label: 'Hours Worked',
        type: 'number',
        required: false,
        icon: Timer,
        half: true,
        placeholder: 'e.g. 40',
        help: 'Optional. Approximate hours spent on the project this week.',
      },
      {
        id: 'notes',
        label: 'Notes or Links',
        type: 'text',
        required: false,
        icon: StickyNote,
        half: true,
        placeholder: 'PR links, doc links, etc.',
        help: 'Optional. Any additional references or context.',
      },
    ]
  }
];

function FieldHelp({ text }) {
  return (
    <p className="mt-1.5 text-xs text-muted-foreground flex items-start gap-1.5">
      <Info size={11} className="mt-0.5 shrink-0 text-blue-400/60" />
      {text}
    </p>
  );
}

export default function NewReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Compute current week's Monday as default
  const getThisMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    weekStartDate: getThisMonday(),
    projectId: '',
    tasksCompleted: '',
    tasksPlanned: '',
    blockers: '',
    hoursWorked: '',
    notes: '',
  });

  useEffect(() => {
    if (!user) return;
    fetch('http://localhost:5000/api/projects', {
      headers: { 'Authorization': `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProjects(data); })
      .catch(console.error);
  }, [user]);

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (action) => {
    if (!formData.projectId || !formData.tasksCompleted || !formData.tasksPlanned) {
      setError('Please fill in all required fields: Project, Tasks Completed, and Tasks Planned.');
      return;
    }

    setLoading(true);
    setError('');

    const startDate = new Date(formData.weekStartDate);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const payload = {
      ...formData,
      status: action,
      weekEndDate: endDate.toISOString().split('T')[0],
    };
    if (!payload.hoursWorked) delete payload.hoursWorked;

    try {
      const res = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create report');
      router.push('/reports');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <Link href="/reports" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors gap-1.5">
        <ArrowLeft size={15} /> Back to Reports
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Weekly Report</h1>
        <p className="text-muted-foreground mt-1">Complete the standardized report form for this week's activity.</p>
      </div>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
          <Siren size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="space-y-6">
        {FIELDS.map(section => (
          <div key={section.section} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">{section.section}</h3>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {section.fields.map(field => {
                  const Icon = field.icon;
                  const wrapClass = field.half ? '' : 'md:col-span-2';
                  return (
                    <div key={field.id} className={`space-y-1.5 ${wrapClass}`}>
                      <label htmlFor={field.id} className="text-sm font-medium flex items-center gap-2">
                        <Icon size={14} className="text-muted-foreground" />
                        {field.label}
                        {field.required && <span className="text-destructive text-xs ml-1">*</span>}
                      </label>

                      {field.type === 'select' ? (
                        <select
                          id={field.id}
                          name={field.id}
                          value={formData[field.id]}
                          onChange={handleChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                        >
                          <option value="">Select a project…</option>
                          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          id={field.id}
                          name={field.id}
                          value={formData[field.id]}
                          onChange={handleChange}
                          rows={field.rows || 3}
                          placeholder={field.placeholder}
                          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all resize-none"
                        />
                      ) : (
                        <input
                          id={field.id}
                          name={field.id}
                          type={field.type}
                          value={formData[field.id]}
                          onChange={handleChange}
                          min={field.type === 'number' ? 0 : undefined}
                          max={field.type === 'number' ? 168 : undefined}
                          placeholder={field.placeholder}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
                        />
                      )}
                      {field.help && <FieldHelp text={field.help} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fixed action bar */}
      <div className="sticky bottom-6 z-10">
        <div className="bg-card border border-border rounded-xl shadow-lg p-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground hidden md:block">
            <span className="font-medium text-foreground">Fields marked <span className="text-destructive">*</span> are required.</span> Save as draft to continue editing later.
          </p>
          <div className="flex gap-3 ml-auto">
            <button
              type="button"
              onClick={() => handleSubmit('Draft')}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 transition-colors gap-2 disabled:opacity-50"
            >
              <Save size={16} /> Save Draft
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('submitted')}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-5 transition-colors gap-2 disabled:opacity-50"
            >
              <SendHorizonal size={16} />
              {loading ? 'Submitting…' : 'Submit Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
