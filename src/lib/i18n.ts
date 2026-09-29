/**
 * Interface copy, Arabic and English.
 *
 * Arabic is written first and is the source of truth. The English is a
 * translation of it, not the other way round, which is why a few English strings
 * read slightly plainer than a native English product would: the Arabic sets the
 * register and the English follows.
 */

export type Lang = 'ar' | 'en'

export const LANGS: readonly Lang[] = ['ar', 'en']
export const DIR: Record<Lang, 'rtl' | 'ltr'> = { ar: 'rtl', en: 'ltr' }

export const T = {
  productTagline: { ar: 'مراجعة مسبقة لرخص البناء', en: 'Pre-submission review for building permits' },

  navReview: { ar: 'مراجعة', en: 'Review' },
  navCorpus: { ar: 'البنود المحمّلة', en: 'Loaded clauses' },
  navReport: { ar: 'تقرير تجريبي', en: 'Sample report' },

  heroTitle: {
    ar: 'اعرف ما الذي سيُرفض، قبل أن تبني',
    en: 'Know what will be rejected, before you build',
  },
  heroBody: {
    ar: 'ارفع حزمة المخططات وأعطنا أبعاد الأرض والنطاق. يرجع لك تقرير بكل بند لن يجتاز المراجعة، ومعه نص البند النظامي حرفيًا وموقعه على اللوحة.',
    en: 'Upload the drawing set with the plot dimensions and zone. You get back every item that will not pass, with the clause text exactly as written and its location on the sheet.',
  },
  heroPromise: {
    ar: 'لا يذكر النظام بندًا غير محمّل عنده. ما لا يستطيع ربطه ببند، يعرضه «لم يُفحص» ولا يخمّن.',
    en: 'The system never cites a clause it does not hold. Anything it cannot tie to a loaded clause is shown as not checked, never guessed.',
  },

  uploadTitle: { ar: 'ابدأ مراجعة', en: 'Start a review' },
  uploadDrop: { ar: 'اسحب حزمة المخططات هنا، أو اختر ملفًا', en: 'Drop the drawing set here, or choose a file' },
  uploadHint: { ar: 'ملف PDF واحد، حتى ٥٠ ميجابايت', en: 'One PDF, up to 50 MB' },
  plotWidth: { ar: 'عرض الأرض', en: 'Plot width' },
  plotDepth: { ar: 'عمق الأرض', en: 'Plot depth' },
  zone: { ar: 'النطاق', en: 'Zone' },
  buildingType: { ar: 'نوع المبنى', en: 'Building type' },
  villa: { ar: 'فيلا سكنية', en: 'Residential villa' },
  municipality: { ar: 'الأمانة', en: 'Municipality' },
  startReview: { ar: 'ابدأ المراجعة', en: 'Start review' },

  notWiredTitle: { ar: 'هذه الواجهة غير موصولة بعد', en: 'This form is not wired up yet' },
  notWired: {
    ar: 'قراءة ملفات PDF واستخراج الأبعاد هي الخطوة القادمة. الزر معطّل حتى تكتمل، حتى لا يبدو أن المراجعة جرت وهي لم تجرِ.',
    en: 'PDF reading and dimension extraction come next. The button stays disabled until they exist, so nothing looks like a review that did not happen.',
  },
  seeSample: { ar: 'شاهد تقريرًا تجريبيًا', en: 'See a sample report' },

  fail: { ar: 'مخالف', en: 'Fails' },
  pass: { ar: 'مطابق', en: 'Passes' },
  notChecked: { ar: 'لم يُفحص', en: 'Not checked' },
  suppressed: { ar: 'نتائج مستبعدة', en: 'Suppressed' },

  observed: { ar: 'المقاس على اللوحة', en: 'Measured on sheet' },
  required: { ar: 'المطلوب', en: 'Required' },
  difference: { ar: 'الفرق', en: 'Short by' },
  computed: { ar: 'المحسوب', en: 'Computed' },
  maximum: { ar: 'الحد الأعلى', en: 'Maximum' },
  minimum: { ar: 'الحد الأدنى', en: 'Minimum' },
  sheet: { ar: 'اللوحة', en: 'Sheet' },
  location: { ar: 'الموقع', en: 'Location' },
  locationUnknown: { ar: 'غير محدد على اللوحة', en: 'Not located on the sheet' },
  clause: { ar: 'البند', en: 'Clause' },
  page: { ar: 'صفحة', en: 'Page' },
  confidence: { ar: 'الثقة', en: 'Confidence' },

  reportTitle: { ar: 'تقرير مراجعة مسبقة', en: 'Pre-submission review' },
  plot: { ar: 'قطعة', en: 'Plot' },
  plan: { ar: 'مخطط', en: 'Plan' },
  reference: { ar: 'المرجع', en: 'Reference' },
  clausesLoaded: { ar: 'بندًا محمّلًا', en: 'clauses loaded' },
  exportPdf: { ar: 'تصدير التقرير', en: 'Export report' },

  suppressedTitle: { ar: 'ما استبعده النظام', en: 'What the system suppressed' },
  suppressedBody: {
    ar: 'هذه نتائج اقترحها النموذج ولم يمكن ربطها ببند محمّل، فحُذفت من التقرير وسُجّلت هنا. ظهورها في هذه القائمة هو ما يجعل الحذف قابلًا للمراجعة.',
    en: 'These were proposed by the model and could not be tied to a loaded clause, so they were dropped from the report and logged here. Listing them is what makes the suppression auditable.',
  },
  reasonUnknownRule: { ar: 'لا يوجد بند محمّل بهذا المعرّف', en: 'No loaded rule with this key' },
  reasonClauseMismatch: { ar: 'رقم البند المذكور لا يطابق البند المرتبط بالقاعدة', en: 'The cited clause is not the rule’s clause' },
  claimedClause: { ar: 'البند المذكور', en: 'Claimed clause' },
  claimedText: { ar: 'النص الذي أورده النموذج', en: 'Text the model supplied' },
  discarded: { ar: 'مُهمَل', en: 'Discarded' },

  corpusTitle: { ar: 'البنود المحمّلة', en: 'Loaded clauses' },
  corpusBody: {
    ar: 'لا يفحص النظام إلا ما هو محمّل هنا ومُتحقَّق منه. أي بند خارج هذه القائمة يظهر في التقرير «لم يُفحص».',
    en: 'The system checks only what is loaded here and verified. Anything outside this list appears in the report as not checked.',
  },
  fixtureWarning: {
    ar: 'هذه بنود تجريبية بأرقام ونصوص مُختلقة، للتطوير فقط. لا تُستخدم في مراجعة حقيقية.',
    en: 'These are fixture clauses with invented numbers and text, for development only. Not for a real review.',
  },
  verified: { ar: 'مُتحقَّق منه', en: 'Verified' },
  ruleKey: { ar: 'المعرّف', en: 'Rule key' },

  verbatimLabel: { ar: 'نص البند', en: 'Clause text' },
  restatementLabel: { ar: 'صياغة ضبط', en: 'Dhabt wording' },
  restatementNote: {
    ar: 'صياغتنا للمتطلب، وليست نص البند. الجهة المُصدِرة تحتفظ بحقوق النص.',
    en: 'Our wording of the requirement, not the clause text. The issuer reserves rights over the text.',
  },
  openSource: { ar: 'افتح المصدر', en: 'Open the source' },

  // --- landing, ported from design/landing.html -----------------------------
  // Keys and copy are the designer's. The design's own dictionary already used
  // this { ar, en } shape, so these are a straight lift.
  brand: { ar: 'ضبط', en: 'Dhabt' },
  navApp: { ar: 'أداة الفحص', en: 'The tool' },
  lblSheet: { ar: 'الورقة', en: 'Sheet' },
  lblDate: { ar: 'التاريخ', en: 'Date' },
  scale: { ar: 'المقياس', en: 'Scale' },

  heroA: { ar: 'نحافظ على هوية المكان في كل ما يُبنى،', en: 'Keep the identity of place in everything that gets built.' },
  heroB: { ar: 'ونفحص تصميمك قبل التقديم', en: 'Check your design before you submit.' },
  heroSub: {
    ar: 'ضبط يقرأ واجهات مشروعك، ويحدد الطراز المعماري الذي ينطبق على موقعه، ويقارن التصميم بموجهات العمارة السعودية قبل أن تقدّم على رخصة البناء.',
    en: 'Dhabt reads your project elevations, identifies the architectural style that applies to the site, and compares the design with the Saudi Architecture design guidelines before you apply for a building permit.',
  },
  cta: { ar: 'ابدأ الفحص', en: 'Start a check' },
  cta2: { ar: 'اطّلع على تقرير توضيحي', en: 'See a sample report' },

  figAlt: { ar: 'رسم خطي لواجهة مبنى تحت القياس، نافذة واحدة مؤشَّرة ثم معدّلة', en: 'Line drawing of a building elevation being measured, one window flagged and then corrected' },
  figCaption: { ar: 'الشكل 1 · واجهة نموذجية تحت القياس', en: 'Fig. 1 · A generic elevation under measurement' },
  measuring: { ar: 'جارٍ قياس الفتحات', en: 'Measuring openings' },
  ratio: { ar: 'نسبة الفتحات', en: 'Opening ratio' },
  limit: { ar: 'الحد', en: 'Limit' },
  over: { ar: 'تتجاوز الحد', en: 'Exceeds the limit' },
  within: { ar: 'ضمن الحد · قبل التعديل 42%', en: 'Within limit · was 42%' },

  a01Name: { ar: 'المشكلة', en: 'The problem' },
  a01Title: { ar: 'لكل منطقة عمارتها، والتصميم الجديد لازم يعرفها', en: 'Every region has its architecture. New designs need to know it.' },
  a01p1: {
    ar: 'في 16 مارس 2025 أُطلقت خريطة العمارة السعودية بتسعة عشر طرازًا معماريًا، كل طراز يعكس جغرافيا منطقته ومناخها وثقافتها، ولكل طراز ثلاثة أنماط: تقليدي وانتقالي ومعاصر.',
    en: 'On 16 March 2025 the Saudi Architecture Characters Map was launched with 19 architectural styles, each reflecting the geography, climate and culture of its region, and each with three patterns: traditional, transitional and contemporary.',
  },
  a01p2: {
    ar: 'الموجهات التصميمية صارت جزءًا من رحلة رخصة البناء، ويتوسع تطبيقها مدينة بعد مدينة. والأسئلة الشائعة للبرنامج نفسه تذكر أن مشاريع وصلت إلى استوديو التصميم أُعيدت لأنها لم تأخذ الموجهات في الاعتبار. ومطابقة التصميم معها اليوم تتم يدويًا.',
    en: 'The design guidelines are now part of the building permit journey and are being applied city by city. The programme\u2019s own FAQ says projects that reached the design studio were returned because they did not take the guidelines into account. Checking a design against them today is manual.',
  },
  n1Label: { ar: 'إطلاق خريطة العمارة السعودية', en: 'Saudi Architecture Characters Map launched' },
  n2Val: { ar: '19 طرازًا', en: '19 styles' },
  n2Label: { ar: 'كل طراز من جغرافيا منطقته ومناخها وثقافتها', en: 'Each from the geography, climate and culture of its region' },
  n3Val: { ar: '3 أنماط', en: '3 patterns' },
  n3Label: { ar: 'تقليدي، انتقالي، معاصر', en: 'Traditional, transitional, contemporary' },

  a02Name: { ar: 'طريقة العمل', en: 'How it works' },
  a02Title: { ar: 'من المخطط إلى التقرير في أربع خطوات', en: 'From drawing to report in four steps' },

  a03Name: { ar: 'التقرير', en: 'The report' },
  a03Title: { ar: 'كل ملاحظة بمكانها ومرجعها وسببها', en: 'Every finding with its place, its guideline and its reason' },
  a03Cap: { ar: 'مثال توضيحي', en: 'Illustrative example' },
  a03Body: {
    ar: 'التقرير لا يكتفي بمطابق أو غير مطابق. كل ملاحظة تشير إلى مكانها على الواجهة، وترتبط بالموجه الخاص بها، وتشرح السبب التراثي وراءه، عشان يكون قرار التعديل عند المهندس واضحًا.',
    en: 'The report does not stop at pass or fail. Each finding points to its place on the elevation, links to its guideline and explains the heritage reason behind it, so the engineer can decide on the change with the full picture.',
  },
  rTitle: { ar: 'تقرير فحص الواجهات', en: 'Facade review report' },
  rProject: { ar: 'فيلا سكنية · مشروع توضيحي', en: 'Residential villa · illustrative project' },
  rStyleL: { ar: 'الطراز', en: 'Style' },
  rStyleV: { ar: 'طراز الموقع', en: 'Site style' },
  rPatL: { ar: 'النمط', en: 'Pattern' },
  rPatV: { ar: 'انتقالي', en: 'Transitional' },
  rElev: { ar: 'الواجهة الشمالية', en: 'North elevation' },
  rSummary: { ar: 'ملاحظة واحدة · بندان مطابقان', en: '1 issue · 2 pass' },
  lblLoc: { ar: 'الموقع', en: 'Location' },
  lblRef: { ar: 'الموجه', en: 'Guideline' },
  lblWhy: { ar: 'السبب التراثي', en: 'Heritage reason' },

  a04Name: { ar: 'الأنماط الثلاثة', en: 'The three patterns' },
  a04Title: { ar: 'مبنى واحد، ثلاثة أنماط', en: 'One building, three patterns' },
  a04Body: {
    ar: 'كل طراز يُطبَّق بثلاثة أنماط. نفس الكتلة ونفس الموقع، والفرق في الفتحات والدروة والتفاصيل. ضبط يفحص التصميم على النمط اللي اخترته.',
    en: 'Every style can be applied in three patterns. Same massing, same site; the difference is in the openings, the parapet and the detail. Dhabt checks the design against the pattern you chose.',
  },
  p1: { ar: 'تقليدي', en: 'Traditional' },
  p2: { ar: 'انتقالي', en: 'Transitional' },
  p3: { ar: 'معاصر', en: 'Contemporary' },
  elev: { ar: 'واجهة', en: 'Elevation' },

  a05Name: { ar: 'الطرز', en: 'Styles' },
  a05Title: { ar: 'جدول الطرز المعمارية التسعة عشر', en: 'Schedule of the 19 architectural styles' },
  colNo: { ar: 'رقم', en: 'No.' },
  colName: { ar: 'الطراز', en: 'Style' },

  a06Name: { ar: 'المراجع', en: 'Reference sources' },
  disclaimer: {
    ar: 'ضبط غير تابع لهذه الجهات. القرار النهائي في التصميم يبقى للمهندس المرخّص.',
    en: 'Dhabt is not affiliated with these entities. The final design decision stays with the licensed engineer.',
  },

  closeTitle: { ar: 'افحص مشروعك القادم قبل التقديم', en: 'Check your next project before you submit' },
  closeBody: {
    ar: 'ارفع الواجهات، واستلم تقريرًا عربيًا يبين كل ملاحظة وسببها.',
    en: 'Upload the elevations and receive an Arabic report that shows each finding and its reason.',
  },
  copy: { ar: '© 2026 ضبط', en: '© 2026 Dhabt' },

  langSwitch: { ar: 'English', en: 'العربية' },
} as const

