import { QUESTIONS_70 } from "../src/features/archetype-deepdive-v2/domain/questions70.ts";
import fs from "fs";
const slim = QUESTIONS_70.map(q => ({
  id: q.id, position: q.position, house: q.house,
  prompt_fr: q.prompt_fr, prompt_en: q.prompt_en,
  options: q.options.map(o => ({
    id: o.id, label_fr: o.label_fr, label_en: o.label_en,
    weights: o.weights,
  })),
}));
fs.writeFileSync("supabase/functions/export-deep-dive-v2-to-drive/questions70.json", JSON.stringify(slim, null, 2));
console.log("wrote", slim.length, "questions");
