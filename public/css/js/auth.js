// public/js/auth.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const adminRegisterForm = document.getElementById('admin-register-form');
    const loginError = document.getElementById('login-error');
    const adminRegisterMessage = document.getElementById('admin-register-message');

    // --- Login Logic ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = loginForm['login-email'].value;
            const password = loginForm['login-password'].value;
            loginError.textContent = ''; // Clear previous errors

            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                logAction('User attempting login', { email: email });

                // Fetch user role from Firestore
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const role = userData.role;

                    if (role === 'admin') {
                        window.location.href = 'admin.html';
                        logAction('Admin logged in', { uid: user.uid, email: user.email });
                    } else if (role === 'member') {
                        window.location.href = 'member.html';
                        logAction('Member logged in', { uid: user.uid, email: user.email });
                    } else {
                        loginError.textContent = 'Unknown user role. Please contact support.';
                        await auth.signOut(); // Log out unknown roles
                        logAction('Login failed: Unknown role', { email: email, uid: user.uid });
                    }
                } else {
                    loginError.textContent = 'User profile not found. Please contact support.';
                    await auth.signOut(); // Log out if no Firestore profile
                    logAction('Login failed: No Firestore profile', { email: email, uid: user.uid });
                }
            } catch (error) {
                console.error("Login error:", error);
                loginError.textContent = `Login failed: ${error.message}`;
                logAction('Login failed', { email: email, error: error.message });
            }
        });
    }

    // --- Admin Registration Logic (for initial setup) ---
    // In a real production app, this should be highly secured,
    // perhaps a one-time script or accessible only by a super-admin.
    if (adminRegisterForm) {
        adminRegisterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = adminRegisterForm['admin-email'].value;
            const password = adminRegisterForm['admin-password'].value;
            adminRegisterMessage.textContent = ''; // Clear previous messages

            try {
                // Create user in Firebase Authentication
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Store user role as 'admin' in Firestore
                await db.collection('users').doc(user.uid).set({
                    email: user.email,
                    role: 'admin',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                adminRegisterMessage.textContent = 'Admin registration successful! You can now log in.';
                adminRegisterMessage.style.color = 'green';
                adminRegisterForm.reset();
                logAction('Admin registered', { uid: user.uid, email: user.email });
            } catch (error) {
                console.error("Admin registration error:", error);
                adminRegisterMessage.textContent = `Registration failed: ${error.message}`;
                adminRegisterMessage.style.color = 'red';
                logAction('Admin registration failed', { email: email, error: error.message });
            }
        });
    }

    // --- Authentication State Observer ---
    // This runs whenever the user's login state changes
    auth.onAuthStateChanged(user => {
        const currentPage = window.location.pathname.split('/').pop();

        if (!user) {
            // User is not logged in
            if (currentPage !== 'index.html' && currentPage !== '') {
                // If not on the login page, redirect to login
                window.location.href = 'index.html';
                logAction('Redirected to login', { from: currentPage });
            }
        } else {
            // User is logged in
            // Redirect based on role if they are on the login page
            if (currentPage === 'index.html' || currentPage === '') {
                db.collection('users').doc(user.uid).get().then(doc => {
                    if (doc.exists) {
                        const role = doc.data().role;
                        if (role === 'admin') {
                            window.location.href = 'admin.html';
                        } else if (role === 'member') {
                            window.location.href = 'member.html';
                        } else {
                            console.warn('User has unknown role, logging out.', user.uid);
                            auth.signOut();
                        }
                    } else {
                        // If no Firestore profile for a logged-in user, sign out (shouldn't happen often)
                        console.warn('Logged in user has no Firestore profile, logging out.', user.uid);
                        auth.signOut();
                    }
                }).catch(error => {
                    console.error("Error checking user role on auth state change:", error);
                    auth.signOut(); // Log out on error
                });
            }
            // Other pages (admin.html, member.html) will handle their own specific role checks
        }
    });
});

// Global logout function
function logout() {
    auth.signOut().then(() => {
        logAction('User logged out');
        // Redirection handled by onAuthStateChanged listener
    }).catch(error => {
        console.error("Logout error:", error);
        logAction('Logout failed', { error: error.message });
    });
}
