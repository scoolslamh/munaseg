// 🔗 رابط Google Apps Script المنشور
const SHEET_URL = "https://script.google.com/macros/s/AKfycbxIEOiQKxmc21TMVNHRqcDWgljaWzBhRiimWUDM45RnfcsYRminU2EMlLld03bbXE0KGQ/exec";


// ============================
// 🟢 صفحة الدخول
// ============================
if (document.getElementById('loginBtn')) {
  const loginBtn = document.getElementById('loginBtn');
  const msg = document.getElementById('message');

  // إنشاء مؤشر تحميل
  const loader = document.createElement('span');
  loader.className = 'loader hidden';
  loader.style.marginRight = '8px';
  loader.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#fff">
      <g fill="none" fill-rule="evenodd">
        <g transform="translate(1 1)" stroke-width="3">
          <circle stroke-opacity=".3" cx="18" cy="18" r="16"></circle>
          <path d="M34 18c0-9.94-8.06-18-18-18">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 18 18"
              to="360 18 18"
              dur="1s"
              repeatCount="indefinite"/>
          </path>
        </g>
      </g>
    </svg>`;
  loginBtn.parentNode.insertBefore(loader, loginBtn);

  loginBtn.addEventListener('click', async () => {
    const number = document.getElementById('schoolNumber').value.trim();
    msg.textContent = '';

    const digitsOnly = number.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 5) {
      msg.textContent = 'الرقم الوزاري يجب ألا يقل عن 5 أرقام.';
      return;
    }

    loader.classList.remove('hidden');
    loginBtn.disabled = true;
    loginBtn.textContent = 'جاري التحقق...';

    try {
      const res = await fetch(`${SHEET_URL}?action=login&number=${encodeURIComponent(number)}`);
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('schoolData', JSON.stringify(data));
        window.location.href = 'form.html';
      } else {
        msg.textContent = 'لم يتم العثور على الرقم الوزاري.';
      }
    } catch {
      msg.textContent = 'حدث خطأ في الاتصال، حاول مجددًا.';
    } finally {
      loader.classList.add('hidden');
      loginBtn.disabled = false;
      loginBtn.textContent = 'دخول';
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
    // تعبئة الحقول
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

    // لو البيانات مؤكدة مسبقًا
    if (data.updated) {
      document.querySelectorAll('input, select').forEach(i => i.setAttribute('readonly', true));
      const saveBtn = document.getElementById('saveBtn');
      if (saveBtn) saveBtn.disabled = true;
      msg.textContent = 'تم تأكيد البيانات مسبقًا — عرض فقط.';
    } else {
      // عند الضغط على "تحديث البيانات"
      document.getElementById('updateForm').addEventListener('submit', e => {
        e.preventDefault();
        document.getElementById('confirmBox').classList.remove('hidden');
      });

      // زر تأكيد الإرسال
      const confirmBtn = document.getElementById('confirmBtn');
      const saveBtn = document.getElementById('saveBtn');
      const loaderSave = document.createElement('span');
      loaderSave.className = 'loader hidden';
      loaderSave.style.marginRight = '8px';
      loaderSave.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="#006c35">
          <g fill="none" fill-rule="evenodd">
            <g transform="translate(1 1)" stroke-width="3">
              <circle stroke-opacity=".3" cx="18" cy="18" r="16"></circle>
              <path d="M34 18c0-9.94-8.06-18-18-18">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 18 18"
                  to="360 18 18"
                  dur="1s"
                  repeatCount="indefinite"/>
              </path>
            </g>
          </g>
        </svg>`;
      if (saveBtn) saveBtn.parentNode.insertBefore(loaderSave, saveBtn);

      confirmBtn.addEventListener('click', async () => {
        msg.textContent = '⏳ جاري حفظ البيانات...';
        loaderSave.classList.remove('hidden');
        confirmBtn.disabled = true;

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

        const fileInput = document.getElementById('assignmentFile');
        let base64File = '';

        if (fileInput && fileInput.files.length > 0) {
          const file = fileInput.files[0];
          if (file.type !== 'application/pdf') {
            msg.textContent = '❌ يُسمح فقط برفع ملفات PDF.';
            loaderSave.classList.add('hidden');
            confirmBtn.disabled = false;
            return;
          }

          base64File = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

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
            if (saveBtn) saveBtn.disabled = true;
            document.getElementById('confirmBox').classList.add('hidden');
          } else {
            msg.textContent = '⚠️ فشل في الحفظ، تحقق من الاتصال.';
          }
        } catch (error) {
          console.error('Error sending data:', error);
          msg.textContent = '❌ حدث خطأ أثناء الإرسال.';
        } finally {
          loaderSave.classList.add('hidden');
          confirmBtn.disabled = false;
        }
      });
    }
  }
}

