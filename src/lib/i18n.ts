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

  navHome: { ar: 'ضبط', en: 'Dhabt' },

  // --- landing ---------------------------------------------------------------
  heroKicker: { ar: 'مراجعة مسبقة قبل الرفع على بلدي', en: 'Pre-submission review, before Balady' },
  heroSub: {
    ar: 'كل دورة رفض تكلفك أسبوعين وإعادة رسم. ضبط يقرأ حزمة المخططات ويعطيك قائمة بما لن يجتاز المراجعة، ومعه رقم البند وموقعه على اللوحة، قبل أن ترفع وقبل أن تبني.',
    en: 'Every rejection cycle costs two weeks and a redraw. Dhabt reads the drawing set and lists what will not pass, with the clause number and its location on the sheet, before you submit and before you build.',
  },
  ctaPrimary: { ar: 'شاهد تقريرًا كاملًا', en: 'See a full report' },
  ctaSecondary: { ar: 'جرّب الأداة', en: 'Open the tool' },

  problemTitle: { ar: 'الرفض يكلف أكثر مما يبدو', en: 'Rejection costs more than it looks' },
  problem1T: { ar: 'أسبوعان في المتوسط', en: 'Two weeks, on average' },
  problem1B: {
    ar: 'دورة الرفض الواحدة تعني تعديل المخطط وإعادة الرفع وانتظار دور جديد في المراجعة.',
    en: 'One rejection cycle means editing the drawing, resubmitting, and waiting for a new place in the queue.',
  },
  problem2T: { ar: 'الأسباب متكررة', en: 'The reasons repeat' },
  problem2B: {
    ar: 'ارتداد ناقص بعشرة سنتيمترات، درج أضيق من المطلوب، نسبة بناء تجاوزت الحد. أخطاء تُكتشف بالقياس لا بالخبرة.',
    en: 'A setback ten centimetres short, a stair narrower than required, a coverage ratio over the limit. Errors found by measuring, not by experience.',
  },
  problem3T: { ar: 'وبعضها يظهر بعد البناء', en: 'And some surface after building' },
  problem3B: {
    ar: 'ما يمر في المراجعة ولا يطابق الكود يظهر عند الفحص الميداني، حين تكون الخرسانة قد صُبّت.',
    en: 'What passes review but does not match the code surfaces at site inspection, once the concrete is poured.',
  },

  promiseTitle: { ar: 'ولا يخترع بندًا، أبدًا', en: 'And it never invents a clause' },
  promiseBody: {
    ar: 'أداة تختلق رقم بند أسوأ من لا أداة، لأن المهندس سيعتمد عليها. كل نتيجة في ضبط مربوطة ببند محمّل فعليًا في النظام، بصفحته في المستند المصدر. وما لا يستطيع النظام ربطه ببند، يعرضه «لم يُفحص» ولا يخمّن.',
    en: 'A tool that fabricates a clause number is worse than no tool, because an engineer will rely on it. Every finding in Dhabt is tied to a clause actually loaded into the system, with its page in the source document. Anything it cannot tie to a clause is shown as not checked, never guessed.',
  },
  promise1T: { ar: 'البند بصفحته', en: 'The clause, with its page' },
  promise1B: { ar: 'كل نتيجة تحمل رقم البند والصفحة ورابط المستند المصدر.', en: 'Every finding carries the clause number, the page, and a link to the source document.' },
  promise2T: { ar: '«لم يُفحص» ظاهر', en: 'Not checked, shown' },
  promise2B: { ar: 'البنود التي لم تُفحص تظهر بنفس ثقل المخالفات، لا تُخفى ولا تُطوى.', en: 'Unchecked items appear with the same weight as violations. Never hidden, never collapsed.' },
  promise3T: { ar: 'الموقع على اللوحة', en: 'Located on the sheet' },
  promise3B: { ar: 'اسم اللوحة والإحداثي، حتى تصل للمشكلة مباشرة.', en: 'Sheet name and coordinate, so you go straight to the problem.' },

  howTitle: { ar: 'كيف يعمل', en: 'How it works' },
  how1T: { ar: 'ارفع الحزمة', en: 'Upload the set' },
  how1B: { ar: 'ملف PDF واحد، مع أبعاد الأرض والنطاق ونوع المبنى.', en: 'One PDF, with the plot dimensions, zone and building type.' },
  how2T: { ar: 'يُقرأ المخطط', en: 'The drawing is read' },
  how2B: { ar: 'تمييز اللوحات واستخراج الأبعاد والتعليقات، بالعربي والإنجليزي.', en: 'Sheets identified, dimensions and annotations extracted, Arabic and English.' },
  how3T: { ar: 'تُطابق البنود', en: 'Matched to clauses' },
  how3B: { ar: 'مقارنة ما استُخرج بالبنود المحمّلة، لا بما يتذكره نموذج.', en: 'What was extracted is compared to loaded clauses, not to what a model remembers.' },
  how4T: { ar: 'تقرير جاهز', en: 'A report to hand over' },
  how4B: { ar: 'ملف بالعربي تعطيه لفريق التصميم مباشرة.', en: 'An Arabic file you hand to the design team as is.' },

  checksTitle: { ar: 'ما يفحصه اليوم', en: 'What it checks today' },
  checksSub: {
    ar: 'الفلل السكنية أولًا، وهي أعلى أنواع الرخص عددًا وأبسطها هندسة.',
    en: 'Residential villas first: the highest permit volume and the simplest geometry.',
  },

  sourcesTitle: { ar: 'من أين تأتي البنود', en: 'Where the clauses come from' },
  sourcesBody: {
    ar: 'اشتراطات إنشاء المباني السكنية الصادرة عن وزارة الشؤون البلدية والإسكان للارتدادات والارتفاع ونسبة البناء والمواقف، وكود البناء السعودي الصادر عن المركز السعودي لكود البناء للدرج والممرات والأبواب والمخارج. لكل بند نسخته وتاريخ إصداره وبصمة الملف المصدر.',
    en: 'The MOMAH residential building requirements for setbacks, height, coverage and parking, and the Saudi Building Code from the Saudi Building Code Center for stairs, corridors, doors and exits. Each clause carries its edition, issue date and a hash of the source file.',
  },

  statusTitle: { ar: 'قيد التطوير', en: 'In development' },
  statusBody: {
    ar: 'ضبط تحت البناء الآن. البنود المعروضة في التقرير التجريبي بيانات اختبار وليست بنودًا نظامية، وكل بند فيها موسوم بذلك. سيفتح التسجيل للمكاتب الهندسية عند تحميل أول مجموعة بنود موثقة.',
    en: 'Dhabt is being built. The clauses in the sample report are test data, not regulatory clauses, and each one is marked as such. Registration opens to engineering offices once the first verified clause set is loaded.',
  },
  statusCta: { ar: 'تواصل معنا', en: 'Get in touch' },

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
