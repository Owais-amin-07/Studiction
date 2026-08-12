import {
  Brain, CigaretteOff, GraduationCap, Heart, Leaf, Moon, Smartphone, Target,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ArticleSection {
  heading?: string;
  text?: string;
  bullets?: string[];
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  minutes: number;
  source: string;
  intro: string;
  sections: ArticleSection[];
  action: string;
}

export interface ResourceCategory {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  articles: Article[];
}

export const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    id: 'understand', label: 'Understanding Addiction', icon: Brain, color: '#a78bfa',
    articles: [
      {
        id: 'what-is-addiction',
        title: 'What Is Addiction? (It\'s Not Weakness)',
        excerpt: 'Addiction is a change in how the brain learns — not a character flaw.',
        minutes: 3,
        source: 'National Institute on Drug Abuse (NIDA)',
        intro: 'Most people think addiction is about willpower. Science says it is about learning. When you understand the loop, you stop blaming yourself — and start rewiring.',
        sections: [
          {
            heading: 'The reward loop',
            text: 'Every habit lives in a loop: trigger → action → reward. When the reward is fast and strong (a nicotine hit, a notification burst), the brain stamps that loop in deeply.',
          },
          {
            heading: 'Why stopping feels impossible',
            text: 'With repetition, the brain\'s rational voice (prefrontal cortex) gets quieter while habit circuits get louder. That is why "just stop" rarely works — the hardware has changed.',
          },
          {
            heading: 'The good news',
            text: 'The brain is plastic. Every time you respond differently to a trigger, the old loop weakens and a new one strengthens. Recovery is literal rewiring.',
          },
        ],
        action: 'Write down ONE trigger (time, place, or feeling) that starts your strongest habit loop. Awareness is step one.',
      },
      {
        id: 'dopamine',
        title: 'Dopamine: The Molecule That Hijacks You',
        excerpt: 'Dopamine is not pleasure — it is "want more". Understanding it explains almost every habit.',
        minutes: 3,
        source: 'Research reviewed by Stanford Medicine & NIDA',
        intro: 'Dopamine is often called the pleasure molecule. It is actually the craving molecule — it spikes BEFORE the reward, making you chase it.',
        sections: [
          {
            heading: 'Fast, artificial spikes',
            text: 'Phones and nicotine deliver dopamine spikes your brain never evolved for. The faster the spike, the stronger the loop.',
          },
          {
            heading: 'Why life feels boring',
            text: 'With constant high spikes, your baseline drops. Normal life — studying, walking, talking — starts feeling dull. That boredom IS the craving.',
          },
          {
            heading: 'The reset',
            text: 'Within days to weeks of reducing super-stimuli, the baseline recovers. Ordinary life becomes interesting again. This is real, measurable healing.',
          },
        ],
        action: 'Tomorrow, delay your fastest dopamine source by 30 minutes — no phone for the first half hour after waking.',
      },
    ],
  },
  {
    id: 'habits', label: 'Healthy Habits', icon: Leaf, color: '#48cfad',
    articles: [
      {
        id: 'two-minute-rule',
        title: 'The 2-Minute Rule: Habits Too Small to Fail',
        excerpt: 'Big changes fail. Tiny changes stick. Shrink the habit until you cannot say no.',
        minutes: 2,
        source: 'Atomic Habits (James Clear) · Tiny Habits (BJ Fogg, Stanford)',
        intro: 'Almost every failed habit failed because it started too big. The 2-minute rule fixes the starting line.',
        sections: [
          {
            bullets: [
              'Shrink any habit to two minutes: "read more" → "read one page"; "exercise" → "put on your shoes".',
              'A habit must be ESTABLISHED before it can be improved.',
              'Use habit stacking: "After I [current habit], I will [new 2-minute habit]".',
            ],
          },
          {
            text: 'Consistency beats intensity. One page every day builds a reader; thirty pages once builds nothing.',
          },
        ],
        action: 'Pick one habit, shrink it to 2 minutes, and attach it to an existing routine (after brushing teeth, after lunch).',
      },
      {
        id: 'routines',
        title: 'Morning & Evening Routines That Protect You',
        excerpt: 'You do not rise to your goals — you fall to your routines.',
        minutes: 3,
        source: 'American Psychological Association · Sleep Foundation',
        intro: 'Willpower is a battery; routines are a pipeline. Design a morning and evening that protect your energy automatically.',
        sections: [
          {
            heading: 'Morning anchors',
            bullets: [
              'First 30 minutes: no phone. Win the morning before the feed steals it.',
              'Get light and movement — even 5 minutes resets your body clock.',
              'Choose ONE priority for the day. Only one.',
            ],
          },
          {
            heading: 'Evening anchors',
            bullets: [
              'Screen sunset: no screens the last hour before bed.',
              'Prepare tomorrow tonight (bag, clothes, plan) — reduce morning friction.',
              'Same sleep time daily. Consistency is stronger than duration.',
            ],
          },
        ],
        action: 'Choose one morning anchor and one evening anchor. Start tomorrow — not "someday".',
      },
    ],
  },
  {
    id: 'sleep', label: 'Sleep & Recovery', icon: Moon, color: '#818cf8',
    articles: [
      {
        id: 'sleep-superpower',
        title: 'Sleep Is Your Superpower',
        excerpt: 'The cheapest performance upgrade in existence — and the first thing addiction steals.',
        minutes: 3,
        source: 'Harvard Health · Matthew Walker, Why We Sleep',
        intro: 'Sleep is when the brain cleans toxins, stores memories, and rebalances emotions. It is not lazy — it is recovery.',
        sections: [
          {
            bullets: [
              'Under 7 hours: focus, memory and mood all drop — and cravings rise sharply.',
              'A consistent bedtime matters more than sleeping in on weekends.',
              'Caffeine after 4pm and heavy late meals quietly steal deep sleep.',
            ],
          },
          {
            text: 'A rested prefrontal cortex says "no" to cravings. A tired one says "one more".',
          },
        ],
        action: 'Set a fixed lights-out time tonight — even if you do not feel sleepy. Consistency trains the clock.',
      },
      {
        id: 'screens-before-bed',
        title: 'Screens Before Bed: What They Really Do',
        excerpt: 'The last hour of your day decides the first hour of tomorrow.',
        minutes: 2,
        source: 'American Academy of Sleep Medicine · Harvard Health',
        intro: 'Your phone fights your sleep in two ways: light and content.',
        sections: [
          {
            heading: 'Light',
            text: 'Blue light delays melatonin, the sleep hormone. Your brain reads the screen as "daytime" and postpones sleep.',
          },
          {
            heading: 'Content',
            text: 'Endless feeds keep the brain alert and emotionally activated — the opposite of the wind-down sleep needs.',
          },
          {
            heading: 'Build a wind-down',
            text: 'Dim lights → no screens → something slow (shower, book, reflection). Same order every night becomes a sleep trigger.',
          },
        ],
        action: 'Tonight, charge your phone outside the bedroom. Use a normal alarm if needed.',
      },
    ],
  },
  {
    id: 'focus', label: 'Focus & Productivity', icon: Target, color: '#38bdf8',
    articles: [
      {
        id: 'deep-work',
        title: 'Deep Work: Focus in a Distracted World',
        excerpt: 'Focus is a trainable skill — and a superpower, because so few people have it left.',
        minutes: 3,
        source: 'Cal Newport, Deep Work (Georgetown University)',
        intro: 'The ability to concentrate without distraction is becoming rare at exactly the moment it becomes most valuable.',
        sections: [
          {
            heading: 'Attention residue',
            text: 'Every quick glance at your phone leaves "residue" — your attention stays stuck on it for up to 20 minutes. Ten glances can cost you most of an hour.',
          },
          {
            heading: 'Work in blocks',
            text: 'One task, 60–90 minutes, phone in another room. Not face-down — another room. Visibility alone drains attention.',
          },
        ],
        action: 'Schedule one 60-minute deep block tomorrow and write it down like an appointment.',
      },
      {
        id: 'pomodoro',
        title: 'Pomodoro & Time Blocking, Simply',
        excerpt: 'You don\'t need more time — you need cleaner time.',
        minutes: 3,
        source: 'The Pomodoro Technique (F. Cirillo) · Time Blocking (C. Newport)',
        intro: 'Two simple systems beat any productivity app.',
        sections: [
          {
            heading: 'Pomodoro',
            bullets: [
              '25 minutes of focus + 5-minute break.',
              'After 4 rounds, take a longer break (15–30 min).',
              'During the 25: one tab, one task, phone out of sight.',
            ],
          },
          {
            heading: 'Time blocking',
            bullets: [
              'Give every hour a job on paper. Unassigned time becomes phone time.',
              'Check messages 2–3 times a day, not at every ping.',
            ],
          },
        ],
        action: 'Tomorrow, run 4 Pomodoros on your hardest task before opening any social app.',
      },
    ],
  },
  {
    id: 'stress', label: 'Stress & Emotions', icon: Heart, color: '#f472b6',
    articles: [
      {
        id: 'understand-stress',
        title: 'Stress: Understand It to Calm It',
        excerpt: 'Stress is not the enemy. Unmanaged stress is.',
        minutes: 3,
        source: 'American Psychological Association (APA)',
        intro: 'Stress is a body alarm. Short bursts help you perform. A chronic alarm damages sleep, focus — and feeds cravings.',
        sections: [
          {
            heading: 'Healthy coping',
            bullets: [
              'Move: a 10-minute walk burns the stress hormone.',
              'Breathe: long, slow exhales calm the alarm.',
              'Talk: a person, not a feed.',
              'Write: three lines about what you feel.',
            ],
          },
          {
            heading: 'The trap',
            text: 'Scrolling, nicotine and sugar feel like relief but act like a loan — the stress returns with interest.',
          },
        ],
        action: 'Next stress spike: walk 10 minutes BEFORE touching your phone. Notice the difference.',
      },
      {
        id: 'urge-surfing',
        title: 'Riding Out a Craving: Urge Surfing',
        excerpt: 'A craving is a wave. It rises, peaks, and falls — even if you do nothing.',
        minutes: 3,
        source: 'Mindfulness-Based Relapse Prevention (Marlatt, Univ. of Washington)',
        intro: 'Most cravings peak and pass within 10–20 minutes. You do not have to fight the wave — you have to surf it.',
        sections: [
          {
            heading: 'How to surf',
            bullets: [
              'Notice the urge. Say it in your head: "this is a craving".',
              'Breathe slowly — box breathing: 4 in, 4 hold, 4 out, 4 hold.',
              'Wait 10 minutes. Watch the wave rise… and fall.',
            ],
          },
          {
            text: 'Every surfed craving weakens the next one. Every fed craving strengthens it.',
          },
        ],
        action: 'Next craving: set a 10-minute timer and surf. Most waves die on their own.',
      },
    ],
  },
  {
    id: 'nicotine', label: 'Nicotine Recovery', icon: CigaretteOff, color: '#fb7185',
    articles: [
      {
        id: 'quit-timeline',
        title: 'What Happens When You Quit: The Timeline',
        excerpt: 'Your body starts repairing within 20 minutes of the last puff.',
        minutes: 2,
        source: 'World Health Organization (WHO) · CDC',
        intro: 'Quitting is not giving something up. It is a repair process that begins almost immediately.',
        sections: [
          {
            bullets: [
              '20 minutes: heart rate and blood pressure drop.',
              '12 hours: carbon monoxide in blood returns to normal.',
              '2 weeks – 3 months: circulation and lung function improve.',
              '1 – 9 months: coughing and shortness of breath decrease.',
            ],
          },
          {
            text: 'Withdrawal peaks around day 2–3 and fades within weeks. It is not punishment — it is healing.',
          },
        ],
        action: 'Save this timeline. Read it the next time a craving says "just one".',
      },
      {
        id: 'four-ds',
        title: 'The 4 Ds: Your Anti-Relapse Plan',
        excerpt: 'Relapse happens in predictable moments — and predictable moments can be planned for.',
        minutes: 2,
        source: 'WHO · NHS Smokefree',
        intro: 'Willpower fails when the moment is unplanned. The 4 Ds are a pocket plan for the hard minute.',
        sections: [
          {
            bullets: [
              'DELAY — wait 10 minutes before deciding.',
              'DEEP BREATHE — 10 slow breaths calm the alarm.',
              'DRINK WATER — slowly, with full attention.',
              'DO SOMETHING ELSE — change room, task, or person.',
            ],
          },
          {
            text: 'Also change the scenery: remove packs and vapes from sight, and tell one person your quit date. Accountability roughly doubles success.',
          },
        ],
        action: 'Write your 4-D plan on paper now and keep it in your pocket or wallet.',
      },
    ],
  },
  {
    id: 'digital', label: 'Digital Wellness', icon: Smartphone, color: '#22d3ee',
    articles: [
      {
        id: 'doomscrolling',
        title: 'Doomscrolling: Why You Can\'t Stop',
        excerpt: 'Infinite scroll is a slot machine in your pocket — and you are the player.',
        minutes: 3,
        source: 'American Psychological Association · Harvard Medical School reviews',
        intro: 'Feeds use a psychological mechanism called variable reward — the same mechanism that makes slot machines addictive.',
        sections: [
          {
            heading: 'Variable reward',
            text: 'Sometimes the next post is great, sometimes boring. Unpredictable rewards create the strongest habit loops known to psychology.',
          },
          {
            heading: 'The cost',
            text: 'Heavy scrolling is linked with anxiety, poor sleep, and fragmented attention — the feeling of reading the same line twice.',
          },
          {
            heading: 'Add friction',
            text: 'Log out after each use, remove apps from the home screen, switch to grayscale. Friction breaks autopilot.',
          },
        ],
        action: 'Right now: Settings → Accessibility → Grayscale. Color is the bait.',
      },
      {
        id: 'seven-day-detox',
        title: 'A Practical 7-Day Digital Detox',
        excerpt: 'Not punishment — a 7-day experiment in calm.',
        minutes: 3,
        source: 'Digital wellness guidance from Harvard Health & Stanford',
        intro: 'A detox shows your brain that life without constant scrolling is not boring — it is quieter.',
        sections: [
          {
            bullets: [
              'Day 1–2: notifications off (keep humans only); phone out of the bedroom.',
              'Day 3–4: grayscale on; top app removed from home screen.',
              'Day 5–6: phone-free meals; first 30 minutes of the day phone-free.',
              'Day 7: one half-day fully phone-free. Notice how you feel.',
            ],
          },
          {
            text: 'Expect boredom in the first days. Boredom is not the problem — it is the healing.',
          },
        ],
        action: 'Start Day 1 today. Tell one friend so someone knows.',
      },
    ],
  },
  {
    id: 'students', label: 'Student Success', icon: GraduationCap, color: '#fbbf24',
    articles: [
      {
        id: 'study-smart',
        title: 'Study Smart: Recall & Spaced Repetition',
        excerpt: 'Re-reading feels productive. Science ranks it among the weakest methods.',
        minutes: 3,
        source: 'Dunlosky et al. (2013), Psychological Science in the Public Interest',
        intro: 'A landmark review ranked study techniques. The winners are not the popular ones.',
        sections: [
          {
            heading: 'Active recall',
            text: 'Close the book and retrieve from memory. The struggle IS the learning — if it feels hard, it is working.',
          },
          {
            heading: 'Spaced repetition',
            text: 'Review at growing intervals: 1 day, 3 days, 7 days. Forgetting a little and re-learning is what builds long-term memory.',
          },
          {
            heading: 'Practice questions',
            text: 'Testing yourself beats highlighting, re-reading and summarizing combined.',
          },
        ],
        action: 'Next session: 25 minutes of closed-book recall + questions. Zero re-reading.',
      },
      {
        id: 'beat-procrastination',
        title: 'Beating Procrastination (Kindly)',
        excerpt: 'Procrastination is not laziness — it is avoiding a feeling.',
        minutes: 3,
        source: 'American Psychological Association · Dr. Tim Pychyl (Carleton Univ.)',
        intro: 'You do not avoid the task. You avoid the feeling the task gives you. Knowing this changes everything.',
        sections: [
          {
            heading: 'The 5-minute rule',
            text: 'Commit to only 5 minutes. Starting kills the fear; momentum does the rest.',
          },
          {
            heading: 'Make it tiny and visible',
            text: 'Write the next physical action — "open chapter 3, do question 1" — not "study".',
          },
          {
            heading: 'Forgive yourself',
            text: 'Research shows self-forgiveness after procrastinating reduces future procrastination. Guilt feeds the loop.',
          },
        ],
        action: 'Pick the task you are avoiding. Do 5 minutes on it right after reading this.',
      },
    ],
  },
];