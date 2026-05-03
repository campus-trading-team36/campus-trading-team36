const {
  Document, Packer, Paragraph, TextRun, ExternalHyperlink,
  AlignmentType, BorderStyle, HeadingLevel, LevelFormat,
  PageBreak, TableOfContents
} = require('docx');
const fs = require('fs');

const BLUE = '00529b';
const DARK = '1a1a2e';
const MUTED = '555555';
const LIGHT_BG = 'E8F0FB';

function h1(text) {
  return new Paragraph({
    spacing: { before: 320, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: BLUE, space: 6 } },
    children: [new TextRun({ text, bold: true, size: 32, color: BLUE, font: 'Arial' })]
  });
}

function h2(text) {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    children: [new TextRun({ text, bold: true, size: 24, color: BLUE, font: 'Arial' })]
  });
}

function h3(text) {
  return new Paragraph({
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text, bold: true, size: 22, color: DARK, font: 'Arial' })]
  });
}

function p(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 80 },
    children: [new TextRun({ text, size: 20, font: 'Arial', color: DARK, ...opts })]
  });
}

function note(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    indent: { left: 400 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 8 } },
    children: [new TextRun({ text, size: 19, font: 'Arial', color: '444444', italics: true })]
  });
}

function tip(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    indent: { left: 400 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: '2a9d3f', space: 8 } },
    children: [new TextRun({ text: '\u2705  ' + text, size: 19, font: 'Arial', color: '1a4d2e' })]
  });
}

function warn(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    indent: { left: 400 },
    border: { left: { style: BorderStyle.SINGLE, size: 12, color: 'e63946', space: 8 } },
    children: [new TextRun({ text: '\u26a0\ufe0f  ' + text, size: 19, font: 'Arial', color: '7a1c24' })]
  });
}

function bullet(text, bold_part = '') {
  const children = [];
  if (bold_part) {
    children.push(new TextRun({ text: bold_part + ' ', bold: true, size: 20, font: 'Arial', color: DARK }));
    children.push(new TextRun({ text, size: 20, font: 'Arial', color: DARK }));
  } else {
    children.push(new TextRun({ text, size: 20, font: 'Arial', color: DARK }));
  }
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 40, after: 40 },
    children
  });
}

function step(text, bold_part = '') {
  const children = [];
  if (bold_part) {
    children.push(new TextRun({ text: bold_part + '  ', bold: true, size: 20, font: 'Arial', color: DARK }));
    children.push(new TextRun({ text, size: 20, font: 'Arial', color: DARK }));
  } else {
    children.push(new TextRun({ text, size: 20, font: 'Arial', color: DARK }));
  }
  return new Paragraph({
    numbering: { reference: 'steps', level: 0 },
    spacing: { before: 60, after: 60 },
    children
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun('')] });
}

