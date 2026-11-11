import { ClinicalReportReader } from "./components/ClinicalReportReader";
import type { UserReport } from "./types";

interface Props {
  report: UserReport | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Point d'entrée de lecture des rapports utilisateur.
 * Délègue au « 5-Pillar Clinical Reader » haute fidélité (standard AEGIS V3.2)
 * tout en assurant une rétrocompatibilité totale sur les anciens rapports monocanaux.
 */
export function UserReportModal({ report, open, onOpenChange }: Props) {
  return (
    <ClinicalReportReader
      report={report}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
