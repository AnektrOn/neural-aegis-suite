import type { CartographyDocument } from "../../types";
import {
  BALANCE_ANALYSE_GUARDIANS,
  BALANCE_ANALYSE_HOUSES,
  BALANCE_ANALYSE_META,
} from "./cartography";
import { BALANCE_ANALYSE_DETAILED } from "./detailed-reports";
import { BALANCE_ANALYSE_SYNTHESIS } from "./synthesis";

export const BALANCE_ANALYSE_DOCUMENT: CartographyDocument = {
  meta: BALANCE_ANALYSE_META,
  houses: BALANCE_ANALYSE_HOUSES,
  guardians: BALANCE_ANALYSE_GUARDIANS,
  synthesis: BALANCE_ANALYSE_SYNTHESIS,
  detailedReports: BALANCE_ANALYSE_DETAILED,
};
