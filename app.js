/* ==========================================================================
   WanderPlan Core Application Logic
   ========================================================================== */

class WanderPlanApp {
  constructor() {
    this.trips = [];
    this.activeTripId = null;
    this.activeDayIndex = 0;
    this.webhookUrl = 'https://siddhib.app.n8n.cloud/webhook/4e71779d-7849-47b2-a9b4-34d8e398dd91';
    
    // Load from LocalStorage or initialize default
    this.loadState();
    this.initDOM();
    this.bindEvents();
    this.initAIChat();
    
    // Render initial view
    this.renderDashboard();
  }

  /* ==========================================================================
     State & Storage Management
     ========================================================================== */

  loadState() {
    const savedTrips = localStorage.getItem('wanderplan_trips');
    const savedWebhook = localStorage.getItem('wanderplan_webhook');
    
    if (savedWebhook) {
      this.webhookUrl = savedWebhook;
    }
    
    if (savedTrips) {
      this.trips = JSON.parse(savedTrips);
    } else {
      // Setup a beautiful pre-configured trip for demonstration
      this.trips = [this.createSampleTrip()];
      this.saveState();
    }
  }

  saveState() {
    localStorage.setItem('wanderplan_trips', JSON.stringify(this.trips));
    localStorage.setItem('wanderplan_webhook', this.webhookUrl);
  }

  createSampleTrip() {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() + 30);
    const end = new Date(start);
    end.setDate(start.getDate() + 4); // 5-day trip

