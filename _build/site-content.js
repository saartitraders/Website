// All website text that is not in the app: home page, About page, page titles, alt texts
// and the footer disclaimer. Legal texts, FAQ answers and contact details are NOT here:
// build-site.js reads them from the app so the website always matches the app.
//
// Content rules: describe only what the v1 app really does. No made-up numbers, reviews,
// testimonials or bank/Google/CIBIL logos. Figures on the CSS cards are always labelled
// "Example figures". Photo alt texts describe the person, never call them a customer.

/**
 * Google Play link. Leave empty while the app is not live: the site then shows a
 * "Coming soon on Google Play" button with no link and no Google/Play logo.
 * Fill it in (https://play.google.com/store/apps/details?id=...) to show "Get it on Google Play".
 */
const PLAY_STORE_URL = '';

/**
 * Used in the website's legal texts only while the app's BACKUP_RETENTION_TEXT still says
 * [TO BE FILLED]. Once the app has a real value, the app's value is used.
 */
const BACKUP_RETENTION_TEXT_OVERRIDE = 'We do not keep separate backups of your data.';

const FOOTER_DISCLAIMER = 'SAARTI is an information and tracking tool. It is not a bank or lender, does not give loans, and is not linked to CIBIL/TransUnion or any bank. It does not give financial advice.';

// Every FAQ question from the app goes in one of these categories. Questions are matched by
// their exact text (with SAARTI filled in). A question not listed here goes to the first
// category, and the build prints a warning. The order here is the order on the home page,
// which shows the first two of each category.
const FAQ_CATEGORIES = [
  {
    id: 'data',
    name: 'Data & privacy',
    questions: [
      'Is my data safe?',
      'Does SAARTI read my SMS, bank account or contacts?',
      'How do I download or delete my data and my account?',
      'How do I change my password, or reset it if I forgot it?',
      'How do I contact you?',
    ],
  },
  {
    id: 'cibil',
    name: 'CIBIL report',
    questions: [
      'How do I get my CIBIL report PDF and what happens to it after I upload it?',
    ],
  },
  {
    id: 'dues',
    name: 'Dues & reminders',
    questions: [
      'How is "Due This Month" calculated?',
      'How do bill reminders work?',
      'How do I mark a bill as paid, and why am I asked "Did you pay?"',
      'Why can the calculated due differ from my bank statement?',
      'Why is a card EMI not added to the total due?',
      'How do I add cards, card EMIs and loans?',
      'How do I edit or delete a card or loan?',
    ],
  },
];

// <title> and meta description per page
const PAGES = {
  'index.html': {
    title: 'SAARTI – Track your credit cards, loans and EMIs',
    description: 'SAARTI keeps your credit cards, loans and EMIs in one place, shows what is due this month, reminds you before due dates and checks your CIBIL report against your own records.',
  },
  'privacy-policy.html': {
    title: 'Privacy Policy | SAARTI',
    description: 'What personal data the SAARTI app collects, why, who handles it, how long it is kept and what you can do about it.',
  },
  'terms-and-conditions.html': {
    title: 'Terms of Service | SAARTI',
    description: 'The terms that apply when you use the SAARTI app.',
  },
  'delete-account.html': {
    title: 'Delete your account | SAARTI',
    description: 'How to delete your SAARTI account and all your data, in the app or by email.',
  },
  'faq.html': {
    title: 'Help & FAQ | SAARTI',
    description: 'Answers to common questions about SAARTI: your data, your CIBIL report, monthly dues and bill reminders.',
  },
  'about.html': {
    title: 'About | SAARTI',
    description: 'SAARTI is an Android app by Saarti Traders to track your credit cards, loans and EMIs in one place.',
  },
  'contact.html': {
    title: 'Contact | SAARTI',
    description: 'Contact SAARTI support or our Grievance Officer.',
  },
  '404.html': {
    title: 'Page not found | SAARTI',
    description: 'This page could not be found.',
  },
};

