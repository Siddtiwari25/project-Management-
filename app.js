// ==================== DATA MODELS ====================
let projects = [];
let teamMessages = [];
let reminders = [];
let uploadedFiles = [];

// Chart instances
let projChart = null;
let progChart = null;

// DOM Elements cache
const dom = {
    projectsContainer: document.getElementById('projectsContainer'),
    noProjectsMsg: document.getElementById('noProjectsMsg'),
    chatMessages: document.getElementById('chatMessages'),
    remindersList: document.getElementById('remindersList'),
    fileList: document.getElementById('fileList'),
    statProjects: document.getElementById('statProjects'),
    statTasks: document.getElementById('statTasks'),
    statCompleted: document.getElementById('statCompleted'),
    statMessages: document.getElementById('statMessages'),
    footerProductivity: document.getElementById('footerProductivity'),
    footerTime: document.getElementById('footerTime'),
    analyticsSummary: document.getElementById('analyticsSummary')
};

// Load data with fallback demo data
function loadData() {
    try {
        const storedProjects = localStorage.getItem('space_projects_v5');
        if(storedProjects) projects = JSON.parse(storedProjects);
        const storedMsgs = localStorage.getItem('team_chat_v5');
        if(storedMsgs) teamMessages = JSON.parse(storedMsgs);
        const storedReminders = localStorage.getItem('reminders_list_v5');
        if(storedReminders) reminders = JSON.parse(storedReminders);
        const storedFiles = localStorage.getItem('uploaded_files_v5');
        if(storedFiles) uploadedFiles = JSON.parse(storedFiles);
    } catch(e) { console.warn(e); }
    
    if(projects.length === 0) {
        const now = Date.now();
        projects = [
            { 
                id: now + 100, 
                name: "🌌 Andromeda Expedition", 
                deadline: new Date(now + 86400000 * 14).toISOString().slice(0,10), 
                tasks: [
                    { id: now + 1, text: "Build warp drive", completed: false, dueDate: new Date(now + 86400000 * 5).toISOString().slice(0,10), comments: [] },
                    { id: now + 2, text: "Recruit astronauts", completed: true, dueDate: new Date(now + 86400000 * 2).toISOString().slice(0,10), comments: [] },
                    { id: now + 3, text: "Design spaceship AI", completed: false, dueDate: null, comments: [] }
                ]
            },
            { 
                id: now + 200, 
                name: "🛸 Lunar Base Alpha", 
                deadline: new Date(now + 86400000 * 30).toISOString().slice(0,10), 
                tasks: [
                    { id: now + 4, text: "Establish communication", completed: false, dueDate: null, comments: [] },
                    { id: now + 5, text: "Build habitat modules", completed: false, dueDate: new Date(now + 86400000 * 15).toISOString().slice(0,10), comments: [] }
                ]
            },
            { 
                id: now + 300, 
                name: "🚀 Mars Colony", 
                deadline: new Date(now + 86400000 * 60).toISOString().slice(0,10), 
                tasks: [
                    { id: now + 6, text: "Design landing system", completed: true, dueDate: null, comments: [] },
                    { id: now + 7, text: "Train astronauts", completed: false, dueDate: new Date(now + 86400000 * 10).toISOString().slice(0,10), comments: [] }
                ]
            }
        ];
    }
    if(teamMessages.length === 0) teamMessages.push({ text: "👽 Welcome to Stellar Flow! Collaborate here.", timestamp: new Date().toLocaleTimeString() });
    if(reminders.length === 0) reminders.push({ date: new Date().toISOString().slice(0,10), text: "Weekly sync with team" });
    saveAll();
}

function saveAll() {
    localStorage.setItem('space_projects_v5', JSON.stringify(projects));
    localStorage.setItem('team_chat_v5', JSON.stringify(teamMessages));
    localStorage.setItem('reminders_list_v5', JSON.stringify(reminders));
    localStorage.setItem('uploaded_files_v5', JSON.stringify(uploadedFiles));
    updateQuickStats();
    updateFooterStats();
}

function showToast(msg, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-bell'}"></i> ${msg}`;
    if(isError) toast.style.borderLeftColor = '#ff6b6b';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2700);
}

