// ==================== IDEAS PAGE ====================
function buildIdeasPage() {
  const ideas = getIdeas();

  let cardsHTML = '';
  if (ideas.length === 0) {
    cardsHTML = '<div class="empty-state" style="grid-column:1/-1;text-align:center;padding:40px 0">Нет проектов. Создайте первый!</div>';
  } else {
    ideas.forEach(p => {
      const total = p.tasks.length;
      const done = p.tasks.filter(t => t.done).length;
      const pct = total > 0 ? Math.round(done / total * 100) : 0;
      cardsHTML += `
        <div class="idea-card" onclick="openIdeaDetail('${esc(p.id)}')">
          <div class="idea-emoji">${p.emoji || '📁'}</div>
          <div class="idea-name">${esc(p.name)}</div>
          <div class="idea-stats">${done}/${total} задач</div>
          <div class="idea-bar">
            <div class="idea-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>
      `;
    });
  }

  return `
    <div class="page-header">
      <button class="back-btn" onclick="goHome()">← Назад</button>
      <h2 class="page-heading">💡 База идей</h2>
      <button class="btn-primary" onclick="startAddIdea()">+ Проект</button>
    </div>
    <div class="ideas-grid">
      ${cardsHTML}
    </div>
  `;
}

// ==================== IDEA DETAIL ====================
function buildIdeaDetail() {
  const idea = getIdeaById(viewData.id);
  if (!idea) {
    return `
      <div class="page-header">
        <button class="back-btn" onclick="openIdeas()">← Назад</button>
        <h2 class="page-heading">Проект не найден</h2>
      </div>
    `;
  }

  // Emoji picker (hidden by default)
  const emojiPickerHTML = buildEmojiPicker(idea.id);

  let activeTasksHTML = '';
  let doneTasksHTML = '';

  idea.tasks.forEach((t, i) => {
    const isUrgent = t.urgent && !t.done;
    const urgentCls = isUrgent ? 'urgent-row' : '';
    const urgentBtn = isUrgent ? 'active' : '';
    const dateBadge = t.scheduledDate
      ? `<span class="task-deadline-badge ${t.done ? 'done' : ''}">${formatDateDisplay(t.scheduledDate)}</span>`
      : '';
    const itemHTML = `
      <div class="task-item ${t.done ? 'done-row' : ''} ${urgentCls}"
        draggable="true" data-idx="${i}" data-flip-id="idea-${esc(idea.id)}-${i}"
        ondragstart="ideaDragStart(event,'${esc(idea.id)}',${i})"
        ondragover="ideaDragOver(event)"
        ondrop="ideaDrop(event,'${esc(idea.id)}',${i})"
        ondragend="ideaDragEnd(event)">
        <span class="task-drag" title="Перетащить">⋮⋮</span>
        <div class="task-cb ${t.done ? 'checked' : ''}" onclick="toggleIdeaTask('${esc(idea.id)}',${i})"></div>
        <span class="task-name ${t.done ? 'struck' : ''}">${esc(t.text)}</span>
        ${dateBadge}
        ${t.done ? '' : `<button class="task-urgent-btn ${urgentBtn}" onclick="toggleIdeaTaskUrgent('${esc(idea.id)}',${i})" title="Срочно">⚡</button>`}
        <button class="ibtn" onclick="setIdeaTaskDate('${esc(idea.id)}',${i})" title="Дата">📅</button>
        <button class="task-del" onclick="deleteIdeaTask('${esc(idea.id)}',${i})">×</button>
      </div>
    `;
    if (t.done) doneTasksHTML += itemHTML;
    else activeTasksHTML += itemHTML;
  });

  const doneCount = idea.tasks.filter(t => t.done).length;
  const isExpanded = uiState.ideaDoneExpanded === idea.id;

  let tasksHTML = '';
  if (idea.tasks.length === 0) {
    tasksHTML = '<div class="empty-state">Нет задач. Добавьте первую!</div>';
  } else {
    tasksHTML = activeTasksHTML;
    if (doneCount > 0) {
      tasksHTML += `
        <div class="done-toggle" onclick="toggleIdeaDone('${esc(idea.id)}')">
          <span class="done-toggle-icon">${isExpanded ? '▾' : '▸'}</span>
          <span>✓ Выполненные (${doneCount})</span>
        </div>
        <div class="done-collapsed ${isExpanded ? 'open' : ''}">
          ${doneTasksHTML}
        </div>
      `;
    }
  }
  let goalsHTML = '';
  const projectGoals = idea.goals || [];
  projectGoals.forEach(g => {
    let mText = '';
    if (g.month) {
      const [gy, gm] = g.month.split('-').map(Number);
      mText = `<span class="badge badge-blue" style="margin-left:8px;font-size:10px">${MONTHS_SHORT[gm]} ${gy}</span>`;
    }
    goalsHTML += `
      <div class="task-item ${g.done ? 'done-row' : ''}" style="margin-bottom:6px">
        <div class="task-cb ${g.done ? 'checked' : ''}" onclick="toggleIdeaGoal('${esc(idea.id)}', '${g.id}')"></div>
        <span class="task-name ${g.done ? 'struck' : ''}">${esc(g.text)} ${mText}</span>
        <button class="task-del" style="opacity:1" onclick="deleteIdeaGoal('${esc(idea.id)}', '${g.id}')">×</button>
      </div>
    `;
  });
  if (!goalsHTML) goalsHTML = '<div class="empty-state" style="padding:6px 0">Нет глобальных целей</div>';

  const monthOptions = YEARS.map(y => MONTHS_RU.map((mName, mIdx) => `<option value="${y}-${mIdx}">${mName} ${y}</option>`).join('')).join('');

  const goalsSection = `
    <div class="section-card">
      <div class="section-eyebrow">🎯 Цели проекта</div>
      <div style="margin-bottom:12px">${goalsHTML}</div>
      <div class="add-row">
        <input class="add-input" id="ideaGoalInp" placeholder="Новая цель...">
        <select class="add-input" id="ideaGoalMonth" style="flex:0 0 130px; padding:0 8px;">
          <option value="">Без месяца</option>
          ${monthOptions}
        </select>
        <button class="btn-primary" onclick="addIdeaGoal('${esc(idea.id)}')">+</button>
      </div>
    </div>
  `;	
  const notesHTML = buildNoteBlock('ideaNotes-' + idea.id, 'Заметки', idea.notes || '');

  return `
    <div class="page-header">
      <button class="back-btn" onclick="openIdeas()">← Назад</button>
      <h2 class="page-heading">${idea.emoji || '📁'} ${esc(idea.name)}</h2>
      <button class="btn-secondary" onclick="deleteIdea('${esc(idea.id)}')">🗑️</button>
    </div>

    <div class="section-card">
      <div class="idea-emoji-row">
        <div class="idea-big-emoji" id="ideaEmojiBtn" onclick="toggleEmojiPicker()">${idea.emoji || '📁'}</div>
        <div class="idea-emoji-label">Нажмите, чтобы сменить эмодзи</div>
      </div>
      ${emojiPickerHTML}
    </div>

    ${goalsSection}

    <div class="section-card">
      <div class="section-eyebrow">📋 Задачи</div>
      <div class="idea-tasks-list">
        ${tasksHTML}
      </div>
      <div class="add-row idea-add-row">
        <input class="add-input" id="ideaTaskInp" placeholder="Новая задача..." autofocus>
        <button type="button" class="date-pick-btn ${uiState.ideaAddDate ? 'has-date' : ''}" onclick="openIdeaAddDatePicker()">
          📅 ${uiState.ideaAddDate ? formatDateDisplay(uiState.ideaAddDate) : 'Дата'}
        </button>
        <button class="btn-primary" onclick="addIdeaTask('${esc(idea.id)}')">+</button>
      </div>
    </div>

    <div class="section-card">${notesHTML}</div>
  `;
}

