# tasks2.md — قائمة المهام (برومبتات تفصيلية)

---

## TASK 1 — صفحة Login: إزالة الـ borders من الـ inputs وتحديث الـ UX

**Prompt:**
```
في صفحة الـ login، عدّل جميع حقول الإدخال (inputs) بالطريقة التالية:

1. **إزالة الـ border/outline المستطيل** من حوالين الـ inputs تمامًا عند الـ focus وعند الـ blur. استبدلها بـ underline فقط (border-bottom) أو استخدم floating label design بدون border مرئي — شبه ما بتعمله Apple وGoogle في صفحات الـ login الحديثة.

2. **إضافة autofill/autocomplete دعم كامل:**
   - لما المستخدم يضغط على حقل الإيميل وعنده suggestion جاهز من المتصفح، يتضاف الـ value تلقائيًا في الحقل بدون مشكلة.
   - تأكد إن الـ inputs لها attributes صح: `autocomplete="email"` للإيميل و `autocomplete="current-password"` للباسورد.
   - تأكد كمان إن الـ paste (لصق النص) شغال طبيعي في كل الحقول — لا يوجد `onPaste` event يمنع ذلك.

3. الـ styling المطلوب يكون عصري ونظيف: لا shadow غريبة، لا border بارزة. فقط خط سفلي أو تصميم minimalist واضح.
```

---

## TASK 2 — صفحة العملاء (Clients): إصلاح تصدير PDF

**Prompt:**
```
في صفحة الـ clients، زر "تصدير العميل كـ PDF"، عدّل الـ PDF المُصدَّر بالطريقة التالية:

1. **إصلاح مشكلة الكلام الغريب / encoding غلط:**
   - تأكد إن كل النصوص العربية تظهر صح في الـ PDF.
   - استخدم font يدعم العربية بشكل كامل (مثلاً Amiri أو Cairo من Google Fonts).
   - تأكد إن الـ text direction صح (RTL للعربي).

2. **إزالة أيقونة الـ print** من الـ PDF أو من الـ UI — أزل أي print icon أو print button موجود في صفحة الـ PDF preview.

3. **إضافة قسم "تحليل البيانات والأرقام"** في أسفل الـ PDF لكل عميل، يشمل:
   - إجمالي المدفوعات حتى الآن
   - المتوسط الشهري للمدفوعات (average monthly payment)
   - عدد الأشهر المسجلة
   - أعلى شهر دفع فيه (highest payment month)
   - أقل شهر دفع فيه (lowest payment month)
   - رسم بياني بسيط إن أمكن (bar chart أو table) يوضح المدفوعات الشهرية
```

---

## TASK 3 — صفحة العملاء: حفظ التعديلات اليدوية على الأشهر

**Prompt:**
```
في صفحة تفاصيل العميل، عند التعديل اليدوي لمبالغ الأشهر:

1. **إصلاح مشكلة عدم الحفظ:** لما المستخدم يضغط على شهر معين ويغير المبلغ يدويًا ويضغط save، التعديل لازم يتحفظ فعليًا في الـ database/localStorage — وليس مجرد في الـ UI state.

2. تأكد إن الـ save function بتعمل `await` صح وبتـ persist البيانات قبل ما تظهر رسالة النجاح.

3. بعد الحفظ، لو المستخدم خرج من الصفحة ورجع، يلاقي نفس الأرقام اللي حطها.

4. **نفس الإصلاح للـ notes:** تأكد إن الـ notes بتتحفظ فعليًا وليس فقط في الـ state المؤقت.

5. أزل أو أصلح الـ toast/notification اللي بتظهر "تم الحفظ" — لازم تظهر بس بعد ما الحفظ ينجح فعليًا (في الـ `.then()` أو بعد الـ `await`).
```

---

## TASK 4 — صفحة العملاء: إصلاح الـ Balance السالب

**Prompt:**
```
في صفحة العميل، قسم الـ balance:

1. **فحص وإصلاح منطق الـ balance:** افحص الـ calculation اللي بتحسب الـ balance للعميل وتأكد إنها ما بتديش قيمة سالبة في الحالات الطبيعية.

2. الـ balance المفروض = مجموع المدفوعات الفعلية - أي خصومات أو ديون. لو في بيانات قديمة أو deleted entries بتسبب السالب، أصلح المنطق ده.

3. أضف validation: لو الـ balance طلع سالب بسبب deleted data، اعرضه كـ 0 أو اعرض تحذير واضح بدل ما تعرض رقم سالب.

4. افحص كل الـ edge cases: حذف عميل، حذف شهر، تعديل مبلغ لـ 0 — وتأكد إن الـ balance يتحسب صح في كل الحالات.
```

