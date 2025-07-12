// Profile dropdown functionality
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const button = dropdown.previousElementSibling;
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        button.setAttribute('aria-expanded', 'false');
    } else {
        dropdown.classList.add('show');
        button.setAttribute('aria-expanded', 'true');
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
    }
});

// Custom iOS-style wheel picker implementation
class IOSWheelPicker {
    constructor() {
        this.initializePickers();
    }

    initializePickers() {
        // Initialize date picker
        const dueDateInput = document.getElementById('due_date');
        if (dueDateInput) {
            dueDateInput.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDatePicker(dueDateInput);
            });
        }

        // Initialize time picker  
        const dueTimeInput = document.getElementById('due_time');
        if (dueTimeInput) {
            dueTimeInput.addEventListener('click', (e) => {
                e.preventDefault();
                this.showTimePicker(dueTimeInput);
            });
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
            
            // Determine scroll direction and amount
            const isMobile = window.innerWidth <= 480;
            const itemHeight = isMobile ? 36 : 48;
            const centerOffset = isMobile ? 72 : 96;
            const scrollDelta = e.deltaY > 0 ? itemHeight : -itemHeight; // One item height per scroll
            const newOffset = currentOffset + scrollDelta;
            
            // Calculate bounds
            const minOffset = -(items.length - 1) * itemHeight + centerOffset;
            const maxOffset = centerOffset;
            
            // Clamp the offset within bounds
            const clampedOffset = Math.max(minOffset, Math.min(newOffset, maxOffset));
            
            // Apply smooth transition
            container.style.transition = 'transform 0.2s ease-out';
            container.style.transform = `translateY(${clampedOffset}px)`;
            
            // Update selection after transition
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
            input.value = selectedTime;
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
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
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

// Task interactions
function initializeTaskInteractions() {
    document.querySelectorAll('.task-desc').forEach(div => {
        div.addEventListener('click', () => {
            if (div.parentElement.dataset.done === 'true') return;
            if (div.classList.contains('editing')) return;
            
            const id = div.dataset.id;
            const full = div.textContent.trim();
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
                    div.textContent = `${prefix} ${nv}`;
                });
            };
            
            inp.addEventListener('blur', save);
            inp.addEventListener('keydown', e => {
                if (e.key==='Enter') inp.blur();
                if (e.key==='Escape') {
                    div.classList.remove('editing');
                    div.textContent = full;
                }
            });
        });
    });
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

// Filtering
function initializeFiltering() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            const progressBar = document.getElementById('progress-bar');
            const activeSection = document.getElementById('active-section');
            const completedSection = document.getElementById('completed-section');
            
            // Handle progress bar visibility (only show on 'all' filter)
            if (progressBar) {
                const shouldShow = filter === 'all';
                console.log('Filter changed to:', filter, 'shouldShow:', shouldShow);
                
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
                
                console.log(`Progress bar ${shouldShow ? 'shown' : 'hidden'} for filter: ${filter}`);
                
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
                // Hide completed section completely
                if (completedSection) {
                    completedSection.style.display = 'none';
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
                
                // Restore original heading
                const activeHeading = activeSection ? activeSection.querySelector('h2') : null;
                if (activeHeading) {
                    activeHeading.textContent = 'Active Tasks';
                }
                // Handle "no tasks" message
                const noTasksMsg = activeSection ? activeSection.querySelector('.no-tasks') : null;
                if (noTasksMsg) {
                    noTasksMsg.textContent = 'No active tasks.';
                    setElementVisibility(noTasksMsg, visibleTasks === 0);
                }
            } else if (filter === 'today') {
                // Hide completed section and filter active tasks
                if (completedSection) {
                    completedSection.style.display = 'none';
                }
                
                // Update heading for "Due Today" filter
                const activeHeading = activeSection ? activeSection.querySelector('h2') : null;
                if (activeHeading) {
                    activeHeading.textContent = 'Due Today';
                }
                
                // Filter active tasks to show only today/overdue
                const activeTasks = activeSection ? activeSection.querySelectorAll('.task-item:not(.no-tasks)') : [];
                const noTasksMsg = activeSection ? activeSection.querySelector('.no-tasks') : null;
                let visibleTasks = 0;
                let totalActiveTasks = 0;
                
                activeTasks.forEach(task => {
                    const days = task.dataset.days;
                    const isDone = task.dataset.done === 'true';
                    
                    // Count total active tasks (not completed)
                    if (!isDone) {
                        totalActiveTasks++;
                    }
                    
                    // Show tasks that are due today (days = 0) or overdue (days = -1), but not completed
                    if (!isDone && days !== '' && (parseFloat(days) === 0 || parseFloat(days) === -1)) {
                        task.style.display = '';
                        visibleTasks++;
                    } else {
                        task.style.display = 'none';
                    }
                });
                
                // Show/hide "no tasks" message based on visible tasks and active tasks
                if (noTasksMsg) {
                    if (totalActiveTasks === 0) {
                        // No active tasks at all
                        noTasksMsg.textContent = 'No active tasks.';
                        setElementVisibility(noTasksMsg, true);
                    } else if (visibleTasks === 0) {
                        // There are active tasks but none due today
                        noTasksMsg.textContent = 'No tasks due today.';
                        setElementVisibility(noTasksMsg, true);
                    } else {
                        setElementVisibility(noTasksMsg, false);
                    }
                }
            } else if (filter === 'completed') {
                // Hide active section completely
                if (activeSection) {
                    activeSection.style.display = 'none';
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
        });
    });
}