export type StringKey = keyof typeof T

export function t(key: StringKey, lang: Lang): string {
  return T[key][lang]
}

/**
 * Display name per check.
 *
 * Deliberately not the clause heading. Several rules can derive from one clause
 * (riser and going are usually one clause, height and floor count another), and
 * falling back to the heading makes two different checks render as two identical
 * rows. The check is the thing being reported, so the check gets the name.
 */
export const CHECK_NAMES: Record<string, { ar: string; en: string }> = {
  'setback.front.min': { ar: 'الارتداد الأمامي', en: 'Front setback' },
  'setback.rear.min': { ar: 'الارتداد الخلفي', en: 'Rear setback' },
  'setback.side.min': { ar: 'الارتداد الجانبي', en: 'Side setback' },
  'height.max': { ar: 'ارتفاع المبنى', en: 'Building height' },
  'floors.max': { ar: 'عدد الأدوار', en: 'Number of floors' },
  'coverage.ratio.max': { ar: 'نسبة البناء', en: 'Plot coverage' },
  'parking.count.min': { ar: 'عدد المواقف', en: 'Parking spaces' },
  'stair.width.min': { ar: 'عرض الدرج', en: 'Stair width' },
  'stair.riser.max': { ar: 'ارتفاع القائمة', en: 'Riser height' },
  'stair.going.min': { ar: 'عرض النائمة', en: 'Going depth' },
  'corridor.width.min': { ar: 'عرض الممر', en: 'Corridor width' },
  'door.clear_width.min': { ar: 'عرض الباب الصافي', en: 'Door clear width' },
  'egress.travel_distance.max': { ar: 'مسافة الانتقال', en: 'Travel distance' },
  'egress.exit_count.min': { ar: 'عدد المخارج', en: 'Number of exits' },
}

