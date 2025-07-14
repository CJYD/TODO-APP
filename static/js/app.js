// Profile dropdown functionality
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const button = document.querySelector('.profile-button');
    if (!dropdown || !button) return;
    const expanded = dropdown.classList.contains('show');
    dropdown.classList.toggle('show', !expanded);
    button.setAttribute('aria-expanded', (!expanded).toString());
    if (!expanded) {
        setTimeout(() => {
            document.addEventListener('click', function closeProfile(e) {
                if (!e.target.closest('.profile-dropdown')) {
                    dropdown.classList.remove('show');
                    button.setAttribute('aria-expanded', 'false');
                    document.removeEventListener('click', closeProfile);
                }
            });
        }, 0);
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('profileDropdown');
    const profileButton = document.querySelector('.profile-button');
    
    if (dropdown && profileButton && 
        !dropdown.contains(event.target) && 
        !profileButton.contains(event.target)) {
        dropdown.classList.remove('show');
        profileButton.setAttribute('aria-expanded', 'false');
    }
});

// Close dropdown on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const dropdown = document.getElementById('profileDropdown');
        const profileButton = document.querySelector('.profile-button');
        if (dropdown && dropdown.classList.contains('show')) {
            dropdown.classList.remove('show');
            profileButton.setAttribute('aria-expanded', 'false');
        }
        
        // Also close filter dropdown
        const filterDropdown = document.getElementById('filterDropdown');
        const filterButton = document.querySelector('.filter-button');
        if (filterDropdown && filterDropdown.classList.contains('show')) {
            filterDropdown.classList.remove('show');
            filterButton.setAttribute('aria-expanded', 'false');
        }
    }
});

// Filter dropdown functionality
function toggleFilterDropdown() {
    const dropdown = document.getElementById('filterDropdown');
    const button = document.querySelector('.filter-button');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.setAttribute('aria-expanded', 'false');
    } else {
        dropdown.classList.add('show');
        button.setAttribute('aria-expanded', 'true');
    }
}

// Close filter dropdown when clicking outside
document.addEventListener('click', function(event) {
    const filterDropdown = document.getElementById('filterDropdown');
    const filterButton = document.querySelector('.filter-button');
    
    if (filterDropdown && filterButton && 
        !filterDropdown.contains(event.target) && 
        !filterButton.contains(event.target)) {
        filterDropdown.classList.remove('show');
        filterButton.setAttribute('aria-expanded', 'false');
    }
});

// Handle filter dropdown item clicks
document.addEventListener('DOMContentLoaded', function() {
    const filterItems = document.querySelectorAll('.filter-dropdown-item');
    const filterText = document.querySelector('.filter-text');
    
    filterItems.forEach(item => {
        item.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            const filterLabel = this.textContent;
            
            // Update active state
            filterItems.forEach(fi => fi.classList.remove('active'));
            this.classList.add('active');
            
            // Update button text
            if (filterText) {
                filterText.textContent = filterLabel;
            }
            
            // Close dropdown
            const dropdown = document.getElementById('filterDropdown');
            const button = document.querySelector('.filter-button');
            if (dropdown && button) {
                dropdown.classList.remove('show');
                button.setAttribute('aria-expanded', 'false');
            }
            
            // Apply filter using existing logic
            applyFilter(filter);
        });
    });
});

// Custom iOS-style wheel picker implementation
class IOSWheelPicker {
    constructor() {
        this.initializePickers();
    }

    // Detect if device is mobile (iOS, Android, etc.)
    isMobileDevice() {
        // Check for touch support and mobile user agents
        const touchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const mobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const iPadOS = /MacIntel/.test(navigator.platform) && navigator.maxTouchPoints > 1;
        const smallScreen = window.innerWidth <= 768;
        
        return touchDevice && (mobileUserAgent || iPadOS || smallScreen);
    }

