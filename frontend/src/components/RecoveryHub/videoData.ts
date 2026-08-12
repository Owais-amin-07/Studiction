import {
  CigaretteOff, GraduationCap, ListChecks, Moon, ShieldCheck, Smartphone, Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface HubVideo {
  id: string;
  title: string;
  speaker: string;
  note: string;
  language: 'en' | 'ur';
  youtubeId: string;
}

export interface VideoCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  videos: HubVideo[];
}

export const VIDEO_CATEGORIES: VideoCategory[] = [
  {
    id: 'digital', label: 'Digital Addiction', icon: Smartphone, color: '#48cfad',
    videos: [
      {
        id: 'digital-en',
        title: 'A Simple Way to Break a Bad Habit',
        speaker: 'Judson Brewer · TED',
        language: 'en',
        youtubeId: '-moW9jvvMr4',
        note: 'The science behind why habits stick — and how mindfulness quietly rewires them.',
      },
      {
        id: 'digital-ur',
        title: 'Homosapiens to FOMOsapiens',
        speaker: 'Dr. Khurram Sadiq · TEDxLCWU',
        language: 'ur',
        youtubeId: 'Blow2xXSpNY',
        note: 'For the nights you scroll until 3am. This talk will change how you see your phone.',
      },
    ],
  },
  {
    id: 'nicotine', label: 'Quitting Nicotine', icon: CigaretteOff, color: '#fb7185',
    videos: [
      {
        id: 'nicotine-en',
        title: 'How to Quit Smoking',
        speaker: 'TEDx',
        language: 'en',
        youtubeId: '0TL2Vh7goJc',
        note: 'Every craving passes. This voice will sit with you through the hard ones.',
      },
      {
        id: 'nicotine-ur',
        title: 'How to Quit Smoking (Urdu/Hindi)',
        speaker: 'Fitness365Days',
        language: 'ur',
        youtubeId: '2oegCWFJArU',
        note: 'Ek kash se hazar kash — practical steps to break free, in your own language.',
      },
    ],
  },
  {
    id: 'discipline', label: 'Self Discipline', icon: ShieldCheck, color: '#a78bfa',
    videos: [
      {
        id: 'discipline-en',
        title: 'How to Build Self Discipline',
        speaker: 'Brian Tracy',
        language: 'en',
        youtubeId: 'tvTRZJ-4EyI',
        note: 'Motivation fades. Discipline stays. Start here on the days you don\'t feel like starting.',
      },
      {
        id: 'discipline-ur',
        title: 'How to Face Problems in Life',
        speaker: 'Qasim Ali Shah',
        language: 'ur',
        youtubeId: 'OrQte08Ml90',
        note: 'Har mushkil se ubharne ka tareeqa — a timeless talk on resilience.',
      },
    ],
  },
  {
    id: 'productivity', label: 'Productivity', icon: ListChecks, color: '#38bdf8',
    videos: [
      {
        id: 'productivity-en',
        title: 'Deep Work & Productivity',
        speaker: 'Ali Abdaal',
        language: 'en',
        youtubeId: '6o2tm00Ar8A',
        note: 'Two focused hours beat ten distracted ones. The deep work method, simply explained.',
      },
      {
        id: 'productivity-ur',
        title: 'Control Your Emotions & Productivity',
        speaker: 'Qasim Ali Shah',
        language: 'ur',
        youtubeId: 'JzFs__yJt-w',
        note: 'Jazbaat ko qaboo mein rakho, kaam khud ba khud ho jayega.',
      },
    ],
  },
  {
    id: 'motivation', label: 'Student Motivation', icon: GraduationCap, color: '#fbbf24',
    videos: [
      {
        id: 'motivation-en',
        title: 'How to Study for Exams',
        speaker: 'Ali Abdaal',
        language: 'en',
        youtubeId: 'IlU-zDU6aQ0',
        note: 'Active recall, spaced repetition, Feynman technique — the student\'s complete toolkit.',
      },
      {
        id: 'motivation-ur',
        title: 'How to Find Inspiration of Life',
        speaker: 'Qasim Ali Shah',
        language: 'ur',
        youtubeId: 'cLuKvIkQdKA',
        note: 'For the student who forgot why they started — this will bring it back.',
      },
    ],
  },
  {
    id: 'sleep', label: 'Better Sleep', icon: Moon, color: '#818cf8',
    videos: [
      {
        id: 'sleep-en',
        title: 'One More Reason to Get a Good Night\'s Sleep',
        speaker: 'TED',
        language: 'en',
        youtubeId: 'MJK-dMlATmM',
        note: 'A rested brain resists cravings better. Sleep isn\'t lazy — it\'s recovery.',
      },
      {
        id: 'sleep-ur',
        title: 'Sleep Less Than 6 Hours? The Danger',
        speaker: 'PTN Urdu',
        language: 'ur',
        youtubeId: 'N_l7t0WoD9I',
        note: 'Raat ko screen nahi, sukoon chahiye — why short sleep steals your whole day.',
      },
    ],
  },
  {
    id: 'stress', label: 'Stress Relief', icon: Wind, color: '#f472b6',
    videos: [
      {
        id: 'stress-en',
        title: '10-Minute Meditation for Stress Relief',
        speaker: 'Goodful',
        language: 'en',
        youtubeId: 'inpok4MKVLM',
        note: 'Exams, deadlines, expectations — sit for 10 minutes. This one breathes with you.',
      },
      {
        id: 'stress-ur',
        title: 'Zehni Dabao Ka Ilaj',
        speaker: 'Syed Shafaat Ahmed',
        language: 'ur',
        youtubeId: 'iPd4SAjhVlc',
        note: 'Dil halka karne ke liye — for the weight you carry silently.',
      },
    ],
  },
];