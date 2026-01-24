const PDFDocument = require("pdfkit");
const fs = require("fs");

exports.generatePrescriptionPDF = (data, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);

      // Title
      doc
        .fontSize(22)
        .text("Medical Prescription", { align: "center" })
        .moveDown(2);

      // Patient & Doctor Info
      doc.fontSize(14);
      doc.text(`Patient Name: ${data.patientName}`);
      doc.text(`Doctor Name: ${data.doctorName}`);
      doc.text(`Specialization: ${data.specialization}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      // Medicines
      doc.fontSize(16).text("Medicines", { underline: true });
      doc.moveDown(0.5);

      data.medicines.forEach((med, index) => {
        doc.fontSize(13).text(
          `${index + 1}. ${med.name} | ${med.dosage} | ${med.duration}`
        );
      });

      // Notes
      if (data.notes) {
        doc.moveDown();
        doc.fontSize(16).text("Notes", { underline: true });
        doc.fontSize(13).text(data.notes);
      }

      doc.end();

      stream.on("finish", resolve);
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
};
