// Simulating a centralized ERP Database using LocalStorage
// In a real app, this would be API calls to a backend.

export default class ERPDatabase {
    static getCollection(collectionName) {
        const data = localStorage.getItem(`erp_db_${collectionName}`);
        return data ? JSON.parse(data) : null;
    }

    static saveCollection(collectionName, data) {
        localStorage.setItem(`erp_db_${collectionName}`, JSON.stringify(data));
    }

    // --- CRM ---
    static getLeads() {
        let leads = this.getCollection('leads');
        if (!leads) {
            // Default Initial Data
            leads = [
                { id: 1, name: 'John Doe', company: 'Acme Corp', status: 'New', value: 5000, email: 'john@acme.com', phone: '555-0101' },
                { id: 2, name: 'Sarah Smith', company: 'TechGlobal', status: 'Negotiation', value: 12000, email: 'sarah@techglobal.io', phone: '555-0102' },
                { id: 3, name: 'Michael Brown', company: 'LogiTrans', status: 'Closed Won', value: 8500, email: 'm.brown@logitrans.com', phone: '555-0103' },
            ];
            this.saveCollection('leads', leads);
        }
        return leads;
    }

    static addLead(lead) {
        const leads = this.getLeads();
        lead.id = Date.now(); // Simple ID generation
        leads.push(lead);
        this.saveCollection('leads', leads);
        return leads;
    }

    static updateLead(updatedLead) {
        let leads = this.getLeads();
        leads = leads.map(l => l.id === updatedLead.id ? updatedLead : l);
        this.saveCollection('leads', leads);
        return leads;
    }

    static deleteLead(id) {
        let leads = this.getLeads();
        leads = leads.filter(l => l.id !== id);
        this.saveCollection('leads', leads);
        return leads;
    }

    // --- HRM ---
    static getEmployees() {
        let employees = this.getCollection('employees');
        if (!employees) {
            employees = [
                { id: 1, name: "Anurag Pathak", role: "Software Engineer", dept: "Engineering", img: "https://github.com/ANURAG-PATHAK.png" },
                { id: 2, name: "Sarah Jenkins", role: "Product Manager", dept: "Product", img: "" },
            ];
            this.saveCollection('employees', employees);
        }
        return employees;
    }

    static addEmployee(emp) {
        const emps = this.getEmployees();
        emp.id = Date.now();
        // Default to a generic avatar if none provided
        if (!emp.img) emp.img = "";
        emps.push(emp);
        this.saveCollection('employees', emps);
        return emps;
    }

    static updateEmployee(updatedEmp) {
        let emps = this.getEmployees();
        emps = emps.map(e => e.id === updatedEmp.id ? updatedEmp : e);
        this.saveCollection('employees', emps);
        return emps;
    }

    static deleteEmployee(id) {
        let emps = this.getEmployees();
        emps = emps.filter(e => e.id !== id);
        this.saveCollection('employees', emps);
        return emps;
    }