// ==================== EMOJI PICKER ====================
const IDEA_EMOJIS = [
  '📁','🎯','🚀','💡','🛠️','📚','🎨','🎮','🎵','⚡',
  '🔥','💻','📱','🌐','🏠','✈️','🏋️','🧘','📷','🎬',
  '🌱','🍎','☕','🎸','✏️','📊','🔮','🎁','🪐','👾',
  '🤖','🧪','🧪','🫧','💎','🏆','🎪','🌍','🐾','❤️',
  '🧠','🦋','🌊','🌙','☀️','🍕','🥑','🦊','🐙','🦾'
];

function buildEmojiPicker(ideaId) {
  let html = `<div class="emoji-picker" id="emojiPicker">`;
  IDEA_EMOJIS.forEach(e => {
    html += `<button class="emoji-option" onclick="changeIdeaEmoji('${esc(ideaId)}','${e}')">${e}</button>`;
  });
  html += '</div>';
  return html;
}

function toggleEmojiPicker() {
  const picker = document.getElementById('emojiPicker');
  if (picker) picker.classList.toggle('open');
}

function changeIdeaEmoji(id, emoji) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (idea) {
    idea.emoji = emoji;
    saveIdeas(ideas);
  }
  render();
}

// ==================== IDEA HANDLERS ====================
let _ideaIdCounter = 0;