/** Falls back to the rule key, never to a clause heading. */
export function checkName(ruleKey: string, lang: Lang): string {
  return CHECK_NAMES[ruleKey]?.[lang] ?? ruleKey
}


// --- structured landing content ---------------------------------------------
// These are lists, not strings, so they sit outside T rather than being forced
// through t(), whose return type is string.

export interface LandingStep { readonly n: string; readonly h: string; readonly p: string }

export const LANDING_STEPS: Record<Lang, readonly LandingStep[]> = {
  ar: [
    { n: '01', h: 'ارفع المخططات', p: 'واجهات المشروع ومخططاته كما تجهّزها للتقديم.' },
    { n: '02', h: 'تحديد الطراز', p: 'يحدد ضبط الطراز المعماري الذي ينطبق على موقع المشروع، ونمطه.' },
    { n: '03', h: 'الفحص', p: 'يقيس الواجهة: الفتحات والدراوي ومساحات الألوان، ويقارنها بالموجهات.' },
    { n: '04', h: 'التقرير', p: 'تقرير عربي يبين كل ملاحظة، ومكانها على المخطط، والموجه المرتبط بها، والسبب التراثي وراءها.' },
  ],
  en: [
    { n: '01', h: 'Upload', p: 'The project elevations and drawings, as you prepare them for submission.' },
    { n: '02', h: 'Style', p: 'Dhabt identifies the architectural style and pattern that apply to the site.' },
    { n: '03', h: 'Check', p: 'It measures the facade: openings, parapets and colour areas, and compares them with the guidelines.' },
    { n: '04', h: 'Report', p: 'An Arabic report showing each issue, where it is on the drawing, the guideline it relates to, and the heritage reason behind it.' },
  ],
}

