// utils/pdf.js
const PDFDocument = require("pdfkit");

exports.generatePrescriptionPDF = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer); // <-- return buffer instead of file path
      });

      // PDF content
      doc.fontSize(16).text(`Prescription for: ${data.patientName}`);
      doc.fontSize(14).text(`Doctor: ${data.doctorName}`);
      doc.text(`Specialization: ${data.specialization}`);
      doc.text("Medicines:");
      data.medicines.forEach((med, i) => {
        doc.text(`${i + 1}. ${med.name} - ${med.dosage} - ${med.duration}`);
      });
      doc.text(`Notes: ${data.notes || "None"}`);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
