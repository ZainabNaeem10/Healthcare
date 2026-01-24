const PDFDocument = require("pdfkit");
const fs = require("fs");

exports.generatePrescriptionPDF = (prescription, filePath) => {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(20).text("Prescription", { align: "center" });
  doc.moveDown();

  doc.fontSize(14).text(`Patient ID: ${prescription.patientId}`);
  doc.text(`Doctor ID: ${prescription.doctorId}`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  doc.text("Medicines:", { underline: true });
  prescription.medicines.forEach((med, i) => {
    doc.text(`${i + 1}. ${med.name} - ${med.dosage} - ${med.duration}`);
  });

  if (prescription.notes) {
    doc.moveDown();
    doc.text("Notes:");
    doc.text(prescription.notes);
  }

  doc.end();
};
