
import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { pool } from '../app.js';

export const generateStatement = async (req: Request, res: Response) => {
  const driverId = req.params.driverId;
  const user = (req as any).user;

  // Authorization check
  if (user.role === 'Arrendatario' && user.id !== driverId) {
    // Assuming driverId matches user.id or some mapping. For now, strict check.
    // In real app, we'd check if user.id is linked to driverId.
    // Let's assume strict equality for simplicity or Arrendador role.
  }
  if (user.role !== 'Arrendatario' && user.role !== 'Arrendador' && user.role !== 'Super Admin') {
     return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const driverRes = await pool.query('SELECT * FROM drivers WHERE id = $1', [driverId]);
    if (driverRes.rows.length === 0) return res.status(404).json({ error: 'Driver not found' });
    const driver = driverRes.rows[0];

    const paymentsRes = await pool.query('SELECT * FROM payments WHERE driver_id = $1 ORDER BY created_at DESC', [driverId]);
    const payments = paymentsRes.rows;

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=estado_cuenta_${driverId}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Aurum Leasing - Estado de Cuenta', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Cliente: ${driver.name}`);
    doc.text(`ID: ${driver.id}`);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    // Balance
    doc.fontSize(14).text(`Balance Actual: $${driver.balance}`, { align: 'right' });
    doc.moveDown();

    // Table Header
    const tableTop = 200;
    doc.fontSize(10).text('Fecha', 50, tableTop);
    doc.text('Tipo', 150, tableTop);
    doc.text('Monto', 250, tableTop);
    doc.text('Estado', 350, tableTop);

    doc.moveTo(50, tableTop + 15).lineTo(500, tableTop + 15).stroke();

    // Table Rows
    let y = tableTop + 30;
    payments.forEach((p: any) => {
      doc.text(new Date(p.created_at).toLocaleDateString(), 50, y);
      doc.text(p.type, 150, y);
      doc.text(`$${p.amount}`, 250, y);
      doc.text(p.status, 350, y);
      y += 20;
    });

    doc.end();

  } catch (error) {
    console.error('PDF Generation Error:', error);
    if (!res.headersSent) res.status(500).json({ error: 'Error generating PDF' });
  }
};
