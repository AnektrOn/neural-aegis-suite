/**
 * useTrackingCheckin
 *
 * Checks whether the current user has a pending daily check-in for
 * the Myss Archetype perspective. Provides handlers for answering questions.
 */

import { useState, useEffect, useCallback } from "react";
import type { TrackingDailyBatch, TrackingDailyResponse, TrackingQuestion, TrackingResponseValue } from "../domain/types";
import { ensureDailyBatch, getBatchResponses, recordResponse } from "../services/trackingDailyService";
import { loadPerspectiveBySlug } from "../services/trackingQuestionService";

const MYSS_PERSPECTIVE_SLUG = "myss-archetype";

export interface TrackingCheckinState {
  isLoading: boolean;
  isDismissed: boolean;
  hasPendingCheckin: boolean;
  batch: (TrackingDailyBatch & { questions: TrackingQuestion[] }) | null;
  responses: TrackingDailyResponse[];
  currentQuestionIndex: number;
  isSubmitting: boolean;
  isComplete: boolean;
  error: string | null;
  canReopen: boolean;
  submitResponse: (value: TrackingResponseValue) => Promise<void>;
  dismiss: () => void;
  reopen: () => void;
}

export function useTrackingCheckin(userId: string | undefined): TrackingCheckinState {
  const [isLoading, setIsLoading] = useState(true);
  const [batch, setBatch] = useState<(TrackingDailyBatch & { questions: TrackingQuestion[] }) | null>(null);
  const [responses, setResponses] = useState<TrackingDailyResponse[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const perspective = await loadPerspectiveBySlug(MYSS_PERSPECTIVE_SLUG);
        if (!perspective || cancelled) {
          setIsLoading(false);
          return;
        }

        const todayBatch = await ensureDailyBatch(userId, perspective.id);
        if (cancelled) return;

        if (todayBatch.questions.length === 0) {
          setBatch(null);
          setIsLoading(false);
          return;
        }

        // Already completed today — don't reopen the modal on every page load
        if (todayBatch.status === "answered") {
          setBatch(todayBatch);
          setCurrentQuestionIndex(todayBatch.questions.length);
          setIsLoading(false);
          return;
        }

        setBatch(todayBatch);

        const existingResponses = await getBatchResponses(todayBatch.id);
        if (cancelled) return;

        setResponses(existingResponses);
        setCurrentQuestionIndex(existingResponses.length);
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg === "NO_TRACKING_QUESTIONS") {
            setBatch(null);
          } else {
            console.error("TrackingCheckin: load error", err);
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [userId]);

  const submitResponse = useCallback(async (value: TrackingResponseValue) => {
    if (!batch || !userId) return;

    const question = batch.questions[currentQuestionIndex];
    if (!question) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await recordResponse(userId, batch.id, question.id, value);

      const newResponse: TrackingDailyResponse = {
        id: crypto.randomUUID(),
        user_id: userId,
        batch_id: batch.id,
        question_id: question.id,
        response_date: new Date().toISOString().split("T")[0],
        numeric_value: value.type === "scale" ? value.numeric_value : null,
        choice_value: value.type === "choice" ? value.choice_value : null,
        text_value: value.type === "text" ? value.text_value : null,
        weights_applied: value.type === "choice" ? (value.weights_applied ?? []) : [],
        responded_at: new Date().toISOString(),
      };

      setResponses((prev) => [...prev, newResponse]);

      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      if (nextIndex >= batch.questions.length) {
        setSessionComplete(true);
        setBatch((prev) => (prev ? { ...prev, status: "answered" } : prev));
      }
    } catch (err) {
      console.error("TrackingCheckin: submit error", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  }, [batch, userId, currentQuestionIndex]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const reopen = useCallback(() => {
    setDismissed(false);
  }, []);

  useEffect(() => {
    const handler = () => reopen();
    window.addEventListener("aegis:open-checkin", handler);
    return () => window.removeEventListener("aegis:open-checkin", handler);
  }, [reopen]);

  const questionCount = batch?.questions?.length ?? 0;

  const canReopen =
    dismissed &&
    batch !== null &&
    questionCount > 0 &&
    batch.status === "pending" &&
    currentQuestionIndex < questionCount;

  const hasPendingCheckin =
    !dismissed &&
    !isLoading &&
    batch !== null &&
    questionCount > 0 &&
    batch.status === "pending" &&
    currentQuestionIndex < questionCount;

  const isComplete =
    sessionComplete &&
    !dismissed &&
    batch !== null &&
    questionCount > 0;

  return {
    isLoading,
    isDismissed: dismissed,
    hasPendingCheckin,
    batch,
    responses,
    currentQuestionIndex,
    isSubmitting,
    isComplete,
    error,
    canReopen,
    submitResponse,
    dismiss,
    reopen,
  };
}