// Function to ensure progress bar is always visible when on "All" filter
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

// Dark mode toggle functionality
function toggleTheme() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
        updateThemeToggleUI(false);
    } else {
        body.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateThemeToggleUI(true);
    }
}

function updateThemeToggleUI(isDark) {
    const themeIconDark = document.querySelector('.theme-icon-dark');
    const themeIconLight = document.querySelector('.theme-icon-light');
    const themeText = document.querySelector('.theme-text');
    
    if (isDark) {
        themeIconDark.style.display = 'none';
        themeIconLight.style.display = 'block';
        themeText.textContent = 'Light Mode';
    } else {
        themeIconDark.style.display = 'block';
        themeIconLight.style.display = 'none';
        themeText.textContent = 'Dark Mode';
    }
}

// Initialize theme on page load
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Default to dark theme if no preference is saved, or use saved preference
    const shouldUseDark = savedTheme ? savedTheme === 'dark' : prefersDark;
    
    document.body.setAttribute('data-theme', shouldUseDark ? 'dark' : 'light');
    updateThemeToggleUI(shouldUseDark);
}

// Run theme initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTheme);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize custom iOS wheel pickers
    new IOSWheelPicker();
    
    // Initialize other components
    initializeTaskInteractions();
    initializeFiltering();
    
    // Initialize progress bar visibility (show by default since "All" is active)
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        console.log('Progress bar element found:', progressBar);
        const progressBarInner = progressBar.querySelector('.progress-bar');
        console.log('Progress bar inner width:', progressBarInner ? progressBarInner.style.width : 'N/A');
        console.log('Progress bar container display:', window.getComputedStyle(progressBar).display);
        console.log('Progress bar container visibility:', window.getComputedStyle(progressBar).visibility);
        console.log('Progress bar container height:', window.getComputedStyle(progressBar).height);
        console.log('Progress bar rect:', progressBar.getBoundingClientRect());
        
        // Force show progress bar initially
        progressBar.style.setProperty('display', 'block', 'important');
        progressBar.style.setProperty('visibility', 'visible', 'important');
        progressBar.classList.remove('hidden-mobile');
        
        console.log('Progress bar forced visible');
        console.log('After forcing - display:', window.getComputedStyle(progressBar).display);
        console.log('After forcing - visibility:', window.getComputedStyle(progressBar).visibility);
        console.log('After forcing - rect:', progressBar.getBoundingClientRect());
        
        // Ensure progress bar stays visible
        ensureProgressBarVisibility();
        
        // Also run it periodically to catch any dynamic changes
        setInterval(ensureProgressBarVisibility, 1000);
    } else {
        console.log('Progress bar element not found!');
    }
    
    // Continuously ensure progress bar visibility
    setInterval(ensureProgressBarVisibility, 1000);
});