    // --- Mail ---
    static getEmails(box = 'inbox') { // 'inbox', 'sent', 'trash'
        let allMail = this.getCollection('emails');
        if (!allMail) {
            allMail = [
                { id: 101, folder: 'inbox', from: 'HR Department', subject: 'Holiday Policy Update', body: 'Please review the attached changes...', date: new Date().toISOString() },
                { id: 102, folder: 'inbox', from: 'Client Support', subject: 'Re: Ticket #49281', body: 'We have resolved the issue regarding...', date: new Date().toISOString() },
            ];
            this.saveCollection('emails', allMail);
        }
        return allMail.filter(m => m.folder === box).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    static sendEmail(email) {
        const allMail = this.getCollection('emails') || []; // don't replicate init logic here, assume it exists or empty
        email.id = Date.now();
        email.folder = 'sent'; // sender saves to sent
        email.date = new Date().toISOString();
        allMail.push(email);
        this.saveCollection('emails', allMail);

        // Simulate Reply
        if (Math.random() > 0.5) {
            setTimeout(() => {
                const reply = {
                    id: Date.now() + 1,
                    folder: 'inbox',
                    from: email.to,
                    subject: 'Re: ' + email.subject,
                    body: "Thanks for your email. I will get back to you shortly.\n\nSimulated Auto-Reply",
                    date: new Date().toISOString()
                };
                const currentMail = this.getCollection('emails');
                currentMail.push(reply);
                this.saveCollection('emails', currentMail);
            }, 3000);
        }

        return allMail;
    }

    // --- Projects (Alphery Projects) ---
    static getProjects() {
        let projects = this.getCollection('projects');
        if (!projects) {
            projects = [
                { id: 1, title: 'Website Redesign', client: 'Acme Corp', status: 'In Progress', startDate: '2023-10-01', endDate: '2023-12-15', description: 'Overhauling the main corporate website with new branding.', progress: 65, logs: [] },
                { id: 2, title: 'Mobile App Dev', client: 'RetailPlus', status: 'Planning', startDate: '2024-01-10', endDate: '2024-06-01', description: 'Native iOS and Android shopping app.', progress: 10, logs: [] },
            ];
            this.saveCollection('projects', projects);
        }
        return projects;
    }

    static addProject(project) {
        let projects = this.getProjects();
        project.id = Date.now();
        project.logs = [{ date: new Date().toISOString(), action: 'Project Created', user: 'Admin' }]; // Audit log
        project.progress = 0;
        projects.push(project);
        this.saveCollection('projects', projects);
        return projects;
    }

    static updateProject(updatedProject) {
        let projects = this.getProjects();
        // Find old project to diff for logs
        const oldProject = projects.find(p => p.id === updatedProject.id);

        let logMsg = 'Project Updated';
        if (oldProject.status !== updatedProject.status) logMsg = `Status changed to ${updatedProject.status}`;
        else if (oldProject.progress !== updatedProject.progress) logMsg = `Progress updated to ${updatedProject.progress}%`;

        updatedProject.logs.unshift({ date: new Date().toISOString(), action: logMsg, user: 'Admin' });

        projects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
        this.saveCollection('projects', projects);
        return projects;
    }

    static deleteProject(id) {
        let projects = this.getProjects();
        projects = projects.filter(p => p.id !== id);
        this.saveCollection('projects', projects);
        return projects;
    }

    // --- System Users (Login Management) ---
    static getSystemUsers() {
        let users = this.getCollection('system_users');
        if (!users) {
            // Default Admin User on first load
            users = [
                {
                    id: 1,
                    username: "admin",
                    password: "123",
                    displayName: "Administrator",
                    image: "./themes/Yaru/system/user-home.png",
                    permissions: ["all_apps"]
                }
            ];
            this.saveCollection('system_users', users);
        }
        return users;
    }

    static addSystemUser(user) {
        let users = this.getSystemUsers();
        user.id = Date.now();
        // Ensure image is set if missing
        if (!user.image) user.image = "./themes/Yaru/system/user-home.png";
        users.push(user);
        this.saveCollection('system_users', users);
        return users;
    }

    static updateSystemUser(updatedUser) {
        let users = this.getSystemUsers();
        users = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        this.saveCollection('system_users', users);
        return users;
    }

    static deleteSystemUser(id) {
        let users = this.getSystemUsers();
        // Prevent deleting the last admin or "admin" username potentially?
        // For now, allow deletion but maybe warn in UI.
        users = users.filter(u => u.id !== id);
        this.saveCollection('system_users', users);
        return users;
    }

    // --- Chat / Messenger ---
    static getChatHistory(user1, user2) {
        const allMessages = this.getCollection('chat_messages') || [];
        // Filter messages where (from=u1 AND to=u2) OR (from=u2 AND to=u1)
        return allMessages.filter(m =>
            (m.from === user1 && m.to === user2) ||
            (m.from === user2 && m.to === user1)
        ).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    static saveMessage(from, to, text) {
        const allMessages = this.getCollection('chat_messages') || [];
        const newMessage = {
            id: Date.now(),
            from,
            to,
            text,
            date: new Date().toISOString(),
            read: false
        };
        allMessages.push(newMessage);
        this.saveCollection('chat_messages', allMessages);
        return newMessage;
    }
}