const HOME = {
  hero: {
    eyebrow: 'Debt & Financial Management',
    titleBefore: 'Every card and loan. ',
    titleEm: 'One clear',
    titleAfter: ' monthly plan.',
    lead: 'SAARTI keeps your credit cards, loans and EMIs in one place, shows what is due this month, reminds you before due dates and checks your CIBIL report against your own records.',
    secondaryCta: 'See how it works',
    trust: ['No card number, CVV or PIN', 'Made for India'],
    screen: 'assets/images/screens/screen-1-home.jpg',
    // Example cards drawn with CSS; the figures are labelled "Example figures" on the page
    cards: [
      { colour: 'navy', last4: '4821', left: 'Due on 22nd', right: 'Limit ₹1,00,000' },
      { colour: 'blue', last4: '7730', left: 'Due on 5th', right: '11% used' },
    ],
    chips: [
      { icon: 'bell', title: 'Bill reminder', text: '3 days before your due date' },
      { icon: 'chart', title: 'Limit vs utilisation', text: 'See how much of your limit you use' },
    ],
  },

  steps: [
    { title: 'Add cards & loans', text: 'Type them in, or read them from your CIBIL report.' },
    { title: 'Upload your CIBIL PDF', text: 'AI reads your score and accounts. The PDF is deleted after.' },
    { title: 'Compare & fix', text: 'See what does not match and how to raise a dispute.' },
    { title: 'Pay on time', text: 'One monthly due, reminders, and mark bills as paid.' },
  ],

  features: {
    eyebrow: 'What SAARTI does',
    title: 'Everything for your debt, in one app',
    // faq: exact app FAQ question for the "Learn more" link; null = no link
    items: [
      { icon: 'card', title: 'Cards & loans', text: 'Limit, outstanding, EMIs and due dates for every card and loan, in one list.', faq: 'How do I add cards, card EMIs and loans?' },
      { icon: 'calendar', title: 'Monthly due', text: 'One total for this month. Mark a bill as paid and the total updates.', faq: 'How is "Due This Month" calculated?' },
      { icon: 'bell', title: 'Bill reminders', text: 'Notifications on your phone before each due date. Only the bank name, never an amount.', faq: 'How do bill reminders work?' },
      { icon: 'file', title: 'CIBIL PDF, read by AI', text: 'Upload your report PDF. Your score and accounts are picked out for you, then the PDF is deleted.', faq: 'How do I get my CIBIL report PDF and what happens to it after I upload it?' },
      { icon: 'swap', title: 'Compare & dispute', text: 'CIBIL vs your own data, side by side. Steps to dispute on the CIBIL website.', faq: null },
      { icon: 'calc', title: 'EMI calculator', text: 'EMI, total interest and a year-by-year plan from amount, rate and tenure.', faq: null },
      { icon: 'download', title: 'Download your data', text: 'Get everything you saved as a PDF or Excel file, any time.', faq: 'How do I download or delete my data and my account?' },
    ],
  },

  cards: {
    eyebrow: 'Your cards',
    title: 'Every card in its own colour',
    text: 'Pick a colour for each card so you know it at a glance. Each one shows its limit, outstanding, what is left, and how much of the limit you use.',
    fan: [
      { colour: 'rose', last4: '1209', left: 'Card 4', right: 'Due 18th' },
      { colour: 'teal', last4: '5561', left: 'Card 3', right: 'Due 10th' },
      { colour: 'violet', last4: '7730', left: 'Card 2', right: 'Due 5th' },
      { colour: 'navy', last4: '4821', left: 'Card 1', right: 'Due 22nd' },
    ],
    meter: { limit: '₹1,00,000', outstanding: '₹11,000', percent: 11 },
    note: 'Example figures. We only ask for the last 4 digits of a card.',
  },

  due: {
    eyebrow: 'Monthly due',
    title: 'Know what to pay this month',
    text: 'SAARTI adds up every card bill and loan EMI into one number, and takes off what you have already paid.',
    screen: 'assets/images/screens/screen-3-monthly-due.jpg',
    checks: [
      'Card bills and loan EMIs in one total',
      'Mark paid, and your outstanding updates',
      'Reminders 3 days before, 1 day before and on the due date',
    ],
    paid: [
      { label: 'Card bill', pill: 'Paid', kind: 'ok' },
      { label: 'Home loan EMI', pill: 'Due in 3 days', kind: 'soon' },
    ],
    remind: { title: 'Did you pay?', text: 'A due date passed. Tap Mark paid so your totals stay right.' },
  },

  cibil: {
    eyebrow: 'CIBIL report',
    title: 'Check your report against your own records',
    tabs: [
      {
        label: '1 · Upload PDF',
        screen: 'assets/images/screens/screen-5-cibil-upload.jpg',
        alt: 'CIBIL tab in SAARTI with the Upload CIBIL Report button',
        title: 'Upload your CIBIL report PDF',
        text: 'Download your report from the CIBIL website and upload the PDF in the CIBIL tab. AI reads your score, cards and loans from it. The PDF is deleted right after it is read; only the details picked out are kept.',
        note: 'You choose to upload. SAARTI does not connect to your bank or to CIBIL.',
      },
      {
        label: '2 · Compare',
        screen: 'assets/images/screens/screen-4-compare.jpg',
        alt: 'Compare tab showing CIBIL accounts next to the accounts typed in by hand',
        title: 'See what does not match',
        text: 'Compare puts the accounts on your CIBIL report next to the ones you typed in. Mark each row OK or Wrong, and flag accounts that are not yours.',
        note: 'Comparing does not change your CIBIL report.',
      },
      {
        label: '3 · Dispute',
        screen: 'assets/images/screens/screen-2-my-data.jpg',
        alt: 'My Data tab with cards and loans',
        title: 'Raise a dispute on the CIBIL website',
        text: 'If something on your report is wrong, the app shows you how to raise a dispute with CIBIL yourself, and keeps your own records correct in the meantime.',
        note: 'SAARTI is not linked to CIBIL or TransUnion.',
      },
    ],
  },

  gallery: {
    eyebrow: 'Inside the app',
    title: 'A look at SAARTI',
    items: [
      { screen: 'assets/images/screens/screen-1-home.jpg', alt: 'SAARTI Home dashboard', caption: 'Home' },
      { screen: 'assets/images/screens/screen-2-my-data.jpg', alt: 'My Data tab with cards and loans', caption: 'My Data' },
      { screen: 'assets/images/screens/screen-3-monthly-due.jpg', alt: 'Monthly Due screen', caption: 'Monthly Due' },
      { screen: 'assets/images/screens/screen-4-compare.jpg', alt: 'Compare tab', caption: 'Compare' },
      { screen: 'assets/images/screens/screen-5-cibil-upload.jpg', alt: 'CIBIL tab', caption: 'CIBIL' },
    ],
  },

  privacy: {
    eyebrow: 'Privacy',
    title: 'Your data, your control',
    items: [
      { icon: 'lock', title: 'No sensitive codes', text: 'Never your full card number, CVV, PIN or bank password.' },
      { icon: 'fileDone', title: 'PDF deleted after reading', text: 'Only the details picked out are kept.' },
      { icon: 'download', title: 'Download your data', text: 'As PDF or Excel, whenever you want.' },
      { icon: 'bin', title: 'Delete any time', text: 'Delete your account and all your data from Profile.' },
    ],
  },

  faq: {
    eyebrow: 'Help & FAQ',
    title: 'Questions people ask',
    allLabel: 'All questions',
    perCategory: 2,
  },

  cta: {
    eyebrow: 'Android first',
    titleSoon: 'SAARTI is coming soon on Google Play',
    titleLive: 'SAARTI is on Google Play',
    textSoon: 'The Android app is almost ready. iPhone comes after that.',
    textLive: 'Download SAARTI for Android from Google Play.',
    image: 'assets/images/people/model-cta.jpg',
    alt: 'Young woman showing the SAARTI app on her phone',
  },
};

