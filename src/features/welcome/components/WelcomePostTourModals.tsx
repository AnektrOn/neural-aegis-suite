import { useState } from "react";
import PulseFeatureAnnounceModal from "@/components/PulseFeatureAnnounceModal";
import { Houses72ResumeModal } from "@/features/houses72/components/Houses72ResumeModal";

/**
 * Sequential modals after the product tour: Houses72 resume first, then Pulse announce.
 */
export function WelcomePostTourModals() {
  const [houses72Blocking, setHouses72Blocking] = useState(true);

  return (
    <>
      <Houses72ResumeModal onBlockingChange={setHouses72Blocking} />
      {houses72Blocking ? null : <PulseFeatureAnnounceModal />}
    </>
  );
}