    return {
      id: 'sample-kyoto',
      destination: 'Kyoto, Japan',
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
      budgetLimit: 3000,
      style: 'Cultural',
      companion: 'Couple',
      activities: [
        {
          id: 'act-1',
          dayIndex: 0,
          title: 'Arrive at Kyoto Station & Check-in',
          time: '14:00',
          cost: 120,
          category: 'lodging',
          notes: 'Granvia Kyoto Hotel. Confirm reservation #GR-88291.'
        },
        {
          id: 'act-2',
          dayIndex: 0,
          title: 'Sunset at Fushimi Inari Shrine',
          time: '17:30',
          cost: 0,
          category: 'sightseeing',
          notes: 'Walk through the thousands of vermilion torii gates. Best at twilight.'
        },
        {
          id: 'act-3',
          dayIndex: 0,
          title: 'Traditional Kaiseki Dinner',
          time: '20:00',
          cost: 180,
          category: 'dining',
          notes: 'Gion Karyo. Traditional multi-course dining experience.'
        },
        {
          id: 'act-4',
          dayIndex: 1,
          title: 'Arashiyama Bamboo Grove Walk',
          time: '08:30',
          cost: 0,
          category: 'sightseeing',
          notes: 'Arrive early to beat the crowds. Head to the Tenryu-ji Temple afterward.'
        },
        {
          id: 'act-5',
          dayIndex: 1,
          title: 'Sagano Romantic Train Ride',
          time: '11:00',
          cost: 30,
          category: 'activity',
          notes: 'Scenic rail journey along the Hozu River.'
        }
      ],
      packingList: [
        { id: 'pack-1', name: 'Passport & Visas', category: 'Documents', packed: true },
        { id: 'pack-2', name: 'Flight Tickets', category: 'Documents', packed: true },
        { id: 'pack-3', name: 'Comfortable Walking Shoes', category: 'Clothing', packed: false },
        { id: 'pack-4', name: 'Camera & Spare Batteries', category: 'Tech', packed: false },
        { id: 'pack-5', name: 'Japan Rail Pass', category: 'Documents', packed: false },
        { id: 'pack-6', name: 'Universal Travel Adapter', category: 'Tech', packed: true },
        { id: 'pack-7', name: 'Light Rain Jacket', category: 'Clothing', packed: false }
      ],
      expenses: [
        { id: 'exp-1', desc: 'Kaiseki Dinner Gion', amount: 180, category: 'food' },
        { id: 'exp-2', desc: 'Granvia Hotel Deposit', amount: 650, category: 'lodging' },
        { id: 'exp-3', desc: 'Shinkansen Bullet Train Tickets', amount: 260, category: 'transit' },
        { id: 'exp-4', desc: 'Sagano Train Tickets', amount: 30, category: 'activities' }
      ]
    };
  }

  /* ==========================================================================
     DOM Selection & Initial Setup
     ========================================================================== */

  initDOM() {
    // Nav elements
    this.navDashboard = document.getElementById('nav-dashboard');
    this.navWebhookSettings = document.getElementById('nav-webhook-settings');
    this.globalSearch = document.getElementById('global-search');
    
    // Views
    this.dashboardView = document.getElementById('dashboard-view');
    this.detailView = document.getElementById('detail-view');
    
    // Modals
    this.modalCreateTrip = document.getElementById('modal-create-trip');
    this.modalAddActivity = document.getElementById('modal-add-activity');
    this.modalWebhookSettings = document.getElementById('modal-webhook-settings');
    
    // Dynamic Containers
    this.tripsGrid = document.getElementById('trips-grid-container');
    this.itineraryDayTabs = document.getElementById('itinerary-day-tabs');
    this.activitiesList = document.getElementById('activities-list-container');
    this.expenseList = document.getElementById('expense-list-container');
    this.packingCategories = document.getElementById('packing-categories-container');
    this.toastContainer = document.getElementById('toast-container');
    
    // Detail View Elements
    this.tripTitle = document.getElementById('trip-destination-title');
    this.tripDatesText = document.getElementById('trip-dates-text');
    this.tagStyle = document.getElementById('tag-style');
    this.tagCompanion = document.getElementById('tag-companion');
    
    // Stats Elements
    this.statTotalTrips = document.getElementById('stat-total-trips');
    this.statTotalBudget = document.getElementById('stat-total-budget');

    // AI Chat Elements
    this.aiChatWidget = document.getElementById('ai-chat-widget');
    this.btnToggleAiChat = document.getElementById('btn-toggle-ai-chat');
    this.aiChatContainer = document.getElementById('ai-chat-container');
    this.btnCloseAiChat = document.getElementById('btn-close-ai-chat');
    this.aiMessagesLog = document.getElementById('ai-messages-log');
    this.aiChatForm = document.getElementById('ai-chat-form');
    this.aiChatInput = document.getElementById('ai-chat-input');
  }

  /* ==========================================================================
     Event Bindings
     ========================================================================== */

  bindEvents() {
    // Navigation
    this.navDashboard.addEventListener('click', (e) => {
      e.preventDefault();
      this.switchView('dashboard');
    });
    
    this.navWebhookSettings.addEventListener('click', (e) => {
      e.preventDefault();
      this.openModal(this.modalWebhookSettings);
    });

    // Dashboard Actions
    document.getElementById('btn-create-trip-top').addEventListener('click', () => {
      this.openModal(this.modalCreateTrip);
    });
    
    document.getElementById('card-new-trip-trigger').addEventListener('click', () => {
      this.openModal(this.modalCreateTrip);
    });
    
    // Back to Dashboard
    document.getElementById('btn-back-dashboard').addEventListener('click', () => {
      this.switchView('dashboard');
    });

    // Detail Actions
    document.getElementById('btn-add-activity').addEventListener('click', () => {
      this.openModal(this.modalAddActivity);
    });
    
    document.getElementById('btn-delete-trip').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this trip itinerary? This cannot be undone.')) {
        this.deleteActiveTrip();
      }
    });

    // Webhook Sync Action
    document.getElementById('btn-sync-webhook').addEventListener('click', () => {
      this.syncActiveTrip();
    });

    // Modals - Close buttons
    document.getElementById('btn-close-trip-modal').addEventListener('click', () => this.closeModal(this.modalCreateTrip));
    document.getElementById('btn-close-activity-modal').addEventListener('click', () => this.closeModal(this.modalAddActivity));
    document.getElementById('btn-close-webhook-modal').addEventListener('click', () => this.closeModal(this.modalWebhookSettings));

    // Form Submits
    document.getElementById('create-trip-form').addEventListener('submit', (e) => this.handleCreateTrip(e));
    document.getElementById('add-activity-form').addEventListener('submit', (e) => this.handleAddActivity(e));
    document.getElementById('add-expense-form').addEventListener('submit', (e) => this.handleAddExpense(e));
    document.getElementById('add-packing-form').addEventListener('submit', (e) => this.handleAddPackingItem(e));
    document.getElementById('webhook-settings-form').addEventListener('submit', (e) => this.handleSaveWebhookSettings(e));
    
    // Webhook Test Button
    document.getElementById('btn-test-webhook').addEventListener('click', () => this.testWebhookConnection());

    // Close modal when clicking overlay
    [this.modalCreateTrip, this.modalAddActivity, this.modalWebhookSettings].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal);
      });
    });

    // Search bar functionality
    this.globalSearch.addEventListener('input', (e) => this.handleSearch(e.target.value));

    // Filter Tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        filterTabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.renderDashboard(e.target.getAttribute('data-filter'));
      });
    });
  }

  /* ==========================================================================
     Navigation & Modal Mechanics
     ========================================================================== */

  switchView(viewName) {
    if (viewName === 'dashboard') {
      this.dashboardView.classList.add('active');
      this.detailView.classList.remove('active');
      this.navDashboard.classList.add('active');
      this.activeTripId = null;
      this.renderDashboard();
    } else if (viewName === 'detail') {
      this.dashboardView.classList.remove('active');
      this.detailView.classList.add('active');
      this.navDashboard.classList.remove('active');
    }
  }

  openModal(modalElement) {
    modalElement.classList.add('active');
    // Pre-populate fields if necessary
    if (modalElement === this.modalCreateTrip) {
      document.getElementById('create-trip-form').reset();
      // Set default start date to today, end date to tomorrow
      const todayStr = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      document.getElementById('trip-start').value = todayStr;
      document.getElementById('trip-end').value = tomorrowStr;
    } else if (modalElement === this.modalWebhookSettings) {
      document.getElementById('settings-webhook-url').value = this.webhookUrl;
      const testPanel = document.getElementById('webhook-test-response');
      testPanel.style.display = 'none';
      testPanel.className = 'webhook-test-results';
    }
  }

  closeModal(modalElement) {
    modalElement.classList.remove('active');
  }

  /* ==========================================================================
     Toast Notifications System
     ========================================================================== */

  showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
      <button class="toast-close">&times;</button>
    `;
    
    // Bind close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.style.animation = 'slideIn 0.3s ease reverse forwards';
      setTimeout(() => toast.remove(), 300);
    });
    
    this.toastContainer.appendChild(toast);
    
    // Auto remove after 4.5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideIn 0.3s ease reverse forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  }

  /* ==========================================================================
     CRUD Operations: Trips
     ========================================================================== */

  handleCreateTrip(e) {
    e.preventDefault();
    
    const destination = document.getElementById('trip-dest').value.trim();
    const startDate = document.getElementById('trip-start').value;
    const endDate = document.getElementById('trip-end').value;
    const budgetLimit = parseFloat(document.getElementById('trip-budget').value);
    const style = document.getElementById('trip-style').value;
    const companion = document.getElementById('trip-companion').value;

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date must be before or equal to end date.');
      return;
    }

    const newTrip = {
      id: `trip-${Date.now()}`,
      destination,
      startDate,
      endDate,
      budgetLimit,
      style,
      companion,
      activities: [],
      packingList: this.getDefaultPackingList(),
      expenses: []
    };

    this.trips.push(newTrip);
    this.saveState();
    this.closeModal(this.modalCreateTrip);
    this.showToast('Adventure Created!', `Start designing your trip to ${destination}`, 'success');
    
    // Open the new trip details immediately
    this.openTripDetail(newTrip.id);
  }

  getDefaultPackingList() {
    return [
      { id: `pack-${Date.now()}-1`, name: 'Passport & Copies', category: 'Documents', packed: false },
      { id: `pack-${Date.now()}-2`, name: 'Flight & Hotel Bookings', category: 'Documents', packed: false },
      { id: `pack-${Date.now()}-3`, name: 'Credit Cards & Cash', category: 'Documents', packed: false },
      { id: `pack-${Date.now()}-4`, name: 'Toothbrush & Toiletries', category: 'Essentials', packed: false },
      { id: `pack-${Date.now()}-5`, name: 'First Aid Kit / Meds', category: 'Essentials', packed: false },
      { id: `pack-${Date.now()}-6`, name: 'Sufficient Clothing', category: 'Clothing', packed: false },
      { id: `pack-${Date.now()}-7`, name: 'Phone Charger', category: 'Tech', packed: false }
    ];
  }

  openTripDetail(tripId) {
    this.activeTripId = tripId;
    this.activeDayIndex = 0;
    this.switchView('detail');
    this.renderTripDetail();
  }

  deleteActiveTrip() {
    if (!this.activeTripId) return;
    
    const deletedTrip = this.trips.find(t => t.id === this.activeTripId);
    this.trips = this.trips.filter(t => t.id !== this.activeTripId);
    this.saveState();
    
    this.showToast('Trip Removed', `Your trip to ${deletedTrip.destination} was deleted.`, 'info');
    this.switchView('dashboard');
  }

  /* ==========================================================================
     CRUD Operations: Activities
     ========================================================================== */

  handleAddActivity(e) {
    e.preventDefault();
    if (!this.activeTripId) return;

    const trip = this.trips.find(t => t.id === this.activeTripId);
    const title = document.getElementById('activity-title').value.trim();
    const time = document.getElementById('activity-time').value;
    const cost = parseFloat(document.getElementById('activity-cost').value) || 0;
    const category = document.getElementById('activity-cat').value;
    const notes = document.getElementById('activity-notes').value.trim();

    const newActivity = {
      id: `act-${Date.now()}`,
      dayIndex: this.activeDayIndex,
      title,
      time,
      cost,
      category,
      notes
    };

    trip.activities.push(newActivity);
    
    // Sort activities by time
    trip.activities.sort((a, b) => a.time.localeCompare(b.time));

    // If cost > 0, log it in expenses automatically
    if (cost > 0) {
      trip.expenses.push({
        id: `exp-${Date.now()}`,
        desc: `${title} (Timeline Activity)`,
        amount: cost,
        category: category === 'transit' ? 'transit' : (category === 'lodging' ? 'lodging' : 'activities')
      });
    }

    this.saveState();
    this.closeModal(this.modalAddActivity);
    this.showToast('Activity Logged', `Added "${title}" to your itinerary`, 'success');
    
    this.renderTripDetail();
  }

  deleteActivity(activityId) {
    if (!this.activeTripId) return;
    const trip = this.trips.find(t => t.id === this.activeTripId);
    const activity = trip.activities.find(a => a.id === activityId);
    
    trip.activities = trip.activities.filter(a => a.id !== activityId);
    this.saveState();
    
    this.showToast('Activity Removed', `"${activity.title}" was removed.`, 'info');
    this.renderTripDetail();
  }

  /* ==========================================================================
     CRUD Operations: Budget & Expenses
     ========================================================================== */

  handleAddExpense(e) {
    e.preventDefault();
    if (!this.activeTripId) return;

    const trip = this.trips.find(t => t.id === this.activeTripId);
    const desc = document.getElementById('expense-desc').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;

    const newExpense = {
      id: `exp-${Date.now()}`,
      desc,
      amount,
      category
    };

    trip.expenses.push(newExpense);
    this.saveState();
    document.getElementById('add-expense-form').reset();
    
    this.showToast('Expense Logged', `Charged $${amount.toFixed(2)} for "${desc}"`, 'success');
    this.renderTripDetail();
  }

  deleteExpense(expenseId) {
    if (!this.activeTripId) return;
    const trip = this.trips.find(t => t.id === this.activeTripId);
    const expense = trip.expenses.find(e => e.id === expenseId);
    
    trip.expenses = trip.expenses.filter(e => e.id !== expenseId);
    this.saveState();
    
    this.showToast('Expense Cleared', `Deleted expense of $${expense.amount.toFixed(2)}`, 'info');
    this.renderTripDetail();
  }

  /* ==========================================================================
     CRUD Operations: Packing Checklist
     ========================================================================== */

  handleAddPackingItem(e) {
    e.preventDefault();
    if (!this.activeTripId) return;

    const trip = this.trips.find(t => t.id === this.activeTripId);
    const name = document.getElementById('packing-item-name').value.trim();
    
    const newItem = {
      id: `pack-${Date.now()}`,
      name,
      category: 'Essentials', // Custom items go under Essentials by default
      packed: false
    };

    trip.packingList.push(newItem);
    this.saveState();
    document.getElementById('add-packing-form').reset();
    
    this.showToast('Item Added', `"${name}" added to packing checklist`, 'success');
    this.renderPackingList(trip);
  }

  togglePackingItem(itemId) {
    if (!this.activeTripId) return;
    const trip = this.trips.find(t => t.id === this.activeTripId);
    const item = trip.packingList.find(i => i.id === itemId);
    
    item.packed = !item.packed;
    this.saveState();
    this.renderPackingList(trip);
  }

  deletePackingItem(itemId) {
    if (!this.activeTripId) return;
    const trip = this.trips.find(t => t.id === this.activeTripId);
    
    trip.packingList = trip.packingList.filter(i => i.id !== itemId);
    this.saveState();
    this.renderPackingList(trip);
  }

  /* ==========================================================================
     Dashboard Views Rendering
     ========================================================================== */

  renderDashboard(filterType = 'all') {
    // 1. Calculate Stats
    const totalTripsCount = this.trips.length;
    let totalBudgetVal = 0;
    this.trips.forEach(t => totalBudgetVal += t.budgetLimit);
    
    this.statTotalTrips.textContent = totalTripsCount;
    this.statTotalBudget.textContent = `$${totalBudgetVal.toLocaleString()}`;
    
    // 2. Render Cards
    const activeCards = this.tripsGrid.querySelectorAll('.trip-card');
    activeCards.forEach(c => c.remove());
    
    const today = new Date();
    today.setHours(0,0,0,0);

    const filteredTrips = this.trips.filter(trip => {
      const tripEnd = new Date(trip.endDate);
      tripEnd.setHours(0,0,0,0);
      
      if (filterType === 'upcoming') {
        return tripEnd >= today;
      } else if (filterType === 'past') {
        return tripEnd < today;
      }
      return true;
    });

    filteredTrips.forEach(trip => {
      const card = document.createElement('div');
      card.className = 'trip-card';
      
      // Calculate spent vs limit
      const spent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
      const limit = trip.budgetLimit;
      const spentPercent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
      const overBudget = spent > limit;

      // Card Background Cover Image
      // If Kyoto, we use Kyoto theme or default cover
      const imagePath = 'assets/cover_placeholder.png';
      
      card.innerHTML = `
        <div class="trip-card-cover" style="background-image: url('${imagePath}')">
          <div class="trip-card-overlay"></div>
          <div class="trip-card-delete" title="Delete Trip" data-id="${trip.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </div>
          <span class="badge badge-primary trip-card-style-tag">${trip.style}</span>
          <div class="trip-card-cover-title">${trip.destination}</div>
        </div>
        <div class="trip-card-body">
          <div class="trip-card-dates">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="18" y2="10"></line></svg>
            <span>${this.formatDateRange(trip.startDate, trip.endDate)}</span>
          </div>
          <div class="trip-card-footer">
            <div class="trip-card-budget-bar">
              <span>Expenses</span>
              <span class="spent-label ${overBudget ? 'text-danger' : ''}">$${spent.toLocaleString()} / $${limit.toLocaleString()}</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill ${overBudget ? 'over-budget' : ''}" style="width: ${spentPercent}%"></div>
            </div>
          </div>
        </div>
      `;
      
      // Navigate to Details
      card.addEventListener('click', (e) => {
        // Stop navigation if delete was clicked
        if (e.target.closest('.trip-card-delete')) {
          e.stopPropagation();
          const tripId = e.target.closest('.trip-card-delete').getAttribute('data-id');
          if (confirm('Delete this trip?')) {
            this.trips = this.trips.filter(t => t.id !== tripId);
            this.saveState();
            this.renderDashboard(filterType);
            this.showToast('Trip Deleted', 'The itinerary was deleted successfully.', 'info');
          }
          return;
        }
        this.openTripDetail(trip.id);
      });
      
      this.tripsGrid.appendChild(card);
    });
  }

  /* ==========================================================================
     Trip Detail Views Rendering
     ========================================================================== */

  renderTripDetail() {
    if (!this.activeTripId) return;
    const trip = this.trips.find(t => t.id === this.activeTripId);
    if (!trip) return;

    // Set Banner Titles
    this.tripTitle.textContent = trip.destination;
    this.tripDatesText.textContent = this.formatDateRange(trip.startDate, trip.endDate);
    this.tagStyle.textContent = `🧗 ${trip.style}`;
    this.tagCompanion.textContent = `🙋 ${trip.companion}`;
    
    // Set Header Banner Background
    const bannerBg = document.getElementById('trip-detail-banner-bg');
    bannerBg.style.backgroundImage = "url('assets/cover_placeholder.png')";

    // Generate weather details
    this.renderWeather(trip.destination);

    // Call sub-component renders
    this.renderItineraryDays(trip);
    this.renderActivities(trip);
    this.renderBudget(trip);
    this.renderPackingList(trip);
    this.renderMapRoute(trip);
  }

  // 1. Render Itinerary Day Tabs
  renderItineraryDays(trip) {
    this.itineraryDayTabs.innerHTML = '';
    
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive

    for (let i = 0; i < diffDays; i++) {
      const currentTabDate = new Date(start);
      currentTabDate.setDate(start.getDate() + i);
      
      const tabButton = document.createElement('button');
      tabButton.className = `day-tab ${this.activeDayIndex === i ? 'active' : ''}`;
      tabButton.setAttribute('data-day', i);
      
      const formattedDate = currentTabDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      tabButton.innerHTML = `Day ${i + 1} <span style="font-size:0.75rem; font-weight:400; opacity:0.75;">(${formattedDate})</span>`;
      
      tabButton.addEventListener('click', () => {
        this.activeDayIndex = i;
        this.renderItineraryDays(trip);
        this.renderActivities(trip);
        this.renderMapRoute(trip);
      });
      
      this.itineraryDayTabs.appendChild(tabButton);
    }
  }

  // 2. Render Timeline Activities
  renderActivities(trip) {
    this.activitiesList.innerHTML = '';
    
    const dayActivities = trip.activities.filter(act => act.dayIndex === this.activeDayIndex);
    
    if (dayActivities.length === 0) {
      this.activitiesList.innerHTML = `
        <div class="timeline-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <p>No activities planned for this day yet.</p>
        </div>
      `;
      return;
    }

    dayActivities.forEach(act => {
      const activityCard = document.createElement('div');
      activityCard.className = 'activity-card';
      
      const categoryEmoji = this.getCategoryEmoji(act.category);

      activityCard.innerHTML = `
        <div class="timeline-dot" style="border-color: var(--${this.getCategoryColorVar(act.category)})"></div>
        <div class="activity-time-cost">
          <span class="activity-time">${act.time}</span>
          ${act.cost > 0 ? `<span class="activity-cost">$${act.cost.toFixed(0)}</span>` : '<span class="activity-cost" style="background:rgba(255,255,255,0.03); color:var(--text-muted)">Free</span>'}
        </div>
        <div class="activity-title-group">
          <div>
            <h4>${act.title}</h4>
            <span class="activity-category-tag ${act.category}">${categoryEmoji} ${act.category}</span>
          </div>
          <button class="activity-card-delete" data-id="${act.id}" title="Remove Activity">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
        ${act.notes ? `<p class="activity-notes">${act.notes}</p>` : ''}
      `;
      
      activityCard.querySelector('.activity-card-delete').addEventListener('click', () => {
        this.deleteActivity(act.id);
      });
      
      this.activitiesList.appendChild(activityCard);
    });
  }

  // 3. Render Budget Doughnut and Expenses List
  renderBudget(trip) {
    const totalLimit = trip.budgetLimit;
    const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = totalLimit - totalSpent;
    
    // Limits displays
    document.getElementById('budget-limit-display').textContent = `$${totalLimit.toLocaleString()}`;
    document.getElementById('budget-spent-display').textContent = `$${totalSpent.toLocaleString()}`;
    
    const remDisplay = document.getElementById('budget-remaining-display');
    const remContainer = document.getElementById('budget-rem-container');
    
    remDisplay.textContent = `$${Math.abs(remaining).toLocaleString()}`;
    if (remaining < 0) {
      remDisplay.className = 'val text-danger';
      remDisplay.textContent = `-$${Math.abs(remaining).toLocaleString()} (Over)`;
    } else {
      remDisplay.className = 'val text-success';
    }

    // Doughnut chart math
    const percent = totalLimit > 0 ? Math.min((totalSpent / totalLimit) * 100, 100) : 0;
    document.getElementById('budget-percent-label').textContent = `${Math.round(percent)}%`;
    
    const ring = document.getElementById('budget-donut-ring');
    // Circumference = 2 * PI * r = 2 * 3.14159 * 15.915 = 100
    // dasharray represents: length-of-stroke length-of-gap
    const strokeDash = `${percent} ${100 - percent}`;
    ring.setAttribute('stroke-dasharray', strokeDash);
    // Set color based on limit
    if (remaining < 0) {
      ring.setAttribute('stroke', 'var(--error)');
    } else if (percent > 85) {
      ring.setAttribute('stroke', 'var(--sunset)');
    } else {
      ring.setAttribute('stroke', 'var(--primary)');
    }

    // Render Expenses list
    this.expenseList.innerHTML = '';
    
    if (trip.expenses.length === 0) {
      this.expenseList.innerHTML = `<p style="font-size:0.8rem; color:var(--text-muted); text-align:center; padding:1rem 0;">No logged expenses yet.</p>`;
      return;
    }

    trip.expenses.forEach(e => {
      const expenseItem = document.createElement('div');
      expenseItem.className = 'expense-item';
      
      const catEmoji = this.getExpenseCategoryEmoji(e.category);
      
      expenseItem.innerHTML = `
        <div class="expense-item-info">
          <span>${catEmoji}</span>
          <span style="font-weight: 500;">${e.desc}</span>
        </div>
        <div class="expense-item-cost">
          <span>$${e.amount.toFixed(0)}</span>
          <button class="btn-delete-expense" data-id="${e.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      `;
      
      expenseItem.querySelector('.btn-delete-expense').addEventListener('click', () => {
        this.deleteExpense(e.id);
      });
      
      this.expenseList.appendChild(expenseItem);
    });
  }

  // 4. Render Packing Checklists
  renderPackingList(trip) {
    const list = trip.packingList;
    
    // Math progress
    const totalItems = list.length;
    const packedItems = list.filter(i => i.packed).length;
    const percent = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;
    
    document.getElementById('packing-progress-bar').style.width = `${percent}%`;
    document.getElementById('packing-progress-text').textContent = `${packedItems} / ${totalItems} Packed`;
    document.getElementById('packing-progress-percentage').textContent = `${percent}%`;

    // Render categorized groups
    this.packingCategories.innerHTML = '';
    
    const categories = ['Documents', 'Essentials', 'Clothing', 'Tech'];
    
    categories.forEach(cat => {
      const itemsInCat = list.filter(item => item.category === cat);
      if (itemsInCat.length === 0 && cat !== 'Essentials') return; // Skip if empty except essentials

      const catBlock = document.createElement('div');
      catBlock.className = 'packing-category';
      
      let itemsHTML = '';
      itemsInCat.forEach(item => {
        itemsHTML += `
          <div class="packing-item ${item.packed ? 'packed' : ''}">
            <label class="packing-label-wrapper" data-id="${item.id}">
              <div class="custom-checkbox">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span>${item.name}</span>
            </label>
            <button class="btn-delete-packing" data-id="${item.id}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        `;
      });

      catBlock.innerHTML = `
        <div class="packing-cat-header">${cat}</div>
        <div class="packing-list">
          ${itemsHTML || '<p style="font-size:0.8rem; color:var(--text-muted); padding:0.25rem 0.5rem;">List is empty</p>'}
        </div>
      `;
      
      // Bind checkbox toggles and delete buttons
      catBlock.querySelectorAll('.packing-label-wrapper').forEach(lbl => {
        lbl.addEventListener('click', (ev) => {
          ev.preventDefault();
          this.togglePackingItem(lbl.getAttribute('data-id'));
        });
      });

      catBlock.querySelectorAll('.btn-delete-packing').forEach(btn => {
        btn.addEventListener('click', () => {
          this.deletePackingItem(btn.getAttribute('data-id'));
        });
      });

      this.packingCategories.appendChild(catBlock);
    });
  }

  // 5. Map routing layout render (SVG Plotting)
  renderMapRoute(trip) {
    const mapContainer = document.getElementById('map-markers-container');
    const svgMap = document.getElementById('map-routes-svg');
    const mapCoords = document.getElementById('map-coords');
    
    mapContainer.innerHTML = '';
    
    // Clear previous dynamic routes
    const paths = svgMap.querySelectorAll('.map-dynamic-route');
    paths.forEach(p => p.remove());

    const dayActivities = trip.activities.filter(act => act.dayIndex === this.activeDayIndex);
    
    // Generate a coordinates mock center for destination
    const destHash = this.getStringHash(trip.destination);
    const baseLat = 30 + (destHash % 20); // 30-50 degrees
    const baseLng = 100 + (destHash % 50); // 100-150 degrees
    
    mapCoords.textContent = `Center Lat: ${baseLat.toFixed(4)}°, Lng: ${baseLng.toFixed(4)}°`;

    if (dayActivities.length === 0) {
      // Draw grid lines
      svgMap.innerHTML = `
        <line x1="0" y1="50" x2="400" y2="50" class="map-grid-lines" />
        <line x1="0" y1="100" x2="400" y2="100" class="map-grid-lines" />
        <line x1="0" y1="150" x2="400" y2="150" class="map-grid-lines" />
        <line x1="100" y1="0" x2="100" y2="200" class="map-grid-lines" />
        <line x1="200" y1="0" x2="200" y2="200" class="map-grid-lines" />
        <line x1="300" y1="0" x2="300" y2="200" class="map-grid-lines" />
      `;
      return;
    }

    // Map Dimensions: 400x200
    // Generate coordinates on map relative to activity order
    const points = [];
    dayActivities.forEach((act, idx) => {
      // Deterministic coordinate based on activity ID
      const actHash = this.getStringHash(act.id);
      const x = 50 + (actHash % 300);
      const y = 30 + (actHash % 140);
      
      points.push({ x, y, act });

      // Create Floating Marker
      const marker = document.createElement('div');
      marker.className = 'map-marker';
      marker.style.left = `${(x / 400) * 100}%`;
      marker.style.top = `${(y / 200) * 100}%`;
      
      const pinColorClass = act.category; // lodging, sightseeing, dining etc

      marker.innerHTML = `
        <div class="map-marker-pin ${pinColorClass}"></div>
        <div class="map-marker-label">${act.time} - ${act.title.substring(0, 15)}${act.title.length > 15 ? '...' : ''}</div>
      `;
      
      mapContainer.appendChild(marker);
    });

    // Draw route vector segments connecting activities
    if (points.length > 1) {
      let pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`;
      }

      // Append SVG Path
      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', pathD);
      pathEl.setAttribute('class', 'map-dynamic-route');
      pathEl.setAttribute('fill', 'none');
      pathEl.setAttribute('stroke', 'var(--accent)');
      pathEl.setAttribute('stroke-width', '2');
      pathEl.setAttribute('stroke-dasharray', '5,5');
      pathEl.setAttribute('style', 'filter: drop-shadow(0 0 3px rgba(6,182,212,0.5))');
      
      svgMap.appendChild(pathEl);
    }
  }

  // 6. Weather Forecast Simulator
  renderWeather(destination) {
    const tempEl = document.getElementById('weather-temp');
    const descEl = document.getElementById('weather-desc');
    const locEl = document.getElementById('weather-loc');
    
    locEl.textContent = destination;
    
    // Custom seed based on destination hash
    const destHash = this.getStringHash(destination);
    const isCold = (destHash % 3) === 0;
    const isRainy = (destHash % 4) === 0;
    
    let temp = 20 + (destHash % 12);
    let desc = 'Sunny & Pleasant';
    let iconHTML = '';

    if (isCold) {
      temp = 4 + (destHash % 8);
      desc = 'Cold & Clear';
    } else if (isRainy) {
      temp = 12 + (destHash % 6);
      desc = 'Passing Showers';
    }

    tempEl.textContent = `${temp}°C`;
    descEl.textContent = desc;

    const weatherIconContainer = document.getElementById('weather-icon-placeholder');
    
    if (desc.includes('Sunny') || desc.includes('Clear')) {
      iconHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon animated-spin" style="color:var(--sunset);">
          <circle cx="12" cy="12" r="5"></circle>
          <line x1="12" y1="1" x2="12" y2="3"></line>
          <line x1="12" y1="21" x2="12" y2="23"></line>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
          <line x1="1" y1="12" x2="3" y2="12"></line>
          <line x1="21" y1="12" x2="23" y2="12"></line>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
        </svg>
      `;
    } else {
      iconHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="weather-icon" style="color:var(--accent);">
          <path d="M17 18a5 5 0 0 0-10 0"></path>
          <path d="M12 2v2"></path>
          <path d="M4.93 4.93l1.41 1.41"></path>
          <path d="M20 10h2"></path>
          <path d="M19.07 4.93l-1.41 1.41"></path>
          <path d="M2 10h2"></path>
          <path d="M15.41 12.59a3 3 0 1 0-6.82 0"></path>
          <line x1="8" y1="22" x2="8" y2="18"></line>
          <line x1="12" y1="22" x2="12" y2="18"></line>
          <line x1="16" y1="22" x2="16" y2="18"></line>
        </svg>
      `;
    }
    
    weatherIconContainer.innerHTML = iconHTML;
  }

  /* ==========================================================================
     n8n Webhook Cloud Integration Module
     ========================================================================== */

  async syncActiveTrip() {
    if (!this.activeTripId) return;
    const trip = this.trips.find(t => t.id === this.activeTripId);
    if (!trip) return;

    const syncBtn = document.getElementById('btn-sync-webhook');
    const syncBtnText = document.getElementById('sync-btn-text');
    const syncBtnIcon = syncBtn.querySelector('.sync-btn-icon');
    const syncBadge = document.getElementById('cloud-sync-status');
    const syncBadgeText = syncBadge.querySelector('.sync-text');

    // 1. Update button to loading state
    syncBtn.disabled = true;
    syncBtnText.textContent = 'Syncing...';
    syncBtnIcon.classList.add('syncing');
    
    syncBadge.className = 'sync-badge';
    syncBadgeText.textContent = 'Uploading to n8n...';

    // 2. Prepare payload
    const payload = {
      sessionId: trip.id, // For n8n memory nodes
      tripId: trip.id,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budgetLimit: trip.budgetLimit,
      style: trip.style,
      companion: trip.companion,
      totalSpent: trip.expenses.reduce((sum, e) => sum + e.amount, 0),
      activitiesCount: trip.activities.length,
      packingListCount: trip.packingList.length,
      activities: trip.activities,
      packingList: trip.packingList,
      expenses: trip.expenses,
      syncedAt: new Date().toISOString(),
      source: 'WanderPlan AI Web Client',
      author: 'Siddhi B.',
      // Standard chat input fields for n8n AI Agent nodes
      input: `Analyze my trip to ${trip.destination}. Budget limit: $${trip.budgetLimit}. Travel style: ${trip.style}. Companions: ${trip.companion}.`,
      chatInput: `Analyze my trip to ${trip.destination}. Budget limit: $${trip.budgetLimit}. Travel style: ${trip.style}. Companions: ${trip.companion}.`
    };

    try {
      // 3. Perform network POST
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        // 4. Handle Success
        this.showToast(
          'Synced to n8n!',
          `Trip details for ${trip.destination} sent to n8n workflow successfully.`,
          'success'
        );
        syncBtnText.textContent = 'Synced';
        syncBtnIcon.classList.remove('syncing');
        
        syncBadge.className = 'sync-badge connected';
        syncBadgeText.textContent = 'Cloud Synced';
        
        // Save synced status metadata to trip
        trip.lastSynced = new Date().toISOString();
        this.saveState();
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (err) {
      // 5. Handle Network/CORS Error
      console.error('Webhook sync failed:', err);
      this.showToast(
        'Webhook Sync Failed',
        'Could not post to n8n. If it is a CORS issue, make sure CORS is enabled in your n8n webhook node.',
        'error'
      );
      
      syncBtnText.textContent = 'Sync Failed';
      syncBtnIcon.classList.remove('syncing');
      
      syncBadge.className = 'sync-badge';
      syncBadgeText.textContent = 'Sync Failed';
    } finally {
      // Re-enable button after cooldown
      setTimeout(() => {
        syncBtn.disabled = false;
        syncBtnText.textContent = 'Sync to Cloud';
      }, 3000);
    }
  }

  // Test webhook connectivity inside Settings Modal
  async testWebhookConnection() {
    const testUrl = document.getElementById('settings-webhook-url').value.trim();
    const testPanel = document.getElementById('webhook-test-response');
    
    if (!testUrl) {
      alert('Please enter a valid URL.');
      return;
    }

    testPanel.style.display = 'block';
    testPanel.className = 'webhook-test-results';
    testPanel.textContent = 'Testing connection...';

    const testPayload = {
      test: true,
      message: 'Hello from WanderPlan test run!',
      timestamp: new Date().toISOString()
    };

    try {
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        testPanel.className = 'webhook-test-results success';
        testPanel.textContent = `Success! Webhook responded with status: ${response.status}. Connection established.`;
        this.showToast('Connection Successful', 'n8n Webhook is reachable!', 'success');
      } else {
        testPanel.className = 'webhook-test-results error';
        testPanel.textContent = `Server responded with status: ${response.status}. The URL is valid, but the endpoint did not return a 2xx success code.`;
      }
    } catch (err) {
      testPanel.className = 'webhook-test-results error';
      testPanel.innerHTML = `
        <strong>Connection Failed!</strong><br>
        Error: ${err.message}<br><br>
        <em>Note: If you see a CORS block, your n8n webhook received the data, but your browser blocked the response. You can ignore this if the n8n execution history shows a trigger, or configure n8n to send CORS headers.</em>
      `;
      this.showToast('Connection Failed', 'Could not establish connection to n8n webhook.', 'error');
    }
  }

  handleSaveWebhookSettings(e) {
    e.preventDefault();
    const newUrl = document.getElementById('settings-webhook-url').value.trim();
    
    this.webhookUrl = newUrl;
    this.saveState();
    
    this.closeModal(this.modalWebhookSettings);
    this.showToast('Settings Saved', 'n8n production webhook updated.', 'success');
    
    // Update header status
    const syncBadge = document.getElementById('cloud-sync-status');
    const syncBadgeText = syncBadge.querySelector('.sync-text');
    syncBadge.className = 'sync-badge connected';
    syncBadgeText.textContent = 'Cloud Sync Ready';
  }

  /* ==========================================================================
     Helper Utilities
     ========================================================================== */

  // Global search through trip destinations
  handleSearch(query) {
    if (!query) {
      this.renderDashboard();
      return;
    }
    
    const filtered = this.trips.filter(t => 
      t.destination.toLowerCase().includes(query.toLowerCase()) ||
      t.style.toLowerCase().includes(query.toLowerCase())
    );
    
    // Clear and render filtered
    const activeCards = this.tripsGrid.querySelectorAll('.trip-card');
    activeCards.forEach(c => c.remove());
    
    filtered.forEach(trip => {
      // Reuse card drawing logic or trigger render with custom filter
      // For simplicity, we just filter the DOM items in place
    });
    
    // (Re-rendering is easier)
    // We can temporarily replace this.trips with filtered and render, then restore
    const originalTrips = this.trips;
    this.trips = filtered;
    this.renderDashboard();
    this.trips = originalTrips;
  }

  formatDateRange(startStr, endStr) {
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    const startOpt = { month: 'short', day: 'numeric' };
    const endOpt = start.getFullYear() !== end.getFullYear() 
      ? { month: 'short', day: 'numeric', year: 'numeric' }
      : { month: 'short', day: 'numeric' };

    return `${start.toLocaleDateString('en-US', startOpt)} - ${end.toLocaleDateString('en-US', endOpt)}, ${end.getFullYear()}`;
  }

  getCategoryEmoji(category) {
    switch (category) {
      case 'sightseeing': return '👁️';
      case 'dining': return '🍜';
      case 'activity': return '🎯';
      case 'transit': return '✈️';
      case 'lodging': return '🏨';
      default: return '📍';
    }
  }

  getCategoryColorVar(category) {
    switch (category) {
      case 'sightseeing': return 'accent';
      case 'dining': return 'sunset';
      case 'activity': return 'primary';
      case 'transit': return 'warning';
      case 'lodging': return 'success';
      default: return 'primary';
    }
  }

  getExpenseCategoryEmoji(category) {
    switch (category) {
      case 'lodging': return '🏨';
      case 'food': return '🍔';
      case 'transit': return '✈️';
      case 'activities': return '🎟️';
      default: return '🛍️';
    }
  }

  getStringHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  }

  /* ==========================================================================
     WanderBot AI Chat Assistance Module
     ========================================================================== */

  initAIChat() {
    if (!this.btnToggleAiChat) return;

    // Toggle Chat Panel
    this.btnToggleAiChat.addEventListener('click', () => {
      this.aiChatContainer.classList.toggle('active');
      // Hide the "Help" notification badge when chat is opened
      const badge = this.btnToggleAiChat.querySelector('.ai-badge-new');
      if (badge) badge.style.display = 'none';
      this.scrollToChatBottom();
    });

    // Close Chat Panel
    this.btnCloseAiChat.addEventListener('click', () => {
      this.aiChatContainer.classList.remove('active');
    });

    // Form submission
    this.aiChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = this.aiChatInput.value.trim();
      if (!text) return;

      this.appendChatMessage('user', text);
      this.aiChatInput.value = '';
      this.scrollToChatBottom();

      // Typing simulation delay for WanderBot response
      setTimeout(() => {
        this.simulateBotResponse(text);
      }, 700);
    });

    // Quick suggestion chip handlers
    const chips = document.querySelectorAll('.quick-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const text = chip.getAttribute('data-prompt');
        this.appendChatMessage('user', text);
        this.scrollToChatBottom();
        
        setTimeout(() => {
          this.simulateBotResponse(text);
        }, 700);
      });
    });

    // Event delegation for timeline/checklist action buttons inside messages log
    this.aiMessagesLog.addEventListener('click', (e) => {
      const suggestBtn = e.target.closest('.ai-suggest-btn');
      if (!suggestBtn) return;

      const action = suggestBtn.getAttribute('data-action');
      if (action === 'add-activity') {
        const title = suggestBtn.getAttribute('data-title');
        const time = suggestBtn.getAttribute('data-time');
        const cost = parseFloat(suggestBtn.getAttribute('data-cost')) || 0;
        const category = suggestBtn.getAttribute('data-cat');
        const notes = suggestBtn.getAttribute('data-notes');
        
        this.handleAddActivityFromBot(title, time, cost, category, notes);
        suggestBtn.textContent = '✓ Added to Itinerary';
        suggestBtn.disabled = true;
        suggestBtn.style.background = 'rgba(16, 185, 129, 0.15)';
        suggestBtn.style.color = 'var(--success)';
        suggestBtn.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      } else if (action === 'add-packing') {
        const name = suggestBtn.getAttribute('data-name');
        const category = suggestBtn.getAttribute('data-cat') || 'Essentials';
        
        this.handleAddPackingFromBot(name, category);
        suggestBtn.textContent = '✓ Added to Checklist';
        suggestBtn.disabled = true;
        suggestBtn.style.background = 'rgba(16, 185, 129, 0.15)';
        suggestBtn.style.color = 'var(--success)';
        suggestBtn.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      }
    });
  }

  appendChatMessage(sender, text, htmlContent = '') {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${sender}`;
    
    // Format bold text standard markdown
    let formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    msgDiv.innerHTML = `
      <div class="ai-msg-content">
        <div>${formattedText}</div>
        ${htmlContent ? `<div style="margin-top: 0.25rem;">${htmlContent}</div>` : ''}
      </div>
    `;
    
    this.aiMessagesLog.appendChild(msgDiv);
    this.scrollToChatBottom();
  }

  scrollToChatBottom() {
    this.aiMessagesLog.scrollTop = this.aiMessagesLog.scrollHeight;
  }

  simulateBotResponse(userText) {
    const text = userText.toLowerCase();
    
    // Check what the active trip is to personalize bot answers
    let activeTrip = null;
    if (this.activeTripId) {
      activeTrip = this.trips.find(t => t.id === this.activeTripId);
    }
    const destination = activeTrip ? activeTrip.destination : 'Kyoto, Japan';

    // Pattern Matching
    if (text.includes('kyoto') || (text.includes('dining') && destination.toLowerCase().includes('kyoto')) || (text.includes('eat') && destination.toLowerCase().includes('kyoto'))) {
      const html = `
        <button class="ai-suggest-btn" data-action="add-activity" data-title="Nishiki Market Food tasting" data-time="12:30" data-cost="25" data-cat="dining" data-notes="Kyoto's famous 'kitchen' market. Try skewered baby octopus, soy milk donuts, and local matcha sweets.">
          🍴 Add Nishiki Market Tasting to Timeline
        </button>
        <button class="ai-suggest-btn" data-action="add-activity" data-title="Kinkaku-ji Temple Visit" data-time="10:00" data-cost="4" data-cat="sightseeing" data-notes="The historic Golden Pavilion. A Zen temple covered in gold leaf. Stunning reflecting pond view.">
          👁️ Add Kinkaku-ji Temple to Timeline
        </button>
      `;
      this.appendChatMessage(
        'bot',
        `Kyoto has world-renowned dining and temples! 🍣 I highly recommend tasting street food at **Nishiki Market** or visiting the historic **Kinkaku-ji Temple**. 

Click a button below to add these directly to your schedule:`,
        html
      );
    } else if (text.includes('paris') || (text.includes('sight') && destination.toLowerCase().includes('paris')) || (text.includes('louvre') && destination.toLowerCase().includes('paris'))) {
      const html = `
        <button class="ai-suggest-btn" data-action="add-activity" data-title="Louvre Museum Tour" data-time="09:00" data-cost="22" data-cat="sightseeing" data-notes="Pre-booked time slot. Explore the world's largest art museum, containing the Mona Lisa and Venus de Milo.">
          🎨 Add Louvre Tour to Timeline
        </button>
        <button class="ai-suggest-btn" data-action="add-activity" data-title="Seine River Evening Cruise" data-time="19:30" data-cost="15" data-cat="sightseeing" data-notes="Scenic twilight boat cruise along the Seine. Watch the Eiffel Tower sparkle.">
          🚢 Add Seine Cruise to Timeline
        </button>
      `;
      this.appendChatMessage(
        'bot',
        `Paris is spectacular! 🗼 You should explore the art at the **Louvre Museum** in the morning and take a relaxing **Seine River Evening Cruise** at sunset. 

Click below to append these to your timeline:`,
        html
      );
    } else if (text.includes('budget') || text.includes('cost') || text.includes('money')) {
      const html = `
        <button class="ai-suggest-btn" data-action="add-activity" data-title="City Transit Day Pass" data-time="08:00" data-cost="12" data-cat="transit" data-notes="Purchase an unlimited daily public transit pass. Covers all subway, metro, and local bus routes.">
          🚇 Add Public Transit Pass to Timeline
        </button>
      `;
      this.appendChatMessage(
        'bot',
        `Here are my top travel budget tips:
1. **Visit Free Attractions**: Most destinations have beautiful public parks, cathedrals, temples, or viewpoints that cost nothing.
2. **Buy Transit Passes**: Taxis accumulate cost quickly. Opt for a daily local subway/bus pass.
3. **Street Food**: Dining in tourist squares is twice as expensive. Move 2 blocks away to eat where locals do.

I can add a transit day pass expense placeholder to help track your costs:`,
        html
      );
    } else if (text.includes('pack') || text.includes('check') || text.includes('bag')) {
      const html = `
        <button class="ai-suggest-btn" data-action="add-packing" data-name="Portable Power Bank (10k mAh)" data-cat="Tech">
          🔋 Add Power Bank to Tech Checklist
        </button>
        <button class="ai-suggest-btn" data-action="add-packing" data-name="Mini First Aid Kit & Aspirin" data-cat="Essentials">
          💊 Add First Aid Kit to Essentials
        </button>
      `;
      this.appendChatMessage(
        'bot',
        `For a comfortable journey, ensure you pack these tech and health essentials:
* **Tech**: Noise-canceling headphones, travel adapter, charging blocks.
* **Essentials**: Travel tissues, wet wipes, band-aids, custom prescription medication.

Click below to inject these item checklists directly into your packing tab:`,
        html
      );
    } else {
      // Default fallback chat response
      const defaultDest = activeTrip ? activeTrip.destination : "your destination";
      this.appendChatMessage(
        'bot',
        `I am ready to help you plan! 🗺️ Tell me what city you are visiting (e.g., **Kyoto** or **Paris**), ask for **budget tips**, or request **packing suggestions** and I'll generate clickable recommendation links custom-tailored for you!`
      );
    }
  }

  /* ==========================================================================
     Helper API to Insert bot suggestions into active data
     ========================================================================== */

  handleAddActivityFromBot(title, time, cost, category, notes) {
    if (!this.activeTripId) {
      this.showToast('Select a Trip First', 'Please open a trip from your dashboard before adding activities.', 'error');
      return;
    }

    const trip = this.trips.find(t => t.id === this.activeTripId);
    
    const newActivity = {
      id: `act-${Date.now()}`,
      dayIndex: this.activeDayIndex,
      title,
      time,
      cost,
      category,
      notes
    };

    trip.activities.push(newActivity);
    trip.activities.sort((a, b) => a.time.localeCompare(b.time));

    // Log in expenses automatically if cost > 0
    if (cost > 0) {
      trip.expenses.push({
        id: `exp-${Date.now()}`,
        desc: `${title} (Suggested)`,
        amount: cost,
        category: category === 'transit' ? 'transit' : (category === 'lodging' ? 'lodging' : 'activities')
      });
    }

    this.saveState();
    this.showToast('Activity Added!', `"${title}" has been appended to your Day ${this.activeDayIndex + 1} itinerary.`, 'success');
    this.renderTripDetail();
  }

  handleAddPackingFromBot(name, category) {
    if (!this.activeTripId) {
      this.showToast('Select a Trip First', 'Please open a trip from your dashboard before adding packing items.', 'error');
      return;
    }

    const trip = this.trips.find(t => t.id === this.activeTripId);

    const newItem = {
      id: `pack-${Date.now()}`,
      name,
      category,
      packed: false
    };

    trip.packingList.push(newItem);
    this.saveState();
    this.showToast('Packing Item Added!', `"${name}" added under ${category}.`, 'success');
    this.renderPackingList(trip);
  }
}

// Instantiate App on Load
document.addEventListener('DOMContentLoaded', () => {
  window.app = new WanderPlanApp();
});