function pushNotify(title, body) {
    if (Notification.permission === "granted") {
        new Notification(title, { body });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission();
    }
    showToast(`${title}: ${body}`);
}

function calcProgress(project) {
    if(!project.tasks?.length) return 0;
    return (project.tasks.filter(t => t.completed).length / project.tasks.length) * 100;
}

function escapeHtml(str) { 
    if(!str) return ''; 
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m));
}

function updateQuickStats() {
    const totalProjects = projects.length;
    const totalTasks = projects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
    const completedTasks = projects.reduce((sum, p) => sum + (p.tasks?.filter(t => t.completed).length || 0), 0);
    if(dom.statProjects) dom.statProjects.innerText = totalProjects;
    if(dom.statTasks) dom.statTasks.innerText = totalTasks;
    if(dom.statCompleted) dom.statCompleted.innerText = completedTasks;
    if(dom.statMessages) dom.statMessages.innerText = teamMessages.length;
}

function updateFooterStats() {
    const totalTasks = projects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
    const completedTasks = projects.reduce((sum, p) => sum + (p.tasks?.filter(t => t.completed).length || 0), 0);
    const productivity = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    if(dom.footerProductivity) dom.footerProductivity.innerText = productivity;
    if(dom.footerTime) dom.footerTime.innerHTML = `<i class="fas fa-sync-alt fa-fw"></i> ${new Date().toLocaleTimeString()}`;
}

// ==================== FIXED ANALYTICS SECTION ====================
function updateAnalyticsCharts() {
    if(!projects || projects.length === 0) {
        if(dom.analyticsSummary) dom.analyticsSummary.innerText = "0 projects, 0 tasks, 0% complete";
        return;
    }
    
    const labels = projects.map(p => {
        let name = p.name || "Unnamed";
        return name.length > 12 ? name.slice(0,10) + '..' : name;
    });
    const tasksTotal = projects.map(p => p.tasks?.length || 0);
    const tasksDone = projects.map(p => (p.tasks?.filter(t => t.completed).length || 0));
    
    const overallTotal = tasksTotal.reduce((a,b) => a + b, 0);
    const overallDone = tasksDone.reduce((a,b) => a + b, 0);
    const productivity = overallTotal === 0 ? 0 : Math.round((overallDone / overallTotal) * 100);
    
    if(dom.analyticsSummary) {
        dom.analyticsSummary.innerHTML = `<strong>${projects.length}</strong> projects | <strong>${overallTotal}</strong> total tasks | <strong>${overallDone}</strong> completed | <strong>${productivity}%</strong> complete`;
    }
    
    const ctx1 = document.getElementById('projectChart');
    const ctx2 = document.getElementById('progressChart');
    
    if(!ctx1 || !ctx2) return;
    
    const context1 = ctx1.getContext('2d');
    const context2 = ctx2.getContext('2d');
    
    if(!context1 || !context2) return;
    
    if(projChart && typeof projChart.destroy === 'function') {
        projChart.destroy();
        projChart = null;
    }
    if(progChart && typeof progChart.destroy === 'function') {
        progChart.destroy();
        progChart = null;
    }
    
    try {
        projChart = new Chart(context1, { 
            type: 'bar', 
            data: { 
                labels: labels, 
                datasets: [
                    { label: '✅ Completed Tasks', data: tasksDone, backgroundColor: '#3bc9ff', borderRadius: 8, borderSkipped: false },
                    { label: '📋 Total Tasks', data: tasksTotal, backgroundColor: '#a46eff', borderRadius: 8, borderSkipped: false }
                ]
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top', labels: { color: '#eef5ff', font: { size: 10 } } },
                    tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#fff', bodyColor: '#ccc' }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#eef5ff' } },
                    x: { ticks: { color: '#eef5ff', font: { size: 10 } }, grid: { display: false } }
                }
            }
        });
        
        progChart = new Chart(context2, { 
            type: 'doughnut', 
            data: { 
                labels: ['✅ Completed', '⏳ Remaining'], 
                datasets: [{ 
                    data: [overallDone, Math.max(0, overallTotal - overallDone)], 
                    backgroundColor: ['#4ade80', '#2c3e66'], 
                    borderWidth: 0,
                    hoverOffset: 4
                }] 
            }, 
            options: { 
                responsive: true, 
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#eef5ff', font: { size: 10 } } },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} tasks (${Math.round((ctx.raw/overallTotal)*100)}%)` } }
                }
            }
        });
    } catch(e) {
        console.error("Chart creation error:", e);
    }
}

