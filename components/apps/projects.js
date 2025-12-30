import React, { Component } from 'react';
import { db } from '../../config/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export class Projects extends Component {
    constructor() {
        super();
        this.state = {
            projects: [],
            view: 'kanban', // kanban, list
            showModal: false,
            activeProject: null,
            newProject: { title: '', client: '', status: 'Planning', startDate: '', endDate: '', description: '', progress: 0 },
            loading: true
        }
        this.unsubscribe = null;
    }

    componentDidMount() {
        this.subscribeToProjects();
    }

    componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    subscribeToProjects = () => {
        // Real-time listener to projects collection (SHARED across all users)
        const projectsRef = collection(db, 'projects');

        this.unsubscribe = onSnapshot(projectsRef, (snapshot) => {
            const projects = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            this.setState({ projects, loading: false });
        }, (error) => {
            console.error('Error loading projects:', error);
            this.setState({ loading: false });
        });
    }

    handleInputChange = (e) => {
        const value = e.target.type === 'range' ? parseInt(e.target.value) : e.target.value;
        this.setState({
            newProject: { ...this.state.newProject, [e.target.name]: value }
        });
    }

    saveProject = async () => {
        const p = this.state.newProject;
        if (!p.title) return;

        try {
            if (this.state.activeProject) {
                // Update existing project
                const projectRef = doc(db, 'projects', this.state.activeProject.id);
                await updateDoc(projectRef, {
                    ...p,
                    updatedAt: serverTimestamp()
                });
            } else {
                // Create new project
                await addDoc(collection(db, 'projects'), {
                    ...p,
                    progress: 0,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }

            this.setState({
                showModal: false,
                activeProject: null,
                newProject: { title: '', client: '', status: 'Planning', startDate: '', endDate: '', description: '', progress: 0 }
            });
        } catch (error) {
            console.error('Error saving project:', error);
            alert('Failed to save project. Please try again.');
        }
    }

    openEdit = (project) => {
        this.setState({
            activeProject: project,
            newProject: { ...project },
            showModal: true
        });
    }

    deleteProject = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this project?")) return;

        try {
            await deleteDoc(doc(db, 'projects', id));
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Failed to delete project.');
        }
    }

    updateStatus = async (project, status) => {
        try {
            const projectRef = doc(db, 'projects', project.id);
            await updateDoc(projectRef, {
                status,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }

    render() {
        const { projects, view, showModal, newProject, loading } = this.state;
        const columns = ['Planning', 'In Progress', 'Review', 'Completed'];

        if (loading) {
            return (
                <div className="w-full h-full flex items-center justify-center bg-slate-50">
                    <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading projects...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="w-full h-full flex flex-col bg-slate-50 text-slate-800 relative font-sans">
                {/* Header */}
                <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="bg-emerald-600 text-white p-1.5 rounded-lg shadow-sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <h1 className="font-bold text-xl tracking-tight text-slate-800">Alphery Projects</h1>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-semibold">Shared Workspace</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-1 rounded-lg flex text-sm font-medium text-slate-600">
                            <button onClick={() => this.setState({ view: 'kanban' })} className={`px-3 py-1 rounded-md transition ${view === 'kanban' ? 'bg-white shadow text-emerald-600' : 'hover:bg-slate-200'}`}>Board</button>
                            <button onClick={() => this.setState({ view: 'list' })} className={`px-3 py-1 rounded-md transition ${view === 'list' ? 'bg-white shadow text-emerald-600' : 'hover:bg-slate-200'}`}>List</button>
                        </div>
                        <button onClick={() => this.setState({ showModal: true, activeProject: null, newProject: { title: '', client: '', status: 'Planning', startDate: '', endDate: '', description: '', progress: 0 } })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition flex items-center gap-2">
                            <span>+ New Project</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
                    {view === 'kanban' ? (
                        <div className="flex gap-6 h-full min-w-max">
                            {columns.map(col => (
                                <div key={col} className="w-80 flex flex-col bg-slate-100 rounded-xl px-2 py-4 h-full">
                                    <h3 className="font-bold text-slate-500 text-sm uppercase tracking-wider mb-4 px-2 flex justify-between">
                                        {col}
                                        <span className="bg-slate-200 text-slate-600 px-2 rounded-full text-xs flex items-center">{projects.filter(p => p.status === col).length}</span>
                                    </h3>
                                    <div className="flex-1 overflow-y-auto px-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-300">
                                        {projects.filter(p => p.status === col).map(project => (
                                            <div key={project.id} onClick={() => this.openEdit(project)}
                                                className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition cursor-pointer group">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{project.client}</span>
                                                    <div className="opacity-0 group-hover:opacity-100 transition">
                                                        <button onClick={(e) => this.deleteProject(project.id, e)} className="text-slate-400 hover:text-red-500">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                                <h4 className="font-bold text-slate-800 mb-1 leading-tight">{project.title}</h4>
                                                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{project.description}</p>

                                                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                                                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                                                </div>

                                                <div className="flex justify-between items-center text-xs text-slate-400">
                                                    <span>{project.startDate}</span>
                                                    {(project.status !== 'Completed' && col !== 'Completed') && (
                                                        <button onClick={(e) => { e.stopPropagation(); this.updateStatus(project, columns[columns.indexOf(col) + 1]); }}
                                                            className="hover:bg-slate-100 p-1 rounded text-slate-500">
                                                            Move →
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Project</th>
                                        <th className="px-6 py-4">Client</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Dates</th>
                                        <th className="px-6 py-4">Progress</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {projects.map(project => (
                                        <tr key={project.id} onClick={() => this.openEdit(project)} className="hover:bg-slate-50 cursor-pointer">
                                            <td className="px-6 py-4 font-medium text-slate-900">{project.title}</td>
                                            <td className="px-6 py-4 text-slate-600">{project.client}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                    ${project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                        project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">{project.startDate} - {project.endDate}</td>
                                            <td className="px-6 py-4 w-32">
                                                <div className="w-full bg-slate-100 rounded-full h-1.5">
                                                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={(e) => this.deleteProject(project.id, e)} className="text-slate-400 hover:text-red-500">Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-2xl w-[500px] flex flex-col max-h-[90%] animate-in fade-in zoom-in duration-200">
                            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-slate-800">{this.state.activeProject ? 'Edit Project' : 'New Project'}</h3>
                                <button onClick={() => this.setState({ showModal: false })} className="text-slate-400 hover:text-slate-600">✕</button>
                            </div>

                            <div className="p-6 space-y-4 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Project Title</label>
                                        <input name="title" value={newProject.title} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Client</label>
                                        <input name="client" value={newProject.client} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Date</label>
                                        <input type="date" name="startDate" value={newProject.startDate} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Date</label>
                                        <input type="date" name="endDate" value={newProject.endDate} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                                    <select name="status" value={newProject.status} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition bg-white">
                                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description</label>
                                    <textarea name="description" rows="3" value={newProject.description} onChange={this.handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none"></textarea>
                                </div>

                                {this.state.activeProject && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Progress ({newProject.progress || 0}%)</label>
                                        <input type="range" name="progress" min="0" max="100" value={newProject.progress || 0} onChange={this.handleInputChange} className="w-full accent-emerald-600" />
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                                <button onClick={() => this.setState({ showModal: false })} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition">Cancel</button>
                                <button onClick={this.saveProject} className="px-6 py-2 bg-emerald-600 text-white rounded-lg shadow-md hover:bg-emerald-700 font-medium transition transform active:scale-95">Save Project</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export const displayProject = () => {
    return <Projects />;
}
