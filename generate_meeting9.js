const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, AlignmentType, BorderStyle, WidthType, HeadingLevel,
  UnderlineType, ShadingType,
} = require('docx');
const fs = require('fs');

const FONT = 'Courier New';
const SIZE = 20; // half-points = 10pt

function makeRun(text, opts = {}) {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size || SIZE,
    bold: opts.bold || false,
    italics: opts.italics || false,
  });
}

function makePara(runs, alignment) {
  if (typeof runs === 'string') runs = [makeRun(runs)];
  return new Paragraph({ children: runs, alignment: alignment || AlignmentType.LEFT });
}

function heading(text) {
  return new Paragraph({
    children: [makeRun(text, { bold: true })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 200 },
  });
}

function bodyPara(text) {
  return new Paragraph({
    children: [makeRun(text)],
    alignment: AlignmentType.LEFT,
    spacing: { after: 120 },
  });
}

function bulletPara(text) {
  return new Paragraph({
    children: [makeRun(text)],
    bullet: { level: 0 },
    alignment: AlignmentType.LEFT,
  });
}

function emptyLine() {
  return new Paragraph({ children: [new TextRun('')] });
}

const borderSingle = {
  style: BorderStyle.SINGLE,
  size: 4,
  color: '000000',
};
const allBorders = { top: borderSingle, bottom: borderSingle, left: borderSingle, right: borderSingle };

function infoRow(label, value) {
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [makeRun(label, { bold: true })], alignment: AlignmentType.CENTER })],
        borders: allBorders,
        width: { size: 30, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({ children: [makeRun(value)], alignment: AlignmentType.LEFT })],
        borders: allBorders,
        width: { size: 70, type: WidthType.PERCENTAGE },
      }),
    ],
  });
}

const infoTable = new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    infoRow('Module / Project', 'COMP208 Project'),
    infoRow('Team number', '36'),
    infoRow('Meeting number', '9'),
    infoRow('Date', '24 April 2026'),
    infoRow('Time', '10:30\u201312:00'),
    infoRow('Location', 'Online'),
    infoRow('Chair', 'Pengyu Chen'),
    infoRow('Minute-talker', 'Pengyu Chen'),
    infoRow('Present', 'Futian Bi, Pengyu Chen'),
    infoRow('Apologies', 'None'),
  ],
});

const hrBorder = {
  paragraph: {
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    },
  },
};

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: { top: 720, bottom: 720, left: 1000, right: 1000 },
        },
      },
      children: [
        // Title
        new Paragraph({
          children: [makeRun('COMP208 Project \u2014 Team Minutes', { bold: true, size: 40 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        // Subtitle
        new Paragraph({
          children: [makeRun('Meeting 9 Minutes', { size: 32 })],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
        }),
        emptyLine(),

        // Info table
        infoTable,
        emptyLine(),

        // Agenda
        new Paragraph({
          children: [makeRun('Agenda (shared before the meeting)', { bold: true })],
          spacing: { before: 200 },
        }),
        emptyLine(),
        bulletPara('Actions from previous meeting'),
        bulletPara('Summary of current work progress'),
        bulletPara('Review of frontend completion and improvements'),
        bulletPara('Back-end development update'),
        bulletPara('System testing results'),
        bulletPara('Task allocation for final phase'),
        bulletPara('Next meeting'),
        emptyLine(),

        // Divider
        new Paragraph({ children: [new TextRun('')], border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } } }),
        emptyLine(),

        // Minutes heading
        new Paragraph({ children: [makeRun('Minutes', { bold: true })] }),
        emptyLine(),

        // 1. Actions from previous meeting
        heading('1. Actions from previous meeting (Meeting Eight)'),
        bodyPara('Actions: Futian Bi to build the HTML structure of all pages, set up basic layout and organise page content \u2014 Completed.'),
        bodyPara('Actions: Pengyu Chen to implement CSS styling, add JavaScript interactions, optimise visual effects and ensure stable display across all pages \u2014 Completed.'),
        bodyPara('Actions: Both members to cooperate on frontend testing, bug fixing and performance optimisation \u2014 Completed.'),
        emptyLine(),

        // 2.
        heading('2. Summary of current work progress'),
        bodyPara('Each member reported their individual progress. Futian Bi confirmed that all HTML page structures have been completed, including the homepage, product listing page, product detail page, shopping cart page and user profile page. Pengyu Chen confirmed that CSS styling and JavaScript interactions have been fully applied across all pages, with responsive design verified on multiple screen sizes. Both members agreed that the frontend development phase is largely complete and ready for integration with the backend.'),
        emptyLine(),

        // 3.
        heading('3. Review of frontend completion and improvements'),
        bodyPara('The team reviewed the completed frontend pages together. Several minor UI inconsistencies were identified and corrected, including button alignment on the cart page and font sizing in the navigation bar. The team also agreed to improve the loading performance of product images and to add basic form validation feedback messages for the login and registration pages. These improvements were assigned and are expected to be completed before the next meeting.'),
        emptyLine(),

        // 4.
        heading('4. Back-end development update'),
        bodyPara('Pengyu Chen provided an update on the current state of the backend. The Node.js server and database connection have been set up. Core API endpoints for user authentication, product browsing, and shopping cart management are functional. Integration between the frontend pages and the backend APIs is ongoing. Remaining backend tasks include the seller rating system, order history retrieval, and admin management functions.'),
        emptyLine(),

        // 5.
        heading('5. System testing results'),
        bodyPara('Initial system testing was conducted covering user registration, login, product listing, and cart operations. The majority of tested functions performed as expected. Two bugs were identified: an intermittent session timeout issue during checkout, and an image upload failure for listings with more than three images. Both issues have been logged and will be prioritised for fixing before the final submission. Further end-to-end testing will continue in the next development cycle.'),
        emptyLine(),

        // 6.
        heading('6. Task allocation for final phase'),
        bodyPara('Futian Bi is responsible for fixing the identified frontend UI issues, improving image loading performance, and assisting with end-to-end testing. Pengyu Chen is responsible for resolving the two reported backend bugs, completing the remaining API endpoints, and finalising backend\u2013frontend integration. Both members will jointly conduct comprehensive system testing and prepare project documentation for the final submission.'),
        emptyLine(),

        // 7. AOB
        new Paragraph({
          children: [
            makeRun('7. Any other business', { bold: true }),
            makeRun('  No additional issues were raised during this meeting.'),
          ],
          spacing: { after: 120 },
        }),
        emptyLine(),

        // 8. Next meeting
        heading('8. Next meeting'),
        bodyPara('The next meeting will verify that all identified bugs have been resolved, conduct a final round of system testing, and review the completed documentation. The team will also confirm the final submission checklist and ensure all deliverables are in order.'),
        emptyLine(),

        // Bottom divider
        new Paragraph({ children: [new TextRun('')], border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' } } }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  const outPath = 'E:/campus-trading-team36/Team36-Minutes-20260424.docx';
  fs.writeFileSync(outPath, buffer);
  console.log('Saved:', outPath);
});
