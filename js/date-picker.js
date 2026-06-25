// ==================== DATE HELPERS ====================
function formatDateDisplay(iso) {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}.${parts[1]}.${parts[0]}`;
}

function parseISODate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return { y, m: m - 1, d };
}

function toISODate(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function addDaysISO(iso, days) {
  const p = parseISODate(iso || activeDateStr());
  if (!p) return activeDateStr();
  const dt = new Date(p.y, p.m, p.d + days);
  return toISODate(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

// ==================== DATE PICKER MODAL ====================
let _datePickerCtx = null;

function buildDatePickerCalendar(y, m, selectedISO) {
  const calDays = getCalendarDays(y, m);
  let html = `<div class="dp-weekdays">${WEEKDAYS_SHORT.map(w => `<div class="dp-wd">${w}</div>`).join('')}</div>`;
  html += '<div class="dp-days">';
  calDays.forEach(d => {
    if (!d) {
      html += '<div class="dp-day empty"></div>';
      return;
    }
    const iso = toISODate(y, m, d);
    const isToday = y === ACT_Y && m === ACT_M && d === ACT_D;
    const isSelected = selectedISO === iso;
    html += `<button type="button" class="dp-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}"
      onclick="pickDatePickerDay(${y},${m},${d})">${d}</button>`;
  });
  html += '</div>';
  return html;
}

function renderDatePickerModal() {
  const modal = document.getElementById('datePickerModal');
  if (!modal || !_datePickerCtx) return;

  const { y, m, selected, title } = _datePickerCtx;
  const calHost = modal.querySelector('.dp-calendar');
  const preview = modal.querySelector('.dp-preview');

  if (calHost) calHost.innerHTML = buildDatePickerCalendar(y, m, selected);
  if (preview) {
    preview.textContent = selected ? formatDateDisplay(selected) : 'Дата не выбрана';
  }

  const monthLabel = modal.querySelector('.dp-month-label');
  if (monthLabel) monthLabel.textContent = `${MONTHS_RU[m]} ${y}`;
}

function openDatePicker(options) {
  closeDatePicker();

  const selected = options.date || null;
  const view = parseISODate(selected) || { y: ACT_Y, m: ACT_M, d: ACT_D };
  _datePickerCtx = {
    y: view.y,
    m: view.m,
    selected,
    title: options.title || 'Выберите дату',
    onSave: options.onSave,
    onClear: options.onClear,
  };

  const modal = document.createElement('div');
  modal.id = 'datePickerModal';
  modal.className = 'date-modal-overlay';
  modal.innerHTML = `
    <div class="date-modal date-picker-modal">
      <div class="date-modal-title">${esc(_datePickerCtx.title)}</div>
      <div class="dp-preview"></div>
      <div class="dp-quick">
        <button type="button" class="dp-quick-btn" onclick="pickDatePickerQuick(0)">Сегодня</button>
        <button type="button" class="dp-quick-btn" onclick="pickDatePickerQuick(1)">Завтра</button>
        <button type="button" class="dp-quick-btn" onclick="pickDatePickerQuick(3)">+3 дня</button>
        <button type="button" class="dp-quick-btn" onclick="pickDatePickerQuick(7)">+7 дней</button>
      </div>
      <div class="dp-nav">
        <button type="button" class="dp-nav-btn" onclick="shiftDatePickerMonth(-1)">←</button>
        <div class="dp-month-label"></div>
        <button type="button" class="dp-nav-btn" onclick="shiftDatePickerMonth(1)">→</button>
      </div>
      <div class="dp-calendar"></div>
      <div class="date-modal-actions">
        <button type="button" class="date-modal-btn save" onclick="confirmDatePicker()">✓ Сохранить</button>
        ${options.onClear ? '<button type="button" class="date-modal-btn remove" onclick="clearDatePicker()">✕ Убрать дату</button>' : ''}
        <button type="button" class="date-modal-btn cancel" onclick="closeDatePicker()">Отмена</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) closeDatePicker(); });
  renderDatePickerModal();
}

function pickDatePickerDay(y, m, d) {
  if (!_datePickerCtx) return;
  _datePickerCtx.selected = toISODate(y, m, d);
  _datePickerCtx.y = y;
  _datePickerCtx.m = m;
  renderDatePickerModal();
}

function pickDatePickerQuick(days) {
  if (!_datePickerCtx) return;
  const iso = addDaysISO(activeDateStr(), days);
  const p = parseISODate(iso);
  _datePickerCtx.selected = iso;
  _datePickerCtx.y = p.y;
  _datePickerCtx.m = p.m;
  renderDatePickerModal();
}

function shiftDatePickerMonth(delta) {
  if (!_datePickerCtx) return;
  let { y, m } = _datePickerCtx;
  m += delta;
  if (m > 11) { m = 0; y++; }
  if (m < 0) { m = 11; y--; }
  _datePickerCtx.y = y;
  _datePickerCtx.m = m;
  renderDatePickerModal();
}

function confirmDatePicker() {
  if (!_datePickerCtx || !_datePickerCtx.onSave) return;
  if (!_datePickerCtx.selected) return;
  _datePickerCtx.onSave(_datePickerCtx.selected);
  closeDatePicker();
}

function clearDatePicker() {
  if (!_datePickerCtx || !_datePickerCtx.onClear) return;
  _datePickerCtx.onClear();
  closeDatePicker();
}

function closeDatePicker() {
  const modal = document.getElementById('datePickerModal');
  if (modal) modal.remove();
  _datePickerCtx = null;
}
