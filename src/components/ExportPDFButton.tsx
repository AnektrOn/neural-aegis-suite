import { useRef } from "react";
import { motion } from "framer-motion";
import { FileDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

interface ExportPDFButtonProps {
  targetRef: React.RefObject<HTMLDivElement>;
  filename?: string;
}

export default function ExportPDFButton({ targetRef, filename = "rapport" }: ExportPDFButtonProps) {
  const { t } = useLanguage();

  const handleExport = () => {
    if (!targetRef.current) return;

    // Create a print-specific window with the content
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = targetRef.current.innerHTML;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((el) => el.outerHTML)
      .join("\n");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${filename}</title>
          ${styles}
          <style>
            @media print {
              body { 
                background: white !important; 
                color: black !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .no-print { display: none !important; }
              .ethereal-glass { 
                background: white !important; 
                border: 1px solid #e5e7eb !important;
                box-shadow: none !important;
                backdrop-filter: none !important;
              }
            }
            body {
              font-family: 'Space Grotesk', sans-serif;
              padding: 2rem;
              max-width: 1100px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div>${content}</div>
          <script>
            setTimeout(() => { window.print(); window.close(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <motion.button
      onClick={handleExport}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/30 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
    >
      <FileDown size={14} strokeWidth={1.5} />
      <span className="text-[9px] uppercase tracking-[0.3em] font-medium">
        {t("general.exportPdf")}
      </span>
    </motion.button>
  );
}
