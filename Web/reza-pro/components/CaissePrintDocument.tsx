import jsPDF from "jspdf";

interface CaisseSummary {
  totalSales: number;
  totalRefunds: number;
  balance: number;
  startDate: string;
  endDate: string;
}

// Very lightweight placeholder implementation used in production build.
// It generates a simple PDF summary for the cash register report.
export function generateCaissePDF(summary: CaisseSummary) {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Rapport de caisse", 20, 20);

  doc.setFontSize(12);
  doc.text(`Période : ${summary.startDate} → ${summary.endDate}`, 20, 35);
  doc.text(`Total ventes : ${summary.totalSales.toFixed(2)} MAD`, 20, 50);
  doc.text(`Total remboursements : ${summary.totalRefunds.toFixed(2)} MAD`, 20, 60);
  doc.text(`Solde : ${summary.balance.toFixed(2)} MAD`, 20, 70);

  doc.save("caisse.pdf");
}