function startAddIdea() {
  const name = prompt('Название проекта:');
  if (!name || !name.trim()) return;

  const ideas = getIdeas();
  const emojis = ['📁','🎯','🚀','💡','🛠️','📚','🎨','🎮','🎵','⚡'];
  ideas.push({
    id: 'idea_' + Date.now() + '_' + (++_ideaIdCounter),
    name: name.trim(),
    emoji: emojis[Math.floor(Math.random() * emojis.length)],
    tasks: [],
    notes: ''
  });
  saveIdeas(ideas);
  render();
}

function deleteIdea(id) {
  if (!confirm('Удалить проект?')) return;
  const ideas = getIdeas().filter(p => p.id !== id);
  saveIdeas(ideas);
  openIdeas();
}

function sortIdeaTasks(tasks) {
  tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;
    return 0;
  });
}

function addIdeaTask(id) {
  const inp = document.getElementById('ideaTaskInp');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;
  const date = uiState.ideaAddDate || null;

  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (idea) {
    idea.tasks.push({
      id: generateIdeaTaskId(),
      text, done: false,
      scheduledDate: date
    });
    sortIdeaTasks(idea.tasks);
    saveIdeas(ideas);
    uiState.ideaAddDate = null;
    render();
  }
}

function openIdeaAddDatePicker() {
  openDatePicker({
    date: uiState.ideaAddDate || null,
    title: 'Дата новой задачи',
    onSave: (date) => {
      uiState.ideaAddDate = date;
      render();
    },
    onClear: () => {
      uiState.ideaAddDate = null;
      render();
    }
  });
}

function toggleIdeaTask(id, idx) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (!idea || !idea.tasks[idx]) return;
  idea.tasks[idx].done = !idea.tasks[idx].done;
  saveIdeas(ideas);
  render();
}

function toggleIdeaTaskUrgent(id, idx) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (idea && idea.tasks[idx]) {
    idea.tasks[idx].urgent = !idea.tasks[idx].urgent;
    sortIdeaTasks(idea.tasks);
    saveIdeas(ideas);
    render();
  }
}

function deleteIdeaTask(id, idx) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (idea) {
    idea.tasks.splice(idx, 1);
    saveIdeas(ideas);
    render();
  }
}

function setIdeaTaskDate(ideaId, taskIdx) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === ideaId);
  if (!idea || !idea.tasks[taskIdx]) return;
  const task = idea.tasks[taskIdx];

  openDatePicker({
    date: task.scheduledDate || null,
    title: task.text,
    onSave: (date) => {
      const list = getIdeas();
      const proj = list.find(p => p.id === ideaId);
      if (proj && proj.tasks[taskIdx]) {
        proj.tasks[taskIdx].scheduledDate = date;
        delete proj.tasks[taskIdx].scheduledTime;
        saveIdeas(list);
        render();
      }
    },
    onClear: () => {
      const list = getIdeas();
      const proj = list.find(p => p.id === ideaId);
      if (proj && proj.tasks[taskIdx]) {
        proj.tasks[taskIdx].scheduledDate = null;
        delete proj.tasks[taskIdx].scheduledTime;
        saveIdeas(list);
        render();
      }
    }
  });
}

