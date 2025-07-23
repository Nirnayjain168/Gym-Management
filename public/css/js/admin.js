// public/js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('content-area');
    const adminEmailSpan = document.getElementById('admin-email');

    // Authentication check for admin.html
    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists && doc.data().role === 'admin') {
                    adminEmailSpan.textContent = user.email;
                    logAction('Admin dashboard loaded', { uid: user.uid });
                    setupAdminDashboard();
                    renderDashboardOverview(); // Load default view
                } else {
                    alert('Access Denied: You are not authorized to view this page.');
                    logAction('Unauthorized access attempt', { uid: user ? user.uid : 'N/A', page: 'admin.html' });
                    window.location.href = 'index.html';
                }
            }).catch(error => {
                console.error("Error fetching admin role:", error);
                alert('Error checking user role. Please try again.');
                logAction('Error fetching admin role', { uid: user ? user.uid : 'N/A', error: error.message });
                window.location.href = 'index.html';
            });
        } else {
            window.location.href = 'index.html'; // Not logged in
        }
    });

    function setActiveNavLink(navId) {
        document.querySelectorAll('.sidebar nav ul li a').forEach(link => {
            link.classList.remove('active');
        });
        document.getElementById(navId).classList.add('active');
    }

    function setupAdminDashboard() {
        // Navigation listeners
        document.getElementById('nav-dashboard').addEventListener('click', () => {
            logAction('Navigated to Admin Dashboard Overview');
            setActiveNavLink('nav-dashboard');
            renderDashboardOverview();
        });
        document.getElementById('nav-add-member').addEventListener('click', () => {
            logAction('Navigated to Add Member');
            setActiveNavLink('nav-add-member');
            renderAddMemberForm();
        });
        document.getElementById('nav-manage-members').addEventListener('click', () => {
            logAction('Navigated to Manage Members');
            setActiveNavLink('nav-manage-members');
            renderManageMembers();
        });
        document.getElementById('nav-create-bill').addEventListener('click', () => {
            logAction('Navigated to Create Bill');
            setActiveNavLink('nav-create-bill');
            renderCreateBillForm();
        });
        document.getElementById('nav-manage-fees').addEventListener('click', () => {
            logAction('Navigated to Manage Fee Packages');
            setActiveNavLink('nav-manage-fees');
            renderManageFeePackages();
        });
        document.getElementById('nav-send-notification').addEventListener('click', () => {
            logAction('Navigated to Send Notification');
            setActiveNavLink('nav-send-notification');
            renderSendNotificationForm();
        });
        document.getElementById('nav-manage-workouts').addEventListener('click', () => {
            logAction('Navigated to Manage Workouts');
            setActiveNavLink('nav-manage-workouts');
            renderManageWorkouts();
        });
        document.getElementById('nav-manage-diets').addEventListener('click', () => {
            logAction('Navigated to Manage Diet Plans');
            setActiveNavLink('nav-manage-diets');
            renderManageDiets();
        });
        document.getElementById('nav-manage-supplements').addEventListener('click', () => {
            logAction('Navigated to Manage Supplement Store');
            setActiveNavLink('nav-manage-supplements');
            renderManageSupplementStore();
        });
        document.getElementById('nav-report-export').addEventListener('click', () => {
            logAction('Navigated to Reports & Export');
            setActiveNavLink('nav-report-export');
            renderReportsAndExport();
        });
    }

    // --- Dashboard Overview ---
    async function renderDashboardOverview() {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>Overview</h3>
                <p>Total Members: <strong id="total-members">Loading...</strong></p>
                <p>Upcoming Payments (next 30 days): <strong id="upcoming-payments">Loading...</strong></p>
                <p>Active Memberships: <strong id="active-memberships">Loading...</strong></p>
                <p>Recently Added Members:</p>
                <ul id="recent-members-list"><li>Loading...</li></ul>
                <p>Recent Log Activity:</p>
                <ul id="recent-logs-list"><li>Loading...</li></ul>
            </div>
        `;
        const totalMembersSpan = document.getElementById('total-members');
        const upcomingPaymentsSpan = document.getElementById('upcoming-payments');
        const activeMembershipsSpan = document.getElementById('active-memberships');
        const recentMembersList = document.getElementById('recent-members-list');
        const recentLogsList = document.getElementById('recent-logs-list');

        try {
            // Fetch total members
            const membersSnapshot = await db.collection('users').where('role', '==', 'member').get();
            totalMembersSpan.textContent = membersSnapshot.size;

            // Fetch active memberships (simple check: assuming 'active' status or future expiry)
            const activeMembershipsSnapshot = await db.collection('memberships')
                .where('status', '==', 'active')
                .where('endDate', '>', new Date()) // Check if end date is in the future
                .get();
            activeMembershipsSpan.textContent = activeMembershipsSnapshot.size;

            // Fetch upcoming payments (e.g., bills due in next 30 days)
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            const upcomingPaymentsSnapshot = await db.collection('bills')
                .where('status', '==', 'pending')
                .where('dueDate', '<=', thirtyDaysFromNow)
                .get();
            upcomingPaymentsSpan.textContent = upcomingPaymentsSnapshot.size;

            // Fetch recently added members
            const recentMembersSnapshot = await db.collection('users')
                .where('role', '==', 'member')
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();
            recentMembersList.innerHTML = '';
            if (recentMembersSnapshot.empty) {
                recentMembersList.innerHTML = '<li>No recent members.</li>';
            } else {
                recentMembersSnapshot.forEach(doc => {
                    const member = doc.data();
                    recentMembersList.innerHTML += `<li>${member.name || member.email} (Added: ${member.createdAt ? new Date(member.createdAt.toDate()).toLocaleDateString() : 'N/A'})</li>`;
                });
            }

            // Fetch recent logs
            const recentLogsSnapshot = await db.collection('logs')
                .orderBy('timestamp', 'desc')
                .limit(5)
                .get();
            recentLogsList.innerHTML = '';
            if (recentLogsSnapshot.empty) {
                recentLogsList.innerHTML = '<li>No recent log activity.</li>';
            } else {
                recentLogsSnapshot.forEach(doc => {
                    const log = doc.data();
                    recentLogsList.innerHTML += `<li>[${new Date(log.timestamp.toDate()).toLocaleTimeString()}] ${log.action} - User: ${log.userId}</li>`;
                });
            }

            logAction('Dashboard overview loaded');
        } catch (error) {
            console.error("Error loading dashboard overview:", error);
            contentArea.innerHTML = `<p class="error-message">Error loading dashboard data: ${error.message}</p>`;
            logAction('Failed to load dashboard overview', { error: error.message });
        }
    }

    // --- Add Member Form ---
    async function renderAddMemberForm() {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>Add New Member</h3>
                <form id="add-member-form">
                    <input type="text" id="member-name" placeholder="Full Name" required>
                    <input type="email" id="member-email" placeholder="Email" required>
                    <input type="password" id="member-password" placeholder="Temporary Password (min 6 chars)" required>
                    <input type="text" id="member-phone" placeholder="Phone Number">
                    <input type="date" id="member-dob" placeholder="Date of Birth">
                    <textarea id="member-address" placeholder="Address"></textarea>
                    <button type="submit">Add Member</button>
                </form>
                <p id="add-member-message" class="success-message"></p>
            </div>
        `;

        document.getElementById('add-member-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('member-name').value;
            const email = document.getElementById('member-email').value;
            const password = document.getElementById('member-password').value;
            const phone = document.getElementById('member-phone').value;
            const dob = document.getElementById('member-dob').value;
            const address = document.getElementById('member-address').value;
            const messageElement = document.getElementById('add-member-message');
            messageElement.textContent = ''; // Clear previous messages

            try {
                // 1. Create user in Firebase Authentication
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // 2. Store member details and role in Firestore
                await db.collection('users').doc(user.uid).set({
                    name: name,
                    email: email,
                    phone: phone,
                    dob: dob,
                    address: address,
                    role: 'member',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                messageElement.textContent = 'Member added successfully!';
                messageElement.style.color = 'green';
                logAction('Member added', { uid: user.uid, email: email, name: name });
                document.getElementById('add-member-form').reset();
            } catch (error) {
                console.error("Error adding member:", error);
                messageElement.textContent = `Error adding member: ${error.message}`;
                messageElement.style.color = 'red';
                logAction('Add member failed', { email: email, error: error.message });
            }
        });
    }

    // --- Manage Members (View, Update, Delete) ---
    async function renderManageMembers() {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>Manage Members</h3>
                <p id="member-list-status">Loading members...</p>
                <table id="members-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        </tbody>
                </table>
            </div>
        `;

        const membersTableBody = document.querySelector('#members-table tbody');
        const statusMessage = document.getElementById('member-list-status');

        try {
            const snapshot = await db.collection('users').where('role', '==', 'member').orderBy('createdAt', 'desc').get();
            membersTableBody.innerHTML = ''; // Clear existing
            if (snapshot.empty) {
                statusMessage.textContent = 'No members found.';
            } else {
                statusMessage.textContent = ''; // Clear loading message
                snapshot.forEach(doc => {
                    const member = doc.data();
                    const row = membersTableBody.insertRow();
                    row.insertCell(0).textContent = member.name || 'N/A';
                    row.insertCell(1).textContent = member.email;
                    row.insertCell(2).textContent = member.phone || 'N/A';
                    const actionsCell = row.insertCell(3);

                    const updateBtn = document.createElement('button');
                    updateBtn.textContent = 'Update';
                    updateBtn.onclick = () => renderUpdateMemberForm(doc.id, member);
                    actionsCell.appendChild(updateBtn);

                    const deleteBtn = document.createElement('button');
                    deleteBtn.textContent = 'Delete';
                    deleteBtn.style.backgroundColor = 'var(--danger-color)';
                    deleteBtn.onclick = () => deleteMember(doc.id, member.email);
                    actionsCell.appendChild(deleteBtn);
                });
            }
            logAction('Member list loaded for management');
        } catch (error) {
            console.error("Error fetching members for management:", error);
            statusMessage.textContent = `Error loading members: ${error.message}`;
            statusMessage.style.color = 'red';
            logAction('Failed to load member list', { error: error.message });
        }
    }

    async function renderUpdateMemberForm(memberId, memberData) {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>Update Member</h3>
                <form id="update-member-form">
                    <input type="text" id="update-name" placeholder="Member Name" value="${memberData.name || ''}" required>
                    <input type="email" id="update-email" placeholder="Member Email" value="${memberData.email || ''}" disabled>
                    <input type="text" id="update-phone" placeholder="Phone Number" value="${memberData.phone || ''}">
                    <input type="date" id="update-dob" placeholder="Date of Birth" value="${memberData.dob || ''}">
                    <textarea id="update-address" placeholder="Address">${memberData.address || ''}</textarea>
                    <button type="submit">Update Member</button>
                    <button type="button" class="secondary-btn" onclick="renderManageMembers()">Cancel</button>
                </form>
                <p id="update-member-message" class="success-message"></p>
            </div>
        `;

        document.getElementById('update-member-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('update-name').value;
            const phone = document.getElementById('update-phone').value;
            const dob = document.getElementById('update-dob').value;
            const address = document.getElementById('update-address').value;
            const messageElement = document.getElementById('update-member-message');

            try {
                await db.collection('users').doc(memberId).update({
                    name: name,
                    phone: phone,
                    dob: dob,
                    address: address,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                messageElement.textContent = 'Member updated successfully!';
                messageElement.style.color = 'green';
                logAction('Member updated', { memberId: memberId, name: name });
                setTimeout(renderManageMembers, 1500);
            } catch (error) {
                console.error("Error updating member:", error);
                messageElement.textContent = `Error updating member: ${error.message}`;
                messageElement.style.color = 'red';
                logAction('Update member failed', { memberId: memberId, error: error.message });
            }
        });
    }

    async function deleteMember(memberId, memberEmail) {
        if (!confirm(`Are you sure you want to delete member: ${memberEmail}? This will only delete their data, not their Firebase Auth account easily from client-side.`)) {
            return;
        }

        try {
            // IMPORTANT: Deleting a user from Firebase Authentication from the client-side
            // requires the user to be currently logged in and be the user you're deleting.
            // To delete other users (like an admin deleting a member), you MUST use
            // Firebase Admin SDK, typically via a Firebase Cloud Function.
            // For now, we'll only delete the Firestore record.
            await db.collection('users').doc(memberId).delete();
            alert('Member data deleted successfully. (Note: Authentication user record needs server-side deletion.)');
            logAction('Member data deleted', { memberId: memberId, email: memberEmail });
            renderManageMembers(); // Refresh the list
        } catch (error) {
            console.error("Error deleting member:", error);
            alert(`Error deleting member: ${error.message}`);
            logAction('Delete member failed', { memberId: memberId, error: error.message });
        }
    }

    // --- Create Bill Form ---
    async function renderCreateBillForm() {
        // Fetch all members to populate a dropdown
        let membersHtmlOptions = '';
        try {
            const membersSnapshot = await db.collection('users').where('role', '==', 'member').get();
            membersSnapshot.forEach(doc => {
                const member = doc.data();
                membersHtmlOptions +=` <option value="${doc.id}">${member.name || member.email}</option>`;
            });
        } catch (error) {
            console.error("Error fetching members for bill creation:", error);
            membersHtmlOptions = `<option value="">Error loading members</option>`;
            logAction('Error fetching members for bill creation', { error: error.message });
        }

        contentArea.innerHTML = `
            <div class="content-section">
                <h3>Create New Bill</h3>
                <form id="create-bill-form">
                    <label for="bill-member">Select Member:</label>
                    <select id="bill-member" required>
                        <option value="">-- Select a Member --</option>
                        ${membersHtmlOptions}
                    </select>
                    <label for="bill-amount">Amount (INR):</label>
                    <input type="number" id="bill-amount" placeholder="e.g., 1500" min="0" step="0.01" required>
                    <label for="bill-description">Description:</label>
                    <input type="text" id="bill-description" placeholder="e.g., Monthly Membership Fee" required>
                    <label for="bill-due-date">Due Date:</label>
                    <input type="date" id="bill-due-date" required>
                    <label for="bill-status">Status:</label>
                    <select id="bill-status" required>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="overdue">Overdue</option>
                    </select>
                    <button type="submit">Create Bill</button>
                    </form>
                    <p id="create-bill-message" class="success-message"></p>
                    </div>`;
                  document.getElementById('create-bill-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const memberId = document.getElementById('bill-member').value;
            const amount = parseFloat(document.getElementById('bill-amount').value);
            const description = document.getElementById('bill-description').value;
            const dueDate = document.getElementById('bill-due-date').value;
            const status = document.getElementById('bill-status').value;
            const messageElement = document.getElementById('create-bill-message');
            messageElement.textContent = '';

            if (!memberId) {
                messageElement.textContent = 'Please select a member.';
                messageElement.style.color = 'red';
                return;
            }

            try {
                await db.collection('bills').add({
                    memberId: memberId,
                    amount: amount,
                    description: description,
                    dueDate: new Date(dueDate), // Store as Firestore Timestamp
                    status: status,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: auth.currentUser.uid
                });
                messageElement.textContent = 'Bill created successfully!';
                messageElement.style.color = 'green';
                logAction('Bill created', { memberId: memberId, amount: amount });
                document.getElementById('create-bill-form').reset();
            } catch (error) {
                console.error("Error creating bill:", error);
                messageElement.textContent = `Error creating bill: ${error.message}`;
                messageElement.style.color = 'red';
                logAction('Bill creation failed', { error: error.message });
            }
        });
    }

    // --- Manage Fee Packages ---
    async function renderManageFeePackages() {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>Manage Fee Packages</h3>
                <form id="add-fee-package-form">
                    <input type="text" id="package-name" placeholder="Package Name (e.g., Monthly Basic)" required>
                    <input type="number" id="package-price" placeholder="Price (INR)" min="0" step="0.01" required>
                    <input type="number" id="package-duration" placeholder="Duration (in days)" min="1" required>
                    <textarea id="package-description" placeholder="Description (e.g., Access to gym equipment)"></textarea>
                    <button type="submit">Add Fee Package</button>
                </form>
                <p id="fee-package-message" class="success-message"></p>

                <h4>Existing Fee Packages</h4>
                <table id="fee-packages-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Duration (Days)</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;

        const addForm = document.getElementById('add-fee-package-form');
        const messageElement = document.getElementById('fee-package-message');
        const tableBody = document.querySelector('#fee-packages-table tbody');

        // Add new package
        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('package-name').value;
            const price = parseFloat(document.getElementById('package-price').value);
            const duration = parseInt(document.getElementById('package-duration').value);
            const description = document.getElementById('package-description').value;

            try {
                await db.collection('feePackages').add({
                    name, price, duration, description,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                messageElement.textContent = 'Fee package added successfully!';
                messageElement.style.color = 'green';
                addForm.reset();
                logAction('Fee package added', { name: name, price: price });
                loadFeePackages(); // Reload list
            } catch (error) {
                console.error("Error adding fee package:", error);
                messageElement.textContent = `Error: ${error.message}`;
                messageElement.style.color = 'red';
                logAction('Add fee package failed', { error: error.message });
            }
        });

        // Load existing packages
        async function loadFeePackages() {
            tableBody.innerHTML = '<tr><td colspan="4">Loading packages...</td></tr>';
            try {
                const snapshot = await db.collection('feePackages').orderBy('name').get();
                tableBody.innerHTML = '';
                if (snapshot.empty) {
                    tableBody.innerHTML = '<tr><td colspan="4">No fee packages found.</td></tr>';
                } else {
                    snapshot.forEach(doc => {
                        const pkg = doc.data();
                        const row = tableBody.insertRow();
                        row.insertCell(0).textContent = pkg.name;
                        row.insertCell(1).textContent = `₹${pkg.price.toFixed(2)}`;
                        row.insertCell(2).textContent = pkg.duration;
                        const actionsCell = row.insertCell(3);
                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'Delete';
                        deleteBtn.style.backgroundColor = 'var(--danger-color)';
                        deleteBtn.onclick = async () => {
                            if (confirm(`Delete package "${pkg.name}"?`)) {
                                await db.collection('feePackages').doc(doc.id).delete();
                                logAction('Fee package deleted', { packageId: doc.id, name: pkg.name });
                                loadFeePackages(); // Reload list
                            }
                        };
                        actionsCell.appendChild(deleteBtn);
                    });
                }
                logAction('Fee packages loaded');
            } catch (error) {
                console.error("Error loading fee packages:", error);
                tableBody.innerHTML = `<tr><td colspan="4" class="error-message">Error loading packages: ${error.message}</td></tr>`;
                logAction('Failed to load fee packages', { error: error.message });
            }
        }
        loadFeePackages();

        // Assign Fee Package to Member (Separate section, perhaps a modal or another button)
        // For now, let's keep it simple: assume this is an action performed from "Manage Members" or "Create Bill"
    }

    // --- Send Notification Form ---
    async function renderSendNotificationForm() {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>Send Notification</h3>
                <form id="send-notification-form">
                    <label for="notification-title">Title:</label>
                    <input type="text" id="notification-title" placeholder="e.g., Gym Holiday Notice" required>
                    <label for="notification-message">Message:</label>
                    <textarea id="notification-message" placeholder="Detailed message for members" rows="5" required></textarea>
                    <label for="notification-target">Send To:</label>
                    <select id="notification-target">
                        <option value="all">All Members</option>
                        </select>
                    <button type="submit">Send Notification</button>
                </form>
                <p id="send-notification-message" class="success-message"></p>
            </div>
        `;

        document.getElementById('send-notification-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = document.getElementById('notification-title').value;
            const message = document.getElementById('notification-message').value;
            const target = document.getElementById('notification-target').value; // 'all' for now
            const messageElement = document.getElementById('send-notification-message');
            messageElement.textContent = '';

            try {
                let targetUserIds = [];
                if (target === 'all') {
                    const membersSnapshot = await db.collection('users').where('role', '==', 'member').get();
                    targetUserIds = membersSnapshot.docs.map(doc => doc.id);
                }
                // Future: Add logic for specific member targeting

                await db.collection('notifications').add({
                    title: title,
                    message: message,
                    targetUserIds: targetUserIds, // Array of UIDs
                    sentBy: auth.currentUser.uid,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    readBy: [] // To track which members have read it
                });

                messageElement.textContent = 'Notification sent successfully!';
                messageElement.style.color = 'green';
                logAction('Notification sent', { title: title, target: target });
                document.getElementById('send-notification-form').reset();
            } catch (error) {
                console.error("Error sending notification:", error);
                messageElement.textContent = `Error sending notification: ${error.message}`;
                messageElement.style.color = 'red';
                logAction('Send notification failed', { error: error.message });
            }
        });
    }

    // --- Manage Workouts (Basic CRUD) ---
    async function renderManageWorkouts() {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>Manage Workout Plans</h3>
                <form id="add-workout-form">
                    <input type="text" id="workout-name" placeholder="Workout Plan Name (e.g., Full Body Beginner)" required>
                    <textarea id="workout-description" placeholder="Describe the plan (e.g., 3 sets of 10 reps for each exercise)" rows="3"></textarea>
                    <textarea id="workout-exercises" placeholder="List exercises (e.g., Bench Press, Squats, Deadlifts)" rows="5" required></textarea>
                    <button type="submit">Add Workout Plan</button>
                </form>
                <p id="workout-message" class="success-message"></p>

                <h4>Existing Workout Plans</h4>
                <table id="workouts-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;
        const addForm = document.getElementById('add-workout-form');
        const messageElement = document.getElementById('workout-message');
        const tableBody = document.querySelector('#workouts-table tbody');

        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('workout-name').value;
            const description = document.getElementById('workout-description').value;
            const exercises = document.getElementById('workout-exercises').value; // Could be parsed as array later

            try {
                await db.collection('workoutPlans').add({
                    name, description, exercises,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: auth.currentUser.uid
                });
                messageElement.textContent = 'Workout plan added!';
                messageElement.style.color = 'green';
                addForm.reset();
                logAction('Workout plan added', { name: name });
                loadWorkoutPlans();
            } catch (error) {
                console.error("Error adding workout plan:", error);
                messageElement.textContent = `Error: ${error.message}`;
                messageElement.style.color = 'red';
                logAction('Add workout plan failed', { error: error.message });
            }
        });

        async function loadWorkoutPlans() {
            tableBody.innerHTML = '<tr><td colspan="3">Loading workout plans...</td></tr>';
            try {
                const snapshot = await db.collection('workoutPlans').orderBy('name').get();
                tableBody.innerHTML = '';
                if (snapshot.empty) {
                    tableBody.innerHTML = '<tr><td colspan="3">No workout plans found.</td></tr>';
                } else {
                    snapshot.forEach(doc => {
                        const plan = doc.data();
                        const row = tableBody.insertRow();
                        row.insertCell(0).textContent = plan.name;
                        row.insertCell(1).textContent = plan.description.substring(0, 50) + (plan.description.length > 50 ? '...' : '');
                        const actionsCell = row.insertCell(2);
                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'Delete';
                        deleteBtn.style.backgroundColor = 'var(--danger-color)';
                        deleteBtn.onclick = async () => {
                            if (confirm(`Delete workout plan "${plan.name}"?`)) {
                                await db.collection('workoutPlans').doc(doc.id).delete();
                                logAction('Workout plan deleted', { planId: doc.id });
                                loadWorkoutPlans();
                            }
                        };
                        actionsCell.appendChild(deleteBtn);
                        // Add "View Details" or "Edit" buttons similarly
                    });
                }
                logAction('Workout plans loaded');
            } catch (error) {
                console.error("Error loading workout plans:", error);
                tableBody.innerHTML = `<tr><td colspan="3" class="error-message">Error loading plans: ${error.message}</td></tr>`;
                logAction('Failed to load workout plans', { error: error.message });
            }
        }
        loadWorkoutPlans();
    }

    // --- Manage Diet Plans (Basic CRUD) ---
    async function renderManageDiets() {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>Manage Diet Plans</h3>
                <form id="add-diet-form">
                    <input type="text" id="diet-name" placeholder="Diet Plan Name (e.g., Keto Diet)" required>
                    <textarea id="diet-details" placeholder="Full diet plan details (meals, macros, etc.)" rows="10" required></textarea>
                    <button type="submit">Add Diet Plan</button>
                </form>
                <p id="diet-message" class="success-message"></p>

                <h4>Existing Diet Plans</h4>
                <table id="diets-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        `;

        const addForm = document.getElementById('add-diet-form');
        const messageElement = document.getElementById('diet-message');
        const tableBody = document.querySelector('#diets-table tbody');

        addForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('diet-name').value;
            const details = document.getElementById('diet-details').value;

            try {
                await db.collection('dietPlans').add({
                    name, details,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: auth.currentUser.uid
                });
                messageElement.textContent = 'Diet plan added!';
                messageElement.style.color = 'green';
                addForm.reset();
                logAction('Diet plan added', { name: name });
                loadDietPlans();
            } catch (error) {
                console.error("Error adding diet plan:", error);
                messageElement.textContent = `Error: ${error.message}`;
                messageElement.style.color = 'red';
                logAction('Add diet plan failed', { error: error.message });
            }
        });

        async function loadDietPlans() {
            tableBody.innerHTML = '<tr><td colspan="2">Loading diet plans...</td></tr>';
            try {
                const snapshot = await db.collection('dietPlans').orderBy('name').get();
                tableBody.innerHTML = '';
                if (snapshot.empty) {
                    tableBody.innerHTML = '<tr><td colspan="2">No diet plans found.</td></tr>';
                } else {
                    snapshot.forEach(doc => {
                        const plan = doc.data();
                        const row = tableBody.insertRow();
                        row.insertCell(0).textContent = plan.name;
                        const actionsCell = row.insertCell(1);
                        const viewBtn = document.createElement('button');
                        viewBtn.textContent = 'View/Edit';
                        viewBtn.onclick = () => alert(`Diet Plan: ${plan.name}\n\nDetails:\n${plan.details}`); // Simple alert, expand later
                        actionsCell.appendChild(viewBtn);

                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'Delete';
                        deleteBtn.style.backgroundColor = 'var(--danger-color)';
                        deleteBtn.onclick = async () => {
                            if (confirm(`Delete diet plan "${plan.name}"?`)) {
                                await db.collection('dietPlans').doc(doc.id).delete();
                                logAction('Diet plan deleted', { planId: doc.id });
                                loadDietPlans();
                            }
                        };
                        actionsCell.appendChild(deleteBtn);
                    });
                }
                logAction('Diet plans loaded');
            } catch (error) {
                console.error("Error loading diet plans:", error);
                tableBody.innerHTML = `<tr><td colspan="2" class="error-message">Error loading plans: ${error.message}</td></tr>`;
                logAction('Failed to load diet plans', { error: error.message });
            }
        }
        loadDietPlans();
    }

    // --- Manage Supplement Store (Placeholder) ---
    function renderManageSupplementStore() {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>Manage Supplement Store</h3>
                <p>This section will allow you to add, edit, and remove supplements for your in-app store.</p>
                <p>Features to implement:</p>
                <ul>
                    <li>Add Product Form (Name, Description, Price, Stock, ImageURL)</li>
                    <li>List Products with Edit/Delete options</li>
                    <li>Basic Inventory Management</li>
                </ul>
                <p class="info-message">Implementation for a full e-commerce module would involve a separate "products" collection, possibly "orders" and "cart" collections, and more complex UI.</p>
            </div>
        `;
        logAction('Navigated to Manage Supplement Store (placeholder)');
    }

    // --- Reports & Export (Placeholder) ---
    function renderReportsAndExport() {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>Reports & Export</h3>
                <p>Generate various reports here (e.g., member list, payment history, attendance).</p>
                <p>Features to implement:</p>
                <ul>
                    <li>Filter reports by date range, membership type, payment status</li>
                    <li>Export data to CSV/Excel (client-side or via Cloud Function)</li>
                    <li>Visualizations (charts for member growth, revenue trends - might need charting library)</li>
                </ul>
                <button onclick="exportMembersToCSV()">Export Members to CSV</button>
                <p id="export-message" class="success-message"></p>
            </div>
        `;
        logAction('Navigated to Reports & Export (placeholder)');
    }

    async function exportMembersToCSV() {
        const messageElement = document.getElementById('export-message');
        messageElement.textContent = 'Generating CSV...';
        messageElement.style.color = 'var(--primary-color)';
        try {
            const snapshot = await db.collection('users').where('role', '==', 'member').get();
            let csvContent = "data:text/csv;charset=utf-8,";
            csvContent += "Name,Email,Phone,Date of Birth,Address,Registered At\n";

            snapshot.forEach(doc => {
                const member = doc.data();
                const name = member.name || '';
                const email = member.email || '';
                const phone = member.phone || '';
                const dob = member.dob || '';
                const address = (member.address || '').replace(/(\r\n|\n|\r)/gm, " "); // Remove newlines
                const createdAt = member.createdAt ? new Date(member.createdAt.toDate()).toLocaleDateString() : '';

                csvContent += `"${name}","${email}","${phone}","${dob}","${address}","${createdAt}"\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "gym_members_report.csv");
            document.body.appendChild(link); // Required for Firefox
            link.click();
            document.body.removeChild(link);
            messageElement.textContent = 'Members data exported successfully!';
            messageElement.style.color = 'green';
            logAction('Members exported to CSV');
        } catch (error) {
            console.error("Error exporting members:", error);
            messageElement.textContent = `Error exporting: ${error.message}`;
            messageElement.style.color = 'red';
            logAction('Export members failed', { error: error.message });
        }
    }
});
        