    initializePickers() {
        // Initialize date picker
        const dueDateInput = document.getElementById('due_date');
        if (dueDateInput) {
            if (this.isMobileDevice()) {
                // Use native mobile date picker
                dueDateInput.type = 'date';
                dueDateInput.style.cursor = 'pointer';
                dueDateInput.removeAttribute('readonly');
                dueDateInput.removeEventListener('click', this.showDatePicker);
            } else {
                // Use custom picker for desktop
                dueDateInput.setAttribute('readonly', 'true');
                dueDateInput.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showDatePicker(dueDateInput);
                });
            }
        }

        // Initialize time picker  
        const dueTimeInput = document.getElementById('due_time');
        if (dueTimeInput) {
            if (this.isMobileDevice()) {
                // Use native mobile time picker
                dueTimeInput.type = 'time';
                dueTimeInput.style.cursor = 'pointer';
                dueTimeInput.removeAttribute('readonly');
                dueTimeInput.removeEventListener('click', this.showTimePicker);
            } else {
                // Use custom picker for desktop
                dueTimeInput.setAttribute('readonly', 'true');
                dueTimeInput.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showTimePicker(dueTimeInput);
                });
            }
        }
    }

    showDatePicker(input) {
        const modal = this.createDatePickerModal();
        document.body.appendChild(modal);
        
        // Check if input has existing value, otherwise use today's date
        let dateToSet;
        if (input.value && input.value.trim()) {
            // Parse existing date from input (YYYY-MM-DD format)
            dateToSet = new Date(input.value);
        } else {
            // Use today's date as default
            dateToSet = new Date();
        }
        
        // Show modal with animation first
        document.body.classList.add('ios-picker-open');
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Set wheel values after modal is shown and DOM is ready
        setTimeout(() => {
            this.setDateWheelValues(modal, dateToSet);
        }, 100);
        
        // Setup event listeners
        this.setupDatePickerEvents(modal, input);
    }

    showTimePicker(input) {
        const modal = this.createTimePickerModal();
        document.body.appendChild(modal);
        
        // Check if input has existing value, otherwise use current time
        let timeToSet;
        if (input.value && input.value.trim()) {
            // Parse existing time from input
            timeToSet = this.parseTime(input.value);
        } else {
            // Use current time as default
            timeToSet = new Date();
        }
        
        // Show modal with animation first
        document.body.classList.add('ios-picker-open');
        setTimeout(() => modal.classList.add('show'), 10);
        
        // Set wheel values after modal is shown and DOM is ready
        setTimeout(() => {
            this.setTimeWheelValues(modal, timeToSet);
        }, 100);
        
        // Setup event listeners
        this.setupTimePickerEvents(modal, input);
    }

    createDatePickerModal() {
        const modal = document.createElement('div');
        modal.className = 'ios-picker-modal';
        modal.innerHTML = `
            <div class="ios-picker-container">
                <div class="ios-picker-header">
                    <button class="ios-picker-cancel">Cancel</button>
                    <div class="ios-picker-title">Select Date</div>
                    <button class="ios-picker-done">Done</button>
                </div>
                <div class="ios-picker-wheels">
                    <div class="ios-wheel" data-type="month">
                        <div class="ios-wheel-items">
                            ${this.generateMonthOptions()}
                        </div>
                    </div>
                    <div class="ios-wheel" data-type="day">
                        <div class="ios-wheel-items">
                            ${this.generateDayOptions()}
                        </div>
                    </div>
                    <div class="ios-wheel" data-type="year">
                        <div class="ios-wheel-items">
                            ${this.generateYearOptions()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    createTimePickerModal() {
        const modal = document.createElement('div');
        modal.className = 'ios-picker-modal';
        modal.innerHTML = `
            <div class="ios-picker-container">
                <div class="ios-picker-header">
                    <button class="ios-picker-cancel">Cancel</button>
                    <div class="ios-picker-title">Select Time</div>
                    <button class="ios-picker-done">Done</button>
                </div>
                <div class="ios-picker-wheels">
                    <div class="ios-wheel" data-type="hour">
                        <div class="ios-wheel-items">
                            ${this.generateHourOptions()}
                        </div>
                    </div>
                    <div class="ios-wheel" data-type="minute">
                        <div class="ios-wheel-items">
                            ${this.generateMinuteOptions()}
                        </div>
                    </div>
                    <div class="ios-wheel" data-type="ampm">
                        <div class="ios-wheel-items">
                            ${this.generateAmPmOptions()}
                        </div>
                    </div>
                </div>
            </div>
        `;
        return modal;
    }

    generateMonthOptions() {
        const months = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        return months.map((month, index) => 
            `<div class="ios-wheel-item" data-value="${index}">${month}</div>`
        ).join('');
    }

    generateDayOptions() {
        let options = '';
        for (let i = 1; i <= 31; i++) {
            options += `<div class="ios-wheel-item" data-value="${i}">${i}</div>`;
        }
        return options;
    }

    generateYearOptions() {
        const currentYear = new Date().getFullYear();
        let options = '';
        for (let i = currentYear - 10; i <= currentYear + 10; i++) {
            options += `<div class="ios-wheel-item" data-value="${i}">${i}</div>`;
        }
        return options;
    }

    generateHourOptions() {
        let options = '';
        for (let i = 1; i <= 12; i++) {
            options += `<div class="ios-wheel-item" data-value="${i}">${i}</div>`;
        }
        return options;
    }

    generateMinuteOptions() {
        let options = '';
        for (let i = 0; i < 60; i += 5) {
            const minute = i.toString().padStart(2, '0');
            options += `<div class="ios-wheel-item" data-value="${i}">${minute}</div>`;
        }
        return options;
    }

    generateAmPmOptions() {
        return `
            <div class="ios-wheel-item" data-value="AM">AM</div>
            <div class="ios-wheel-item" data-value="PM">PM</div>
        `;
    }

    setDateWheelValues(modal, date) {
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        
        const month = date.getMonth();
        const day = date.getDate();
        const year = date.getFullYear();
        
        this.setWheelValue(modal.querySelector('[data-type="month"]'), month);
        this.setWheelValue(modal.querySelector('[data-type="day"]'), day);
        this.setWheelValue(modal.querySelector('[data-type="year"]'), year);
    }

    setTimeWheelValues(modal, time) {
        let hours = time.getHours();
        // Round minutes to nearest 5-minute interval
        const minutes = Math.round(time.getMinutes() / 5) * 5;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        // Convert to 12-hour format
        if (hours > 12) hours -= 12;
        if (hours === 0) hours = 12;
        
        this.setWheelValue(modal.querySelector('[data-type="hour"]'), hours);
        this.setWheelValue(modal.querySelector('[data-type="minute"]'), minutes);
        this.setWheelValue(modal.querySelector('[data-type="ampm"]'), ampm);
    }

    setWheelValue(wheel, value) {
        const items = wheel.querySelectorAll('.ios-wheel-item');
        const container = wheel.querySelector('.ios-wheel-items');
        
        let foundIndex = -1;
        items.forEach((item, index) => {
            item.classList.remove('selected', 'adjacent');
            if (item.dataset.value == value) {
                foundIndex = index;
                item.classList.add('selected');
            }
        });

        if (foundIndex !== -1) {
            // Calculate offset to center the selected item
            // Adjust item height based on screen size
            const isMobile = window.innerWidth <= 480;
            const itemHeight = isMobile ? 36 : 48;
            const containerHeight = wheel.offsetHeight;
            const centerOffset = (containerHeight / 2) - (itemHeight / 2);
            const offset = -(foundIndex * itemHeight - centerOffset);
            
            container.style.transform = `translateY(${offset}px)`;
            
            // Add adjacent styling
            if (items[foundIndex - 1]) items[foundIndex - 1].classList.add('adjacent');
            if (items[foundIndex + 1]) items[foundIndex + 1].classList.add('adjacent');
        }

        this.setupWheelScrolling(wheel);
    }

    setupWheelScrolling(wheel) {
        const container = wheel.querySelector('.ios-wheel-items');
        const items = wheel.querySelectorAll('.ios-wheel-item');
        
        let isScrolling = false;
        let startY = 0;
        let velocity = 0;
        let lastTime = 0;
        let lastY = 0;
        let animationFrame = null;
        let isDragging = false;
        let totalDragDistance = 0;

        const updateSelection = () => {
            const wheelRect = wheel.getBoundingClientRect();
            const wheelCenter = wheelRect.top + wheelRect.height / 2;

            let closestItem = null;
            let closestDistance = Infinity;

            items.forEach((item, index) => {
                item.classList.remove('selected', 'adjacent');
                const itemRect = item.getBoundingClientRect();
                const itemCenter = itemRect.top + itemRect.height / 2;
                const distance = Math.abs(itemCenter - wheelCenter);

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestItem = { item, index };
                }
            });

            if (closestItem) {
                closestItem.item.classList.add('selected');
                if (items[closestItem.index - 1]) items[closestItem.index - 1].classList.add('adjacent');
                if (items[closestItem.index + 1]) items[closestItem.index + 1].classList.add('adjacent');
            }
        };

        // Enhanced click/tap functionality for each item
        items.forEach((item, index) => {
            const handleItemSelect = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Add immediate visual feedback
                item.style.transform = 'scale(1.05)';
                item.style.transition = 'transform 0.1s ease';
                
                setTimeout(() => {
                    item.style.transform = '';
                    item.style.transition = '';
                }, 100);
                
                // Calculate the position to center this item
                const isMobile = window.innerWidth <= 480;
                const itemHeight = isMobile ? 36 : 48;
                const centerOffset = isMobile ? 72 : 96; // Half of wheel height
                const targetOffset = -(index * itemHeight - centerOffset);
                
                // Apply smooth transition to center the clicked item
                container.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
                container.style.transform = `translateY(${targetOffset}px)`;
                
                // Update selection after animation
                setTimeout(() => {
                    updateSelection();
                    container.style.transition = '';
                }, 300);
            };
            
            // Add both click and touchend for better responsiveness
            item.addEventListener('click', handleItemSelect);
            item.addEventListener('touchend', (e) => {
                // Only handle if this was a tap, not a scroll
                if (!isDragging && totalDragDistance < 5) {
                    handleItemSelect(e);
                }
            }, { passive: false });
        });

        // Enhanced touch and mouse events with momentum scrolling
        const handleStart = (e) => {
            isScrolling = true;
            isDragging = false;
            totalDragDistance = 0;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            startY = clientY;
            lastY = clientY;
            lastTime = Date.now();
            velocity = 0;
            
            container.style.transition = 'none';
            
            // Cancel any ongoing animation
            if (animationFrame) {
                cancelAnimationFrame(animationFrame);
                animationFrame = null;
            }
            
            // Prevent background scrolling for touch events
            if (e.touches) {
                e.stopPropagation();
                e.preventDefault();
            }
        };

        const handleMove = (e) => {
            if (!isScrolling) return;
            
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const currentTime = Date.now();
            const deltaY = clientY - lastY;
            const deltaTime = currentTime - lastTime;
            
            // Track total drag distance to distinguish between tap and drag
            totalDragDistance += Math.abs(deltaY);
            if (totalDragDistance > 5) {
                isDragging = true;
            }
            
            // Calculate velocity for momentum
            if (deltaTime > 0) {
                velocity = deltaY / deltaTime;
            }
            
            const currentTransform = container.style.transform;
            const currentOffset = currentTransform ? parseInt(currentTransform.match(/-?\d+/)?.[0] || 0) : 0;
            
            // Apply movement with enhanced sensitivity for touch
            const sensitivity = e.touches ? 1.3 : 1.0; // More sensitive for touch
            const newOffset = currentOffset + (deltaY * sensitivity);
            container.style.transform = `translateY(${newOffset}px)`;
            
            lastY = clientY;
            lastTime = currentTime;
            
            // Prevent background scrolling
            if (e.touches) {
                e.stopPropagation();
                e.preventDefault();
            }
        };

        const handleEnd = (e) => {
            if (!isScrolling) return;
            isScrolling = false;

            const isMobile = window.innerWidth <= 480;
            const itemHeight = isMobile ? 36 : 48;
            const centerOffset = isMobile ? 72 : 96;
            
            const currentTransform = container.style.transform;
            let currentOffset = currentTransform ? parseInt(currentTransform.match(/-?\d+/)?.[0] || 0) : 0;
            
            // Apply momentum if there's velocity
            const momentumDuration = Math.abs(velocity) * 500; // Scale momentum
            if (Math.abs(velocity) > 0.5 && momentumDuration > 100) {
                const momentumDistance = velocity * momentumDuration * 0.5;
                currentOffset += momentumDistance;
            }
            
            // Snap to nearest item
            const snapIndex = Math.round((-currentOffset + centerOffset) / itemHeight);
            const clampedIndex = Math.max(0, Math.min(snapIndex, items.length - 1));
            const finalOffset = -(clampedIndex * itemHeight - centerOffset);

            container.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            container.style.transform = `translateY(${finalOffset}px)`;

            setTimeout(() => {
                updateSelection();
                container.style.transition = '';
            }, 400);
        };

        // Add event listeners with proper options
        container.addEventListener('touchstart', handleStart, { passive: false });
        container.addEventListener('mousedown', handleStart);
        
        container.addEventListener('touchmove', handleMove, { passive: false });
        container.addEventListener('mousemove', handleMove);
        
        container.addEventListener('touchend', handleEnd);
        container.addEventListener('mouseup', handleEnd);
        container.addEventListener('mouseleave', handleEnd);

        // Mouse wheel scrolling support
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const currentTransform = container.style.transform;
            const currentOffset = currentTransform ? parseInt(currentTransform.match(/-?\d+/)[0]) : 0;
            const isMobile = window.innerWidth <= 480;
            const itemHeight = isMobile ? 36 : 48;
            const centerOffset = isMobile ? 72 : 96;
            // Reverse scroll direction for desktop only and slow down
            let scrollDelta;
            if (isMobile) {
                scrollDelta = e.deltaY > 0 ? itemHeight : -itemHeight;
            } else {
                scrollDelta = (e.deltaY > 0 ? -itemHeight : itemHeight) / 8; // slower scroll on desktop
            }
            const newOffset = currentOffset + scrollDelta;
            const minOffset = -(items.length - 1) * itemHeight + centerOffset;
            const maxOffset = centerOffset;
            const clampedOffset = Math.max(minOffset, Math.min(newOffset, maxOffset));
            container.style.transition = 'transform 0.2s ease-out';
            container.style.transform = `translateY(${clampedOffset}px)`;
            setTimeout(() => {
                updateSelection();
                container.style.transition = '';
            }, 200);
        });

        updateSelection();
    }

    setupDatePickerEvents(modal, input) {
        const cancelBtn = modal.querySelector('.ios-picker-cancel');
        const doneBtn = modal.querySelector('.ios-picker-done');

        cancelBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });

        doneBtn.addEventListener('click', () => {
            const selectedDate = this.getSelectedDate(modal);
            input.value = selectedDate.toISOString().split('T')[0];
            this.closeModal(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }

    setupTimePickerEvents(modal, input) {
        const cancelBtn = modal.querySelector('.ios-picker-cancel');
        const doneBtn = modal.querySelector('.ios-picker-done');

        cancelBtn.addEventListener('click', () => {
            this.closeModal(modal);
        });

        doneBtn.addEventListener('click', () => {
            const selectedTime = this.getSelectedTime(modal);
            // Convert to 12-hour format for display
            const time12Hour = this.convertTo12Hour(selectedTime);
            input.value = time12Hour;
            // Store 24-hour format in a hidden field if needed for backend
            input.setAttribute('data-24h-value', selectedTime);
            this.closeModal(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }

    getSelectedDate(modal) {
        const monthItem = modal.querySelector('[data-type="month"] .ios-wheel-item.selected');
        const dayItem = modal.querySelector('[data-type="day"] .ios-wheel-item.selected');
        const yearItem = modal.querySelector('[data-type="year"] .ios-wheel-item.selected');

        const month = parseInt(monthItem.dataset.value);
        const day = parseInt(dayItem.dataset.value);
        const year = parseInt(yearItem.dataset.value);

        return new Date(year, month, day);
    }

    getSelectedTime(modal) {
        const hourItem = modal.querySelector('[data-type="hour"] .ios-wheel-item.selected');
        const minuteItem = modal.querySelector('[data-type="minute"] .ios-wheel-item.selected');
        const ampmItem = modal.querySelector('[data-type="ampm"] .ios-wheel-item.selected');

        let hour = parseInt(hourItem.dataset.value);
        const minute = parseInt(minuteItem.dataset.value);
        const ampm = ampmItem.dataset.value;

        if (ampm === 'PM' && hour !== 12) hour += 12;
        if (ampm === 'AM' && hour === 12) hour = 0;

        return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    }

    parseTime(timeString) {
        // Handle both 12-hour and 24-hour formats
        if (timeString.includes('AM') || timeString.includes('PM')) {
            // Parse 12-hour format
            const [time, period] = timeString.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            let hour24 = hours;
            
            if (period === 'PM' && hours !== 12) {
                hour24 += 12;
            } else if (period === 'AM' && hours === 12) {
                hour24 = 0;
            }
            
            const date = new Date();
            date.setHours(hour24, minutes, 0, 0);
            return date;
        } else {
            // Parse 24-hour format
            const [hours, minutes] = timeString.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            return date;
        }
    }

    convertTo12Hour(time24h) {
        const [hours, minutes] = time24h.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    }

    closeModal(modal) {
        modal.classList.remove('show');
        document.body.classList.remove('ios-picker-open');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

// Update the existing task interactions to work with priority badges
function initializeTaskInteractions() {
    document.querySelectorAll('.task-desc').forEach(div => {
        div.addEventListener('click', (e) => {
            if (div.parentElement.dataset.done === 'true') return;
            if (div.classList.contains('editing')) return;
            
            const textElement = div.querySelector('.task-text');
            if (!textElement) return;
            
            const id = div.dataset.id;
            
            // Store the badge container if it exists
            const badgeContainer = div.querySelector('.badge-container');
            const badgeContainerHTML = badgeContainer ? badgeContainer.outerHTML : '';
            
            // Get text content excluding badge container
            let textContent = textElement.textContent.trim();
            if (badgeContainer) {
                textContent = textContent.replace(badgeContainer.textContent.trim(), '').trim();
            }
            const full = textContent;
            const prefix = (full.match(/^(\d+\.)\s*/)||[])[1]||'';
            const oldText = full.replace(/^\d+\.\s*/, '');

            div.innerHTML = '';
            div.classList.add('editing');
            const inp = document.createElement('input');
            inp.type = 'text';
            inp.value = oldText;
            inp.classList.add('edit-input');
            div.appendChild(inp);
            inp.focus();

            const save = () => {
                const nv = inp.value.trim()||oldText;
                fetch(`/edit/${id}`, {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body: JSON.stringify({description:nv})
                }).then(()=>{
                    div.classList.remove('editing');
                    // Restore content with badge container and text wrapper
                    div.innerHTML = badgeContainerHTML + `<span class="task-text" title="${nv}">${prefix} ${nv}</span>`;
                    // Recheck long text handling after edit
                    handleLongTaskTitles();
                });
            };
            
            inp.addEventListener('blur', save);
            inp.addEventListener('keydown', e => {
                if (e.key==='Enter') inp.blur();
                if (e.key==='Escape') {
                    div.classList.remove('editing');
                    // Restore original content with badge container and text wrapper
                    div.innerHTML = badgeContainerHTML + `<span class="task-text" title="${full}">${full}</span>`;
                }
            });
        });
    });
}

// Regular task actions functionality
function toggleRegularActions(taskId) {
    const menu = document.getElementById(`regular-actions-${taskId}`);
    const allMenus = document.querySelectorAll('.regular-actions-menu');
    // Close all other menus
    allMenus.forEach(m => {
        if (m !== menu) {
            m.classList.remove('show');
        }
    });
    // Toggle the clicked menu
    menu.classList.toggle('show');
    // Close menu when clicking outside
    if (menu.classList.contains('show')) {
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!e.target.closest('.regular-actions-container')) {
                    menu.classList.remove('show');
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }
}

// Helper function for controlling element visibility with CSS classes
function setElementVisibility(element, visible) {
    if (!element) return;
    
    if (visible) {
        element.classList.remove('hidden');
        element.style.display = '';
    } else {
        element.classList.add('hidden');
    }
}

// Apply filter function - extracted for reuse
function applyFilter(filter) {
    const progressBar = document.getElementById('progress-bar');
    const activeSection = document.getElementById('active-section');
    const recurringSection = document.getElementById('recurring-section');
    const completedSection = document.getElementById('completed-section');
    
    // Handle progress bar visibility (only show on 'all' filter and if it exists)
    if (progressBar) {
        const shouldShow = filter === 'all';
        
        // Use simple approach for both mobile and desktop
        if (shouldShow) {
            progressBar.style.setProperty('display', 'block', 'important');
            progressBar.style.setProperty('visibility', 'visible', 'important');
            progressBar.classList.remove('hidden-mobile');
        } else {
            progressBar.style.setProperty('display', 'none', 'important');
            progressBar.style.setProperty('visibility', 'hidden', 'important');
            progressBar.classList.add('hidden-mobile');
        }
        
        // Extra safety check for "All" filter
        if (filter === 'all') {
            setTimeout(ensureProgressBarVisibility, 100);
        }
    }
    
    // Reset all sections and tasks to initial state
    if (activeSection) {
        activeSection.style.display = 'block';
        activeSection.style.visibility = 'visible';
    }
    if (recurringSection) {
        recurringSection.style.display = 'block';
        recurringSection.style.visibility = 'visible';
    }
    if (completedSection) {
        completedSection.style.display = 'block';
        completedSection.style.visibility = 'visible';
    }
    
    // Reset all tasks to be visible with proper styling
    document.querySelectorAll('.task-item').forEach(task => {
        task.style.display = '';  // Remove inline display style
        task.style.visibility = 'visible';
        task.style.height = '';
        task.style.margin = '';
        task.style.padding = '';
        task.style.border = '';
    });
    
    // Apply filter-specific logic
    if (filter === 'all') {
        // Show everything - already reset above
        // Restore original heading
        const activeHeading = activeSection ? activeSection.querySelector('h2') : null;
        if (activeHeading) {
            activeHeading.textContent = 'Active Tasks';
        }
        // Restore original "no tasks" message and show if needed
        const noTasksMsg = activeSection ? activeSection.querySelector('.no-tasks') : null;
        if (noTasksMsg) {
            noTasksMsg.textContent = 'No active tasks.';
            // Check if there are any visible active tasks
            const activeTasks = activeSection ? activeSection.querySelectorAll('.task-item:not(.no-tasks)') : [];
            const hasActiveTasks = Array.from(activeTasks).some(task => task.dataset.done !== 'true');
            setElementVisibility(noTasksMsg, !hasActiveTasks);
        }
    } else if (filter === 'active') {
        // Hide completed section but show recurring section
        if (completedSection) {
            completedSection.style.display = 'none';
        }
        // Show recurring section for active filter
        if (recurringSection) {
            recurringSection.style.display = 'block';
        }
        // Hide completed tasks in active section
        const activeTasks = activeSection ? activeSection.querySelectorAll('.task-item:not(.no-tasks)') : [];
        let visibleTasks = 0;
        activeTasks.forEach(task => {
            const isDone = task.dataset.done === 'true';
            if (isDone) {
                task.style.display = 'none';
            } else {
                task.style.display = '';
                visibleTasks++;
            }
        });
        
        // Count recurring tasks as well
        const recurringTasks = recurringSection ? recurringSection.querySelectorAll('.task-item:not(.no-tasks)') : [];
        const totalActiveTasks = visibleTasks + recurringTasks.length;
        
        // Restore original heading
        const activeHeading = activeSection ? activeSection.querySelector('h2') : null;
        if (activeHeading) {
            activeHeading.textContent = 'Active Tasks';
        }
        // Handle "no tasks" message for active section
        const noTasksMsg = activeSection ? activeSection.querySelector('.no-tasks') : null;
        if (noTasksMsg) {
            noTasksMsg.textContent = 'No active tasks.';
            setElementVisibility(noTasksMsg, visibleTasks === 0);
        }
        // Handle "no tasks" message for recurring section
        const recurringNoTasksMsg = recurringSection ? recurringSection.querySelector('.no-tasks') : null;
        if (recurringNoTasksMsg) {
            setElementVisibility(recurringNoTasksMsg, recurringTasks.length === 0);
        }
    } else if (filter === 'recurring') {
        // Hide active and completed sections completely
        if (activeSection) {
            activeSection.style.display = 'none';
        }
        if (completedSection) {
            completedSection.style.display = 'none';
        }
        // Ensure recurring section is visible
        if (recurringSection) {
            recurringSection.style.display = 'block';
            const recurringTasks = recurringSection.querySelectorAll('.task-item:not(.no-tasks)');
            const noTasksMsg = recurringSection.querySelector('.no-tasks');
            if (noTasksMsg) {
                setElementVisibility(noTasksMsg, recurringTasks.length === 0);
            }
        }
    } else if (filter === 'today') {
        // Hide completed section but show recurring section for tasks due today
        if (completedSection) {
            completedSection.style.display = 'none';
        }
        // Show recurring section for today filter to check for tasks due today
        if (recurringSection) {
            recurringSection.style.display = 'block';
        }
        
        // Update heading for "Due Today" filter
        const activeHeading = activeSection ? activeSection.querySelector('h2') : null;
        if (activeHeading) {
            activeHeading.textContent = 'Due Today';
        }
        
        // Filter active tasks to show only those due today (local time)
        const activeTasks = activeSection ? activeSection.querySelectorAll('.task-item:not(.no-tasks)') : [];
        const noTasksMsg = activeSection ? activeSection.querySelector('.no-tasks') : null;
        let visibleTasks = 0;
        let totalActiveTasks = 0;

        // Get today's local date string (YYYY-MM-DD)
        const todayLocal = new Date();
        const todayStr = todayLocal.toISOString().slice(0, 10);

        activeTasks.forEach(task => {
            const isDone = task.dataset.done === 'true';
            const dueUTC = task.getAttribute('data-due-utc');
            let isDueToday = false;
            if (dueUTC) {
                // Convert UTC string to local date
                const dueDate = new Date(dueUTC);
                const dueLocalStr = dueDate.toISOString().slice(0, 10);
                isDueToday = dueLocalStr === todayStr;
            }
            // Count total active tasks (not completed)
            if (!isDone) {
                totalActiveTasks++;
            }
            // Show tasks that are due today (local date), but not completed
            if (!isDone && isDueToday) {
                task.style.display = '';
                visibleTasks++;
            } else {
                task.style.display = 'none';
            }
        });

        // Filter recurring tasks to show only those due today
        const recurringTasks = recurringSection ? recurringSection.querySelectorAll('.task-item:not(.no-tasks)') : [];
        let visibleRecurringTasks = 0;
        
        recurringTasks.forEach(task => {
            const dueUTC = task.getAttribute('data-due-utc');
            let isDueToday = false;
            if (dueUTC) {
                // Convert UTC string to local date
                const dueDate = new Date(dueUTC);
                const dueLocalStr = dueDate.toISOString().slice(0, 10);
                isDueToday = dueLocalStr === todayStr;
            }
            
            if (isDueToday) {
                task.style.display = '';
                visibleRecurringTasks++;
            } else {
                task.style.display = 'None';
            }
        });

        // Show/hide "no tasks" message based on visible tasks and active tasks
        if (noTasksMsg) {
            if (totalActiveTasks === 0) {
                // No active tasks at all
                noTasksMsg.textContent = 'No active tasks.';
                setElementVisibility(noTasksMsg, true);
            } else if (visibleTasks === 0 && visibleRecurringTasks === 0) {
                // There are active tasks but none due today
                noTasksMsg.textContent = 'No tasks due today.';
                setElementVisibility(noTasksMsg, true);
            } else {
                setElementVisibility(noTasksMsg, false);
            }
        }
        
        // Handle "no tasks" message for recurring section
        const recurringNoTasksMsg = recurringSection ? recurringSection.querySelector('.no-tasks') : null;
        if (recurringNoTasksMsg) {
            setElementVisibility(recurringNoTasksMsg, visibleRecurringTasks === 0);
        }
    } else if (filter === 'completed') {
        // Hide active and recurring sections completely
        if (activeSection) {
            activeSection.style.display = 'none';
        }
        if (recurringSection) {
            recurringSection.style.display = 'none';
        }
        // Ensure completed section is visible and handle "no tasks" message
        if (completedSection) {
            completedSection.style.display = 'block';
            const completedTasks = completedSection.querySelectorAll('.task-item:not(.no-tasks)');
            const noTasksMsg = completedSection.querySelector('.no-tasks');
            if (noTasksMsg) {
                setElementVisibility(noTasksMsg, completedTasks.length === 0);
            }
        }
    }
}

// Filtering
function initializeFiltering() {
    // Ensure default filter is active on page load
    const defaultFilterBtn = document.querySelector('.filter-btn[data-filter="all"]');
    if (defaultFilterBtn) {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active', 'filter-btn-active'));
        defaultFilterBtn.classList.add('active', 'filter-btn-active');
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active', 'filter-btn-active'));
            btn.classList.add('active', 'filter-btn-active');
            
            const filter = btn.dataset.filter;
            
            // Use the extracted applyFilter function
            applyFilter(filter);
        });
    });
}

// Function to ensure progress bar is always visible when on "All" filter (if it exists)
function ensureProgressBarVisibility() {
    const progressBar = document.getElementById('progress-bar');
    const activeFilter = document.querySelector('.filter-btn.active');
    
    if (progressBar && activeFilter && activeFilter.dataset.filter === 'all') {
        // Force visibility regardless of any other CSS
        progressBar.style.setProperty('display', 'block', 'important');
        progressBar.style.setProperty('visibility', 'visible', 'important');
        progressBar.style.setProperty('opacity', '1', 'important');
        progressBar.style.setProperty('transform', 'none', 'important');
        progressBar.style.setProperty('position', 'relative', 'important');
        progressBar.classList.remove('hidden-mobile');
        
        // Also check if it has any size
        const rect = progressBar.getBoundingClientRect();
        if (rect.height === 0) {
            progressBar.style.setProperty('height', '8px', 'important');
            progressBar.style.setProperty('min-height', '8px', 'important');
        }
    }
}

// Password toggle functionality
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.password-toggle');
    const eyeIcon = button.querySelector('.eye-icon');
    const eyeOffIcon = button.querySelector('.eye-off-icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        eyeIcon.style.display = 'none';
        eyeOffIcon.style.display = 'block';
        button.setAttribute('aria-label', 'Hide password');
    } else {
        input.type = 'password';
        eyeIcon.style.display = 'block';
        eyeOffIcon.style.display = 'none';
        button.setAttribute('aria-label', 'Show password');
    }
}

// Note: Theme switching is now handled in the Settings page
// The theme initialization is handled by applyUserPreferences() function above

function applyUserPreferences() {
    // Apply theme
    const savedTheme = localStorage.getItem('settings-theme') || 'system';
    setTheme(savedTheme);
    
    // Apply compact mode
    const compactMode = localStorage.getItem('settings-compact-mode') === 'true';
    document.body.classList.toggle('compact-mode', compactMode);
    
    // Apply auto-hide completed tasks
    const autoHideCompleted = localStorage.getItem('settings-auto-hide-completed') === 'true';
    if (autoHideCompleted) {
        const completedSection = document.getElementById('completed-section');
        const completedTasks = document.querySelectorAll('.task-item.completed');
        
        // Hide completed tasks older than 7 days
        completedTasks.forEach(task => {
            const taskElement = task;
            // You could add logic here to check task completion date
            // For now, just hide if auto-hide is enabled
        });
    }
    
    // Apply sort preference
    const sortPreference = localStorage.getItem('settings-sort-preference') || 'due_date';
    applySortPreference(sortPreference);
}

function setTheme(theme) {
    if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            const currentTheme = localStorage.getItem('settings-theme') || 'system';
            if (currentTheme === 'system') {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        });
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}

function applySortPreference(sortBy) {
    const taskLists = document.querySelectorAll('.task-list');
    
    taskLists.forEach(list => {
        const tasks = Array.from(list.querySelectorAll('.task-item:not(.no-tasks)'));
        
        tasks.sort((a, b) => {
            switch(sortBy) {
                case 'priority':
                    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                    const aPriority = priorityOrder[a.dataset.priority] || 2;
                    const bPriority = priorityOrder[b.dataset.priority] || 2;
                    return bPriority - aPriority; // Higher priority first
                    
                case 'alphabetical':
                    const aText = a.querySelector('.task-desc').textContent.trim();
                    const bText = b.querySelector('.task-desc').textContent.trim();
                    return aText.localeCompare(bText);
                    
                case 'created':
                    // Would need creation timestamp, fallback to DOM order
                    return 0;
                    
                case 'due_date':
                default:
                    const aDays = parseFloat(a.dataset.days) || Infinity;
                    const bDays = parseFloat(b.dataset.days) || Infinity;
                    return aDays - bDays; // Sooner due dates first
            }
        });
        
        // Reorder DOM elements
        tasks.forEach(task => list.appendChild(task));
    });
}

// Robust UTC to local time conversion for countdown
function convertUTCToLocal(utcString) {
    return new Date(utcString);
}

function getCountdownString(dueUTC, nowUTC) {
    if (!dueUTC || dueUTC === '') return 'No due date';
    const due = convertUTCToLocal(dueUTC);
    const now = convertUTCToLocal(nowUTC);
    if (isNaN(due.getTime()) || isNaN(now.getTime())) return 'Invalid date';
    let delta = due.getTime() - now.getTime();
    if (delta <= 0) return 'Overdue';
    
    let totalMinutes = Math.floor(delta / 60000);
    let days = Math.floor(totalMinutes / (24 * 60));
    let hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    let mins = totalMinutes % 60;
    
    // For tasks less than 24 hours away, show hours and minutes
    if (days === 0) {
        let parts = [];
        if (hours > 0) parts.push(hours + 'h');
        if (mins > 0) parts.push(mins + 'm');
        if (parts.length === 0) parts.push('less than 1m');
        return parts.join(' ');
    } 
    // For tasks a day or more away, just show days
    else {
        return days + 'd';
    }
}

function updateTaskCountdowns(nowUTC) {
    document.querySelectorAll('.task-item').forEach(function(item) {
        const dueUTC = item.getAttribute('data-due-utc');
        const meta = item.querySelector('.task-meta .task-due');
        console.log('Task:', item, 'dueUTC:', dueUTC, 'nowUTC:', nowUTC, 'meta:', meta);
        if (meta) {
            meta.textContent = getCountdownString(dueUTC, nowUTC);
            console.log('Updated countdown:', meta.textContent);
        } else {
            console.log('No .task-due element found for this task-item.');
        }
    });
}

window.addEventListener('DOMContentLoaded', function() {
    // Initial countdown update using backend UTC
    if (window.now_utc) {
        updateTaskCountdowns(window.now_utc);
    }
    // Update countdowns every minute using browser's current UTC
    setInterval(function() {
        const nowUTC = new Date().toISOString();
        updateTaskCountdowns(nowUTC);
    }, 60000); // 60 seconds
    // Also update immediately on load for accuracy
    const nowUTC = new Date().toISOString();
    updateTaskCountdowns(nowUTC);
});

// Recurring task actions functionality
function toggleRecurringActions(taskId) {
    const menu = document.getElementById(`recurring-actions-${taskId}`);
    const allMenus = document.querySelectorAll('.recurring-actions-menu');
    
    // Close all other menus
    allMenus.forEach(m => {
        if (m !== menu) {
            m.classList.remove('show');
        }
    });
    
    // Toggle the clicked menu
    menu.classList.toggle('show');
    
    // Close menu when clicking outside
    if (menu.classList.contains('show')) {
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!e.target.closest('.recurring-actions-container')) {
                    menu.classList.remove('show');
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 0);
    }
}

// Handle long task titles dynamically
function handleLongTaskTitles() {
    const taskItems = document.querySelectorAll('.task-item');
    
    taskItems.forEach(item => {
        const taskText = item.querySelector('.task-text');
        
        if (taskText) {
            const textLength = taskText.textContent.trim().length;
            const isMobile = window.innerWidth <= 768;
            
            // Remove existing attributes
            item.removeAttribute('data-long-text');
            item.removeAttribute('data-very-long-text');
            
            // Determine thresholds based on screen size
            const longTextThreshold = isMobile ? 40 : 60;
            const veryLongTextThreshold = isMobile ? 80 : 120;
            
            if (textLength > veryLongTextThreshold) {
                item.setAttribute('data-very-long-text', '');
            } else if (textLength > longTextThreshold) {
                item.setAttribute('data-long-text', '');
            }
            // No layout changes - just let CSS handle line clamping
        }
    });
}

// Handle window resize for responsive layout
let resizeTimeout;
window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(handleLongTaskTitles, 250);
});

// Initialize user preferences on page load
document.addEventListener('DOMContentLoaded', function() {
    applyUserPreferences();
    initializeFiltering();
    initializeTaskInteractions();
    
    // Initialize iOS-style wheel picker for date/time inputs
    new IOSWheelPicker();
    
    // Handle long task titles
    handleLongTaskTitles();
});