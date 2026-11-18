import { createContext } from "react";
import type { VoiceFeedbackContext as FeedbackContext } from "./voiceFeedbackService";

export const VoiceFeedbackContext = createContext<((context?: FeedbackContext) => void) | null>(null);