const users_seeder = [
    {
        username: "admin",
        password: "123",
        displayName: "Administrator",
        image: "./themes/Yaru/system/user-home.png",
        permissions: ["all_apps"]
    }
];

// NOTE: This file is now just a reference/seeder. 
// User management has moved to ERPDatabase (localStorage).
export default users_seeder;
