export interface GuardianCaptionCue {
  id: number;
  startSec: number;
  endSec: number;
  text: string;
}

/** Iris — Onboarding Part 1 (before quiz), from Iris_-_Onboarding_Part_1_-_before_quizz_eng.srt */
export const FEMALE_STEP_1_CAPTIONS: GuardianCaptionCue[] = [
  {
    id: 1,
    startSec: 0.14,
    endSec: 2.119,
    text: "Hello. My name is Iris.",
  },
  {
    id: 2,
    startSec: 2.939,
    endSec: 8.119,
    text: "I'm here to welcome you to AEGIS and guide you through the onboarding process, if",
  },
  {
    id: 3,
    startSec: 8.119,
    endSec: 8.699,
    text: "you choose.",
  },
  {
    id: 4,
    startSec: 9.779,
    endSec: 12.42,
    text: "Before we begin, one important point about your data.",
  },
  {
    id: 5,
    startSec: 13.359,
    endSec: 16.159,
    text: "Your information remains private and belongs to you.",
  },
  {
    id: 6,
    startSec: 16.819,
    endSec: 20.42,
    text: "It is not sold, shared, or distributed to 3rd parties.",
  },
  {
    id: 7,
    startSec: 21.459,
    endSec: 25.479,
    text: "AEGIS uses your input only to create your personal experience and generate your",
  },
  {
    id: 8,
    startSec: 25.479,
    endSec: 26.619,
    text: "individual insights.",
  },
  {
    id: 9,
    startSec: 27.939,
    endSec: 29.619,
    text: "We will begin with a short questionnaire.",
  },
  {
    id: 10,
    startSec: 30.239,
    endSec: 32.54,
    text: "Take your time. There are no right answers.",
  },
  {
    id: 11,
    startSec: 33.34,
    endSec: 35.619,
    text: "When you are ready, select Start the Quiz.",
  },
  {
    id: 12,
    startSec: 36.54,
    endSec: 37.939,
    text: "I will be here when you are finished.",
  },
];

export function getActiveCaption(
  cues: GuardianCaptionCue[],
  currentTimeSec: number,
): GuardianCaptionCue | null {
  for (const cue of cues) {
    if (currentTimeSec >= cue.startSec && currentTimeSec < cue.endSec) {
      return cue;
    }
  }
  const last = cues[cues.length - 1];
  if (last && currentTimeSec >= last.startSec && currentTimeSec <= last.endSec + 0.35) {
    return last;
  }
  return null;
}
