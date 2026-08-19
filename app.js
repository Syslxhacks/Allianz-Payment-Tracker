/**
 * Allianz Payment Tracker - Main Application Logic
 * Mobile-first Vanilla JS with PIN Security and Static/Cloudflare readiness
 */

(function () {
    'use strict';

    // Get 156-student dataset from students_data.js
    const ALL_STUDENTS = window.ALLIANZ_STUDENTS_DATA || [];

    // =========================================================================
    // STATE MANAGEMENT
    // =========================================================================
    const state = {
        pinInput: '',
        currentPin: window.APP_CONFIG.DEFAULT_PIN || '0420',
        isAuthenticated: false,
        
        // Supabase / Backend State
        supabaseClient: null,
        isDemoMode: false,
        
        // Student Data
        students: [],
        activeCursoFilter: 'ALL',
        activeStatusFilter: 'ALL', // 'ALL' | 'UNPAID' | 'PAID'
        searchQuery: '',
        
        // Modal State
        selectedStudent: null
    };

    // =========================================================================
    // DOM ELEMENTS
    // =========================================================================
    const dom = {
        // PIN Screen
        pinView: document.getElementById('pinView'),
        pinDots: document.querySelectorAll('#pinDots .pin-dot'),
        pinErrorMsg: document.getElementById('pinErrorMsg'),
        pinKeypad: document.getElementById('pinKeypad'),
        pinClearBtn: document.getElementById('pinClearBtn'),
        pinBackspaceBtn: document.getElementById('pinBackspaceBtn'),

        // Header & Actions
        backendBadge: document.getElementById('backendBadge'),
        openStatsBtn: document.getElementById('openStatsBtn'),
        headerUnpaidCount: document.getElementById('headerUnpaidCount'),
        openSettingsBtn: document.getElementById('openSettingsBtn'),
        lockSessionBtn: document.getElementById('lockSessionBtn'),

        // Filters & Search
        cursoFilter: document.getElementById('cursoFilter'),
        searchInput: document.getElementById('searchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        statusPills: document.querySelectorAll('.status-pill'),
        countAll: document.getElementById('countAll'),
        countUnpaid: document.getElementById('countUnpaid'),
        countPaid: document.getElementById('countPaid'),
        filteredResultsLabel: document.getElementById('filteredResultsLabel'),
        syncIndicator: document.getElementById('syncIndicator'),

        // Student List
        studentsList: document.getElementById('studentsList'),

        // Payment Confirmation Modal
        paymentModal: document.getElementById('paymentModal'),
        confirmModalStudentName: document.getElementById('confirmModalStudentName'),
        confirmModalStudentCurso: document.getElementById('confirmModalStudentCurso'),
        confirmModalMessage: document.getElementById('confirmModalMessage'),
        confirmBtnText: document.getElementById('confirmBtnText'),
        confirmPaymentBtn: document.getElementById('confirmPaymentBtn'),
        cancelPaymentBtn: document.getElementById('cancelPaymentBtn'),
        closePaymentModalBtn: document.getElementById('closePaymentModalBtn'),

        // Stats Modal
        statsModal: document.getElementById('statsModal'),
        closeStatsModalBtn: document.getElementById('closeStatsModalBtn'),
        statsUnpaidTotal: document.getElementById('statsUnpaidTotal'),
        statsUnpaidPercent: document.getElementById('statsUnpaidPercent'),
        statsPaidTotal: document.getElementById('statsPaidTotal'),
        statsOverallTotal: document.getElementById('statsOverallTotal'),
        statsCoursesCount: document.getElementById('statsCoursesCount'),
        statsCourseList: document.getElementById('statsCourseList'),
        refreshStatsBtn: document.getElementById('refreshStatsBtn'),

        // Settings Modal
        settingsModal: document.getElementById('settingsModal'),
        closeSettingsModalBtn: document.getElementById('closeSettingsModalBtn'),
        loadDemoDataBtn: document.getElementById('loadDemoDataBtn'),
        themeLightBtn: document.getElementById('themeLightBtn'),
        themeDarkBtn: document.getElementById('themeDarkBtn'),

        // Toast Container
        toastContainer: document.getElementById('toastContainer')
    };

    // =========================================================================
    // INITIALIZATION & CLIENT SETUP
    // =========================================================================
    async function initApp() {
        initTheme();
        initAuth();
        initSupabase();
        initEventListeners();

        if (state.isAuthenticated) {
            await loadStudents();
        }
    }

    // Theme Management
    function initTheme() {
        const savedTheme = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.THEME) || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.THEME, theme);
        showToast(`Tema ${theme === 'dark' ? 'oscuro' : 'claro'} activado`, 'info');
    }

    // Supabase / Backend Setup
    function initSupabase() {
        const configUrl = window.APP_CONFIG.SUPABASE_URL;
        const configKey = window.APP_CONFIG.SUPABASE_ANON_KEY;

        if (configUrl && configKey && window.supabase && window.supabase.createClient) {
            try {
                state.supabaseClient = window.supabase.createClient(configUrl, configKey);
                state.isDemoMode = false;
                updateBackendBadge('En Línea', 'live');
            } catch (err) {
                console.warn('Error connecting to Supabase, falling back to local mode:', err);
                enableLocalMode();
            }
        } else {
            enableLocalMode();
        }
    }

    function enableLocalMode() {
        state.isDemoMode = true;
        state.supabaseClient = null;
        updateBackendBadge('Local 156', 'live');

        // Check if stored dataset has 156 items, if not reset to the updated dataset
        const stored = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.DEMO_STUDENTS);
        if (!stored || JSON.parse(stored).length !== ALL_STUDENTS.length) {
            localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.DEMO_STUDENTS, JSON.stringify(ALL_STUDENTS));
        }
    }

    function updateBackendBadge(text, type) {
        if (dom.backendBadge) {
            dom.backendBadge.textContent = text;
            dom.backendBadge.className = `brand-badge ${type === 'demo' ? 'demo' : ''}`;
        }
    }

    // =========================================================================
    // PIN AUTHENTICATION SYSTEM
    // =========================================================================
    function initAuth() {
        const sessionAuth = sessionStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        if (sessionAuth === 'active') {
            state.isAuthenticated = true;
            dom.pinView.classList.add('hidden');
        } else {
            state.isAuthenticated = false;
            dom.pinView.classList.remove('hidden');
            resetPinInput();
        }
    }

    function handlePinKeyPress(digit) {
        if (state.pinInput.length < 6) {
            state.pinInput += digit;
            renderPinDots();

            if (state.pinInput.length >= 4) {
                validatePin();
            }
        }
    }

    function handlePinBackspace() {
        if (state.pinInput.length > 0) {
            state.pinInput = state.pinInput.slice(0, -1);
            renderPinDots();
            dom.pinErrorMsg.textContent = '';
        }
    }

    function resetPinInput() {
        state.pinInput = '';
        renderPinDots();
        dom.pinErrorMsg.textContent = '';
    }

    function renderPinDots() {
        dom.pinDots.forEach((dot, index) => {
            if (index < state.pinInput.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
    }

    function validatePin() {
        if (state.pinInput === state.currentPin) {
            // Success PIN
            state.isAuthenticated = true;
            sessionStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, 'active');
            dom.pinView.classList.add('hidden');
            showToast('Acceso concedido', 'success');
            loadStudents();
        } else if (state.pinInput.length === state.currentPin.length) {
            // Wrong PIN
            dom.pinDots.forEach(dot => dot.parentElement.classList.add('shake'));
            dom.pinErrorMsg.textContent = 'PIN Incorrecto. Intenta de nuevo.';
            setTimeout(() => {
                dom.pinDots.forEach(dot => dot.parentElement.classList.remove('shake'));
                resetPinInput();
            }, 500);
        }
    }

    function lockSession() {
        state.isAuthenticated = false;
        sessionStorage.removeItem(window.APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        resetPinInput();
        dom.pinView.classList.remove('hidden');
        showToast('Sesión bloqueada', 'info');
    }

    // =========================================================================
    // DATABASE & STUDENT DATA OPERATIONS
    // =========================================================================
    async function loadStudents() {
        dom.studentsList.innerHTML = `
            <div class="state-container">
                <div class="spinner"></div>
                <div class="state-title">Cargando alumnos...</div>
            </div>
        `;

        try {
            if (!state.isDemoMode && state.supabaseClient) {
                const { data, error } = await state.supabaseClient
                    .from('students')
                    .select('*')
                    .order('curso', { ascending: true })
                    .order('name', { ascending: true });

                if (error) throw error;
                state.students = data || [];
            } else {
                // Read from LocalStorage
                const stored = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.DEMO_STUDENTS);
                state.students = stored ? JSON.parse(stored) : [...ALL_STUDENTS];
            }

            populateCourseFilter();
            renderStudentsList();
            updateStatistics();
            dom.syncIndicator.textContent = `Actualizado: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } catch (err) {
            console.error('Error fetching students:', err);
            dom.studentsList.innerHTML = `
                <div class="state-container">
                    <div class="state-icon" style="color: var(--danger);">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    </div>
                    <div class="state-title">Error al cargar datos</div>
                    <div class="state-desc">${err.message || 'No se pudieron recuperar los registros.'}</div>
                    <button class="btn btn-secondary" id="retryLoadBtn" style="margin-top: 14px;">Reintentar</button>
                </div>
            `;
            document.getElementById('retryLoadBtn')?.addEventListener('click', loadStudents);
            showToast('Error al cargar datos', 'error');
        }
    }

    // Natural sort helper for course names (e.g. 5P, 5R, 6L, 10B, 11AM, 12D)
    function sortCourses(courses) {
        return courses.sort((a, b) => {
            const numA = parseInt(a, 10) || 0;
            const numB = parseInt(b, 10) || 0;
            if (numA !== numB) return numA - numB;
            return a.localeCompare(b);
        });
    }

    function populateCourseFilter() {
        const uniqueCourses = sortCourses(Array.from(new Set(state.students.map(s => s.curso))).filter(Boolean));
        const currentSelected = dom.cursoFilter.value;

        let optionsHtml = '<option value="ALL">Todos los Cursos</option>';
        uniqueCourses.forEach(curso => {
            optionsHtml += `<option value="${escapeHtml(curso)}">${escapeHtml(curso)}</option>`;
        });

        dom.cursoFilter.innerHTML = optionsHtml;
        if (uniqueCourses.includes(currentSelected)) {
            dom.cursoFilter.value = currentSelected;
        } else {
            dom.cursoFilter.value = 'ALL';
            state.activeCursoFilter = 'ALL';
        }
    }

    // =========================================================================
    // RENDERING & FILTERING
    // =========================================================================
    function getFilteredStudents() {
        return state.students.filter(student => {
            // Course Filter
            if (state.activeCursoFilter !== 'ALL' && student.curso !== state.activeCursoFilter) {
                return false;
            }

            // Status Filter
            if (state.activeStatusFilter === 'UNPAID' && student.paid_status) return false;
            if (state.activeStatusFilter === 'PAID' && !student.paid_status) return false;

            // Search Query Filter
            if (state.searchQuery.trim()) {
                const query = normalizeStr(state.searchQuery);
                const nameMatch = normalizeStr(student.name).includes(query);
                const cursoMatch = normalizeStr(student.curso).includes(query);
                if (!nameMatch && !cursoMatch) return false;
            }

            return true;
        });
    }

    function renderStudentsList() {
        const filtered = getFilteredStudents();

        // Update counts in header and filter pills
        const totalCount = state.students.length;
        const unpaidCount = state.students.filter(s => !s.paid_status).length;
        const paidCount = state.students.filter(s => s.paid_status).length;

        dom.countAll.textContent = totalCount;
        dom.countUnpaid.textContent = unpaidCount;
        dom.countPaid.textContent = paidCount;
        dom.headerUnpaidCount.textContent = unpaidCount;
        dom.filteredResultsLabel.textContent = `Mostrando ${filtered.length} de ${totalCount} alumnos`;

        if (filtered.length === 0) {
            dom.studentsList.innerHTML = `
                <div class="state-container">
                    <div class="state-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    </div>
                    <div class="state-title">No se encontraron alumnos</div>
                    <div class="state-desc">Prueba cambiando los filtros o el término de búsqueda.</div>
                </div>
            `;
            return;
        }

        let html = '';
        filtered.forEach(student => {
            const isPaid = Boolean(student.paid_status);
            html += `
                <div class="student-card ${isPaid ? 'is-paid' : ''}" data-id="${student.id}" role="button" tabindex="0" aria-label="${escapeHtml(student.name)}, ${escapeHtml(student.curso)}, ${isPaid ? 'Pagado' : 'Pendiente'}">
                    <div class="student-info">
                        <span class="student-name">${escapeHtml(student.name)}</span>
                        <div class="student-meta">
                            <span class="curso-tag">${escapeHtml(student.curso)}</span>
                        </div>
                    </div>
                    <div class="status-badge ${isPaid ? 'paid' : 'unpaid'}">
                        ${isPaid ? `
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            Pagado
                        ` : `
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="8"/></svg>
                            Pendiente
                        `}
                    </div>
                </div>
            `;
        });

        dom.studentsList.innerHTML = html;

        // Attach click handlers to student rows
        dom.studentsList.querySelectorAll('.student-card').forEach(card => {
            card.addEventListener('click', () => {
                const studentId = card.getAttribute('data-id');
                const student = state.students.find(s => String(s.id) === String(studentId));
                if (student) {
                    openPaymentConfirmationModal(student);
                }
            });
        });
    }

    // =========================================================================
    // PAYMENT INTERACTION & ASYNC STATE UPDATE
    // =========================================================================
    function openPaymentConfirmationModal(student) {
        state.selectedStudent = student;
        dom.confirmModalStudentName.textContent = student.name;
        dom.confirmModalStudentCurso.textContent = student.curso;

        if (student.paid_status) {
            dom.confirmModalMessage.textContent = 'Este alumno ya está marcado como Pagado. ¿Deseas volver a marcarlo como Pendiente?';
            dom.confirmBtnText.textContent = 'Marcar como Pendiente';
            dom.confirmPaymentBtn.className = 'btn btn-danger';
        } else {
            dom.confirmModalMessage.textContent = '¿Confirmas que este alumno realizó el pago de su cuota?';
            dom.confirmBtnText.textContent = 'Confirmar Pago';
            dom.confirmPaymentBtn.className = 'btn btn-success';
        }

        openModal(dom.paymentModal);
    }

    async function executePaymentUpdate() {
        if (!state.selectedStudent) return;
        const student = state.selectedStudent;
        const newPaidStatus = !student.paid_status;

        // Set Loading state on confirmation button
        dom.confirmPaymentBtn.disabled = true;
        const originalBtnHtml = dom.confirmPaymentBtn.innerHTML;
        dom.confirmPaymentBtn.innerHTML = `<div class="spinner" style="width:18px;height:18px;margin:0;border-width:2px;"></div> Guardando...`;

        try {
            if (!state.isDemoMode && state.supabaseClient) {
                const { error } = await state.supabaseClient
                    .from('students')
                    .update({ 
                        paid_status: newPaidStatus,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', student.id);

                if (error) throw error;
            } else {
                // Update LocalStorage
                const idx = state.students.findIndex(s => String(s.id) === String(student.id));
                if (idx !== -1) {
                    state.students[idx].paid_status = newPaidStatus;
                    localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.DEMO_STUDENTS, JSON.stringify(state.students));
                }
            }

            // Update in-memory state
            student.paid_status = newPaidStatus;

            // Close modal
            closeModal(dom.paymentModal);

            // Dynamic visual feedback: locate DOM element
            const cardEl = dom.studentsList.querySelector(`.student-card[data-id="${student.id}"]`);
            if (cardEl) {
                if (newPaidStatus) {
                    cardEl.classList.add('is-paid', 'payment-flash');
                    const badge = cardEl.querySelector('.status-badge');
                    if (badge) {
                        badge.className = 'status-badge paid';
                        badge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Pagado`;
                    }
                    setTimeout(() => cardEl.classList.remove('payment-flash'), 800);
                } else {
                    cardEl.classList.remove('is-paid');
                    const badge = cardEl.querySelector('.status-badge');
                    if (badge) {
                        badge.className = 'status-badge unpaid';
                        badge.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Pendiente`;
                    }
                }
            }

            // Update header counters and statistics
            const unpaidCount = state.students.filter(s => !s.paid_status).length;
            const paidCount = state.students.filter(s => s.paid_status).length;
            dom.countUnpaid.textContent = unpaidCount;
            dom.countPaid.textContent = paidCount;
            dom.headerUnpaidCount.textContent = unpaidCount;
            updateStatistics();

            showToast(newPaidStatus ? `Pago registrado: ${student.name}` : `Pago revertido: ${student.name}`, 'success');

        } catch (err) {
            console.error('Error updating payment status:', err);
            showToast(`Error al guardar: ${err.message || 'Inténtalo de nuevo'}`, 'error');
        } finally {
            dom.confirmPaymentBtn.disabled = false;
            dom.confirmPaymentBtn.innerHTML = originalBtnHtml;
        }
    }

    // =========================================================================
    // STATISTICS VIEW
    // =========================================================================
    function updateStatistics() {
        const total = state.students.length;
        const unpaid = state.students.filter(s => !s.paid_status).length;
        const paid = total - unpaid;
        const unpaidPercent = total > 0 ? Math.round((unpaid / total) * 100) : 0;

        dom.statsUnpaidTotal.textContent = unpaid;
        dom.statsUnpaidPercent.textContent = `${unpaidPercent}% del total de alumnos`;
        dom.statsPaidTotal.textContent = paid;
        dom.statsOverallTotal.textContent = total;

        // Group by course
        const coursesMap = {};
        state.students.forEach(student => {
            const c = student.curso || 'Sin Curso';
            if (!coursesMap[c]) {
                coursesMap[c] = { curso: c, total: 0, unpaid: 0, paid: 0 };
            }
            coursesMap[c].total += 1;
            if (student.paid_status) {
                coursesMap[c].paid += 1;
            } else {
                coursesMap[c].unpaid += 1;
            }
        });

        const courseList = Object.values(coursesMap).sort((a, b) => {
            const numA = parseInt(a.curso, 10) || 0;
            const numB = parseInt(b.curso, 10) || 0;
            if (numA !== numB) return numA - numB;
            return a.curso.localeCompare(b.curso);
        });

        dom.statsCoursesCount.textContent = `${courseList.length} cursos`;

        if (courseList.length === 0) {
            dom.statsCourseList.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 12px;">Sin datos disponibles</div>`;
            return;
        }

        let html = '';
        courseList.forEach(item => {
            const percentPaid = item.total > 0 ? Math.round((item.paid / item.total) * 100) : 0;
            html += `
                <div class="course-stat-item">
                    <div class="course-stat-header">
                        <span class="course-name-stat">${escapeHtml(item.curso)}</span>
                        <span class="course-unpaid-badge">${item.unpaid} pendientes</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-secondary);">
                        <span>${item.paid} pagados de ${item.total}</span>
                        <span>${percentPaid}% completado</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${percentPaid}%;"></div>
                    </div>
                </div>
            `;
        });

        dom.statsCourseList.innerHTML = html;
    }

    // =========================================================================
    // EVENT LISTENERS & MODAL CONTROLLERS
    // =========================================================================
    function initEventListeners() {
        // PIN Keypad clicks
        dom.pinKeypad.addEventListener('click', (e) => {
            const keyBtn = e.target.closest('.pin-key');
            if (!keyBtn) return;

            const key = keyBtn.getAttribute('data-key');
            if (key !== null) {
                handlePinKeyPress(key);
            }
        });

        dom.pinClearBtn.addEventListener('click', resetPinInput);
        dom.pinBackspaceBtn.addEventListener('click', handlePinBackspace);

        // Hardware keyboard support for PIN
        window.addEventListener('keydown', (e) => {
            if (!state.isAuthenticated) {
                if (/^[0-9]$/.test(e.key)) {
                    handlePinKeyPress(e.key);
                } else if (e.key === 'Backspace') {
                    handlePinBackspace();
                } else if (e.key === 'Escape') {
                    resetPinInput();
                }
            }
        });

        // Header Buttons
        dom.openStatsBtn.addEventListener('click', () => {
            updateStatistics();
            openModal(dom.statsModal);
        });

        dom.openSettingsBtn.addEventListener('click', () => {
            openModal(dom.settingsModal);
        });

        dom.lockSessionBtn.addEventListener('click', lockSession);

        // Filters & Search
        dom.cursoFilter.addEventListener('change', (e) => {
            state.activeCursoFilter = e.target.value;
            renderStudentsList();
        });

        dom.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value;
            dom.clearSearchBtn.classList.toggle('hidden', !e.target.value);
            renderStudentsList();
        });

        dom.clearSearchBtn.addEventListener('click', () => {
            dom.searchInput.value = '';
            state.searchQuery = '';
            dom.clearSearchBtn.classList.add('hidden');
            renderStudentsList();
        });

        // Quick Status Pills
        dom.statusPills.forEach(pill => {
            pill.addEventListener('click', () => {
                dom.statusPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                state.activeStatusFilter = pill.getAttribute('data-status');
                renderStudentsList();
            });
        });

        // Payment Confirmation Modal Actions
        dom.confirmPaymentBtn.addEventListener('click', executePaymentUpdate);
        dom.cancelPaymentBtn.addEventListener('click', () => closeModal(dom.paymentModal));
        dom.closePaymentModalBtn.addEventListener('click', () => closeModal(dom.paymentModal));

        // Stats Modal Actions
        dom.closeStatsModalBtn.addEventListener('click', () => closeModal(dom.statsModal));
        dom.refreshStatsBtn.addEventListener('click', async () => {
            await loadStudents();
            showToast('Estadísticas actualizadas', 'info');
        });

        // Settings Modal Actions
        dom.closeSettingsModalBtn.addEventListener('click', () => closeModal(dom.settingsModal));
        dom.themeLightBtn.addEventListener('click', () => setTheme('light'));
        dom.themeDarkBtn.addEventListener('click', () => setTheme('dark'));

        dom.loadDemoDataBtn.addEventListener('click', () => {
            localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.DEMO_STUDENTS, JSON.stringify(ALL_STUDENTS));
            closeModal(dom.settingsModal);
            showToast('Lista de 156 alumnos restaurada', 'success');
            loadStudents();
        });

        // Close modal when tapping backdrop
        [dom.paymentModal, dom.statsModal, dom.settingsModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        });
    }

    // Modal Helpers
    function openModal(modal) {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    // =========================================================================
    // UTILITIES
    // =========================================================================
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let iconSvg = '';
        if (type === 'success') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
        } else if (type === 'error') {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
        } else {
            iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
        }

        toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
        dom.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function normalizeStr(str) {
        return (str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initApp);
    } else {
        initApp();
    }

})();