const ABOUT = {
  eyebrow: 'About SAARTI',
  title: 'A simple way to keep track of your debt',
  intro: 'SAARTI is an Android app made by Saarti Traders. It keeps your credit cards, loans and EMIs in one place, shows what is due this month, reminds you before due dates and helps you check your CIBIL report against your own records.',
  image: 'assets/images/people/model-cta.jpg',
  alt: 'Young woman showing the SAARTI app on her phone',
  sections: [
    {
      title: 'What SAARTI does',
      bullets: [
        'Keeps your credit cards and loans in one list, with limits, outstanding amounts, EMIs and due dates.',
        'Shows one total for what is due this month. Mark a bill as paid and the total updates.',
        'Sets bill reminders on your phone before each due date, if you turn them on.',
        'Reads your CIBIL report PDF with AI to pick out your score and accounts. The PDF is deleted right after it is read.',
        'Puts your CIBIL accounts next to your own records and shows how to raise a dispute on the CIBIL website.',
        'Works out EMI, total interest and a year-by-year plan with the EMI calculator.',
        'Lets you download your data as a PDF or Excel file, and delete your account at any time.',
      ],
    },
    {
      title: 'What SAARTI is not',
      bullets: [
        'It is not a bank or lender, and it does not give loans.',
        'It is not linked to CIBIL/TransUnion or to any bank.',
        'It does not give financial advice. You make your own decisions.',
      ],
    },
    {
      title: 'Your data',
      bullets: [
        'Everything in My Data is what you type in. SAARTI does not read your SMS or contacts and does not connect to your bank.',
        'We never ask for your full card number, CVV, PIN, OTPs or bank passwords.',
        'We do not show ads and we do not sell your data.',
      ],
    },
  ],
};

module.exports = { PLAY_STORE_URL, BACKUP_RETENTION_TEXT_OVERRIDE, FOOTER_DISCLAIMER, FAQ_CATEGORIES, PAGES, HOME, ABOUT };