---

## TASK 5 — استبدال "Revenue" بـ "Average" في كل الموقع

**Prompt:**
```
في كل صفحات الموقع:

1. **ابحث عن كل مكان فيه كلمة "Revenue"** (في الـ UI، الـ cards، الـ charts، الـ tables، الـ PDF، الـ dashboard) واستبدلها بـ "Average" أو "متوسط الدخل الشهري".

2. **تعريف الـ Average الجديد:**
   - Average = إجمالي المبالغ المدفوعة ÷ عدد الأشهر المسجلة للعميل
   - يعني متوسط الفلوس اللي بتدخل في الشهر لكل عميل

3. عدّل الـ calculation في كل مكان بيحسب revenue ليحسب الـ average بدله.

4. عدّل كمان أي label أو tooltip أو legend في الـ charts من "Revenue" لـ "Average Monthly".

5. لو في الـ backend/API بيرجع field اسمه `revenue`، غيره لـ `average` أو احسب الـ average من الـ response الموجود.
```

---

## TASK 6 — صفحة Clients: إصلاح زر "Add First Client"

**Prompt:**
```
في صفحة الـ clients، لما تكون القائمة فاضية ويظهر زر "Add First Client" أو "أضف أول عميل":

1. افحص الـ onClick handler للزر ده وتأكد إنه متوصل صح.
2. الزر المفروض يفتح نفس الـ modal أو يروح لنفس الـ route اللي بيفتحه زر "Add Client" العادي.
3. لو الزر ده موجود في empty state component، تأكد إن الـ props والـ callbacks بتتمرر صح للـ component.
4. اختبر الحالة دي: مستخدم جديد، مفيش عملاء، يضغط "Add First Client" — المفروض يفتح form إضافة عميل.
```

---

## TASK 7 — تعريب الموقع بالكامل (بدون عكس الاتجاه)

**Prompt:**
```
عرّب الموقع بالكامل مع الالتزام بالتالي:

1. **ترجمة كل النصوص من إنجليزي لعربي:**
   - كل الـ labels، الـ buttons، الـ headings، الـ placeholders، الـ tooltips، الـ error messages، الـ success messages، الـ empty states، الـ table headers.
   - كل صفحة في الموقع: Dashboard، Clients، Projects، Login، Settings، وأي صفحة تانية.

2. **مهم جداً — لا تعكس اتجاه الـ layout:**
   - لا تضيف `dir="rtl"` على الـ html أو الـ body.
   - الـ layout يفضل من الشمال لليمين (LTR) زي ما هو.
   - فقط النصوص اللي بتتعرض تكون عربية.

3. استخدم ملف ترجمة واحد (i18n أو object ثابت) يحتوي على كل الـ strings، بدل ما تغير كل نص في مكانه مباشرة — ده بيسهل التعديل في المستقبل.

4. لو في أرقام أو تواريخ، خليها بالتنسيق الإنجليزي (١٢٣ مش ١٢٣ بالعربي) إلا لو المستخدم طلب غير كده.
```

---

## TASK 8 — تطبيق Emerald Theme كامل على الموقع

**Prompt:**
```
طبّق Emerald theme كامل ومتناسق على الموقع بالطريقة التالية:

1. **الألوان الأساسية للـ Emerald Theme:**
   - Primary: #10b981 (emerald-500)
   - Primary Dark: #059669 (emerald-600)
   - Primary Light: #d1fae5 (emerald-100)
   - Background: #f0fdf4 (emerald-50) للـ light mode أو #064e3b للـ dark mode
   - Accent: #34d399 (emerald-400)
   - Text on Primary: #ffffff

2. **طبّق الألوان دي على:**
   - الـ navbar والـ sidebar: خلفية emerald-800 أو emerald-900 مع نص أبيض
   - كل الـ primary buttons: خلفية emerald-500، hover: emerald-600
   - الـ active states في القوائم: emerald-100 background مع emerald-700 text
   - الـ cards: border-right أو border-top بلون emerald-500 كـ accent
   - الـ links: emerald-600
   - الـ focus rings: emerald-300
   - الـ badges والـ tags: emerald-100 background مع emerald-800 text
   - الـ charts: استخدم emerald color palette

3. **استلهم من المواقع الكبيرة:** استخدم نفس نهج Stripe وLinear وVercel في الـ theming — consistent color tokens، hover states واضحة، transitions سلسة.

4. عدّل الـ CSS variables أو الـ Tailwind config (لو الموقع بيستخدم Tailwind) عشان الـ theme يكون مركزي وسهل التغيير.

5. تأكد إن الـ emerald theme بيظهر في كل الصفحات بدون استثناء.
```

