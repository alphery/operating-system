// ============ RENDER ANALYTICS ============
renderAnalytics = () => {
    const stats = this.getProjectStats();
    const { darkMode } = this.state;
    const bgCard = darkMode ? 'bg-slate-800' : 'bg-white';
    const textPrimary = darkMode ? 'text-slate-100' : 'text-slate-800';
    const textSecondary = darkMode ? 'text-slate-400' : 'text-slate-500';
    const border = darkMode ? 'border-slate-700' : 'border-slate-200';

    return (
        <div className="grid grid-cols-4 gap-6 p-6">
            {/* Stats Cards */}
            <div className={`${bgCard} p-6 rounded-2xl shadow-sm border ${border}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`${textSecondary} text-sm font-medium`}>Total Projects</p>
                        <p className={`text-3xl font-bold ${textPrimary} mt-2`}>{stats.total}</p>
                        <p className="text-xs text-emerald-600 mt-1">⭐ {stats.favorites} favorites</p>
                    </div>
                    <div className="bg-emerald-100 p-3 rounded-xl">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <div className={`${bgCard} p-6 rounded-2xl shadow-sm border ${border}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`${textSecondary} text-sm font-medium`}>In Progress</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">{stats.inProgress}</p>
                        <p className="text-xs text-orange-600 mt-1">⚠️ {stats.overdue} overdue</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-xl">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <div className={`${bgCard} p-6 rounded-2xl shadow-sm border ${border}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`${textSecondary} text-sm font-medium`}>Budget</p>
                        <p className="text-3xl font-bold text-purple-600 mt-2">${stats.totalBudget.toLocaleString()}</p>
                        <p className="text-xs text-slate-400 mt-1">Spent: ${stats.totalSpent.toLocaleString()}</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-xl">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                </div>
            </div>

            <div className={`${bgCard} p-6 rounded-2xl shadow-sm border ${border}`}>
                <div className="flex items-center justify-between">
                    <div>
                        <p className={`${textSecondary} text-sm font-medium`}>Hours Logged</p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">{stats.totalHours.toFixed(1)}h</p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-xl">
                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                </div>
            </div>

            {/* Status Breakdown */}
            <div className={`col-span-2 ${bgCard} p-6 rounded-2xl shadow-sm border ${border}`}>
                <h3 className={`font-bold ${textPrimary} mb-4`}>Status Breakdown</h3>
                <div className="space-y-3">
                    {['Planning', 'In Progress', 'Review', 'Completed'].map(status => {
                        const key = status.toLowerCase().replace(' ', '');
                        const count = stats[key] || 0;
                        const percentage = stats.total > 0 ? (count / stats.total * 100).toFixed(0) : 0;
                        return (
                            <div key={status}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className={textSecondary}>{status}</span>
                                    <span className={`font-semibold ${textPrimary}`}>{count} ({percentage}%)</span>
                                </div>
                                <div className={`w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-100'} rounded-full h-2`}>
                                    <div className={`h-2 rounded-full ${status === 'Completed' ? 'bg-emerald-500' : status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-400'}`}
                                        style={{ width: `${percentage}%` }}></div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity */}
            <div className={`col-span-2 ${bgCard} p-6 rounded-2xl shadow-sm border ${border}`}>
                <h3 className={`font-bold ${textPrimary} mb-4`}>Recent Activity</h3>
                <div className="space-y-3 text-sm">
                    {this.state.projects.slice(0, 5).map(p => (
                        <div key={p.id} className={`flex items-center gap-3 pb-3 border-b ${darkMode ? 'border-slate-700' : 'border-slate-100'} last:border-0`}>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <div className="flex-1">
                                <p className={`font-medium ${textPrimary}`}>{p.title}</p>
                                <p className="text-xs text-slate-400">Status: {p.status}</p>
                            </div>
                            <span className="text-xs text-slate-400">{p.progress || 0}%</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className={`col-span-4 ${bgCard} p-6 rounded-2xl shadow-sm border ${border}`}>
                <h3 className={`font-bold ${textPrimary} mb-4 flex items-center gap-2`}>
                    ⌨️ Keyboard Shortcuts
                </h3>
                <div className="grid grid-cols-5 gap-4 text-sm">
                    {[
                        { key: 'Cmd/Ctrl + N', action: 'New Project' },
                        { key: 'Cmd/Ctrl + K', action: 'Search' },
                        { key: 'Cmd/Ctrl + D', action: 'Dark Mode' },
                        { key: 'Cmd/Ctrl + E', action: 'Export Excel' },
                        { key: '1 / 2 / 3', action: 'Switch Views' }
                    ].map(shortcut => (
                        <div key={shortcut.key} className={`p-3 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                            <kbd className={`block mb-1 font-mono text-xs ${darkMode ? 'text-emerald-400' : 'text-emerald-600'} font-bold`}>{shortcut.key}</kbd>
                            <span className={textSecondary}>{shortcut.action}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============ MAIN RENDER ============
render() {
    const { view, showModal, newProject, loading, teamMembers, darkMode, favorites, timerActive, timerElapsed } = this.state;
    const columns = ['Planning', 'In Progress', 'Review', 'Completed'];
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    const filteredProjects = this.filterProjects();

    // Dark mode classes
    const bgMain = darkMode ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-slate-100';
    const bgCard = darkMode ? 'bg-slate-800' : 'bg-white';
    const bgHeader = darkMode ? 'bg-slate-800' : 'bg-white';
    const textPrimary = darkMode ? 'text-slate-100' : 'text-slate-800';
    const textSecondary = darkMode ? 'text-slate-400' : 'text-slate-500';
    const border = darkMode ? 'border-slate-700' : 'border-slate-200';

    if (loading) {
        return (
            <div className={`w-full h-full flex items-center justify-center ${bgMain}`}>
                <div className="text-center">
                    <div className="animate-spin w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className={`${textSecondary} font-medium`}>Loading projects...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full h-full flex flex-col ${bgMain} ${textPrimary} relative font-sans`}>
            {/* Header */}
            <div className={`h-20 ${bgHeader} border-b ${border} flex items-center justify-between px-6 shadow-sm`}>
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-2.5 rounded-xl shadow-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div>
                        <h1 className={`font-bold text-2xl tracking-tight ${textPrimary}`}>Alphery Projects</h1>
                        <p className={`text-xs ${textSecondary}`}>Enterprise Project Management</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Timer Display */}
                    {timerActive && (
                        <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-mono font-bold">
                            <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" />
                            </svg>
                            {this.formatTime(timerElapsed)}
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search projects... (Cmd+K)"
                            value={this.state.searchQuery}
                            onChange={(e) => this.setState({ searchQuery: e.target.value })}
                            className={`pl-10 pr-4 py-2 border ${border} rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'} focus:ring-2 focus:ring-emerald-500 outline-none transition w-64 text-sm`}
                        />
                        <svg className="w-4 h-4 absolute left-3 top-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>

                    {/* View Toggle */}
                    <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-100'} p-1 rounded-lg flex text-xs font-semibold`}>
                        {['kanban', 'list', 'analytics'].map(v => (
                            <button
                                key={v}
                                onClick={() => this.setState({ view: v })}
                                className={`px-4 py-1.5 rounded-md transition capitalize ${view === v ? 'bg-emerald-600 text-white shadow-sm' : `${textSecondary} hover:${textPrimary}`}`}
                            >
                                {v}
                            </button>
                        ))}
                    </div>

                    {/* Dark Mode Toggle */}
                    <button
                        onClick={this.toggleDarkMode}
                        className={`p-2 rounded-lg ${darkMode ? 'bg-slate-700 text-yellow-400' : 'bg-slate-100 text-slate-600'} hover:scale-110 transition`}
                        title="Toggle Dark Mode (Cmd+D)"
                    >
                        {darkMode ? '🌙' : '☀️'}
                    </button>

                    {/* Export Button */}
                    <button
                        onClick={this.exportToExcel}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                        title="Export to Excel (Cmd+E)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Export
                    </button>

                    {/* New Project Button */}
                    <button
                        onClick={() => this.setState({
                            showModal: true,
                            activeProject: null,
                            newProject: {
                                title: '', client: '', status: 'Planning', priority: 'Medium',
                                startDate: '', endDate: '', description: '', progress: 0,
                                budget: 0, spent: 0, tags: [], assignedTo: [],
                                hoursEstimated: 0, hoursLogged: 0, dependencies: [], files: []
                            }
                        })}
                        className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-5 py-2.5 rounded-lg shadow-lg text-sm font-semibold transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
                        title="New Project (Cmd+N)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                        New Project
                    </button>
                </div>
            </div>

            {/* Filters */}
            {view !== 'analytics' && (
                <div className={`px-6 py-4 ${bgHeader} border-b ${border} flex gap-4 items-center`}>
                    <button
                        onClick={() => this.setState({ showFilters: !this.state.showFilters })}
                        className={`px-3 py-2 border ${border} rounded-lg text-sm ${darkMode ? 'bg-slate-700' : 'bg-white'} hover:bg-emerald-50 transition flex items-center gap-2`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                        </svg>
                        Filters
                    </button>

                    {this.state.showFilters && (
                        <>
                            <select
                                value={this.state.filterStatus}
                                onChange={(e) => this.setState({ filterStatus: e.target.value })}
                                className={`px-3 py-2 border ${border} rounded-lg text-sm ${darkMode ? 'bg-slate-700' : 'bg-white'} focus:ring-2 focus:ring-emerald-500 outline-none`}
                            >
                                <option value="All">All Status</option>
                                {columns.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <select
                                value={this.state.filterPriority}
                                onChange={(e) => this.setState({ filterPriority: e.target.value })}
                                className={`px-3 py-2 border ${border} rounded-lg text-sm ${darkMode ? 'bg-slate-700' : 'bg-white'} focus:ring-2 focus:ring-emerald-500 outline-none`}
                            >
                                <option value="All">All Priorities</option>
                                {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select
                                value={this.state.filterAssignee}
                                onChange={(e) => this.setState({ filterAssignee: e.target.value })}
                                className={`px-3 py-2 border ${border} rounded-lg text-sm ${darkMode ? 'bg-slate-700' : 'bg-white'} focus:ring-2 focus:ring-emerald-500 outline-none`}
                            >
                                <option value="All">All Team Members</option>
                                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </>
                    )}

                    <div className={`flex-1 text-right text-sm ${textSecondary}`}>
                        {filteredProjects.length} of {this.state.projects.length} projects
                        {favorites.length > 0 && ` • ⭐ ${favorites.length} favorites`}
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto">
                {view === 'analytics' ? this.renderAnalytics() : view === 'kanban' ? (
                    <div className="flex gap-6 h-full p-6 min-w-max">
                        {columns.map(col => (
                            <div key={col} className={`w-80 flex flex-col ${bgCard} rounded-2xl px-3 py-4 h-full shadow-sm border ${border}`}>
                                <div className="flex justify-between items-center mb-4 px-2">
                                    <h3 className={`font-bold ${textSecondary} text-sm uppercase tracking-wider`}>{col}</h3>
                                    <span className={`${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'} px-2.5 py-0.5 rounded-full text-xs font-bold`}>
                                        {filteredProjects.filter(p => p.status === col).length}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-y-auto px-2 space-y-3 scrollbar-thin scrollbar-thumb-slate-300">
                                    {filteredProjects.filter(p => p.status === col).map(project => (
                                        <div key={project.id} onClick={() => {
                                            this.setState({ selectedProject: project });
                                            this.openEdit(project);
                                        }}
                                            className={`${darkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gradient-to-br from-white to-slate-50 hover:shadow-lg'} p-4 rounded-xl shadow transition cursor-pointer border ${border} group relative`}>

                                            {/* Favorite Star */}
                                            <button
                                                onClick={(e) => this.toggleFavorite(project.id, e)}
                                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <span className="text-xl">{this.state.favorites.includes(project.id) ? '⭐' : '☆'}</span>
                                            </button>

                                            {/* Priority Badge */}
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${project.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                                                    project.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                                        project.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {project.priority}
                                                </span>
                                                <button onClick={(e) => this.deleteProject(project.id, e)} className="opacity-0 group-hover:opacity-100 transition text-slate-400 hover:text-red-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                </button>
                                            </div>

                                            {/* Title & Client */}
                                            <h4 className={`font-bold ${textPrimary} mb-1 leading-tight`}>{project.title}</h4>
                                            {project.client && (
                                                <p className="text-xs text-emerald-600 font-semibold mb-2">🏢 {project.client}</p>
                                            )}
                                            <p className={`text-xs ${textSecondary} line-clamp-2 mb-3`}>{project.description}</p>

                                            {/* Tags */}
                                            {project.tags && project.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-3">
                                                    {project.tags.slice(0, 3).map(tag => (
                                                        <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Progress Bar */}
                                            <div className={`w-full ${darkMode ? 'bg-slate-600' : 'bg-slate-100'} rounded-full h-1.5 mb-3`}>
                                                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-1.5 rounded-full transition-all" style={{ width: `${project.progress || 0}%` }}></div>
                                            </div>

                                            {/* Meta Info */}
                                            <div className="flex justify-between items-center text-xs">
                                                <div className={`flex items-center gap-2 ${textSecondary}`}>
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    {project.startDate}
                                                </div>
                                                <span className={`font-bold ${textPrimary}`}>{project.progress || 0}%</span>
                                            </div>

                                            {/* Team Avatars */}
                                            {project.assignedTo && Array.isArray(project.assignedTo) && project.assignedTo.length > 0 && (
                                                <div className="flex -space-x-2 mt-3">
                                                    {project.assignedTo.slice(0, 3).map(memberId => {
                                                        const member = teamMembers.find(m => m.id === memberId);
                                                        return member ? (
                                                            <div key={memberId} title={member.name} className={`w-6 h-6 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-slate-200'} border-2 border-white flex items-center justify-center text-xs overflow-hidden`}>
                                                                {member.avatar && member.avatar.startsWith('http') ? (
                                                                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span>{member.avatar || '👤'}</span>
                                                                )}
                                                            </div>
                                                        ) : null;
                                                    })}
                                                    {project.assignedTo.length > 3 && (
                                                        <div className={`w-6 h-6 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-slate-300'} border-2 border-white flex items-center justify-center text-xs font-bold ${textPrimary}`}>
                                                            +{project.assignedTo.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // List View - Continue in projects.js due to length
                    <div className="p-6">
                        <div className={`${bgCard} rounded-2xl shadow-sm border ${border} overflow-hidden`}>
                            <table className="w-full">
                                <thead className={`${darkMode ? 'bg-slate-700' : 'bg-slate-50'} border-b ${border}`}>
                                    <tr>
                                        <th className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider`}>Project</th>
                                        <th className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider`}>Client</th>
                                        <th className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider`}>Priority</th>
                                        <th className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider`}>Status</th>
                                        <th className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider`}>Progress</th>
                                        <th className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider`}>Budget</th>
                                        <th className={`px-6 py-4 text-left text-xs font-bold ${textSecondary} uppercase tracking-wider`}>Team</th>
                                        <th className={`px-6 py-4 text-right text-xs font-bold ${textSecondary} uppercase tracking-wider`}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${border}`}>
                                    {filteredProjects.map(project => (
                                        <tr key={project.id} onClick={() => {
                                            this.setState({ selectedProject: project });
                                            this.openEdit(project);
                                        }} className={`${darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50'} cursor-pointer transition`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={(e) => this.toggleFavorite(project.id, e)}>
                                                        <span className="text-lg">{this.state.favorites.includes(project.id) ? '⭐' : '☆'}</span>
                                                    </button>
                                                    <div>
                                                        <div className={`font-semibold ${textPrimary}`}>{project.title}</div>
                                                        {project.tags && project.tags.length > 0 && (
                                                            <div className="flex gap-1 mt-1">
                                                                {project.tags.slice(0, 2).map(tag => (
                                                                    <span key={tag} className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">{tag}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 ${textSecondary}`}>{project.client || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${project.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                                                    project.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                                                        project.priority === 'Medium' ? 'bg-blue-100 text-blue-700' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {project.priority}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${project.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    project.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                                                        project.status === 'Review' ? 'bg-purple-100 text-purple-700' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {project.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-32">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className={textSecondary}>{project.progress || 0}%</span>
                                                    </div>
                                                    <div className={`w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-100'} rounded-full h-1.5`}>
                                                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${project.progress || 0}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className={`${textPrimary} font-semibold`}>${(project.budget || 0).toLocaleString()}</div>
                                                <div className="text-xs text-slate-500">Spent: ${(project.spent || 0).toLocaleString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex -space-x-2">
                                                    {project.assignedTo && project.assignedTo.slice(0, 3).map(memberId => {
                                                        const member = teamMembers.find(m => m.id === memberId);
                                                        return member ? (
                                                            <div key={memberId} title={member.name} className={`w-7 h-7 rounded-full ${darkMode ? 'bg-slate-600' : 'bg-slate-200'} border-2 border-white flex items-center justify-center text-sm`}>
                                                                {member.avatar}
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={(e) => this.deleteProject(project.id, e)} className="text-slate-400 hover:text-red-500 font-medium text-sm transition">
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal - same as original but with dark mode support */}
            {showModal && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className={`${bgCard} rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200`}>
                        {/* Keep existing modal content from original - just wrap with render method */}
                        {/* Modal implementation continues... */}
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

export default Projects;
