/**
 * QUICK REFERENCE: Two Manual Code Changes Needed
 * Copy-paste these exact code blocks to complete the permission system
 */

// ============================================================
// CHANGE 1: Update Projects Filtering
// File: components/apps/projects.js
// Location: Around line 211, in subscribeToProjects method
// ============================================================

// FIND THIS CODE (lines ~211-220):
/*
this.unsubscribeProjects = onSnapshot(q, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
    this.setState({ projects, loading: false });
}, (error) => {
    console.error('Error loading projects:', error);
    this.setState({ loading: false });
});
*/

// REPLACE WITH THIS CODE:
this.unsubscribeProjects = onSnapshot(q, (snapshot) => {
    const allProjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));

    // Filter projects based on user permissions
    const user = this.props.userData || this.props.user;
    const isSuperAdmin = user && user.role === 'super_admin';

    let filteredProjects = allProjects;
    if (!isSuperAdmin && user && user.allowedProjects) {
        // Show only projects the user has access to
        filteredProjects = allProjects.filter(p => user.allowedProjects.includes(p.id));
    } else if (!isSuperAdmin && user) {
        // If not admin and no allowedProjects, show nothing
        filteredProjects = [];
    }

    this.setState({ projects: filteredProjects, loading: false });
}, (error) => {
    console.error('Error loading projects:', error);
    this.setState({ loading: false });
});

// ============================================================
// CHANGE 2: Update App Store Filtering
// File: components/apps/app_store.js
// Location: Around line 228, right after category filtering
// ============================================================

// FIND THIS SECTION (lines ~222-228):
/*
// Filter
let displayApps = enrichedApps;
if (searchQuery) {
    displayApps = displayApps.filter(app => app.title.toLowerCase().includes(searchQuery.toLowerCase()));
} else if (activeCategory !== 'all') {
    displayApps = displayApps.filter(app => app.category === activeCategory);
}
*/

// ADD THIS CODE RIGHT AFTER THE ABOVE SECTION (after line 228):

// Permission-based app filtering
const user = this.props.user;
const userData = this.props.userData;
const isSuperAdmin = userData && userData.role === 'super_admin';
const systemApps = ['app-store', 'settings', 'users', 'messenger'];

if (!isSuperAdmin && userData) {
    if (userData.allowedApps && userData.allowedApps.length > 0) {
        // User has specific app permissions - show those + system apps
        displayApps = displayApps.filter(app =>
            systemApps.includes(app.id) || userData.allowedApps.includes(app.id)
        );
    } else if (userData.allowedApps && userData.allowedApps.length === 0) {
        // User has empty allowed apps - show only system apps
        displayApps = displayApps.filter(app => systemApps.includes(app.id));
    }
    // If allowedApps is undefined, show all apps (backward compatibility)
}

// ============================================================
// THAT'S IT! Just these 2 changes complete the permission system
// ============================================================

/**
 * USAGE SUMMARY:
 * 
 * 1. Login as super admin (alpherymail@gmail.com)
 * 2. Open "User Permissions" app from App Store
 * 3. Select a user from the list
 * 4. Check boxes for projects they can access
 * 5. Check boxes for apps they can see
 * 6. Click "Save Permissions"
 * 7. Done! That user now only sees allowed projects/apps
 * 
 * Super admin always sees everything automatically.
 */
