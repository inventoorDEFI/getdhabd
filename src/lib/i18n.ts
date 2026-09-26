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

  // --- landing: hero ---------------------------------------------------------
  // Adjusted from the brief: the app checks the plot envelope and life safety,
  // not facades or architectural style. See LANDING-NOTES.md conflict 4.
  heroLine: {
    ar: 'افحص تصميمك قبل التقديم، وتأكد من مطابقته للاشتراطات قبل ما يرجع لك',
    en: 'Check your design before you submit, so it matches the requirements the first time.',
  },
  heroSupport: {
    ar: 'ضبط يقرأ مخططات المشروع ويطابقها مع اشتراطات البناء السكني وكود البناء السعودي، ويعطيك تقريرًا واضحًا بكل ملاحظة قبل ما ترفعها على بلدي.',
    en: 'Dhabt reads your drawings, checks them against the residential building requirements and the Saudi Building Code, and gives you a clear report on every issue before you submit to Balady.',
  },
  ctaPrimary: { ar: 'ابدأ الفحص', en: 'Start a check' },
  ctaHow: { ar: 'كيف يعمل', en: 'How it works' },

  // --- problem ---------------------------------------------------------------
  problemTitle: { ar: 'الفحص اليوم يدوي بالكامل', en: 'Checking is manual today' },
  problemP1: {
    ar: 'المكتب الهندسي يفتح الاشتراطات، ويقرأ البند، ويقيس على المخطط بنفسه. كل ارتداد وكل عرض درج وكل نسبة بناء تُراجع بالعين والمسطرة، على عشرات اللوحات.',
    en: 'The engineering office opens the requirements, reads the clause, and measures against the drawing by hand. Every setback, every stair width, every coverage ratio is checked by eye across dozens of sheets.',
  },
  problemP2: {
    ar: 'والأخطاء التي ترجع المعاملة غالبًا بسيطة ومتكررة: ارتداد ناقص بعشرة سنتيمترات، درج أضيق من الحد، نسبة بناء تجاوزت المسموح. أخطاء تُكتشف بالقياس لا بالخبرة، ولا أحد يملك وقتًا لقياس كل شيء مرتين.',
    en: 'The errors that send an application back are usually small and repetitive: a setback ten centimetres short, a stair narrower than the limit, a coverage ratio over the allowance. Errors found by measuring, not by experience, and nobody has time to measure everything twice.',
  },
  problemP3: {
    ar: 'وبعضها لا يظهر إلا بعد البناء، عند الفحص الميداني، حين تكون الخرسانة قد صُبّت وتكلفة التعديل صارت حقيقية.',
    en: 'Some do not surface until after building, at site inspection, once the concrete is poured and the cost of changing it is real.',
  },

  // --- how it works ----------------------------------------------------------
  howTitle: { ar: 'كيف يعمل', en: 'How it works' },
  how1T: { ar: 'ارفع المخططات', en: 'Upload the drawings' },
  how1B: {
    ar: 'المكتب يرفع حزمة المخططات كملف واحد، مع أبعاد الأرض والنطاق.',
    en: 'The office uploads the drawing set as one file, with the plot dimensions and the zone.',
  },
  // Adjusted: there is no architectural style identification in the app.
  how2T: { ar: 'يحدد البنود المنطبقة', en: 'It scopes the rules' },
  how2B: {
    ar: 'نوع المبنى والنطاق والأمانة يحددون أي البنود المحمّلة تنطبق على هذا المشروع.',
    en: 'Building type, zone and municipality decide which of the loaded clauses apply to this project.',
  },
  how3T: { ar: 'يقيس ويطابق', en: 'It measures and compares' },
  how3B: {
    ar: 'يستخرج الأبعاد من اللوحات ويقارنها بالحدود في البنود، لا بما يتذكره نموذج.',
    en: 'Dimensions are read off the sheets and compared with the limits in the clauses, not with what a model remembers.',
  },
  how4T: { ar: 'تقرير بالعربي', en: 'An Arabic report' },
  how4B: {
    ar: 'كل ملاحظة ومعها موقعها على اللوحة، ورقم البند وصفحته، وسبب الملاحظة.',
    en: 'Every issue with its location on the sheet, the clause number and page, and the reason behind it.',
  },

  // --- why -------------------------------------------------------------------
  whyTitle: { ar: 'ليش ضبط', en: 'Why Dhabt exists' },
  whyBody: {
    ar: 'الخبرة في الاشتراطات موجودة، لكنها محصورة في عدد محدود من المكاتب الكبيرة. ضبط ينقل هذه الخبرة إلى يد من يصمم، قبل التقديم لا بعد الرجوع. مكتب صغير في الأحساء أو أبها يحصل على نفس المراجعة التي يحصل عليها مكتب كبير في الرياض.',
    en: 'The expertise exists, but it sits with a small number of large firms. Dhabt puts it in the hands of the people designing, before submission rather than after a return. A small office in Al-Ahsa or Abha gets the same review a large Riyadh firm gets.',
  },

  // --- who -------------------------------------------------------------------
  whoTitle: { ar: 'لمن', en: 'Who it is for' },
  who1: {
    ar: 'المكاتب الهندسية المعتمدة في بلدي والمعماريون الذين يجهزون معاملات الرخص.',
    en: 'Balady-approved engineering offices and architects preparing permit submissions.',
  },
  who2: {
    ar: 'المطورون الذين تقع مشاريعهم تحت اشتراطات البناء السكني.',
    en: 'Developers whose projects fall under the residential building requirements.',
  },

  // --- boundaries ------------------------------------------------------------
  notTitle: { ar: 'ما الذي لا يفعله ضبط', en: 'What Dhabt is not' },
  not1: {
    ar: 'ضبط لا يصدر رخصًا، وليس تابعًا لبلدي ولا لوزارة الشؤون البلدية والإسكان ولا لمركز دعم هيئات التطوير.',
    en: 'Dhabt does not issue permits and is not affiliated with Balady, the Ministry of Municipalities and Housing, or the Development Authorities Support Center.',
  },
  not2: {
    ar: 'هو أداة مساندة للقرار. القرار التصميمي النهائي والاعتماد يبقيان عند المهندس المرخص.',
    en: 'It is a decision-support tool. The final design decision and sign-off stay with the licensed engineer.',
  },
  not3: {
    ar: 'ولا يغني عن مراجعة الاستوديو التصميمي.',
    en: 'It does not replace the design studio review.',
  },

  // --- coming soon: the design guidelines layer, explicitly not built ---------
  soonLabel: { ar: 'قريبًا', en: 'Coming soon' },
  soonTitle: { ar: 'موجهات العمارة السعودية', en: 'Saudi Architecture design guidelines' },
  soonBody: {
    ar: 'في ١٦ مارس ٢٠٢٥ أُطلقت خارطة طُرز العمارة السعودية بتسعة عشر طرازًا، لكل طراز ما يعكس جغرافية منطقته ومناخها وثقافتها، وثلاثة أنماط: تقليدي وانتقالي ومعاصر. الموجهات جزء من رحلة رخصة البناء وتُطبَّق على المدن على مراحل، وفيها قواعد قابلة للقياس مثل حدود نسبة الفتحات في الواجهة ونسب ألوان التمييز.',
    en: 'On 16 March 2025 the Saudi Architecture Characters Map launched with nineteen styles, each reflecting the geography, climate and culture of its region, and each with three patterns: traditional, transitional and contemporary. The guidelines are part of the building permit journey and are being applied city by city in phases, and they contain measurable rules such as limits on the share of a facade given to openings and on accent colours.',
  },
  soonNote: {
    ar: 'فحص الواجهات مقابل هذه الموجهات غير مبني بعد في ضبط. الفحوصات الحالية تغطي الارتدادات والارتفاع ونسبة البناء والمواقف والدرج والممرات والأبواب والمخارج.',
    en: 'Checking elevations against these guidelines is not built in Dhabt yet. The current checks cover setbacks, height, coverage, parking, stairs, corridors, doors and exits.',
  },

  // --- status ----------------------------------------------------------------
  statusTitle: { ar: 'قيد التطوير', en: 'In development' },
  statusBody: {
    ar: 'ضبط تحت البناء الآن. قراءة ملفات PDF واستخراج الأبعاد لم تكتمل بعد، والبنود المعروضة في التقرير التجريبي بيانات اختبار وليست بنودًا نظامية، وكل بند فيها موسوم بذلك.',
    en: 'Dhabt is being built. PDF reading and dimension extraction are not finished, and the clauses in the sample report are test data rather than regulatory clauses, each one marked as such.',
  },

  closeTitle: { ar: 'جاهز تبدأ', en: 'Ready to start' },
  seeSampleShort: { ar: 'شاهد تقريرًا تجريبيًا', en: 'See a sample report' },
  copyright: { ar: '© ٢٠٢٦ ضبط', en: '© 2026 Dhabt' },

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
