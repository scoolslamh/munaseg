// 🔗 رابط Google Apps Script المنشور
const SHEET_URL = "https://script.google.com/macros/s/AKfycbz857i4LM61y2FMRXC2Cfa3NXLoK-xzh4zy97v2Na5tQc0VbCkJ_3xmxY6WMDisrr5BTg/exec";


// ============================
// 🟢 صفحة الدخول
// ============================
if (document.getElementById('loginBtn')) {
  document.getElementById('loginBtn').addEventListener('click', async () => {
    const number = document.getElementById('schoolNumber').value.trim();
    const msg = document.getElementById('message');
    msg.textContent = '';

    // 🔸 التحقق من أن الرقم الوزاري مكوّن من 5 أرقام على الأقل
    const digitsOnly = number.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 5) {
      msg.textContent = 'الرقم الوزاري يجب ألا يقل عن 5 أرقام.';
      return;
    }

    try {
      const res = await fetch(`${SHEET_URL}?action=login&number=${encodeURIComponent(number)}`);
      const data = await res.json();

      if (data.success) {
        // حفظ البيانات مؤقتاً في المتصفح
        localStorage.setItem('schoolData', JSON.stringify(data));
        // الانتقال إلى صفحة النموذج
        window.location.href = 'form.html';
      } else {
        msg.textContent = 'لم يتم العثور على الرقم الوزاري.';
      }
    } catch {
      msg.textContent = 'حدث خطأ في الاتصال، حاول مجددًا.';
    }
  });
}



// ============================
// 🟢 صفحة البيانات
// ============================
if (document.getElementById('updateForm')) {
  const data = JSON.parse(localStorage.getItem('schoolData') || '{}');
  const msg = document.getElementById('message');

  if (!data || !data.success) {
    msg.textContent = 'الرجاء العودة للصفحة الرئيسية.';
  } else {
    // 🔸 تعبئة الحقول
    const fill = (id, val, lock = false) => {
      const el = document.getElementById(id);
      if (el) {
        el.value = val || '';
        if (lock) el.setAttribute('readonly', true);
      }
    };

    fill('schoolNumber', data.number, true);
    fill('schoolName', data.schoolName, true);
    fill('schoolGender', data.gender, true);
    fill('schoolArea', data.area, true);
    fill('principalName', data.principal);
    fill('principalPhone', data.principalPhone);
    fill('schoolEmail', data.email);
    fill('ownership', data.ownership);
    fill('coordinatorName', data.coordinator);
    fill('coordinatorID', data.coordinatorID);
    fill('coordinatorPhone', data.coordinatorPhone);
    fill('jobType', data.jobType);
    fill('qualification', data.qualification);
    fill('farsTitle', data.farsTitle);
    fill('level', data.level);
    fill('grade', data.grade);

    // 🔸 في حالة أن المدرسة أكدت مسبقاً
    if (data.updated) {
      document.querySelectorAll('input, select').forEach(i => i.setAttribute('readonly', true));
      document.getElementById('saveBtn').disabled = true;
      msg.textContent = 'تم تأكيد البيانات مسبقًا — عرض فقط.';
      return;
    }

    // 🔸 عند الضغط على زر "تحديث البيانات"
    document.getElementById('updateForm').addEventListener('submit', e => {
      e.preventDefault();
      document.getElementById('confirmBox').classList.remove('hidden');
    });

    // 🔸 عند تأكيد إرسال البيانات
    document.getElementById('confirmBtn').addEventListener('click', async () => {
      msg.textContent = '⏳ جاري حفظ البيانات...';

      // 1. جمع الحقول
      const payload = {
        number: data.number,
        fields: {
          principal: document.getElementById('principalName').value,
          principalPhone: document.getElementById('principalPhone').value,
          email: document.getElementById('schoolEmail').value,
          ownership: document.getElementById('ownership').value,
          coordinator: document.getElementById('coordinatorName').value,
          coordinatorID: document.getElementById('coordinatorID').value,
          coordinatorPhone: document.getElementById('coordinatorPhone').value,
          jobType: document.getElementById('jobType').value,
          qualification: document.getElementById('qualification').value,
          farsTitle: document.getElementById('farsTitle').value,
          level: document.getElementById('level').value,
          grade: document.getElementById('grade').value
        }
      };

      // 2. قراءة ملف PDF وتحويله إلى Base64
      const fileInput = document.getElementById('assignmentFile');
      let base64File = '';

      if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];

        if (file.type !== 'application/pdf') {
          msg.textContent = '❌ يُسمح فقط برفع ملفات PDF.';
          return;
        }

        base64File = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      // 3. إرسال البيانات إلى Google Script
      try {
        const res = await fetch(SHEET_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, file: base64File })
        });

        const result = await res.json();

        if (result.success) {
          msg.textContent = '✅ تم حفظ البيانات ورفع الملف بنجاح.';
          localStorage.setItem('schoolData', JSON.stringify({ ...data, updated: true }));
          document.querySelectorAll('input').forEach(i => i.setAttribute('readonly', true));
          document.getElementById('saveBtn').disabled = true;
          document.getElementById('confirmBox').classList.add('hidden');
        } else {
          msg.textContent = '⚠️ فشل في الحفظ، تحقق من الاتصال.';
        }
      } catch (error) {
        msg.textContent = '❌ حدث خطأ أثناء الإرسال.';
        console.error('Error sending data:', error);
      }
    });
  }
}
