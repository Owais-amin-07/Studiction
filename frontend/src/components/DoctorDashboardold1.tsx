import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Stethoscope, LogOut, Pencil, Check, RefreshCw,
  Users, Calendar, Clock, FileText, MessageSquare,
} from 'lucide-react';
import * as doctorApi from '../services/doctorApi';
import type { DoctorData } from '../services/doctorApi';

interface DoctorDashboardProps {
  doctor:    DoctorData;
  onLogout:  () => void;
}

const PLACEHOLDER_SECTIONS = [
  { icon: Users,        title: 'Pending Requests',     note: 'Member requests will show up here once booking is live.' },
  { icon: Calendar,     title: "Today's Appointments",  note: 'Scheduled sessions for today will appear here.' },
  { icon: Clock,        title: 'Upcoming Appointments', note: 'Your booked sessions ahead of today.' },
  { icon: FileText,     title: 'Patient Reports',       note: 'AI-prepared summaries will appear here before each session.' },
  { icon: MessageSquare,title: 'Messages',              note: 'Live chat with members will open here.' },
];

export default function DoctorDashboard({ doctor, onLogout }: DoctorDashboardProps) {
  const [isEditing, setIsEditing] = useState(!doctor.profileComplete);
  const [specialization, setSpecialization] = useState(doctor.specialization);
  const [expertise,      setExpertise]      = useState(doctor.expertise);
  const [experience,     setExperience]     = useState(doctor.experience);
  const [bio,            setBio]            = useState(doctor.bio);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [current, setCurrent] = useState(doctor);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const updated = await doctorApi.updateDoctorProfile({ specialization, expertise, experience, bio });
      setCurrent(updated);
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message || 'Could not save profile — please try again');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full px-4 md:px-8 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#48cfad] to-[#6c63ff] flex items-center justify-center shadow-[0_4px_25px_rgba(72,207,173,0.25)]">
            <Stethoscope className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <p className="text-white text-base font-semibold leading-tight">{current.name}</p>
            <p className="text-zinc-500 text-xs">{current.specialization || 'Complete your profile below'}</p>
          </div>
        </div>
        <button
          type="button" onClick={onLogout}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-xl border text-zinc-400 hover:text-white hover:border-white/20 text-xs font-medium transition-colors cursor-pointer"
          style={{ borderColor: 'rgba(255,255,255,0.08)' }}
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>

      {/* Profile card — patients see this before chatting, so it's real, not a placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-3xl p-6 mb-6"
        style={{ boxShadow: '0 0 40px rgba(72,207,173,0.06)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-white text-sm font-semibold">Your Profile</p>
          <p className="text-zinc-600 text-[11px]">Members see this before their first message with you</p>
        </div>

        {!isEditing ? (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">Specialization</p>
                <p className="text-white text-sm">{current.specialization || '—'}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">Expertise</p>
                <p className="text-white text-sm">{current.expertise || '—'}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-1">Experience</p>
                <p className="text-white text-sm">{current.experience || '—'}</p>
              </div>
            </div>
            {current.bio && <p className="text-zinc-400 text-xs leading-relaxed">{current.bio}</p>}
            <button
              type="button" onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 text-[#48cfad] hover:text-[#6fe0c2] text-xs font-semibold transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit profile
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {saveError && <p className="text-rose-400 text-xs">{saveError}</p>}
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Specialization</label>
                <input value={specialization} onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g. Addiction Psychiatry"
                  className="w-full h-9 px-3 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] focus:border-[#48cfad]/80 rounded-lg text-white placeholder-zinc-600 text-sm outline-none transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Expertise</label>
                <input value={expertise} onChange={(e) => setExpertise(e.target.value)}
                  placeholder="e.g. Digital & nicotine dependence, CBT"
                  className="w-full h-9 px-3 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] focus:border-[#48cfad]/80 rounded-lg text-white placeholder-zinc-600 text-sm outline-none transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Experience</label>
                <input value={experience} onChange={(e) => setExperience(e.target.value)}
                  placeholder="e.g. 6 years"
                  className="w-full h-9 px-3 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] focus:border-[#48cfad]/80 rounded-lg text-white placeholder-zinc-600 text-sm outline-none transition-colors" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold">Short Bio (optional)</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2}
                placeholder="A sentence or two members will see about you"
                className="w-full px-3 py-2 bg-[#060611]/90 border border-[rgba(255,255,255,0.06)] focus:border-[#48cfad]/80 rounded-lg text-white placeholder-zinc-600 text-sm outline-none transition-colors resize-none" />
            </div>
            <button
              type="button" onClick={handleSaveProfile} disabled={isSaving}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg text-white text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#48cfad] to-[#6c63ff] cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="animate-spin w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              Save profile
            </button>
          </div>
        )}
      </motion.div>

      {/* Placeholder sections — honest empty states, not fake data */}
      <div className="grid sm:grid-cols-2 gap-4">
        {PLACEHOLDER_SECTIONS.map(({ icon: Icon, title, note }) => (
          <div key={title} className="glass-panel rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-zinc-500" />
              <p className="text-white text-sm font-semibold">{title}</p>
            </div>
            <p className="text-zinc-600 text-xs leading-relaxed">{note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