// Render projects (main render function)
function renderProjects() {
    if(!dom.projectsContainer) return;
    
    if(!projects.length) {
        dom.noProjectsMsg?.classList.remove('hidden');
        dom.projectsContainer.innerHTML = '';
        updateQuickStats();
        updateFooterStats();
        return;
    }
    dom.noProjectsMsg?.classList.add('hidden');
    
    const fragment = document.createDocumentFragment();
    const today = new Date().toISOString().slice(0,10);
    
    projects.forEach(proj => {
        const progress = calcProgress(proj);
        const isDeadlinePassed = proj.deadline && proj.deadline < today;
        const projectDiv = document.createElement('div');
        projectDiv.className = 'project-item fade-in';
        projectDiv.setAttribute('data-project-id', proj.id);
        
        projectDiv.innerHTML = `
            <div class="flex justify-between items-start flex-wrap gap-2">
                <div class="flex-1">
                    <h3 class="font-bold text-base md:text-lg"><i class="fas fa-satellite"></i> ${escapeHtml(proj.name)}</h3>
                    <div class="text-xs opacity-70 flex flex-wrap gap-2 mt-1">
                        <span><i class="far fa-calendar"></i> ${proj.deadline || 'no deadline'}</span>
                        ${isDeadlinePassed ? '<span class="text-red-400"><i class="fas fa-exclamation-triangle"></i> Overdue</span>' : ''}
                    </div>
                </div>
                <button class="delete-project-btn text-red-300 hover:text-red-500 text-sm bg-black/20 px-3 py-1 rounded-full" data-id="${proj.id}"><i class="fas fa-trash-alt"></i> Del</button>
            </div>
            <div class="progress-bar-bg"><div class="progress-fill" style="width: ${progress}%"></div></div>
            <div class="text-xs flex justify-between"><span>${Math.round(progress)}% complete</span> <span>📋 ${proj.tasks?.length || 0} tasks</span></div>
            <div class="mt-3">
                <div class="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <input type="text" id="newTaskInput_${proj.id}" placeholder="New task + deadline" class="text-sm flex-1 min-w-0">
                    <input type="date" id="taskDue_${proj.id}" class="text-sm w-full sm:w-32">
                    <button class="add-task-btn bg-emerald-700/70 text-sm px-3 py-2" data-id="${proj.id}"><i class="fas fa-plus"></i> Add</button>
                </div>
                <div class="mt-3 space-y-2 task-list" data-project="${proj.id}">
                    ${(proj.tasks || []).map(task => `
                        <div class="task-item draggable-task" draggable="true" data-task-id="${task.id}" data-project-id="${proj.id}">
                            <div class="flex items-start gap-2 justify-between flex-wrap">
                                <div class="flex items-center gap-2 flex-1 min-w-0">
                                    <input type="checkbox" class="task-complete" data-task="${task.id}" data-project="${proj.id}" ${task.completed ? 'checked' : ''}>
                                    <span class="${task.completed ? 'line-through opacity-60' : ''} break-words flex-1">${escapeHtml(task.text)}</span>
                                    ${task.dueDate ? `<span class="badge text-[10px] flex-shrink-0">📅 ${task.dueDate}</span>` : ''}
                                </div>
                                <button class="delete-task-btn text-red-400 text-sm px-2" data-task="${task.id}" data-project="${proj.id}"><i class="far fa-trash-alt"></i></button>
                            </div>
                            <div class="mt-1 text-xs text-cyan-300 flex flex-wrap items-center gap-2">
                                <i class="fas fa-comment-dots"></i> 
                                <span class="comment-preview">${task.comments?.length ? task.comments[task.comments.length-1].substring(0,35) : 'add comment'}</span>
                                <button class="comment-task-btn text-[10px] bg-gray-700/40 px-2 py-1 rounded-full" data-task="${task.id}" data-project="${proj.id}">💬 Comment</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="mt-2 text-right text-[10px] opacity-60"><i class="fas fa-arrows-alt"></i> Drag tasks to reorder</div>
            </div>
        `;
        fragment.appendChild(projectDiv);
    });
    
    dom.projectsContainer.innerHTML = '';
    dom.projectsContainer.appendChild(fragment);
    attachProjectEvents();
    attachDragDrop();
    updateRemindersList();
    renderTeamChat();
    renderFileList();
    checkDeadlinesAndNotify();
    updateQuickStats();
    updateFooterStats();
}

function attachProjectEvents() {
    document.querySelectorAll('.delete-project-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = parseInt(btn.dataset.id);
            projects = projects.filter(p => p.id !== id);
            saveAll();
            renderProjects();
            showToast('Project deleted');
        };
    });
    
    document.querySelectorAll('.add-task-btn').forEach(btn => {
        btn.onclick = () => {
            const projId = parseInt(btn.dataset.id);
            const proj = projects.find(p => p.id === projId);
            if(proj) {
                const input = document.getElementById(`newTaskInput_${projId}`);
                const dueDateInput = document.getElementById(`taskDue_${projId}`);
                const text = input?.value.trim();
                if(!text) return showToast('Task name required');
                if(!proj.tasks) proj.tasks = [];
                proj.tasks.push({
                    id: Date.now(),
                    text: text,
                    completed: false,
                    dueDate: dueDateInput?.value || null,
                    comments: []
                });
                if(input) input.value = '';
                if(dueDateInput) dueDateInput.value = '';
                saveAll();
                renderProjects();
                showToast(`Task added`);
            }
        };
    });
    
    document.querySelectorAll('.task-complete').forEach(cb => {
        cb.onchange = (e) => {
            e.stopPropagation();
            const taskId = parseInt(cb.dataset.task);
            const projId = parseInt(cb.dataset.project);
            const proj = projects.find(p => p.id === projId);
            const task = proj?.tasks?.find(t => t.id === taskId);
            if(task) task.completed = cb.checked;
            saveAll();
            renderProjects();
            if(cb.checked) pushNotify('✅ Task done', 'Great progress!');
        };
    });
    
    document.querySelectorAll('.delete-task-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const taskId = parseInt(btn.dataset.task);
            const projId = parseInt(btn.dataset.project);
            const proj = projects.find(p => p.id === projId);
            if(proj && proj.tasks) {
                proj.tasks = proj.tasks.filter(t => t.id !== taskId);
                saveAll();
                renderProjects();
            }
        };
    });
    
    document.querySelectorAll('.comment-task-btn').forEach(btn => {
        btn.onclick = () => {
            const taskId = parseInt(btn.dataset.task);
            const projId = parseInt(btn.dataset.project);
            const comment = prompt('✍️ Add comment to this task:');
            if(comment?.trim()) {
                const proj = projects.find(p => p.id === projId);
                const task = proj?.tasks?.find(t => t.id === taskId);
                if(task) {
                    if(!task.comments) task.comments = [];
                    task.comments.push(comment.trim());
                    saveAll();
                    renderProjects();
                    showToast('Comment added');
                }
            }
        };
    });
}

let dragSrc = null;
function attachDragDrop() {
    document.querySelectorAll('.draggable-task').forEach(el => {
        el.setAttribute('draggable', 'true');
        el.ondragstart = (e) => {
            dragSrc = { taskId: parseInt(el.dataset.taskId), projectId: parseInt(el.dataset.projectId) };
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', '');
            el.classList.add('dragging');
        };
        el.ondragend = () => { el.classList.remove('dragging'); dragSrc = null; };
        el.ondragover = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
        el.ondrop = (e) => {
            e.preventDefault();
            if(!dragSrc || dragSrc.projectId !== parseInt(el.dataset.projectId)) return;
            const proj = projects.find(p => p.id === dragSrc.projectId);
            if(proj && proj.tasks) {
                const srcIndex = proj.tasks.findIndex(t => t.id === dragSrc.taskId);
                const destIndex = proj.tasks.findIndex(t => t.id === parseInt(el.dataset.taskId));
                if(srcIndex !== -1 && destIndex !== -1) {
                    const [moved] = proj.tasks.splice(srcIndex, 1);
                    proj.tasks.splice(destIndex, 0, moved);
                    saveAll();
                    renderProjects();
                    showToast('Task reordered');
                }
            }
        };
    });
}

function updateRemindersList() {
    if(!dom.remindersList) return;
    dom.remindersList.innerHTML = reminders.map((r, idx) => `
        <div class="flex justify-between items-center">
            <span><i class="far fa-clock"></i> ${r.date} — ${escapeHtml(r.text)}</span>
            <button class="delete-reminder text-red-400 text-xs ml-2 px-2 py-1 rounded-full" data-idx="${idx}">🗑️</button>
        </div>
    `).join('');
    document.querySelectorAll('.delete-reminder').forEach(btn => {
        btn.onclick = () => {
            reminders.splice(parseInt(btn.dataset.idx), 1);
            saveAll();
            updateRemindersList();
            showToast('Reminder deleted');
        };
    });
}

function renderTeamChat() {
    if(!dom.chatMessages) return;
    dom.chatMessages.innerHTML = teamMessages.slice(-20).map(m => 
        `<div class="text-xs break-words"><i class="fas fa-user-astronaut"></i> <b>Crew</b>: ${escapeHtml(m.text)} <span class="opacity-50 text-[10px]">${m.timestamp}</span></div>`
    ).join('');
    dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
}

function renderFileList() {
    if(!dom.fileList) return;
    dom.fileList.innerHTML = uploadedFiles.map((f, idx) => `
        <div class="text-xs flex justify-between">
            <span><i class="fas fa-file-alt"></i> ${escapeHtml(f)}</span>
            <button class="delete-file text-red-400 text-xs ml-2" data-idx="${idx}">✖</button>
        </div>
    `).join('');
    document.querySelectorAll('.delete-file').forEach(btn => {
        btn.onclick = () => {
            uploadedFiles.splice(parseInt(btn.dataset.idx), 1);
            saveAll();
            renderFileList();
            showToast('File removed');
        };
    });
}

function checkDeadlinesAndNotify() {
    const today = new Date().toISOString().slice(0,10);
    projects.forEach(p => {
        if(p.deadline === today) pushNotify(`🚀 Deadline: ${p.name}`, `Mission due today!`);
        if(p.tasks) {
            p.tasks.forEach(t => { if(t.dueDate === today && !t.completed) pushNotify(`⚠️ Task due`, `${t.text} in ${p.name}`); });
        }
    });
    reminders.forEach(r => { if(r.date === today) pushNotify(`⏰ Reminder`, r.text); });
}

// ==================== EVENT LISTENERS ====================
document.getElementById('createProjectBtn')?.addEventListener('click', () => {
    const name = document.getElementById('projectNameInput')?.value.trim();
    const deadline = document.getElementById('projectDeadlineInput')?.value;
    if(!name) return showToast('Project name needed');
    projects.push({ id: Date.now(), name: name, deadline: deadline, tasks: [] });
    saveAll();
    renderProjects();
    if(document.getElementById('projectNameInput')) document.getElementById('projectNameInput').value = '';
    if(document.getElementById('projectDeadlineInput')) document.getElementById('projectDeadlineInput').value = '';
    showToast(`🚀 ${name} launched!`);
});

document.getElementById('sendChatBtn')?.addEventListener('click', () => {
    const msg = document.getElementById('chatInput')?.value.trim();
    if(msg) {
        teamMessages.push({ text: msg, timestamp: new Date().toLocaleTimeString() });
        if(teamMessages.length > 50) teamMessages.shift();
        saveAll();
        renderTeamChat();
        if(document.getElementById('chatInput')) document.getElementById('chatInput').value = '';
    }
});

document.getElementById('addReminderBtn')?.addEventListener('click', () => {
    const date = document.getElementById('reminderDate')?.value;
    const text = document.getElementById('reminderText')?.value.trim();
    if(date && text) {
        reminders.push({ date, text });
        saveAll();
        updateRemindersList();
        if(document.getElementById('reminderText')) document.getElementById('reminderText').value = '';
        showToast('Reminder added');
    }
});

document.getElementById('fileUploader')?.addEventListener('change', (e) => {
    if(e.target.files.length) {
        uploadedFiles.push(e.target.files[0].name + ` (${new Date().toLocaleDateString()})`);
        saveAll();
        renderFileList();
        showToast(`📎 File attached`);
        e.target.value = '';
    }
});

document.getElementById('clearCompletedBtn')?.addEventListener('click', () => {
    projects.forEach(proj => { if(proj.tasks) proj.tasks = proj.tasks.filter(t => !t.completed); });
    saveAll();
    renderProjects();
    showToast('Cleared completed tasks');
});

document.getElementById('exportDataBtn')?.addEventListener('click', () => {
    const exportData = { projects, teamMessages, reminders, uploadedFiles, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `galactic-flow-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported');
});

document.getElementById('voiceSimulateBtn')?.addEventListener('click', () => {
    const messages = ["🚀 Launch sequence initiated!", "🛸 Need more fuel!", "✨ Great teamwork!", "📡 Signal received", "🌕 Moon landing progress"];
    teamMessages.push({ text: `🎤 VOICE: ${messages[Math.floor(Math.random() * messages.length)]}`, timestamp: new Date().toLocaleTimeString() });
    if(teamMessages.length > 50) teamMessages.shift();
    saveAll();
    renderTeamChat();
    showToast('Voice note added');
});

document.getElementById('snoozeRemindersBtn')?.addEventListener('click', () => {
    const newDate = new Date();
    newDate.setHours(newDate.getHours() + 1);
    const formattedDate = newDate.toISOString().slice(0,10);
    reminders.forEach(r => { r.date = formattedDate; });
    saveAll();
    updateRemindersList();
    showToast('Reminders snoozed for 1 hour');
});

let darkMode = true;
document.getElementById('themeToggleBtn')?.addEventListener('click', () => {
    darkMode = !darkMode;
    if(darkMode) {
        document.body.classList.remove('light-theme');
        document.getElementById('themeIconText').innerText = 'Dark';
    } else {
        document.body.classList.add('light-theme');
        document.getElementById('themeIconText').innerText = 'Light';
    }
    if(document.getElementById('analyticsModal') && !document.getElementById('analyticsModal').classList.contains('hidden')) {
        updateAnalyticsCharts();
    }
});

['socialGithub', 'socialTwitter', 'socialDiscord'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', (e) => { e.preventDefault(); showToast(`🌌 ${id.replace('social','')} community coming soon`); });
});

