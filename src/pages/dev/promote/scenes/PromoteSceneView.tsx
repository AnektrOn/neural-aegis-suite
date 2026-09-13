import { AnalyticsScene } from "./AnalyticsScene";
import { AuthScene } from "./AuthScene";
import { CalendarScene } from "./CalendarScene";
import { DashboardScene } from "./DashboardScene";
import { DecisionsScene } from "./DecisionsScene";
import { DeepDiveScene } from "./DeepDiveScene";
import { GuardianActivateScene } from "./GuardianActivateScene";
import { GuardianVoiceScene } from "./GuardianVoiceScene";
import { HabitsScene } from "./HabitsScene";
import { Houses72Scene } from "./Houses72Scene";
import { JournalScene } from "./JournalScene";
import { LandingScene } from "./LandingScene";
import { MeditationScene } from "./MeditationScene";
import { MeditationSessionScene } from "./MeditationSessionScene";
import { MoodScene } from "./MoodScene";
import { PeopleScene } from "./PeopleScene";
import { PersonaScene } from "./PersonaScene";
import { PulseScene } from "./PulseScene";
import { QuizScene } from "./QuizScene";
import { ResultsScene } from "./ResultsScene";
import { ToolboxScene } from "./ToolboxScene";
import { ToolboxSessionScene } from "./ToolboxSessionScene";
import { TourScene } from "./TourScene";
import { WelcomeScene } from "./WelcomeScene";

export function PromoteSceneView({ slug }: { slug: string }) {
  switch (slug) {
    case "landing":
      return <LandingScene />;
    case "auth":
      return <AuthScene />;
    case "guardian-activate":
      return <GuardianActivateScene />;
    case "guardian-voice":
      return <GuardianVoiceScene />;
    case "quiz":
      return <QuizScene />;
    case "results":
      return <ResultsScene />;
    case "tour":
      return <TourScene />;
    case "welcome":
      return <WelcomeScene />;
    case "dashboard":
      return <DashboardScene />;
    case "mood":
      return <MoodScene />;
    case "decisions":
      return <DecisionsScene />;
    case "habits":
      return <HabitsScene />;
    case "journal":
      return <JournalScene />;
    case "calendar":
      return <CalendarScene />;
    case "persona":
      return <PersonaScene />;
    case "houses72":
      return <Houses72Scene />;
    case "deep-dive":
      return <DeepDiveScene />;
    case "pulse":
      return <PulseScene />;
    case "toolbox":
      return <ToolboxScene />;
    case "toolbox-session":
      return <ToolboxSessionScene />;
    case "meditation":
      return <MeditationScene />;
    case "people":
      return <PeopleScene />;
    case "analytics":
      return <AnalyticsScene />;
    case "meditation-session":
      return <MeditationSessionScene />;
    default:
      return <LandingScene />;
  }
}