// ==================== IDEA DONE TOGGLE ====================
function toggleIdeaDone(id) {
  if (uiState.ideaDoneExpanded === id) uiState.ideaDoneExpanded = null;
  else uiState.ideaDoneExpanded = id;
  render();
}

// ==================== IDEA DRAG & DROP ====================
let _ideaDragIdx = null;
let _ideaDragId = null;

function ideaDragStart(e, id, idx) {
  _ideaDragIdx = idx;
  _ideaDragId = id;
  e.dataTransfer.effectAllowed = 'move';
  e.target.style.opacity = '0.4';
}

function ideaDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function ideaDrop(e, id, targetIdx) {
  e.preventDefault();
  if (_ideaDragIdx === null || _ideaDragIdx === targetIdx || _ideaDragId !== id) return;
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === id);
  if (!idea) return;
  const [item] = idea.tasks.splice(_ideaDragIdx, 1);
  const insertAt = _ideaDragIdx < targetIdx ? targetIdx - 1 : targetIdx;
  idea.tasks.splice(insertAt, 0, item);
  saveIdeas(ideas);
  _ideaDragIdx = null;
  _ideaDragId = null;
  render();
}

function ideaDragEnd(e) {
  _ideaDragIdx = null;
  _ideaDragId = null;
}
// ==================== PROJECT GOALS LOGIC ====================
function addIdeaGoal(ideaId) {
  const inp = document.getElementById('ideaGoalInp');
  const monthSel = document.getElementById('ideaGoalMonth');
  const text = inp ? inp.value.trim() : '';
  if (!text) return;

  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === ideaId);
  if (!idea) return;
  if (!idea.goals) idea.goals = [];

  const monthVal = monthSel ? monthSel.value : '';
  const goalId = 'ig_' + Date.now();

  idea.goals.push({ id: goalId, text, done: false, month: monthVal });
  saveIdeas(ideas);

  // Добавляем цель в выбранный месяц
  if (monthVal) {
    const [y, m] = monthVal.split('-').map(Number);
    const md = getMonthData(y, m);
    md.goals.push({
      text: `[${idea.emoji || '📁'} ${idea.name}] ${text}`, // Добавляем тег проекта
      done: false,
      ideaGoalId: goalId,
      ideaId: ideaId
    });
    saveMonthData(y, m, md);
  }
  render();
}

function toggleIdeaGoal(ideaId, goalId) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === ideaId);
  if (!idea || !idea.goals) return;
  const goal = idea.goals.find(g => g.id === goalId);
  if (!goal) return;

  goal.done = !goal.done;
  saveIdeas(ideas);

  // Синхронизируем статус с месяцем
  if (goal.month) {
    const [y, m] = goal.month.split('-').map(Number);
    const md = getMonthData(y, m);
    const mg = md.goals.find(g => g.ideaGoalId === goalId);
    if (mg) {
      mg.done = goal.done;
      saveMonthData(y, m, md);
    }
  }
  render();
}

function deleteIdeaGoal(ideaId, goalId) {
  const ideas = getIdeas();
  const idea = ideas.find(p => p.id === ideaId);
  if (!idea || !idea.goals) return;
  
  const idx = idea.goals.findIndex(g => g.id === goalId);
  if (idx === -1) return;
  
  const goal = idea.goals[idx];
  idea.goals.splice(idx, 1);
  saveIdeas(ideas);

  // Удаляем из месяца
  if (goal.month) {
    const [y, m] = goal.month.split('-').map(Number);
    const md = getMonthData(y, m);
    md.goals = md.goals.filter(g => g.ideaGoalId !== goalId);
    saveMonthData(y, m, md);
  }
  render();
}
