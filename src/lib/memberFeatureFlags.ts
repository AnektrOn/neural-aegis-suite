/** Member routes hidden until implementation and QA are complete. */
export type MemberFeatureId = "bibliotheque" | "dien_chan";

const MEMBER_FEATURE_VISIBILITY: Record<MemberFeatureId, boolean> = {
  bibliotheque: false,
  dien_chan: false,
};

export function isMemberFeatureVisible(id: MemberFeatureId): boolean {
  return MEMBER_FEATURE_VISIBILITY[id];
}