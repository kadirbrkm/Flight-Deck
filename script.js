// Flight Logger Application
class FlightLogger {
    constructor() {
        this.flights = JSON.parse(localStorage.getItem('flights')) || [];
        this.map = null;
        this.flightPaths = [];
        this.editingIndex = -1;
        this.currentFilters = {
            month: '',
            aircraft: '',
            route: ''
        };
        this.sortConfig = {
            column: 'date',
            direction: 'desc'
        };
        this.airports = this.getAirportDatabase();
        
        this.init();
    }

    init() {
        this.initializeMap();
        this.bindEvents();
        this.initializeAirportDropdowns();
        this.updateStatistics();
        this.renderFlightTable();
        this.updateFilterOptions();
        this.plotAllFlights();
    }

    // Initialize airport dropdowns
    initializeAirportDropdowns() {
        const departureInput = document.getElementById('departureAirport');
        const arrivalInput = document.getElementById('arrivalAirport');
        
        if (departureInput) {
            this.createAirportDropdown(departureInput, 'departureDropdown');
        }
        
        if (arrivalInput) {
            this.createAirportDropdown(arrivalInput, 'arrivalDropdown');
        }
    }

    // Initialize Leaflet map
    initializeMap() {
        this.map = L.map('map').setView([39.8283, -98.5795], 4); // Center on USA
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Add a layer group for flight paths
        this.flightPathLayer = L.layerGroup().addTo(this.map);
    }

    // Bind all event listeners
    bindEvents() {
        // Form submission
        document.getElementById('flightForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFlightSubmission();
        });

