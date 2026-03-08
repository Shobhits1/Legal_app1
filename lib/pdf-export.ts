import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface FIRData {
  id: string;
  firNumber?: string;
  title: string;
  description: string;
  incidentDate: string;
  location: string;
  complainant: string;
  accused?: string;
  priority: string;
  status: string;
  sections?: Array<{
    act: string;
    section: string;
    title: string;
  }>;
  createdAt: string;
}

export async function exportFIRToPDF(firData: FIRData): Promise<void> {
  try {
    const pdf = new jsPDF();
    let yPos = 15;
    const margin = 15;
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;

    // Outer Border
    pdf.setLineWidth(0.5);
    pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Header section
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('GOVERNMENT OF INDIA', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;

    pdf.setFontSize(14);
    pdf.text('POLICE DEPARTMENT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    // Title
    pdf.setFontSize(18);
    pdf.setLineWidth(0.3);
    pdf.text('FIRST INFORMATION REPORT', pageWidth / 2, yPos, { align: 'center' });
    pdf.line(pageWidth / 2 - 45, yPos + 2, pageWidth / 2 + 45, yPos + 2); // underline
    yPos += 8;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'italic');
    pdf.text('(Under Section 154 Cr.P.C.)', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Basic Info Block
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    const issueDate = firData.createdAt ? new Date(firData.createdAt).toLocaleDateString() : new Date().toLocaleDateString();

    // Draw a box around basic info
    pdf.rect(margin, yPos - 5, pageWidth - margin * 2, 18);
    pdf.text(`1. District: State Police`, margin + 2, yPos);
    pdf.text(`P.S.: Central Hub`, margin + 65, yPos);
    pdf.text(`Year: ${new Date().getFullYear()}`, margin + 115, yPos);
    pdf.text(`FIR No: ${firData.firNumber || firData.id.slice(0, 8)}`, margin + 145, yPos);
    yPos += 8;

    pdf.text(`   Date: ${issueDate}`, margin + 2, yPos);
    pdf.text(`Priority: ${firData.priority}`, margin + 65, yPos);
    pdf.text(`Status: ${firData.status}`, margin + 115, yPos);
    yPos += 15;

    // Check if sections exist to print
    if (firData.sections && firData.sections.length > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`2. Acts and Sections:`, margin, yPos);
      yPos += 3;

      const tableData = firData.sections.map((s, index) => [
        (index + 1).toString(),
        s.act || 'IPC',
        s.section,
        s.title
      ]);

      autoTable(pdf, {
        startY: yPos,
        head: [['S.No.', 'Act', 'Section', 'Offense Description']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 3 },
        margin: { left: margin, right: margin }
      });

      yPos = (pdf as any).lastAutoTable.finalY + 12;
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`2. Acts and Sections: Not specified initially`, margin, yPos);
      yPos += 10;
    }

    // Incident details
    pdf.setFont('helvetica', 'bold');
    pdf.text(`3. (a) Occurrence of Offense:`, margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date & Time: ${firData.incidentDate.replace('T', ' ')}`, margin + 60, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text(`   (b) Information received at P.S.:`, margin, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${issueDate}    Time: ${new Date().toLocaleTimeString()}`, margin + 60, yPos);
    yPos += 10;
    pdf.line(margin, yPos - 3, pageWidth - margin, yPos - 3);

    // Place
    pdf.setFont('helvetica', 'bold');
    pdf.text(`4. Place of Occurrence:`, margin, yPos);
    pdf.setFont('helvetica', 'normal');
    const placeLines = pdf.splitTextToSize(firData.location, pageWidth - margin - 60);
    pdf.text(placeLines, margin + 50, yPos);
    yPos += (placeLines.length * 5) + 5;
    pdf.line(margin, yPos - 3, pageWidth - margin, yPos - 3);

    // Complainant
    pdf.setFont('helvetica', 'bold');
    pdf.text(`5. Complainant / Informant:`, margin, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`(a) Name: ${firData.complainant}`, margin + 5, yPos);
    pdf.text(`(b) Nationality: Indian`, margin + 85, yPos);
    yPos += 10;
    pdf.line(margin, yPos - 3, pageWidth - margin, yPos - 3);

    // Accused
    pdf.setFont('helvetica', 'bold');
    pdf.text(`6. Details of known/suspected accused with full particulars:`, margin, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.text(firData.accused ? firData.accused : 'Unknown / Not specified', margin + 5, yPos);
    yPos += 10;
    pdf.line(margin, yPos - 3, pageWidth - margin, yPos - 3);

    // Narrative
    pdf.setFont('helvetica', 'bold');
    pdf.text(`7. FIR Contents (Attach separate sheet, if required):`, margin, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Title: ${firData.title}`, margin + 5, yPos);
    yPos += 7;

    // Add narrative box
    const narrativeLines = pdf.splitTextToSize(firData.description, pageWidth - margin * 2 - 4);

    // Check if we need a new page for description
    if (yPos + (narrativeLines.length * 5) > pageHeight - 40) {
      pdf.addPage();
      // Outer Border for new page
      pdf.setLineWidth(0.5);
      pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
      yPos = 20;
    }

    pdf.rect(margin, yPos - 3, pageWidth - margin * 2, (narrativeLines.length * 5) + 6);
    pdf.text(narrativeLines, margin + 2, yPos + 2);
    yPos += (narrativeLines.length * 5) + 15;

    // Check if bottom signatures fit, else add page
    if (yPos > pageHeight - 40) {
      pdf.addPage();
      pdf.setLineWidth(0.5);
      pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);
      yPos = pageHeight - 40;
    } else {
      yPos = pageHeight - 40;
    }

    // Signatures
    pdf.setFont('helvetica', 'normal');
    pdf.line(margin, yPos, margin + 60, yPos);
    pdf.text('Signature / Thumb Impression', margin + 5, yPos + 5);
    pdf.text('of the Complainant / Informant', margin + 5, yPos + 10);

    pdf.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos);
    pdf.text('Signature of Officer-in-Charge', pageWidth - margin - 55, yPos + 5);
    pdf.text('Police Station', pageWidth - margin - 35, yPos + 10);

    // Download the PDF
    const safeId = (firData.firNumber || firData.id || 'Unknown').toString().replace(/[^a-z0-9]/gi, '_');
    const safeTitle = (firData.title || 'FIR').toString().substring(0, 15).replace(/[^a-z0-9]/gi, '_');
    const fileName = `FIR_${safeId}_${safeTitle}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

export async function exportReportToPDF(reportData: any): Promise<void> {
  try {
    const pdf = new jsPDF();

    // Header
    pdf.setFontSize(20);
    pdf.setTextColor(0, 0, 128);
    pdf.text('LEGAL AI SYSTEM REPORT', 105, 30, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Analytics & Performance Summary', 105, 45, { align: 'center' });

    let yPosition = 70;

    // Key Metrics
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Metrics', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    // Metrics data
    const metrics = [
      `Total FIRs Processed: ${reportData.totalFIRs || 0}`,
      `AI Accuracy Rate: ${reportData.accuracyRate || 0}%`,
      `Average Processing Time: ${reportData.avgProcessingTime || 0} minutes`,
      `Registered Officers: ${reportData.activeUsers || 0}`,
    ];

    metrics.forEach(metric => {
      pdf.text(metric, 25, yPosition);
      yPosition += 10;
    });

    yPosition += 10;

    // Category Distribution
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('FIR Category Distribution', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    if (reportData.categoryDistribution && reportData.categoryDistribution.length > 0) {
      reportData.categoryDistribution.forEach((category: any) => {
        pdf.text(`${category.category}: ${category.percentage}%`, 25, yPosition);
        yPosition += 10;
      });
    }

    // Footer
    const pageHeight = pdf.internal.pageSize.height;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Generated by LegalAI - Police Digital Assistant', 105, pageHeight - 20, { align: 'center' });
    pdf.text(`Report Date: ${new Date().toLocaleString()}`, 105, pageHeight - 10, { align: 'center' });

    // Download the PDF
    const fileName = `LegalAI_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating report PDF:', error);
    throw new Error('Failed to generate report PDF');
  }
}