export interface LandingFinding {
  readonly n: string
  readonly tone: 'issue' | 'pass'
  readonly status: string
  readonly h: string
  readonly v: string
  readonly loc: string
  readonly ref: string
  readonly why: string
}

export const LANDING_FINDINGS: Record<Lang, readonly LandingFinding[]> = {
  ar: [
    { n: '1', tone: 'issue', status: 'غير مطابق', h: 'نسبة الفتحات في الواجهة', v: '42% / الحد 35%', loc: 'الدور الأول · المحور B', ref: 'موجهات الطراز · الفتحات', why: 'الفتحات المحدودة تخفف الحرارة وتحفظ خصوصية البيت، وهي من ملامح العمارة في المنطقة.' },
    { n: '2', tone: 'pass', status: 'مطابق', h: 'ارتفاع الدروة', v: '1.20 م', loc: 'السطح · المحاور A إلى C', ref: 'موجهات الطراز · الدراوي', why: 'الدروة تستر السطح وترسم خط السماء الذي يميز الطراز.' },
    { n: '3', tone: 'pass', status: 'مطابق', h: 'مساحة اللون الأساسي', v: '78%', loc: 'الواجهة كاملة', ref: 'موجهات الطراز · الألوان', why: 'الألوان الترابية مأخوذة من مواد البناء المحلية في المنطقة.' },
  ],
  en: [
    { n: '1', tone: 'issue', status: 'Issue', h: 'Facade opening ratio', v: '42% / limit 35%', loc: 'First floor · grid B', ref: 'Style guidelines · Openings', why: 'Limited openings reduce heat gain and keep the home private, a defining trait of the region\u2019s architecture.' },
    { n: '2', tone: 'pass', status: 'Pass', h: 'Parapet height', v: '1.20 m', loc: 'Roof · grids A to C', ref: 'Style guidelines · Parapets', why: 'The parapet screens the roof and draws the skyline that marks the style.' },
    { n: '3', tone: 'pass', status: 'Pass', h: 'Primary colour area', v: '78%', loc: 'Whole elevation', ref: 'Style guidelines · Colour', why: 'Earth tones come from the local building materials of the region.' },
  ],
}