        // Cancel edit
        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.cancelEdit();
        });

        // Map controls
        document.getElementById('clearMap').addEventListener('click', () => {
            this.clearMap();
        });

        document.getElementById('fitMap').addEventListener('click', () => {
            this.fitMapToFlights();
        });

        // Export functionality
        document.getElementById('exportFlights').addEventListener('click', () => {
            this.exportFlights();
        });

        // Filter controls
        document.getElementById('filterMonth').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filterAircraft').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('filterRoute').addEventListener('input', () => {
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Modal controls
        document.querySelector('.close').addEventListener('click', () => {
            this.closeModal();
        });

        window.addEventListener('click', (e) => {
            if (e.target === document.getElementById('editModal')) {
                this.closeModal();
            }
        });

        // Table sorting
        document.querySelectorAll('.sortable').forEach(header => {
            header.addEventListener('click', () => {
                this.handleSort(header.dataset.sort);
            });
        });
    }

    // Handle flight form submission
    handleFlightSubmission() {
        const formData = this.getFormData();
        
        if (!this.validateForm(formData)) {
            return;
        }

        if (this.editingIndex >= 0) {
            // Update existing flight
            this.flights[this.editingIndex] = { ...formData, id: this.flights[this.editingIndex].id };
            this.editingIndex = -1;
            this.showCancelButton(false);
            this.showMessage('Flight updated successfully!', 'success');
        } else {
            // Add new flight
            formData.id = Date.now().toString();
            this.flights.push(formData);
            this.showMessage('Flight logged successfully!', 'success');
        }

        this.saveFlights();
        this.resetForm();
        this.updateStatistics();
        this.renderFlightTable();
        this.updateFilterOptions();
        this.plotAllFlights();
    }

    // Get form data
    getFormData() {
        return {
            date: document.getElementById('flightDate').value,
            duration: parseFloat(document.getElementById('flightDuration').value),
            departure: document.getElementById('departureAirport').value.toUpperCase(),
            arrival: document.getElementById('arrivalAirport').value.toUpperCase(),
            aircraft: document.getElementById('aircraftType').value,
            type: document.getElementById('flightType').value,
            notes: document.getElementById('flightNotes').value
        };
    }

    // Validate form data
    validateForm(data) {
        if (!data.date || !data.duration || !data.departure || !data.arrival || !data.aircraft || !data.type) {
            this.showMessage('Please fill in all required fields.', 'error');
            return false;
        }

        if (data.duration <= 0) {
            this.showMessage('Flight duration must be greater than 0.', 'error');
            return false;
        }

        return true;
    }

    // Reset form
    resetForm() {
        document.getElementById('flightForm').reset();
        document.getElementById('flightDate').value = new Date().toISOString().split('T')[0];
    }

    // Save flights to localStorage
    saveFlights() {
        localStorage.setItem('flights', JSON.stringify(this.flights));
    }

    // Update statistics
    updateStatistics() {
        const totalHours = this.flights.reduce((sum, flight) => sum + flight.duration, 0);
        const totalFlights = this.flights.length;
        const uniqueAirports = new Set([
            ...this.flights.map(f => f.departure),
            ...this.flights.map(f => f.arrival)
        ]).size;

        document.getElementById('totalHours').textContent = totalHours.toFixed(1);
        document.getElementById('totalFlights').textContent = totalFlights;
        document.getElementById('uniqueAirports').textContent = uniqueAirports;
    }

    // Render flight table
    renderFlightTable() {
        const tbody = document.getElementById('flightTableBody');
        const filteredFlights = this.getFilteredFlights();
        const sortedFlights = this.getSortedFlights(filteredFlights);

        if (sortedFlights.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-state">
                        <i class="fas fa-plane"></i>
                        <p>No flights found. Start by logging your first flight!</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = sortedFlights.map((flight, index) => `
            <tr class="flight-row" data-flight-index="${this.flights.indexOf(flight)}">
                <td class="date-cell">${this.formatDate(flight.date)}</td>
                <td class="route-cell">
                    <span class="route-info">
                        <span class="airport-code">${flight.departure}</span>
                        <i class="fas fa-arrow-right route-arrow"></i>
                        <span class="airport-code">${flight.arrival}</span>
                    </span>
                </td>
                <td class="aircraft-cell">${flight.aircraft}</td>
                <td class="type-cell">
                    <span class="flight-type-badge ${flight.type.toLowerCase().replace(' ', '-')}">${flight.type}</span>
                </td>
                <td class="duration-cell">
                    <span class="duration-value">${flight.duration.toFixed(1)}h</span>
                </td>
                <td class="notes-cell" title="${flight.notes || 'No notes'}">${flight.notes || '-'}</td>
                <td class="actions-cell">
                    <div class="action-buttons">
                        <button class="btn-secondary btn-small" onclick="flightLogger.editFlight(${this.flights.indexOf(flight)})" title="Edit flight">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger btn-small" onclick="flightLogger.deleteFlight(${this.flights.indexOf(flight)})" title="Delete flight">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="btn-info btn-small" onclick="flightLogger.highlightFlightOnMap(${this.flights.indexOf(flight)})" title="Show on map">
                            <i class="fas fa-map-marker-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add row hover effects and click to highlight
        this.addTableInteractivity();
        this.updateSortIcons();
    }

    // Add table interactivity
    addTableInteractivity() {
        document.querySelectorAll('.flight-row').forEach(row => {
            row.addEventListener('click', (e) => {
                // Don't trigger on button clicks
                if (e.target.closest('.action-buttons')) return;
                
                // Remove previous highlights
                document.querySelectorAll('.flight-row.highlighted').forEach(r => {
                    r.classList.remove('highlighted');
                });
                
                // Highlight current row
                row.classList.add('highlighted');
                
                // Optionally highlight on map
                const flightIndex = parseInt(row.dataset.flightIndex);
                this.highlightFlightOnMap(flightIndex);
            });
        });
    }

    // Highlight specific flight on map
    highlightFlightOnMap(flightIndex) {
        const flight = this.flights[flightIndex];
        if (!flight) return;

        // Clear existing highlights
        this.clearMapHighlights();
        
        // Scroll to map section
        document.querySelector('.map-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });

        // Show message about highlighting
        this.showMessage(`Highlighted flight: ${flight.departure} → ${flight.arrival} on ${this.formatDate(flight.date)}`, 'info');
    }

    // Clear map highlights
    clearMapHighlights() {
        // This will be implemented when we enhance the map functionality
        console.log('Clearing map highlights');
    }

    // Get filtered flights
    getFilteredFlights() {
        return this.flights.filter(flight => {
            // Month filter
            if (this.currentFilters.month) {
                const flightMonth = new Date(flight.date).toISOString().substr(0, 7);
                if (flightMonth !== this.currentFilters.month) return false;
            }

            // Aircraft filter
            if (this.currentFilters.aircraft && flight.aircraft !== this.currentFilters.aircraft) {
                return false;
            }

            // Route filter
            if (this.currentFilters.route) {
                const route = `${flight.departure}-${flight.arrival}`;
                const reverseRoute = `${flight.arrival}-${flight.departure}`;
                const filterRoute = this.currentFilters.route.toUpperCase();
                if (!route.includes(filterRoute) && !reverseRoute.includes(filterRoute)) {
                    return false;
                }
            }

            return true;
        });
    }

    // Apply filters
    applyFilters() {
        this.currentFilters.month = document.getElementById('filterMonth').value;
        this.currentFilters.aircraft = document.getElementById('filterAircraft').value;
        this.currentFilters.route = document.getElementById('filterRoute').value;
        
        this.renderFlightTable();
        this.plotFilteredFlights();
    }

    // Clear filters
    clearFilters() {
        document.getElementById('filterMonth').value = '';
        document.getElementById('filterAircraft').value = '';
        document.getElementById('filterRoute').value = '';
        
        this.currentFilters = { month: '', aircraft: '', route: '' };
        this.renderFlightTable();
        this.plotAllFlights();
    }

    // Update filter options
    updateFilterOptions() {
        // Update month filter
        const months = [...new Set(this.flights.map(f => new Date(f.date).toISOString().substr(0, 7)))].sort();
        const monthSelect = document.getElementById('filterMonth');
        monthSelect.innerHTML = '<option value="">All Months</option>' +
            months.map(month => {
                const date = new Date(month + '-01');
                const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                return `<option value="${month}">${monthName}</option>`;
            }).join('');

        // Update aircraft filter
        const aircraft = [...new Set(this.flights.map(f => f.aircraft))].sort();
        const aircraftSelect = document.getElementById('filterAircraft');
        aircraftSelect.innerHTML = '<option value="">All Aircraft</option>' +
            aircraft.map(ac => `<option value="${ac}">${ac}</option>`).join('');
    }

    // Format date for display
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Edit flight
    editFlight(index) {
        const flight = this.flights[index];
        this.editingIndex = index;

        // Populate form with flight data
        document.getElementById('flightDate').value = flight.date;
        document.getElementById('flightDuration').value = flight.duration;
        document.getElementById('departureAirport').value = flight.departure;
        document.getElementById('arrivalAirport').value = flight.arrival;
        document.getElementById('aircraftType').value = flight.aircraft;
        document.getElementById('flightType').value = flight.type;
        document.getElementById('flightNotes').value = flight.notes;

        this.showCancelButton(true);
        
        // Scroll to form
        document.querySelector('.flight-form-section').scrollIntoView({ behavior: 'smooth' });
    }

    // Delete flight
    deleteFlight(index) {
        if (confirm('Are you sure you want to delete this flight?')) {
            this.flights.splice(index, 1);
            this.saveFlights();
            this.updateStatistics();
            this.renderFlightTable();
            this.updateFilterOptions();
            this.plotAllFlights();
            this.showMessage('Flight deleted successfully!', 'success');
        }
    }

    // Cancel edit
    cancelEdit() {
        this.editingIndex = -1;
        this.resetForm();
        this.showCancelButton(false);
    }

    // Show/hide cancel button
    showCancelButton(show) {
        document.getElementById('cancelEdit').style.display = show ? 'inline-flex' : 'none';
    }

    // Show message
    showMessage(text, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.message');
        existingMessages.forEach(msg => msg.remove());

        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;

        const form = document.querySelector('.flight-form-section');
        form.insertBefore(message, form.firstChild);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            message.remove();
        }, 5000);
    }

    // Close modal
    closeModal() {
        document.getElementById('editModal').style.display = 'none';
    }

    // Export flights to CSV
    exportFlights() {
        if (this.flights.length === 0) {
            this.showMessage('No flights to export!', 'warning');
            return;
        }

        const headers = ['Date', 'Departure', 'Arrival', 'Aircraft', 'Type', 'Hours', 'Notes'];
        const csvContent = [
            headers.join(','),
            ...this.flights.map(flight => [
                flight.date,
                flight.departure,
                flight.arrival,
                `"${flight.aircraft}"`,
                `"${flight.type}"`,
                flight.duration,
                `"${(flight.notes || '').replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `flight-log-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);

        this.showMessage('Flight log exported successfully!', 'success');
    }

    // Get airport coordinates from database
    async getAirportCoordinates(airportCode) {
        // Clean airport code
        const cleanCode = airportCode.replace(/[^A-Z0-9]/g, '');
        
        if (this.airports[cleanCode]) {
            return this.airports[cleanCode].coords;
        }

        // If not found, try to geocode using a simple approach
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${airportCode}+airport&limit=1`);
            const data = await response.json();
            if (data.length > 0) {
                return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }

        // Default to center of USA if not found
        return [39.8283, -98.5795];
    }

    // Search airports based on query
    searchAirports(query) {
        if (!query || query.length < 1) return [];
        
        const searchTerm = query.toLowerCase();
        const results = [];
        
        Object.entries(this.airports).forEach(([code, airport]) => {
            const score = this.calculateAirportSearchScore(code, airport, searchTerm);
            if (score > 0) {
                results.push({
                    code,
                    ...airport,
                    score
                });
            }
        });
        
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, 10); // Limit to top 10 results
    }

    // Calculate search score for airport ranking
    calculateAirportSearchScore(code, airport, searchTerm) {
        let score = 0;
        const codeLC = code.toLowerCase();
        const nameLC = airport.name.toLowerCase();
        const cityLC = airport.city.toLowerCase();
        
        // Exact code match gets highest score
        if (codeLC === searchTerm) return 1000;
        
        // Code starts with search term
        if (codeLC.startsWith(searchTerm)) score += 500;
        
        // Code contains search term
        if (codeLC.includes(searchTerm)) score += 200;
        
        // City starts with search term
        if (cityLC.startsWith(searchTerm)) score += 300;
        
        // City contains search term
        if (cityLC.includes(searchTerm)) score += 100;
        
        // Airport name contains search term
        if (nameLC.includes(searchTerm)) score += 50;
        
        return score;
    }

    // Create airport dropdown
    createAirportDropdown(inputElement, dropdownId) {
        const dropdown = document.createElement('div');
        dropdown.id = dropdownId;
        dropdown.className = 'airport-dropdown';
        dropdown.style.display = 'none';
        
        inputElement.parentNode.appendChild(dropdown);
        
        let timeout = null;
        
        inputElement.addEventListener('input', (e) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.updateAirportDropdown(e.target.value, dropdown, inputElement);
            }, 150);
        });
        
        inputElement.addEventListener('focus', (e) => {
            if (e.target.value.length > 0) {
                this.updateAirportDropdown(e.target.value, dropdown, inputElement);
            }
        });
        
        inputElement.addEventListener('blur', (e) => {
            // Delay hiding to allow clicking on dropdown items
            setTimeout(() => {
                dropdown.style.display = 'none';
            }, 200);
        });
        
        // Add keydown navigation
        inputElement.addEventListener('keydown', (e) => {
            this.handleAirportDropdownNavigation(e, dropdown, inputElement);
        });
    }

    // Update airport dropdown content
    updateAirportDropdown(query, dropdown, inputElement) {
        const results = this.searchAirports(query);
        
        if (results.length === 0) {
            dropdown.style.display = 'none';
            return;
        }
        
        dropdown.innerHTML = results.map((airport, index) => `
            <div class="airport-option ${index === 0 ? 'highlighted' : ''}" 
                 data-code="${airport.code}" 
                 data-index="${index}">
                <div class="airport-code">${airport.code}</div>
                <div class="airport-details">
                    <div class="airport-name">${airport.name}</div>
                    <div class="airport-city">${airport.city}, ${airport.country}</div>
                </div>
            </div>
        `).join('');
        
        dropdown.style.display = 'block';
        
        // Add click event listeners to options
        dropdown.querySelectorAll('.airport-option').forEach(option => {
            option.addEventListener('click', () => {
                inputElement.value = option.dataset.code;
                dropdown.style.display = 'none';
                inputElement.focus();
            });
        });
    }

    // Handle keyboard navigation in dropdown
    handleAirportDropdownNavigation(e, dropdown, inputElement) {
        if (dropdown.style.display === 'none') return;
        
        const options = dropdown.querySelectorAll('.airport-option');
        const highlighted = dropdown.querySelector('.airport-option.highlighted');
        let currentIndex = highlighted ? parseInt(highlighted.dataset.index) : -1;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                currentIndex = Math.min(currentIndex + 1, options.length - 1);
                this.highlightAirportOption(options, currentIndex);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                currentIndex = Math.max(currentIndex - 1, 0);
                this.highlightAirportOption(options, currentIndex);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (highlighted) {
                    inputElement.value = highlighted.dataset.code;
                    dropdown.style.display = 'none';
                }
                break;
                
            case 'Escape':
                dropdown.style.display = 'none';
                break;
        }
    }

    // Highlight specific airport option
    highlightAirportOption(options, index) {
        options.forEach((option, i) => {
            option.classList.toggle('highlighted', i === index);
        });
    }

    // Handle table sorting
    handleSort(column) {
        if (this.sortConfig.column === column) {
            this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortConfig.column = column;
            this.sortConfig.direction = 'asc';
        }
        
        this.updateSortIcons();
        this.renderFlightTable();
    }

    // Update sort icons
    updateSortIcons() {
        document.querySelectorAll('.sortable').forEach(header => {
            const icon = header.querySelector('.sort-icon');
            const column = header.dataset.sort;
            
            if (column === this.sortConfig.column) {
                icon.className = this.sortConfig.direction === 'asc' ? 
                    'fas fa-sort-up sort-icon active' : 
                    'fas fa-sort-down sort-icon active';
            } else {
                icon.className = 'fas fa-sort sort-icon';
            }
        });
    }

    // Sort flights based on current configuration
    getSortedFlights(flights) {
        return [...flights].sort((a, b) => {
            let aVal, bVal;
            
            switch (this.sortConfig.column) {
                case 'date':
                    aVal = new Date(a.date);
                    bVal = new Date(b.date);
                    break;
                case 'route':
                    aVal = `${a.departure}-${a.arrival}`;
                    bVal = `${b.departure}-${b.arrival}`;
                    break;
                case 'aircraft':
                    aVal = a.aircraft.toLowerCase();
                    bVal = b.aircraft.toLowerCase();
                    break;
                case 'type':
                    aVal = a.type.toLowerCase();
                    bVal = b.type.toLowerCase();
                    break;
                case 'duration':
                    aVal = parseFloat(a.duration);
                    bVal = parseFloat(b.duration);
                    break;
                case 'notes':
                    aVal = (a.notes || '').toLowerCase();
                    bVal = (b.notes || '').toLowerCase();
                    break;
                default:
                    return 0;
            }
            
            if (aVal < bVal) return this.sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Comprehensive airport database
    getAirportDatabase() {
        return {
            // Major US Airports
            'KJFK': { name: 'John F. Kennedy International Airport', city: 'New York', country: 'US', coords: [40.6413, -73.7781] },
            'JFK': { name: 'John F. Kennedy International Airport', city: 'New York', country: 'US', coords: [40.6413, -73.7781] },
            'KLAX': { name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'US', coords: [33.9425, -118.4081] },
            'LAX': { name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'US', coords: [33.9425, -118.4081] },
            'KORD': { name: 'O\'Hare International Airport', city: 'Chicago', country: 'US', coords: [41.9742, -87.9073] },
            'ORD': { name: 'O\'Hare International Airport', city: 'Chicago', country: 'US', coords: [41.9742, -87.9073] },
            'KATL': { name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'US', coords: [33.6407, -84.4277] },
            'ATL': { name: 'Hartsfield-Jackson Atlanta International Airport', city: 'Atlanta', country: 'US', coords: [33.6407, -84.4277] },
            'KDEN': { name: 'Denver International Airport', city: 'Denver', country: 'US', coords: [39.8561, -104.6737] },
            'DEN': { name: 'Denver International Airport', city: 'Denver', country: 'US', coords: [39.8561, -104.6737] },
            'KSEA': { name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'US', coords: [47.4502, -122.3088] },
            'SEA': { name: 'Seattle-Tacoma International Airport', city: 'Seattle', country: 'US', coords: [47.4502, -122.3088] },
            'KMIA': { name: 'Miami International Airport', city: 'Miami', country: 'US', coords: [25.7933, -80.2906] },
            'MIA': { name: 'Miami International Airport', city: 'Miami', country: 'US', coords: [25.7933, -80.2906] },
            'KBOS': { name: 'Logan International Airport', city: 'Boston', country: 'US', coords: [42.3656, -71.0096] },
            'BOS': { name: 'Logan International Airport', city: 'Boston', country: 'US', coords: [42.3656, -71.0096] },
            'KSFO': { name: 'San Francisco International Airport', city: 'San Francisco', country: 'US', coords: [37.6213, -122.3790] },
            'SFO': { name: 'San Francisco International Airport', city: 'San Francisco', country: 'US', coords: [37.6213, -122.3790] },
            'KDFW': { name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'US', coords: [32.8998, -97.0403] },
            'DFW': { name: 'Dallas/Fort Worth International Airport', city: 'Dallas', country: 'US', coords: [32.8998, -97.0403] },
            'KPHX': { name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'US', coords: [33.4373, -112.0078] },
            'PHX': { name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix', country: 'US', coords: [33.4373, -112.0078] },
            'KLAS': { name: 'McCarran International Airport', city: 'Las Vegas', country: 'US', coords: [36.0840, -115.1537] },
            'LAS': { name: 'McCarran International Airport', city: 'Las Vegas', country: 'US', coords: [36.0840, -115.1537] },
            'KMCO': { name: 'Orlando International Airport', city: 'Orlando', country: 'US', coords: [28.4312, -81.3081] },
            'MCO': { name: 'Orlando International Airport', city: 'Orlando', country: 'US', coords: [28.4312, -81.3081] },
            'KCLT': { name: 'Charlotte Douglas International Airport', city: 'Charlotte', country: 'US', coords: [35.2144, -80.9473] },
            'CLT': { name: 'Charlotte Douglas International Airport', city: 'Charlotte', country: 'US', coords: [35.2144, -80.9473] },
            'KIAH': { name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'US', coords: [29.9902, -95.3368] },
            'IAH': { name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'US', coords: [29.9902, -95.3368] },
            'KDCA': { name: 'Ronald Reagan Washington National Airport', city: 'Washington', country: 'US', coords: [38.8512, -77.0402] },
            'DCA': { name: 'Ronald Reagan Washington National Airport', city: 'Washington', country: 'US', coords: [38.8512, -77.0402] },
            'KLGA': { name: 'LaGuardia Airport', city: 'New York', country: 'US', coords: [40.7769, -73.8740] },
            'LGA': { name: 'LaGuardia Airport', city: 'New York', country: 'US', coords: [40.7769, -73.8740] },
            'KEWR': { name: 'Newark Liberty International Airport', city: 'Newark', country: 'US', coords: [40.6895, -74.1745] },
            'EWR': { name: 'Newark Liberty International Airport', city: 'Newark', country: 'US', coords: [40.6895, -74.1745] },
            // More airports for better coverage
            'KPHL': { name: 'Philadelphia International Airport', city: 'Philadelphia', country: 'US', coords: [39.8744, -75.2424] },
            'PHL': { name: 'Philadelphia International Airport', city: 'Philadelphia', country: 'US', coords: [39.8744, -75.2424] },
            'KSAN': { name: 'San Diego International Airport', city: 'San Diego', country: 'US', coords: [32.7336, -117.1897] },
            'SAN': { name: 'San Diego International Airport', city: 'San Diego', country: 'US', coords: [32.7336, -117.1897] },
            'KTPA': { name: 'Tampa International Airport', city: 'Tampa', country: 'US', coords: [27.9755, -82.5332] },
            'TPA': { name: 'Tampa International Airport', city: 'Tampa', country: 'US', coords: [27.9755, -82.5332] },
            'KBWI': { name: 'Baltimore/Washington International Thurgood Marshall Airport', city: 'Baltimore', country: 'US', coords: [39.1754, -76.6683] },
            'BWI': { name: 'Baltimore/Washington International Thurgood Marshall Airport', city: 'Baltimore', country: 'US', coords: [39.1754, -76.6683] },
            'KMDW': { name: 'Chicago Midway International Airport', city: 'Chicago', country: 'US', coords: [41.7868, -87.7522] },
            'MDW': { name: 'Chicago Midway International Airport', city: 'Chicago', country: 'US', coords: [41.7868, -87.7522] },
            'KHNL': { name: 'Daniel K. Inouye International Airport', city: 'Honolulu', country: 'US', coords: [21.3187, -157.9224] },
            'HNL': { name: 'Daniel K. Inouye International Airport', city: 'Honolulu', country: 'US', coords: [21.3187, -157.9224] },
            'KFLL': { name: 'Fort Lauderdale-Hollywood International Airport', city: 'Fort Lauderdale', country: 'US', coords: [26.0742, -80.1506] },
            'FLL': { name: 'Fort Lauderdale-Hollywood International Airport', city: 'Fort Lauderdale', country: 'US', coords: [26.0742, -80.1506] },
            'KIAH': { name: 'George Bush Intercontinental Airport', city: 'Houston', country: 'US', coords: [29.9902, -95.3368] },
            'KHOU': { name: 'William P. Hobby Airport', city: 'Houston', country: 'US', coords: [29.6465, -95.2789] },
            'HOU': { name: 'William P. Hobby Airport', city: 'Houston', country: 'US', coords: [29.6465, -95.2789] },
            'KSLC': { name: 'Salt Lake City International Airport', city: 'Salt Lake City', country: 'US', coords: [40.7884, -111.9778] },
            'SLC': { name: 'Salt Lake City International Airport', city: 'Salt Lake City', country: 'US', coords: [40.7884, -111.9778] },
            'KSMF': { name: 'Sacramento International Airport', city: 'Sacramento', country: 'US', coords: [38.6954, -121.5908] },
            'SMF': { name: 'Sacramento International Airport', city: 'Sacramento', country: 'US', coords: [38.6954, -121.5908] },
            'KPOR': { name: 'Portland International Airport', city: 'Portland', country: 'US', coords: [45.5898, -122.5951] },
            'PDX': { name: 'Portland International Airport', city: 'Portland', country: 'US', coords: [45.5898, -122.5951] },
            'KDTW': { name: 'Detroit Metropolitan Wayne County Airport', city: 'Detroit', country: 'US', coords: [42.2162, -83.3554] },
            'DTW': { name: 'Detroit Metropolitan Wayne County Airport', city: 'Detroit', country: 'US', coords: [42.2162, -83.3554] },
            'KMSP': { name: 'Minneapolis-Saint Paul International Airport', city: 'Minneapolis', country: 'US', coords: [44.8848, -93.2223] },
            'MSP': { name: 'Minneapolis-Saint Paul International Airport', city: 'Minneapolis', country: 'US', coords: [44.8848, -93.2223] },
            'KCVG': { name: 'Cincinnati/Northern Kentucky International Airport', city: 'Cincinnati', country: 'US', coords: [39.0488, -84.6678] },
            'CVG': { name: 'Cincinnati/Northern Kentucky International Airport', city: 'Cincinnati', country: 'US', coords: [39.0488, -84.6678] },
            'KMEM': { name: 'Memphis International Airport', city: 'Memphis', country: 'US', coords: [35.0424, -89.9767] },
            'MEM': { name: 'Memphis International Airport', city: 'Memphis', country: 'US', coords: [35.0424, -89.9767] },
            'KSTL': { name: 'Lambert-St. Louis International Airport', city: 'St. Louis', country: 'US', coords: [38.7487, -90.3700] },
            'STL': { name: 'Lambert-St. Louis International Airport', city: 'St. Louis', country: 'US', coords: [38.7487, -90.3700] },
            'KBNA': { name: 'Nashville International Airport', city: 'Nashville', country: 'US', coords: [36.1245, -86.6782] },
            'BNA': { name: 'Nashville International Airport', city: 'Nashville', country: 'US', coords: [36.1245, -86.6782] },
            'KAUS': { name: 'Austin-Bergstrom International Airport', city: 'Austin', country: 'US', coords: [30.1975, -97.6664] },
            'AUS': { name: 'Austin-Bergstrom International Airport', city: 'Austin', country: 'US', coords: [30.1975, -97.6664] },
            'KSAT': { name: 'San Antonio International Airport', city: 'San Antonio', country: 'US', coords: [29.5337, -98.4698] },
            'SAT': { name: 'San Antonio International Airport', city: 'San Antonio', country: 'US', coords: [29.5337, -98.4698] },
            'KCLE': { name: 'Cleveland Hopkins International Airport', city: 'Cleveland', country: 'US', coords: [41.4117, -81.8498] },
            'CLE': { name: 'Cleveland Hopkins International Airport', city: 'Cleveland', country: 'US', coords: [41.4117, -81.8498] },
            'KPIT': { name: 'Pittsburgh International Airport', city: 'Pittsburgh', country: 'US', coords: [40.4915, -80.2329] },
            'PIT': { name: 'Pittsburgh International Airport', city: 'Pittsburgh', country: 'US', coords: [40.4915, -80.2329] },
            'KIND': { name: 'Indianapolis International Airport', city: 'Indianapolis', country: 'US', coords: [39.7173, -86.2944] },
            'IND': { name: 'Indianapolis International Airport', city: 'Indianapolis', country: 'US', coords: [39.7173, -86.2944] },
            'KCMH': { name: 'John Glenn Columbus International Airport', city: 'Columbus', country: 'US', coords: [39.9980, -82.8919] },
            'CMH': { name: 'John Glenn Columbus International Airport', city: 'Columbus', country: 'US', coords: [39.9980, -82.8919] },
            'KJAX': { name: 'Jacksonville International Airport', city: 'Jacksonville', country: 'US', coords: [30.4941, -81.6879] },
            'JAX': { name: 'Jacksonville International Airport', city: 'Jacksonville', country: 'US', coords: [30.4941, -81.6879] },
            'KRSW': { name: 'Southwest Florida International Airport', city: 'Fort Myers', country: 'US', coords: [26.5362, -81.7555] },
            'RSW': { name: 'Southwest Florida International Airport', city: 'Fort Myers', country: 'US', coords: [26.5362, -81.7555] },
            'KPBI': { name: 'Palm Beach International Airport', city: 'West Palm Beach', country: 'US', coords: [26.6832, -80.0956] },
            'PBI': { name: 'Palm Beach International Airport', city: 'West Palm Beach', country: 'US', coords: [26.6832, -80.0956] },
            'KOAK': { name: 'Oakland International Airport', city: 'Oakland', country: 'US', coords: [37.7214, -122.2208] },
            'OAK': { name: 'Oakland International Airport', city: 'Oakland', country: 'US', coords: [37.7214, -122.2208] },
            'KSJC': { name: 'Norman Y. Mineta San José International Airport', city: 'San Jose', country: 'US', coords: [37.3626, -121.9291] },
            'SJC': { name: 'Norman Y. Mineta San José International Airport', city: 'San Jose', country: 'US', coords: [37.3626, -121.9291] },
            'KBUR': { name: 'Hollywood Burbank Airport', city: 'Burbank', country: 'US', coords: [34.2007, -118.3585] },
            'BUR': { name: 'Hollywood Burbank Airport', city: 'Burbank', country: 'US', coords: [34.2007, -118.3585] },
            'KLGB': { name: 'Long Beach Airport', city: 'Long Beach', country: 'US', coords: [33.8177, -118.1517] },
            'LGB': { name: 'Long Beach Airport', city: 'Long Beach', country: 'US', coords: [33.8177, -118.1517] },
            'KSNA': { name: 'John Wayne Airport', city: 'Orange County', country: 'US', coords: [33.6757, -117.8682] },
            'SNA': { name: 'John Wayne Airport', city: 'Orange County', country: 'US', coords: [33.6757, -117.8682] },
            'KONT': { name: 'Ontario International Airport', city: 'Ontario', country: 'US', coords: [34.0560, -117.6010] },
            'ONT': { name: 'Ontario International Airport', city: 'Ontario', country: 'US', coords: [34.0560, -117.6010] },
            'KPSP': { name: 'Palm Springs International Airport', city: 'Palm Springs', country: 'US', coords: [33.8297, -116.5066] },
            'PSP': { name: 'Palm Springs International Airport', city: 'Palm Springs', country: 'US', coords: [33.8297, -116.5066] },
            // Small airports and training facilities
            'KCDW': { name: 'Essex County Airport', city: 'Caldwell', country: 'US', coords: [40.8752, -74.2816] },
            'CDW': { name: 'Essex County Airport', city: 'Caldwell', country: 'US', coords: [40.8752, -74.2816] },
            'KTEB': { name: 'Teterboro Airport', city: 'Teterboro', country: 'US', coords: [40.8501, -74.0606] },
            'TEB': { name: 'Teterboro Airport', city: 'Teterboro', country: 'US', coords: [40.8501, -74.0606] },
            'KHPN': { name: 'Westchester County Airport', city: 'White Plains', country: 'US', coords: [41.0670, -73.7076] },
            'HPN': { name: 'Westchester County Airport', city: 'White Plains', country: 'US', coords: [41.0670, -73.7076] },
            'KISP': { name: 'Long Island MacArthur Airport', city: 'Islip', country: 'US', coords: [40.7952, -73.1002] },
            'ISP': { name: 'Long Island MacArthur Airport', city: 'Islip', country: 'US', coords: [40.7952, -73.1002] },
            'KFRG': { name: 'Republic Airport', city: 'Farmingdale', country: 'US', coords: [40.7288, -73.4134] },
            'FRG': { name: 'Republic Airport', city: 'Farmingdale', country: 'US', coords: [40.7288, -73.4134] },
            'KHWD': { name: 'Hayward Executive Airport', city: 'Hayward', country: 'US', coords: [37.6591, -122.1221] },
            'HWD': { name: 'Hayward Executive Airport', city: 'Hayward', country: 'US', coords: [37.6591, -122.1221] },
            'KPAO': { name: 'Palo Alto Airport', city: 'Palo Alto', country: 'US', coords: [37.4611, -122.1150] },
            'PAO': { name: 'Palo Alto Airport', city: 'Palo Alto', country: 'US', coords: [37.4611, -122.1150] },
            'KSQL': { name: 'San Carlos Airport', city: 'San Carlos', country: 'US', coords: [37.5119, -122.2495] },
            'SQL': { name: 'San Carlos Airport', city: 'San Carlos', country: 'US', coords: [37.5119, -122.2495] },
            'KRHV': { name: 'Reid-Hillview Airport', city: 'San Jose', country: 'US', coords: [37.3329, -121.8197] },
            'RHV': { name: 'Reid-Hillview Airport', city: 'San Jose', country: 'US', coords: [37.3329, -121.8197] },
            'KLVK': { name: 'Livermore Municipal Airport', city: 'Livermore', country: 'US', coords: [37.6934, -121.8201] },
            'LVK': { name: 'Livermore Municipal Airport', city: 'Livermore', country: 'US', coords: [37.6934, -121.8201] },
            'KCCR': { name: 'Buchanan Field', city: 'Concord', country: 'US', coords: [37.9897, -122.0569] },
            'CCR': { name: 'Buchanan Field', city: 'Concord', country: 'US', coords: [37.9897, -122.0569] },
            'KNUQ': { name: 'Moffett Federal Airfield', city: 'Mountain View', country: 'US', coords: [37.4161, -122.0477] },
            'NUQ': { name: 'Moffett Federal Airfield', city: 'Mountain View', country: 'US', coords: [37.4161, -122.0477] },
            'KCNO': { name: 'Chino Airport', city: 'Chino', country: 'US', coords: [34.0085, -117.6386] },
            'CNO': { name: 'Chino Airport', city: 'Chino', country: 'US', coords: [34.0085, -117.6386] },
            'KFUL': { name: 'Fullerton Municipal Airport', city: 'Fullerton', country: 'US', coords: [33.8720, -117.9798] },
            'FUL': { name: 'Fullerton Municipal Airport', city: 'Fullerton', country: 'US', coords: [33.8720, -117.9798] },
            'KTOA': { name: 'Zamperini Field', city: 'Torrance', country: 'US', coords: [33.8034, -118.3396] },
            'TOA': { name: 'Zamperini Field', city: 'Torrance', country: 'US', coords: [33.8034, -118.3396] },
            'KEMT': { name: 'El Monte Airport', city: 'El Monte', country: 'US', coords: [34.0860, -118.0348] },
            'EMT': { name: 'El Monte Airport', city: 'El Monte', country: 'US', coords: [34.0860, -118.0348] },
            'KPOC': { name: 'Brackett Field', city: 'La Verne', country: 'US', coords: [34.0916, -117.7817] },
            'POC': { name: 'Brackett Field', city: 'La Verne', country: 'US', coords: [34.0916, -117.7817] },
            'KWHP': { name: 'Whiteman Airport', city: 'Pacoima', country: 'US', coords: [34.2593, -118.4138] },
            'WHP': { name: 'Whiteman Airport', city: 'Pacoima', country: 'US', coords: [34.2593, -118.4138] },
            'KVNY': { name: 'Van Nuys Airport', city: 'Van Nuys', country: 'US', coords: [34.2098, -118.4898] },
            'VNY': { name: 'Van Nuys Airport', city: 'Van Nuys', country: 'US', coords: [34.2098, -118.4898] },
            'KSMX': { name: 'Santa Maria Public Airport', city: 'Santa Maria', country: 'US', coords: [34.8989, -120.4574] },
            'SMX': { name: 'Santa Maria Public Airport', city: 'Santa Maria', country: 'US', coords: [34.8989, -120.4574] },
            'KSBA': { name: 'Santa Barbara Municipal Airport', city: 'Santa Barbara', country: 'US', coords: [34.4262, -119.8403] },
            'SBA': { name: 'Santa Barbara Municipal Airport', city: 'Santa Barbara', country: 'US', coords: [34.4262, -119.8403] },
            'KOXR': { name: 'Oxnard Airport', city: 'Oxnard', country: 'US', coords: [34.2006, -119.2070] },
            'OXR': { name: 'Oxnard Airport', city: 'Oxnard', country: 'US', coords: [34.2006, -119.2070] },
            'KCMA': { name: 'Camarillo Airport', city: 'Camarillo', country: 'US', coords: [34.2137, -119.0943] },
            'CMA': { name: 'Camarillo Airport', city: 'Camarillo', country: 'US', coords: [34.2137, -119.0943] },
            'TZX': { name: 'Trinity County Airport', city: 'Weaverville', country: 'US', coords: [40.7833, -122.8833] }
        };
    }

    // Plot all flights on map
    async plotAllFlights() {
        this.clearMap();
        const flights = this.getFilteredFlights();
        
        for (const flight of flights) {
            await this.plotFlight(flight);
        }

        if (flights.length > 0) {
            this.fitMapToFlights();
        }
    }

    // Plot filtered flights
    async plotFilteredFlights() {
        await this.plotAllFlights();
    }

    // Plot individual flight
    async plotFlight(flight) {
        try {
            const depCoords = await this.getAirportCoordinates(flight.departure);
            const arrCoords = await this.getAirportCoordinates(flight.arrival);

            // Add departure marker
            const depMarker = L.marker(depCoords, {
                icon: L.divIcon({
                    className: 'custom-marker departure-marker',
                    html: '<i class="fas fa-plane-departure"></i>',
                    iconSize: [20, 20]
                })
            }).addTo(this.flightPathLayer);

            depMarker.bindPopup(`
                <div class="popup-route">${flight.departure}</div>
                <div class="popup-details">Departure</div>
            `);

            // Add arrival marker
            const arrMarker = L.marker(arrCoords, {
                icon: L.divIcon({
                    className: 'custom-marker arrival-marker',
                    html: '<i class="fas fa-plane-arrival"></i>',
                    iconSize: [20, 20]
                })
            }).addTo(this.flightPathLayer);

            arrMarker.bindPopup(`
                <div class="popup-route">${flight.arrival}</div>
                <div class="popup-details">Arrival</div>
            `);

            // Add flight path
            const flightPath = L.polyline([depCoords, arrCoords], {
                color: this.getFlightPathColor(flight.type),
                weight: 3,
                opacity: 0.8,
                className: 'flight-path'
            }).addTo(this.flightPathLayer);

            flightPath.bindPopup(`
                <div class="popup-route">${flight.departure} → ${flight.arrival}</div>
                <div class="popup-details">
                    <strong>Date:</strong> ${this.formatDate(flight.date)}<br>
                    <strong>Aircraft:</strong> ${flight.aircraft}<br>
                    <strong>Duration:</strong> ${flight.duration}h<br>
                    <strong>Type:</strong> ${flight.type}
                    ${flight.notes ? `<br><strong>Notes:</strong> ${flight.notes}` : ''}
                </div>
            `);

        } catch (error) {
            console.error('Error plotting flight:', error);
        }
    }

    // Get flight path color based on type
    getFlightPathColor(type) {
        const colors = {
            'Training': '#f39c12',
            'Commercial': '#3498db',
            'Personal': '#27ae60',
            'Cross Country': '#e74c3c'
        };
        return colors[type] || '#95a5a6';
    }

    // Clear map
    clearMap() {
        this.flightPathLayer.clearLayers();
    }

    // Fit map to show all flights
    fitMapToFlights() {
        const flights = this.getFilteredFlights();
        if (flights.length === 0) return;

        const group = new L.featureGroup();
        this.flightPathLayer.eachLayer(layer => {
            group.addLayer(layer);
        });

        if (group.getLayers().length > 0) {
            this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.flightLogger = new FlightLogger();
    
    // Set default date to today
    document.getElementById('flightDate').value = new Date().toISOString().split('T')[0];
});

// Add custom marker styles
const style = document.createElement('style');
style.textContent = `
    .custom-marker {
        background: white;
        border-radius: 50%;
        border: 2px solid #3498db;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #3498db;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    
    .departure-marker {
        border-color: #27ae60;
        color: #27ae60;
    }
    
    .arrival-marker {
        border-color: #e74c3c;
        color: #e74c3c;
    }
`;
document.head.appendChild(style);