---

## TASK 9 — إضافة زر "Create Client" السريع في قائمة الإنشاء

**Prompt:**
```
في أي صفحة فيها dropdown أو select لاختيار عميل (مثلاً صفحة إنشاء مشروع أو إنشاء invoice):

1. **أضف زر صغير "➕ عميل جديد"** جنب الـ client selector.

2. لما المستخدم يضغط الزر ده، يفتح **modal صغير** (وليس صفحة كاملة) يحتوي على فقط الحقول الأساسية لإنشاء عميل:
   - الاسم (مطلوب)
   - الإيميل
   - رقم التليفون
   - العملة

3. لما المستخدم يضغط "حفظ" في الـ modal:
   - يتعمل الـ API call لإنشاء العميل
   - ينضاف العميل تلقائيًا في صفحة الـ clients
   - يتحدد تلقائيًا في الـ dropdown اللي كان فيه المستخدم
   - يتقفل الـ modal

4. الـ modal يكون responsive وسريع — مش محتاج كل fields صفحة الـ client الكاملة.

5. طبّق الـ pattern ده في **كل** الأماكن اللي فيها client selector في الموقع.
```

---

## TASK 10 — إعادة تصميم صفحة Project بالكامل

**Prompt:**
```
أعد تصميم صفحة الـ Project بالكامل لتكون احترافية وغنية بالتفاصيل مع الحفاظ على خفة الـ UI. استلهم من مواقع زي Linear وNotionوAsana. التصميم الجديد يكون على مرحلتين:

---

### المرحلة الأولى — اختيار نوع المشروع وتفاصيله:

**Step 1: اختيار العميل أو المنفذ**
- حقل search/select لاختيار العميل أو الشخص المسؤول عن المشروع
- يظهر اسمه وصورته (avatar) بعد الاختيار
- زر "عميل جديد" سريع زي TASK 9

**Step 2: اختيار نوع/تصنيف المشروع**
- اعرض بطاقات (cards) بأيقونات لأنواع المشاريع الشائعة:
  - 🌐 موقع ويب
  - 📱 تطبيق موبايل
  - 🎨 تصميم UI/UX
  - 📹 يوتيوب / محتوى فيديو
  - 📘 فيسبوك / سوشيال ميديا
  - 🛍️ متجر إلكتروني
  - ⚙️ تطوير مخصص
  - ✏️ أخرى (مع حقل نص)
- المستخدم يضغط على نوع المشروع فيتحدد ويتلوّن بـ emerald

**Step 3: تفاصيل المشروع**
- اسم المشروع
- وصف مختصر
- رابط المشروع (URL) — اختياري
- الأولوية: Low / Medium / High (بألوان)
- الحالة: Not Started / In Progress / Review / Done

---

### المرحلة الثانية — بعد الاختيار (تظهر بعد Step 3):

**Step 4: المدة الزمنية**
- تاريخ البداية والنهاية (date pickers)
- شريط تقدم (progress bar) يحسب نسبة الوقت المنقضي

**Step 5: المهام الفرعية (Sub-tasks)**
- قائمة مهام قابلة للإضافة والحذف والـ drag-and-drop لتغيير الترتيب
- كل مهمة: اسم + checkbox + assignee (اختياري) + due date (اختياري)
- زر "إضافة مهمة" في الأسفل

**Step 6: الألوان والـ Label**
- اختيار لون للمشروع من palette (يُستخدم في الـ cards والـ calendar)
- إضافة tags/labels (مثلاً: "عاجل"، "قيد الانتظار")

---

### متطلبات عامة للتصميم:
- الصفحة تكون single-page بـ smooth scroll أو stepper UI — مش multi-page navigation
- كل section يكون collapsible أو في card منفصلة
- Auto-save كل تغيير
- Mobile responsive بالكامل
- استخدم الـ Emerald Theme من TASK 8
```

---

> **ملاحظة:** نفّذ كل task بشكل مستقل وتأكد من اختبار كل واحدة قبل الانتقال للتالية.