function labelValue(label, value, isLink = false) {
  if (isLink) {
    return new Paragraph({
      spacing: { before: 50, after: 50 },
      children: [
        new TextRun({ text: label + ': ', bold: true, size: 20, font: 'Arial', color: DARK }),
        new ExternalHyperlink({
          link: value,
          children: [new TextRun({ text: value, size: 20, font: 'Arial', color: BLUE, underline: {} })]
        })
      ]
    });
  }
  return new Paragraph({
    spacing: { before: 50, after: 50 },
    children: [
      new TextRun({ text: label + ': ', bold: true, size: 20, font: 'Arial', color: DARK }),
      new TextRun({ text: value, size: 20, font: 'Arial', color: DARK })
    ]
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 560, hanging: 280 } } } }]
      },
      {
        reference: 'steps',
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 560, hanging: 280 } } } }]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1080, bottom: 1080, left: 1260, right: 1260 }
      }
    },
    children: [

      // ── COVER ──────────────────────────────────────────────────────
      new Paragraph({ spacing: { before: 800, after: 120 },
        children: [new TextRun({ text: 'UoL Campus Market', bold: true, size: 56, color: BLUE, font: 'Arial' })] }),
      new Paragraph({ spacing: { before: 0, after: 60 },
        children: [new TextRun({ text: 'User Manual', size: 36, color: DARK, font: 'Arial' })] }),
      new Paragraph({
        spacing: { before: 0, after: 400 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: BLUE, space: 8 } },
        children: [new TextRun({ text: 'COMP208 Group Project  \u2022  Team 36  \u2022  University of Liverpool', size: 20, color: MUTED, font: 'Arial' })]
      }),
      p('This manual explains how to access, install, and use the UoL Campus Market platform. It covers three user roles: Guest, Registered Student, and Administrator. All sections are written as step-by-step instructions.'),
      spacer(),
      labelValue('Live Website', 'http://38.65.91.221:8080', true),
      labelValue('Source Code', 'https://github.com/campus-trading-team36/campus-trading-team36', true),
      labelValue('Admin Login', 'admin@liverpool.ac.uk  /  admin123'),
      labelValue('Platform', 'Web browser (Chrome, Firefox, Safari, Edge) — no app download needed'),
      pageBreak(),

      // ── SECTION 1: OVERVIEW ────────────────────────────────────────
      h1('1. Platform Overview'),
      p('UoL Campus Market is a second-hand trading website built specifically for University of Liverpool students. It lets students sell items they no longer need and buy from other students in a safe, closed environment. Only university email addresses can register.'),
      spacer(),
      h2('1.1 User Types'),
      bullet('Guest — can browse and search all listings without an account.'),
      bullet('Registered Student — can buy, sell, message, leave reviews, and manage a personal profile.'),
      bullet('Administrator — has extra controls to manage reports, remove content, and view all users.'),
      spacer(),
      h2('1.2 Supported Categories'),
      bullet('Electronics, Books, Clothing, Furniture, Sports, Stationery, Other'),
      pageBreak(),

      // ── SECTION 2: GETTING STARTED ────────────────────────────────
      h1('2. Getting Started'),
      h2('2.1 Accessing the Website'),
      p('The platform is hosted online and requires no installation for regular use.'),
      step('Open any web browser (Chrome, Firefox, Safari, or Edge).'),
      step('Go to: http://38.65.91.221:8080'),
      step('The homepage will load showing all available listings.'),
      note('The website works on mobile phones and tablets as well as desktop computers.'),
      spacer(),
      h2('2.2 Running the Code Locally (Developers Only)'),
      p('If you want to run the project on your own computer for development or testing:'),
      step('Install Node.js version 16 or higher from https://nodejs.org'),
      step('Open a terminal (Command Prompt on Windows, Terminal on Mac/Linux).'),
      step('Run:  git clone https://github.com/campus-trading-team36/campus-trading-team36.git'),
      step('Run:  cd campus-trading-team36'),
      step('Run:  npm install'),
      step('Run:  npm start'),
      step('Open http://localhost:8080 in your browser.'),
      tip('The server creates a data.json file automatically on first run with 10 sample products.'),
      pageBreak(),

      // ── SECTION 3: GUEST ──────────────────────────────────────────
      h1('3. Guest User Guide'),
      p('You do not need an account to browse the marketplace.'),
      h2('3.1 Browsing Listings'),
      step('On the homepage, all approved products are shown as cards in a grid.'),
      step('Each card shows the product photo, title, price, condition, and seller name.'),
      step('Click any card to open the full product detail view with more photos and description.'),
      spacer(),
      h2('3.2 Searching and Filtering'),
      step('Type keywords into the search box at the top — searches titles, descriptions, brands, and tags.'),
      step('Use the category buttons (Electronics, Books, etc.) to filter by type.'),
      step('Use the price range fields (Min / Max) to filter by budget.'),
      step('Use the Condition dropdown to filter by product condition.'),
      step('Use the Sort dropdown to order results by Newest, Price Low\u2013High, Price High\u2013Low, or Most Viewed.'),
      step('Click Clear to reset all filters.'),
      note('You need to log in to contact sellers, save favourites, or add items to your cart.'),
      pageBreak(),

      // ── SECTION 4: REGISTERED STUDENT ────────────────────────────
      h1('4. Registered Student Guide'),
      h2('4.1 Creating an Account'),
      step('Click Register in the top navigation bar.'),
      step('Enter a username (2\u201320 characters).'),
      step('Enter your University of Liverpool email address (@liverpool.ac.uk or @student.liverpool.ac.uk).'),
      step('Click Send Code. A 6-digit verification code will appear on screen (demo mode).'),
      step('Enter the code in the verification field.'),
      step('Choose a password (minimum 6 characters).'),
      step('Click Create Account. You will be logged in automatically.'),
      warn('Only University of Liverpool email addresses are accepted. Personal email addresses will be rejected.'),
      spacer(),
      h2('4.2 Logging In and Out'),
      step('Click Login in the navigation bar.'),
      step('Enter your university email and password.'),
      step('Click Log In. You will be taken back to the homepage.'),
      step('To log out, click Logout in the navigation bar.'),
      spacer(),
      h2('4.3 Your Profile'),
      step('Click Profile in the navigation bar after logging in.'),
      p('Your profile page shows a summary of your activity:'),
      bullet('Total Listings, Active listings, Sold items'),
      bullet('Favourites count, Cart count, Browsing history count'),
      p('You can click any stat card to go directly to that section. The Quick Actions buttons at the bottom let you start a new listing or go to Favourites, Cart, History, or Messages.'),
      spacer(),
      h2('4.4 Creating a Listing'),
      step('Click + New Listing in the navigation bar or on your Profile page.'),
      step('Upload up to 5 photos by clicking the photo area or dragging images onto it. Each image must be JPG, PNG, or WEBP and under 5 MB.'),
      step('Enter a title (required, maximum 100 characters).'),
      step('Select a Category from the dropdown.'),
      step('Select the Condition of the item (New, Like New, Good, or Fair).'),
      step('Enter the Price in pounds (minimum \u00a31).'),
      step('Optionally fill in Brand, Purchase Date, Location (e.g. Carnatic Halls), and a description of any defects.'),
      step('Add Tags by typing a word and pressing Enter or comma. Tags help buyers find your item.'),
      step('Write a Description explaining the item.'),
      step('Click Publish Listing. The item goes live immediately.'),
      tip('Adding photos and accurate condition information leads to faster sales.'),
      spacer(),
      h2('4.5 Managing Your Listings'),
      step('Go to My Listings from the navigation bar.'),
      step('Use the tabs at the top to filter by All, Active, Sold, or Rejected.'),
      step('Click Edit on any active listing to update photos, price, description, or any other field.'),
      step('Click Mark Sold when you have completed a sale. The item will be removed from the public marketplace.'),
      step('Click Delete to permanently remove a listing.'),
      spacer(),
      h2('4.6 Contacting a Seller'),
      step('Open a product\'s detail view by clicking on the listing card.'),
      step('Click Message Seller.'),
      step('You will be taken to a private chat window with the seller.'),
      step('Type your message and press Enter or click Send.'),
      step('To view all your conversations, click Messages in the navigation bar.'),
      spacer(),
      h2('4.7 Favourites'),
      step('Click the heart icon on any product card, or click Favourite inside the product detail view.'),
      step('Access all your saved items from Favourites in the navigation bar or your Profile page.'),
      step('The Favourites page shows the total value of all saved items.'),
      step('Click Remove to take an item out of your favourites.'),
      spacer(),
      h2('4.8 Shopping Cart'),
      step('Open a product detail and click Add to Cart.'),
      step('Access your cart from Cart in the navigation bar or your Profile page.'),
      step('The cart shows the total value of all items.'),
      step('Click Remove next to any item to take it out of the cart.'),
      step('Click Clear All to empty the entire cart.'),
      note('The cart is a personal reminder list. Payment happens directly between buyer and seller.'),
      spacer(),
      h2('4.9 Browsing History'),
      step('Every product you open is automatically saved to your history.'),
      step('Go to History in the navigation bar to see recently viewed items (up to 30).'),
      step('Click any item to open it again.'),
      step('Click Clear History to erase all records.'),
      spacer(),
      h2('4.10 Leaving a Review'),
      step('Open the product detail page for an item.'),
      step('Scroll to the Reviews section at the bottom of the detail panel.'),
      step('Click Write a Review (only shown if you have not already reviewed this listing).'),
      step('Click the star rating from 1 to 5 stars.'),
      step('Optionally add a written comment.'),
      step('Click Submit Review.'),
      note('You cannot review your own listings.'),
      spacer(),
      h2('4.11 Reporting a Listing'),
      step('Open the product detail page.'),
      step('Click the Report button.'),
      step('Describe the issue in the text box and click Submit Report.'),
      p('An admin will review the report and take action if necessary.'),
      pageBreak(),

      // ── SECTION 5: ADMIN ─────────────────────────────────────────
      h1('5. Administrator Guide'),
      p('The admin account has access to an additional dashboard for managing the platform. Log in with admin@liverpool.ac.uk / admin123, then click Admin in the navigation bar.'),
      spacer(),
      h2('5.1 Overview Tab'),
      p('Shows a summary of platform statistics: total users, total products, live listings, sold items, pending reports, and total messages sent.'),
      spacer(),
      h2('5.2 Reports Tab'),
      step('Click the Reports tab in the admin dashboard.'),
      step('Each report shows the reason, the user who submitted it, and the date.'),
      step('Click Remove Content to delete the reported product and resolve the report.'),
      step('Click Dismiss to close the report without taking action.'),
      spacer(),
      h2('5.3 All Users Tab'),
      p('Displays a table of all registered users with their username, email, role, and registration date. This is read-only and used for monitoring.'),
      spacer(),
      h2('5.4 All Products Tab'),
      step('Click the All Products tab to see every listing on the platform regardless of status.'),
      step('Each row shows the product image, title, status badge, category, seller name, date, and view count.'),
      step('Click Delete on any product to remove it from the platform immediately.'),
      warn('Deleting a product also removes it from all users\' favourites and carts. This action cannot be undone.'),
      pageBreak(),

      // ── SECTION 6: TROUBLESHOOTING ────────────────────────────────
      h1('6. Troubleshooting'),
      h2('6.1 Cannot access the website'),
      bullet('Check that you are connected to the internet.'),
      bullet('Try a different browser or clear your browser cache.'),
      bullet('Confirm the URL is exactly http://38.65.91.221:8080 (no https, no trailing slash).'),
      spacer(),
      h2('6.2 Verification code not working'),
      bullet('The code appears on screen directly after clicking Send Code in demo mode.'),
      bullet('Codes expire after a short time. Click Send Code again to get a new one.'),
      spacer(),
      h2('6.3 Image upload fails'),
      bullet('Maximum file size is 5 MB per image. Reduce the file size and try again.'),
      bullet('Only JPG, PNG, WEBP, and GIF formats are supported.'),
      bullet('A maximum of 5 images can be uploaded per listing.'),
      spacer(),
      h2('6.4 Cannot message a seller'),
      bullet('You must be logged in to send messages.'),
      bullet('You cannot message yourself on your own listings.'),
      spacer(),
      h2('6.5 Listing not appearing on homepage'),
      bullet('Listings appear immediately after publishing. Try refreshing the page.'),
      bullet('Check My Listings to confirm the status is Active.'),
      spacer(),

      // ── FOOTER ───────────────────────────────────────────────────
      new Paragraph({
        spacing: { before: 200, after: 0 },
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: 'CCCCCC', space: 6 } },
        children: [new TextRun({
          text: 'UoL Campus Market  \u2022  Team 36  \u2022  COMP208 Group Project  \u2022  University of Liverpool',
          size: 16, color: '999999', font: 'Arial'
        })]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('User_Manual.docx', buf);
  console.log('Done: User_Manual.docx');
});