document.getElementById('showAnalyticsBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('analyticsModal');
    const card = document.getElementById('analyticsCard');
    if(modal && card) {
        modal.classList.remove('hidden');
        document.body.classList.add('modal-open');
        setTimeout(() => { 
            card.style.transform = 'scale(1)'; 
            card.style.opacity = '1'; 
        }, 10);
        setTimeout(() => {
            updateAnalyticsCharts();
        }, 100);
    }
});

document.getElementById('closeAnalyticsBtn')?.addEventListener('click', () => {
    const modal = document.getElementById('analyticsModal');
    const card = document.getElementById('analyticsCard');
    if(card) { card.style.transform = 'scale(0.95)'; card.style.opacity = '0'; }
    setTimeout(() => { if(modal) modal.classList.add('hidden'); document.body.classList.remove('modal-open'); }, 200);
});

document.getElementById('analyticsModal')?.addEventListener('click', (e) => {
    if(e.target === document.getElementById('analyticsModal')) document.getElementById('closeAnalyticsBtn')?.click();
});

document.getElementById('refreshProjectsBtn')?.addEventListener('click', () => { renderProjects(); showToast('Synced'); });
document.getElementById('chatInput')?.addEventListener('keypress', (e) => { if(e.key === 'Enter') document.getElementById('sendChatBtn')?.click(); });
document.getElementById('reminderText')?.addEventListener('keypress', (e) => { if(e.key === 'Enter') document.getElementById('addReminderBtn')?.click(); });

setInterval(() => { if(dom.footerTime) dom.footerTime.innerHTML = `<i class="fas fa-sync-alt fa-fw"></i> ${new Date().toLocaleTimeString()}`; }, 1000);
setInterval(() => checkDeadlinesAndNotify(), 45000);

// Initialize app
loadData();
renderProjects();