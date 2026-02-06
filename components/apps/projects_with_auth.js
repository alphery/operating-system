/**
 * This file provides a wrapper component for Projects app to inject user permissions
 * It allows filtering of projects based on user's allowedProjects array
 */
import React from 'react';
import { Projects } from './projects';
import { useAuth } from '../../context/AuthContext-new';

function ProjectsWithPermissions(props) {
    const { user, platformUser } = useAuth();

    return <Projects {...props} user={user} userData={platformUser} />;
}

export const displayProject = () => {
    return <ProjectsWithPermissions />;
};

export default ProjectsWithPermissions;
