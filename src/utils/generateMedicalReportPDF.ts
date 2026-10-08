// Генерация PDF через браузерный print — без npm-пакетов, без интернета.
// TODO: при наличии сети заменить на jsPDF со встроенным шрифтом.

export interface ProcedureHistoryItem {
  id: number;
  date: string;
  procedureName: string;
  masterName: string;
  drugsUsed: string[];
  notes?: string;
  price?: number;
}

export interface MedicalReportData {
  client: {
    id: number;
    fullName: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | '';
    phone: string;
    email: string;
  };
  medicalCard: {
    allergies: string;
    chronicDiseases: string;
    medications: string;
    doctorRecommendations: string;
  };
  procedures: ProcedureHistoryItem[];
  generatedAt: string;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatGender(g: string): string {
  if (g === 'female') return 'Женский';
  if (g === 'male') return 'Мужской';
  return 'Не указан';
}

function orDash(val: string | undefined): string {
  return val && val.trim() ? val.trim() : '—';
}

function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildHTML(data: MedicalReportData): string {
  const rows = data.procedures.length === 0
    ? `<tr><td colspan="5" style="text-align:center;color:#888;font-style:italic;padding:12px">История процедур отсутствует</td></tr>`
    : data.procedures.map(p => `
      <tr>
        <td>${esc(formatDate(p.date))}</td>
        <td>${esc(p.procedureName)}</td>
        <td>${esc(p.masterName)}</td>
        <td>${p.drugsUsed.length > 0 ? esc(p.drugsUsed.join(', ')) : '—'}</td>
        <td>${p.price ? `${p.price} BYN` : '—'}</td>
      </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8"/>
<title>Медицинская карта</title>
<style>
@page { size: A4; margin: 15mm 18mm 18mm 18mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Arial, sans-serif; font-size: 10pt; color: #1e1e1e; background: #fff; }
.header { background: #1e2d24; color: #fff; padding: 12px 16px 10px; margin-bottom: 14px; border-radius: 4px; }
.header-clinic { font-size: 15pt; font-weight: bold; color: #c8a84b; margin-bottom: 3px; }
.header-title { font-size: 11pt; color: #fff; margin-bottom: 6px; }
.header-meta { display: flex; justify-content: space-between; font-size: 8pt; color: #9aada5; }
.section { margin-bottom: 14px; }
.section-title { background: #1e2d24; color: #c8a84b; font-size: 9.5pt; font-weight: bold; padding: 5px 8px; border-radius: 3px; margin-bottom: 8px; }
.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 20px; padding: 0 4px; }
.field-label { font-size: 7.5pt; color: #777; text-transform: uppercase; margin-bottom: 1px; }
.field-value { font-size: 10pt; }
.full { grid-column: 1 / -1; }
.rec { background: #f5f8f5; border: 1px solid #c8a84b; border-radius: 3px; padding: 8px 10px; margin-top: 8px; }
.rec-label { font-size: 7.5pt; color: #a0884c; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; }
.rec-text { font-size: 10pt; line-height: 1.5; }
hr { border: none; border-top: 0.5px solid #c8a84b; margin: 10px 0; }
table { width: 100%; border-collapse: collapse; font-size: 9pt; }
thead tr { background: #1e2d24; }
thead th { padding: 6px 7px; text-align: left; font-weight: bold; font-size: 8.5pt; color: #c8a84b; }
tbody tr:nth-child(even) { background: #f5f8f5; }
tbody td { padding: 5px 7px; border-bottom: 0.5px solid #dde8dd; vertical-align: top; line-height: 1.4; }
.count { font-size: 8.5pt; color: #777; margin-top: 6px; padding-left: 4px; }
.footer { margin-top: 14px; padding-top: 8px; border-top: 0.5px solid #c8a84b; }
.footer-row { display: flex; justify-content: space-between; font-size: 9pt; color: #555; margin-bottom: 6px; }
.footer-contacts { text-align: center; font-size: 8pt; color: #888; margin-top: 8px; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>

<div class="header">
  <div class="header-clinic">SKIN CODE COSMETIC</div>
  <div class="header-title">МЕДИЦИНСКАЯ КАРТА КЛИЕНТА</div>
  <div class="header-meta">
    <span>№ карты: ${String(data.client.id).padStart(5, '0')}</span>
    <span>Дата формирования: ${esc(formatDate(data.generatedAt))}</span>
  </div>
</div>

<div class="section">
  <div class="section-title">1. ПЕРСОНАЛЬНЫЕ ДАННЫЕ</div>
  <div class="grid">
    <div><div class="field-label">ФИО</div><div class="field-value">${esc(orDash(data.client.fullName))}</div></div>
    <div><div class="field-label">Дата рождения</div><div class="field-value">${esc(formatDate(data.client.dateOfBirth))}</div></div>
    <div><div class="field-label">Пол</div><div class="field-value">${esc(formatGender(data.client.gender))}</div></div>
    <div><div class="field-label">Телефон</div><div class="field-value">${esc(orDash(data.client.phone))}</div></div>
    <div class="full"><div class="field-label">Email</div><div class="field-value">${esc(orDash(data.client.email))}</div></div>
  </div>
</div>

<hr/>

<div class="section">
  <div class="section-title">2. МЕДИЦИНСКАЯ ИНФОРМАЦИЯ</div>
  <div class="grid">
    <div><div class="field-label">Аллергии</div><div class="field-value">${esc(orDash(data.medicalCard.allergies))}</div></div>
    <div><div class="field-label">Хронические заболевания</div><div class="field-value">${esc(orDash(data.medicalCard.chronicDiseases))}</div></div>
    <div class="full"><div class="field-label">Принимаемые препараты</div><div class="field-value">${esc(orDash(data.medicalCard.medications))}</div></div>
  </div>
  ${data.medicalCard.doctorRecommendations ? `
  <div class="rec">
    <div class="rec-label">Рекомендации врача</div>
    <div class="rec-text">${esc(data.medicalCard.doctorRecommendations)}</div>
  </div>` : ''}
</div>

<hr/>

<div class="section">
  <div class="section-title">3. ИСТОРИЯ ПРОЦЕДУР</div>
  <table>
    <thead>
      <tr>
        <th style="width:13%">Дата</th>
        <th style="width:28%">Процедура</th>
        <th style="width:22%">Мастер</th>
        <th style="width:27%">Препараты</th>
        <th style="width:10%">Стоимость</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  ${data.procedures.length > 0 ? `<div class="count">Всего процедур: ${data.procedures.length}</div>` : ''}
</div>

<div class="footer">
  <div class="footer-row">
    <span>Дата: ${esc(formatDate(data.generatedAt))}</span>
    <span>Подпись врача: ________________________</span>
  </div>
  <div class="footer-contacts">
    SKIN CODE COSMETIC &nbsp;|&nbsp; ул. Руссиянова 13/1 &nbsp;|&nbsp; +375(33)-444-44-44 &nbsp;|&nbsp; dearYouthLab@gmail.com
  </div>
</div>

</body>
</html>`;
}

export async function generateMedicalReportPDF(data: MedicalReportData): Promise<void> {
  const html = buildHTML(data);

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) {
    throw new Error('Браузер заблокировал всплывающее окно. Разрешите pop-up для этого сайта и попробуйте снова.');
  }

  win.document.open();
  win.document.write(html);
  win.document.close();

  win.onload = () => {
    setTimeout(() => {
      win.focus();
      win.print();
      win.onafterprint = () => win.close();
    }, 250);
  };
}
