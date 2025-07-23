// public/js/member.js

document.addEventListener('DOMContentLoaded', () => {
    const contentArea = document.getElementById('content-area');
    const memberEmailSpan = document.getElementById('member-email');
    let currentUserId = null; // Store the current user's UID

    // Authentication check for member.html
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid; // Set current user ID
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists && doc.data().role === 'member') {
                    memberEmailSpan.textContent = user.email;
                    logAction('Member dashboard loaded', { uid: user.uid });
                    setupMemberDashboard(user.uid);
                    renderMemberProfile(user.uid); // Load default view
                } else {
                    alert('Access Denied: You are not authorized to view this page.');
                    logAction('Unauthorized access attempt', { uid: user.uid, page: 'member.html' });
                    window.location.href = 'index.html';
                }
            }).catch(error => {
                console.error("Error fetching member role:", error);
                alert('Error checking user role. Please try again.');
                logAction('Error fetching member role', { uid: user.uid, error: error.message });
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

    function setupMemberDashboard(userId) {
        // Navigation listeners
        document.getElementById('nav-view-profile').addEventListener('click', () => {
            logAction('Navigated to My Profile');
            setActiveNavLink('nav-view-profile');
            renderMemberProfile(userId);
        });
        document.getElementById('nav-view-bills').addEventListener('click', () => {
            logAction('Navigated to My Bill Receipts');
            setActiveNavLink('nav-view-bills');
            renderMemberBills(userId);
        });
        document.getElementById('nav-view-notifications').addEventListener('click', () => {
            logAction('Navigated to My Notifications');
            setActiveNavLink('nav-view-notifications');
            renderMemberNotifications(userId);
        });
        document.getElementById('nav-view-workouts').addEventListener('click', () => {
            logAction('Navigated to My Workout Plan');
            setActiveNavLink('nav-view-workouts');
            renderMemberWorkout(userId);
        });
        document.getElementById('nav-view-diets').addEventListener('click', () => {
            logAction('Navigated to My Diet Plan');
            setActiveNavLink('nav-view-diets');
            renderMemberDiet(userId);
        });
    }

    // --- My Profile ---
    async function renderMemberProfile(userId) {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>My Profile</h3>
                <p id="profile-status">Loading profile...</p>
                <div id="profile-details">
                    </div>
                <button id="edit-profile-btn" style="display: none;">Edit Profile</button>
            </div>
        `;

        const profileDetails = document.getElementById('profile-details');
        const profileStatus = document.getElementById('profile-status');
        const editProfileBtn = document.getElementById('edit-profile-btn');

        try {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                const member = doc.data();
                profileDetails.innerHTML = `
                    <p><strong>Name:</strong> ${member.name || 'N/A'}</p>
                    <p><strong>Email:</strong> ${member.email}</p>
                    <p><strong>Phone:</strong> ${member.phone || 'N/A'}</p>
                    <p><strong>Date of Birth:</strong> ${member.dob || 'N/A'}</p>
                    <p><strong>Address:</strong> ${member.address || 'N/A'}</p>
                    <p><strong>Membership Status:</strong> ${member.membershipStatus || 'N/A'}</p>
                    <p><strong>Membership End Date:</strong> ${member.membershipEndDate ? new Date(member.membershipEndDate.toDate()).toLocaleDateString() : 'N/A'}</p>
                `;
                profileStatus.textContent = '';
                editProfileBtn.style.display = 'block';
                editProfileBtn.onclick = () => renderEditProfileForm(userId, member);
                logAction('Member profile viewed', { userId: userId });
            } else {
                profileStatus.textContent = 'Profile not found. Please contact admin.';
                editProfileBtn.style.display = 'none';
                logAction('Member profile not found', { userId: userId });
            }
        } catch (error) {
            console.error("Error fetching member profile:", error);
            profileStatus.textContent = `Error loading profile: ${error.message}`;
            profileStatus.style.color = 'red';
            editProfileBtn.style.display = 'none';
            logAction('Failed to load member profile', { userId: userId, error: error.message });
        }
    }

    async function renderEditProfileForm(userId, memberData) {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>Edit My Profile</h3>
                <form id="edit-profile-form">
                    <label for="edit-name">Name:</label>
                    <input type="text" id="edit-name" value="${memberData.name || ''}" required>
                    <label for="edit-phone">Phone:</label>
                    <input type="text" id="edit-phone" value="${memberData.phone || ''}">
                    <label for="edit-dob">Date of Birth:</label>
                    <input type="date" id="edit-dob" value="${memberData.dob || ''}">
                    <label for="edit-address">Address:</label>
                    <textarea id="edit-address">${memberData.address || ''}</textarea>
                    <button type="submit">Save Changes</button>
                    <button type="button" class="secondary-btn" onclick="renderMemberProfile('${userId}')">Cancel</button>
                </form>
                <p id="edit-profile-message" class="success-message"></p>
            </div>
        `;

        document.getElementById('edit-profile-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('edit-name').value;
            const phone = document.getElementById('edit-phone').value;
            const dob = document.getElementById('edit-dob').value;
            const address = document.getElementById('edit-address').value;
            const messageElement = document.getElementById('edit-profile-message');

            try {
                await db.collection('users').doc(userId).update({
                    name: name,
                    phone: phone,
                    dob: dob,
                    address: address,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                messageElement.textContent = 'Profile updated successfully!';
                messageElement.style.color = 'green';
                logAction('Member profile updated', { userId: userId });
                setTimeout(() => renderMemberProfile(userId), 1500); // Go back to view profile
            } catch (error) {
                console.error("Error updating profile:", error);
                messageElement.textContent = `Error updating profile: ${error.message}`;
                messageElement.style.color = 'red';
                logAction('Failed to update member profile', { userId: userId, error: error.message });
            }
        });
    }

    // --- My Bill Receipts ---
    async function renderMemberBills(userId) {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>My Bill Receipts</h3>
                <p id="bills-status">Loading bills...</p>
                <table id="bills-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Amount</th>
                            <th>Due Date</th>
                            <th>Status</th>
                            <th>Generated On</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        </tbody>
                </table>
            </div>
        `;
        const billsTableBody = document.querySelector('#bills-table tbody');
        const statusMessage = document.getElementById('bills-status');

        try {
            const snapshot = await db.collection('bills')
                                    .where('memberId', '==', userId)
                                    .orderBy('createdAt', 'desc')
                                    .get();
            billsTableBody.innerHTML = '';
            if (snapshot.empty) {
                statusMessage.textContent = 'No bills found.';
            } else {
                statusMessage.textContent = '';
                snapshot.forEach(doc => {
                    const bill = doc.data();
                    const row = billsTableBody.insertRow();
                    row.insertCell(0).textContent = bill.description || 'N/A';
                    row.insertCell(1).textContent = `₹${bill.amount ? bill.amount.toFixed(2) : '0.00'}`;
                    row.insertCell(2).textContent = bill.dueDate ? new Date(bill.dueDate.toDate()).toLocaleDateString() : 'N/A';
                    row.insertCell(3).textContent = bill.status || 'Pending';
                    row.insertCell(4).textContent = bill.createdAt ? new Date(bill.createdAt.toDate()).toLocaleDateString() : 'N/A';
                    const actionsCell = row.insertCell(5);
                    // Add "Pay Now" button if status is pending
                    if (bill.status === 'pending' || bill.status === 'overdue') {
                        const payBtn = document.createElement('button');
                        payBtn.textContent = 'Pay Now';
                        // In a real app, this would integrate with a payment gateway (e.g., Stripe, Razorpay)
                        // which would involve a Cloud Function for security.
                        payBtn.onclick = () => alert(`Simulating payment for Bill ID: ${doc.id}\n(Integration with payment gateway needed!)`);
                        actionsCell.appendChild(payBtn);
                    }
                });
            }
            logAction('Member bills viewed', { userId: userId });
        } catch (error) {
            console.error("Error fetching member bills:", error);
            statusMessage.textContent = `Error loading bills: ${error.message}`;
            statusMessage.style.color = 'red';
            logAction('Failed to load member bills', { userId: userId, error: error.message });
        }
    }

    // --- My Notifications ---
    async function renderMemberNotifications(userId) {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>My Notifications</h3>
                <p id="notifications-status">Loading notifications...</p>
                <ul id="notifications-list">
                    </ul>
            </div>
        `;
        const notificationsList = document.getElementById('notifications-list');
        const statusMessage = document.getElementById('notifications-status');

        try {
            // Fetch notifications targeted at this specific user ID
            const snapshot = await db.collection('notifications')
                                    .where('targetUserIds', 'array-contains', userId)
                                    .orderBy('createdAt', 'desc')
                                    .get();
            notificationsList.innerHTML = '';
            if (snapshot.empty) {
                statusMessage.textContent = 'No new notifications.';
            } else {
                statusMessage.textContent = '';
                snapshot.forEach(doc => {
                    const notification = doc.data();
                    const listItem = document.createElement('li');
                    listItem.classList.add('notification-item'); // Add class for styling
                    // Mark as read (simple client-side, could update Firestore readBy array)
                    const isRead = notification.readBy && notification.readBy.includes(userId);
                    listItem.style.fontWeight = isRead ? 'normal' : 'bold';
                    listItem.innerHTML = `
                        <p><strong>${notification.title}</strong></p>
                        <p>${notification.message}</p>
                        <small>${notification.createdAt ? new Date(notification.createdAt.toDate()).toLocaleString() : 'N/A'}</small>
                    `;
                    listItem.onclick = async () => {
                        // Mark as read in Firestore (prevents duplicates if re-read)
                        if (!isRead) {
                            await db.collection('notifications').doc(doc.id).update({
                                readBy: firebase.firestore.FieldValue.arrayUnion(userId)
                            });
                            listItem.style.fontWeight = 'normal'; // Update UI instantly
                            logAction('Notification marked as read', { notificationId: doc.id, userId: userId });
                        }
                    };
                    notificationsList.appendChild(listItem);
                });
            }
            logAction('Member notifications viewed', { userId: userId });
        } catch (error) {
            console.error("Error fetching member notifications:", error);
            statusMessage.textContent = `Error loading notifications: ${error.message}`;
            statusMessage.style.color = 'red';
            logAction('Failed to load member notifications', { userId: userId, error: error.message });
        }
    }

    // --- My Workout Plan ---
    async function renderMemberWorkout(userId) {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>My Workout Plan</h3>
                <p id="workout-status">Loading your workout plan...</p>
                <div id="workout-plan-details">
                    </div>
            </div>
        `;
        const workoutPlanDetails = document.getElementById('workout-plan-details');
        const workoutStatus = document.getElementById('workout-status');

        try {
            // Assuming member's assigned workout plan is stored in their user document
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists && userDoc.data().assignedWorkoutPlanId) {
                const planId = userDoc.data().assignedWorkoutPlanId;
                const workoutPlanDoc = await db.collection('workoutPlans').doc(planId).get();

                if (workoutPlanDoc.exists) {
                    const plan = workoutPlanDoc.data();
                    workoutPlanDetails.innerHTML = `
                        <h4>${plan.name}</h4>
                        <p><strong>Description:</strong> ${plan.description || 'N/A'}</p>
                        <h5>Exercises:</h5>
                        <pre>${plan.exercises || 'No exercises listed.'}</pre>
                    `;
                    workoutStatus.textContent = '';
                    logAction('Member workout plan viewed', { userId: userId, planId: planId });
                } else {
                    workoutStatus.textContent = 'No workout plan assigned or found.';
                    logAction('Member workout plan not found', { userId: userId, planId: planId });
                }
            } else {
                workoutStatus.textContent = 'No workout plan assigned yet. Please contact your trainer or admin.';
                logAction('No workout plan assigned to member', { userId: userId });
            }
        } catch (error) {
            console.error("Error fetching workout plan:", error);
            workoutStatus.textContent = `Error loading workout plan: ${error.message}`;
            workoutStatus.style.color = 'red';
            logAction('Failed to load member workout plan', { userId: userId, error: error.message });
        }
    }

    // --- My Diet Plan ---
    async function renderMemberDiet(userId) {
        contentArea.innerHTML = `
            <div class="content-section">
                <h3>My Diet Plan</h3>
                <p id="diet-status">Loading your diet plan...</p>
                <div id="diet-plan-details">
                    </div>
            </div>
        `;
        const dietPlanDetails = document.getElementById('diet-plan-details');
        const dietStatus = document.getElementById('diet-status');

        try {
            // Assuming member's assigned diet plan is stored in their user document
            const userDoc = await db.collection('users').doc(userId).get();
            if (userDoc.exists && userDoc.data().assignedDietPlanId) {
                const planId = userDoc.data().assignedDietPlanId;
                const dietPlanDoc = await db.collection('dietPlans').doc(planId).get();

                if (dietPlanDoc.exists) {
                    const plan = dietPlanDoc.data();
                    dietPlanDetails.innerHTML = `
                        <h4>${plan.name}</h4>
                        <pre>${plan.details || 'No diet details listed.'}</pre>
                    `;
                    dietStatus.textContent = '';
                    logAction('Member diet plan viewed', { userId: userId, planId: planId });
                } else {
                    dietStatus.textContent = 'No diet plan assigned or found.';
                    logAction('Member diet plan not found', { userId: userId, planId: planId });
                }
            } else {
                dietStatus.textContent = 'No diet plan assigned yet. Please contact your trainer or admin.';
                logAction('No diet plan assigned to member', { userId: userId });
            }
        } catch (error) {
            console.error("Error fetching diet plan:", error);
            dietStatus.textContent = `Error loading diet plan: ${error.message}`;
            dietStatus.style.color = 'red';
            logAction('Failed to load member diet plan', { userId: userId, error: error.message });
        }
    }
});
