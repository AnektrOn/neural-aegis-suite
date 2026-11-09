import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminPulseHub from "../../AdminPulseHub";
import * as pulseAdminService from "@/pages/admin/pulse/pulseAdminService";

vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({ t: (k: string) => k, locale: "fr" }),
}));

vi.mock("@/hooks/use-admin", () => ({
  usePlatformRoles: () => ({
    isSuperAdmin: true,
    isCompanyAdmin: false,
    isPlatformOperator: true,
    isAdmin: true,
    companyId: null,
    loading: false,
  }),
}));

vi.mock("@/pages/admin/pulse/pulseAdminService", async () => {
  const actual = await vi.importActual<typeof pulseAdminService>(
    "@/pages/admin/pulse/pulseAdminService"
  );
  return {
    ...actual,
    listPulseCards: vi.fn(),
    fetchPulseCardStats: vi.fn(async () => new Map()),
    fetchProfileOptions: vi.fn(async () => [
      { id: "u-1", display_name: "Alice" },
      { id: "u-2", display_name: "Bob" },
    ]),
    fetchUserRuneProgress: vi.fn(async () => null),
    fetchPulseSwipeLog: vi.fn(async () => []),
    toggleCardActive: vi.fn(async () => true),
    deleteCard: vi.fn(async () => true),
    activateAllDrafts: vi.fn(async () => 0),
    bulkActivateCards: vi.fn(async () => 0),
    bulkAssignUsers: vi.fn(async () => 0),
    bulkClearUserAssignment: vi.fn(async () => 0),
  };
});

const sampleCards = [
  {
    id: "card-1",
    external_key: "KYB_001",
    principle_id: "p-1",
    principle_code: "MENTALISM",
    principle_name: "Le Mentalisme",
    title_i18n: { fr: "Le Filtre de la Réalité", en: "Reality Filter" },
    problem_i18n: { fr: "Pourquoi deux personnes vivent la même journée...", en: "Why two people..." },
    bullets_i18n: { fr: ["Le cerveau filtre 90%."], en: ["Brain filters 90%."] },
    format_i18n: { fr: "MICRO-CONCEPT", en: "MICRO-CONCEPT" },
    course_content_i18n: { fr: { hook: "Hook 1", concept: "Concept 1", action: "Action 1" } },
    archetype_targets: ["sage", "warrior"],
    target_user_ids: ["u-1"],
    content_type: "card",
    time_label: "2 MIN",
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: "card-2",
    external_key: "KYB_002",
    principle_id: "p-2",
    principle_code: "POLARITY",
    principle_name: "La Polarité",
    title_i18n: { fr: "Le curseur des émotions", en: "Emotion slider" },
    problem_i18n: { fr: "Comment surmonter le trac ?", en: "How to beat stage fright?" },
    bullets_i18n: { fr: ["Peur et excitation sont identiques."], en: ["Fear and excitement are identical."] },
    format_i18n: { fr: "HACK MENTAL", en: "MENTAL HACK" },
    course_content_i18n: {},
    archetype_targets: [],
    target_user_ids: [],
    content_type: "card",
    time_label: "3 MIN",
    is_active: false,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
];

describe("AdminPulseHub ?tab=manage suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders PulseManagement with loaded cards and KPIs", async () => {
    vi.mocked(pulseAdminService.listPulseCards).mockResolvedValueOnce(sampleCards as any);

    render(
      <MemoryRouter initialEntries={["/admin/pulse?tab=manage"]}>
        <AdminPulseHub />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Le Filtre de la Réalité")).toBeInTheDocument();
    });

    expect(screen.getByText("Le curseur des émotions")).toBeInTheDocument();
    expect(screen.getByText("KYB_001")).toBeInTheDocument();
    expect(screen.getByText("KYB_002")).toBeInTheDocument();
  });

  it("handles card with null/undefined array fields and malformed data without crashing", async () => {
    const edgeCaseCards = [
      {
        id: "card-edge-1",
        external_key: "EDGE_001",
        principle_id: "p-1",
        principle_code: undefined,
        principle_name: undefined,
        title_i18n: null,
        problem_i18n: null,
        bullets_i18n: null,
        format_i18n: null,
        course_content_i18n: null,
        archetype_targets: null as any,
        target_user_ids: null as any,
        content_type: null as any,
        time_label: null as any,
        is_active: false,
        sort_order: null as any,
        created_at: new Date().toISOString(),
      },
      {
        id: "card-edge-2",
        external_key: null,
        principle_id: "p-2",
        principle_code: "MENTALISM",
        principle_name: "Mentalism",
        title_i18n: { fr: "Titre 2" },
        problem_i18n: { fr: "Problem 2" },
        bullets_i18n: { fr: ["b1"] },
        format_i18n: { fr: "FMT" },
        course_content_i18n: {},
        archetype_targets: "[\"sage\"]" as any,
        target_user_ids: "{u-1,u-unknown}" as any,
        content_type: "card",
        time_label: "2 MIN",
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
      },
    ];

    vi.mocked(pulseAdminService.listPulseCards).mockResolvedValueOnce(edgeCaseCards as any);

    render(
      <MemoryRouter initialEntries={["/admin/pulse?tab=manage"]}>
        <AdminPulseHub />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Catalogue Pulse")).toBeInTheDocument();
    });
    expect(screen.getByText("Titre 2")).toBeInTheDocument();
  });

  it("expands card preview without throwing error", async () => {
    vi.mocked(pulseAdminService.listPulseCards).mockResolvedValueOnce(sampleCards as any);

    render(
      <MemoryRouter initialEntries={["/admin/pulse?tab=manage"]}>
        <AdminPulseHub />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Le Filtre de la Réalité")).toBeInTheDocument();
    });

    const expandButtons = screen.getAllByTitle("Voir le contenu");
    expect(expandButtons.length).toBeGreaterThan(0);
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Enseignement")).toBeInTheDocument();
    });
  });

  it("handles empty card list gracefully", async () => {
    vi.mocked(pulseAdminService.listPulseCards).mockResolvedValueOnce([]);

    render(
      <MemoryRouter initialEntries={["/admin/pulse?tab=manage"]}>
        <AdminPulseHub />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Aucune carte")).toBeInTheDocument();
    });
  });

  it("parseStringOrArray correctly parses various array representations", () => {
    const { parseStringOrArray } = pulseAdminService;
    expect(parseStringOrArray(null)).toEqual([]);
    expect(parseStringOrArray(undefined)).toEqual([]);
    expect(parseStringOrArray("")).toEqual([]);
    expect(parseStringOrArray(["sage", "warrior"])).toEqual(["sage", "warrior"]);
    expect(parseStringOrArray('["sage", "warrior"]')).toEqual(["sage", "warrior"]);
    expect(parseStringOrArray("{sage,warrior}")).toEqual(["sage", "warrior"]);
    expect(parseStringOrArray('{"sage","warrior"}')).toEqual(["sage", "warrior"]);
    expect(parseStringOrArray("{2e991527-df04-4ad7-84e2-fed96d93e020}")).toEqual([
      "2e991527-df04-4ad7-84e2-fed96d93e020",
    ]);
  });
});