export interface LandingSource { readonly h: string; readonly b: string }

export const LANDING_SOURCES: Record<Lang, readonly LandingSource[]> = {
  ar: [
    { h: 'موجهات العمارة السعودية التصميمية', b: 'مركز دعم هيئات التطوير' },
    { h: 'اشتراطات المباني السكنية', b: 'وزارة البلديات والإسكان' },
    { h: 'كود البناء السعودي', b: 'مركز كود البناء السعودي' },
  ],
  en: [
    { h: 'Saudi Architecture design guidelines', b: 'Development Authorities Support Center' },
    { h: 'Residential Buildings Requirements', b: 'Ministry of Municipalities and Housing' },
    { h: 'Saudi Building Code', b: 'Saudi Building Code Center' },
  ],
}

/**
 * The nineteen Saudi Architecture styles, replacing the design's VERIFY NAMES
 * placeholder.
 *
 * Arabic is the official orthography from architsaudi.dasc.gov.sa, diacritics
 * included. Ten were read directly off that site; the remaining nine come from
 * corroborating coverage and are flagged in LANDING-NOTES.md as needing a second
 * check against the site's own style pages.
 *
 * English is a transliteration, not an official rendering. The programme
 * publishes no English style names, so these are marked as unofficial.
 */
export interface ArchStyle { readonly ar: string; readonly en: string; readonly verified: boolean }

export const ARCH_STYLES: readonly ArchStyle[] = [
  { ar: 'العِمَارَة النجدية', en: 'Najdi', verified: false },
  { ar: 'العِمَارَة النجدية الشمالية', en: 'Northern Najdi', verified: false },
  { ar: 'عِمَارَة ساحل تبوك', en: 'Tabuk Coast', verified: true },
  { ar: 'عِمَارَة المدينة المنورة', en: 'Madinah', verified: false },
  { ar: 'عِمَارَة ريف المدينة المنورة', en: 'Madinah Countryside', verified: true },
  { ar: 'العِمَارَة الحجازية الساحلية', en: 'Hejazi Coast', verified: true },
  { ar: 'عِمَارَة الطائف', en: 'Taif', verified: false },
  { ar: 'عِمَارَة جبال السروات', en: 'Sarawat Mountains', verified: false },
  { ar: 'عِمَارَة أصدار عسير', en: 'Asir Asdar', verified: true },
  { ar: 'عِمَارَة سفوح تهامة', en: 'Tihama Foothills', verified: true },
  { ar: 'عِمَارَة ساحل تهامة', en: 'Tihama Coast', verified: true },
  { ar: 'عِمَارَة مرتفعات أبها', en: 'Abha Highlands', verified: true },
  { ar: 'عِمَارَة جزر فرسان', en: 'Farasan Islands', verified: true },
  { ar: 'عِمَارَة بيشة الصحراوية', en: 'Bisha Desert', verified: true },
  { ar: 'عِمَارَة نجران', en: 'Najran', verified: false },
  { ar: 'عِمَارَة واحات الأحساء', en: 'Al-Ahsa Oases', verified: false },
  { ar: 'عِمَارَة القطيف', en: 'Qatif', verified: false },
  { ar: 'عِمَارَة الساحل الشرقي', en: 'East Coast', verified: false },
  { ar: 'العِمَارَة النجدية الشرقية', en: 'Eastern Najdi', verified: true },
]
