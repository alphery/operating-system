
import React, { Component } from 'react';
import { db } from '../../config/firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';

export class Todo extends Component {
    constructor() {
        super();
        this.state = {
            tasks: [],
            inputValue: '',
            activeList: 'my-day',
            searchQuery: '',
            showSidebar: true,
            selectedTaskId: null, // For the right details panel

            // Task Detail Input States
            stepInput: '',
            noteInput: ''
        };
        this.unsubscribe = null;
    }

    componentDidMount() {
        if (db) {
            const q = query(collection(db, "todos"), orderBy("createdAt", "desc"));
            this.unsubscribe = onSnapshot(q, (snapshot) => {
                const tasks = snapshot.docs.map(doc => {
                    const data = doc.data();
                    let createdAt = data.createdAt;
                    if (createdAt && createdAt.toDate) createdAt = createdAt.toDate().toISOString();
                    else if (!createdAt) createdAt = new Date().toISOString();
                    return { id: doc.id, ...data, createdAt };
                });
                this.setState({ tasks });
            });
        } else {
            const savedTasks = localStorage.getItem('alphery-todos-v2');
            if (savedTasks) this.setState({ tasks: JSON.parse(savedTasks) });
        }
    }

    componentWillUnmount() {
        if (this.unsubscribe) this.unsubscribe();
    }

    componentDidUpdate(prevProps, prevState) {
        if (!db && prevState.tasks !== this.state.tasks) {
            localStorage.setItem('alphery-todos-v2', JSON.stringify(this.state.tasks));
        }
    }

    // --- Core Task Actions ---

    addTask = async (e) => {
        if (e.key === 'Enter' && this.state.inputValue.trim()) {
            const newTask = {
                text: this.state.inputValue.trim(),
                completed: false,
                important: this.state.activeList === 'important',
                myDay: this.state.activeList === 'my-day',
                createdAt: serverTimestamp(),
                steps: [], // Subtasks
                note: '',
                dueDate: null
            };

            if (db) {
                await addDoc(collection(db, "todos"), newTask);
            } else {
                this.setState(prev => ({
                    tasks: [{ ...newTask, id: Date.now(), createdAt: new Date().toISOString() }, ...prev.tasks]
                }));
            }
            this.setState({ inputValue: '' });
        }
    }

    toggleTaskCompletion = async (e, id) => {
        e.stopPropagation();
        if (db) {
            const task = this.state.tasks.find(t => t.id === id);
            if (task) await updateDoc(doc(db, "todos", id), { completed: !task.completed });
        } else {
            this.setState(prev => ({
                tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
            }));
        }
    }

    toggleImportant = async (e, id) => {
        e.stopPropagation();
        if (db) {
            const task = this.state.tasks.find(t => t.id === id);
            if (task) await updateDoc(doc(db, "todos", id), { important: !task.important });
        } else {
            this.setState(prev => ({
                tasks: prev.tasks.map(t => t.id === id ? { ...t, important: !t.important } : t)
            }));
        }
    }

    deleteTask = async () => {
        const id = this.state.selectedTaskId;
        if (!id) return;

        if (db) {
            await deleteDoc(doc(db, "todos", id));
        } else {
            this.setState(prev => ({ tasks: prev.tasks.filter(t => t.id !== id) }));
        }
        this.setState({ selectedTaskId: null });
    }

    // --- Detail Panel Actions ---

    selectTask = (id) => {
        this.setState({ selectedTaskId: id === this.state.selectedTaskId ? null : id });
    }

    updateTaskDetail = async (id, field, value) => {
        if (db) {
            await updateDoc(doc(db, "todos", id), { [field]: value });
        } else {
            this.setState(prev => ({
                tasks: prev.tasks.map(t => t.id === id ? { ...t, [field]: value } : t)
            }));
        }
    }

    addStep = async (id) => {
        if (!this.state.stepInput.trim()) return;
        const newStep = { id: Date.now(), text: this.state.stepInput, completed: false };
        const task = this.state.tasks.find(t => t.id === id);
        const updatedSteps = [...(task.steps || []), newStep];

        await this.updateTaskDetail(id, 'steps', updatedSteps);
        this.setState({ stepInput: '' });
    }

    toggleStep = async (taskId, stepId) => {
        const task = this.state.tasks.find(t => t.id === taskId);
        const updatedSteps = (task.steps || []).map(s => s.id === stepId ? { ...s, completed: !s.completed } : s);
        await this.updateTaskDetail(taskId, 'steps', updatedSteps);
    }

    // --- Helpers ---

    getFilteredTasks = () => {
        const { tasks, activeList, searchQuery } = this.state;
        let filtered = tasks;
        if (searchQuery) filtered = filtered.filter(t => t.text.toLowerCase().includes(searchQuery.toLowerCase()));

        switch (activeList) {
            case 'my-day': return filtered.filter(t => t.myDay && !t.completed);
            case 'important': return filtered.filter(t => t.important && !t.completed);
            case 'completed': return filtered.filter(t => t.completed);
            default: return filtered.filter(t => !t.completed);
        }
    }

    render() {
        const { activeList, inputValue, showSidebar, selectedTaskId } = this.state;
        const filteredTasks = this.getFilteredTasks();
        const selectedTask = this.state.tasks.find(t => t.id === selectedTaskId);

        const lists = [
            { id: 'my-day', label: 'My Day', icon: '☀️', color: 'text-yellow-500', bg: 'bg-slate-800' },
            { id: 'important', label: 'Important', icon: '⭐', color: 'text-pink-500', bg: 'bg-pink-700' },
            { id: 'tasks', label: 'Tasks', icon: '🏠', color: 'text-blue-500', bg: 'bg-blue-600' },
            { id: 'completed', label: 'Completed', icon: '✅', color: 'text-green-500', bg: 'bg-green-700' },
        ];
        const activeListData = lists.find(l => l.id === activeList);

        return (
            <div className="w-full h-full flex bg-white text-slate-800 font-sans overflow-hidden">
                {/* 1. Sidebar */}
                <div className={`${showSidebar ? 'w-60' : 'w-0'} bg-gray-50 border-r border-gray-200 flex flex-col transition-all duration-300 overflow-hidden shrink-0 z-20`}>
                    <div className="p-4 flex items-center gap-2 mt-8">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">✓</div>
                        <span className="font-bold text-lg text-slate-700">To-Do</span>
                    </div>
                    <nav className="mt-4 px-2 space-y-1">
                        {lists.map(list => (
                            <button
                                key={list.id}
                                onClick={() => this.setState({ activeList: list.id, showSidebar: window.innerWidth > 768 })}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeList === list.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600 hover:bg-gray-200/50'
                                    }`}
                            >
                                <span className={list.color}>{list.icon}</span>
                                {list.label}
                                <span className="ml-auto text-xs text-slate-400">
                                    {this.state.tasks.filter(t => {
                                        if (list.id === 'my-day') return t.myDay && !t.completed;
                                        if (list.id === 'important') return t.important && !t.completed;
                                        if (list.id === 'completed') return t.completed;
                                        return !t.completed;
                                    }).length || ''}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* 2. Main List Area */}
                <div className="flex-grow flex flex-col h-full relative z-10">
                    <div
                        className={`h-32 w-full shrink-0 relative transition-colors duration-500 flex items-end p-6 ${activeListData.bg}`}
                        style={{ backgroundSize: 'cover' }}
                    >
                        <button
                            onClick={() => this.setState({ showSidebar: !showSidebar })}
                            className="absolute top-4 left-4 p-2 text-white/80 hover:bg-white/10 rounded-md transition"
                        >
                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path></svg>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-white drop-shadow-md">{activeListData.label}</h1>
                            <p className="text-white/80 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-4 md:px-8 md:py-6 bg-white">
                        {/* Add Task Input */}
                        {activeList !== 'completed' && (
                            <div className="mb-4 bg-gray-50 rounded-lg border border-gray-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 flex items-center px-4 py-3 transition-all shadow-sm">
                                <span className="text-xl text-blue-500 font-light mr-3">+</span>
                                <input
                                    type="text"
                                    className="flex-grow bg-transparent outline-none text-slate-700 placeholder-slate-400"
                                    placeholder="Add a task"
                                    value={inputValue}
                                    onChange={(e) => this.setState({ inputValue: e.target.value })}
                                    onKeyDown={this.addTask}
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            {filteredTasks.length === 0 ? (
                                <div className="text-center py-20 opacity-50">
                                    <div className="text-6xl mb-4 grayscale opacity-20">{activeListData.icon}</div>
                                    <p className="text-slate-500">Tasks show up here</p>
                                </div>
                            ) : (
                                filteredTasks.map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => this.selectTask(task.id)}
                                        className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer border border-transparent hover:bg-gray-50 hover:border-gray-100 transition-all ${selectedTaskId === task.id ? 'bg-blue-50 border-blue-100' : ''}`}
                                    >
                                        <button
                                            onClick={(e) => this.toggleTaskCompletion(e, task.id)}
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${task.completed ? 'bg-blue-500 border-blue-500' : 'border-slate-400 hover:border-blue-500'
                                                }`}
                                        >
                                            {task.completed && <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
                                        </button>

                                        <div className="flex-grow min-w-0">
                                            <p className={`text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.text}</p>
                                            <div className="flex gap-2 text-xs text-slate-400 items-center">
                                                {task.myDay && <span className="text-xs flex items-center gap-1">☀️ My Day</span>}
                                                {task.steps && task.steps.length > 0 && <span>{task.steps.filter(s => s.completed).length}/{task.steps.length}</span>}
                                                {task.dueDate && <span className="text-red-400">📅 {task.dueDate}</span>}
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => this.toggleImportant(e, task.id)}
                                            className={`opacity-0 group-hover:opacity-100 p-1 ${task.important ? 'opacity-100 text-pink-500' : 'text-slate-300 hover:text-slate-500'}`}
                                        >
                                            {task.important ? '★' : '☆'}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Detail Panel (Right Sidebar) */}
                {selectedTask && (
                    <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-full overflow-y-auto shrink-0 shadow-xl z-30 animate-in slide-in-from-right duration-200">
                        <div className="p-6 flex flex-col gap-4">
                            {/* Title Edit */}
                            <div className="flex items-start gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                <button
                                    onClick={(e) => this.toggleTaskCompletion(e, selectedTask.id)}
                                    className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedTask.completed ? 'bg-blue-500 border-blue-500' : 'border-slate-400'}`}
                                >
                                    {selectedTask.completed && <svg className="w-3 h-3 text-white fill-current" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
                                </button>
                                <input
                                    className={`flex-grow bg-transparent outline-none text-slate-800 font-medium ${selectedTask.completed ? 'line-through text-slate-400' : ''}`}
                                    value={selectedTask.text}
                                    onChange={(e) => this.updateTaskDetail(selectedTask.id, 'text', e.target.value)}
                                />
                                <button onClick={(e) => this.toggleImportant(e, selectedTask.id)} className={selectedTask.important ? 'text-pink-500' : 'text-slate-300'}>
                                    {selectedTask.important ? '★' : '☆'}
                                </button>
                            </div>

                            {/* Steps / Subtasks */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                {selectedTask.steps && selectedTask.steps.map(step => (
                                    <div key={step.id} className="flex items-center gap-3 p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                        <input
                                            type="checkbox"
                                            checked={step.completed}
                                            onChange={() => this.toggleStep(selectedTask.id, step.id)}
                                            className="rounded-full text-blue-500 focus:ring-blue-500"
                                        />
                                        <span className={`text-sm ${step.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{step.text}</span>
                                    </div>
                                ))}
                                <div className="flex items-center gap-3 p-3">
                                    <span className="text-blue-500 text-lg">+</span>
                                    <input
                                        className="flex-grow bg-transparent outline-none text-sm placeholder-blue-500 text-slate-700"
                                        placeholder="Next step"
                                        value={this.state.stepInput}
                                        onChange={(e) => this.setState({ stepInput: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && this.addStep(selectedTask.id)}
                                    />
                                </div>
                            </div>

                            {/* Options */}
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-sm text-slate-600">
                                <button
                                    onClick={() => this.updateTaskDetail(selectedTask.id, 'myDay', !selectedTask.myDay)}
                                    className={`w-full flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50 ${selectedTask.myDay ? 'text-blue-600' : ''}`}
                                >
                                    <span>{selectedTask.myDay ? '☀️ Added to My Day' : '☀️ Add to My Day'}</span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 border-b border-gray-100 hover:bg-gray-50">
                                    <span>⏰ Remind me</span>
                                </button>
                                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50">
                                    <span>📅 Add due date</span>
                                </button>
                            </div>

                            {/* Notes */}
                            <textarea
                                className="w-full bg-white rounded-lg shadow-sm border border-gray-200 p-3 text-sm outline-none resize-none h-32"
                                placeholder="Add note"
                                value={selectedTask.note || ''}
                                onChange={(e) => this.updateTaskDetail(selectedTask.id, 'note', e.target.value)}
                            />
                        </div>

                        <div className="mt-auto p-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 text-xs text-slate-400">
                            <span>Created {new Date(selectedTask.createdAt).toLocaleDateString()}</span>
                            <button onClick={this.deleteTask} className="text-slate-500 hover:text-red-500 hover:bg-red-50 p-2 rounded transition">
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                            </button>
                        </div>
                        {/* Close Panel Button */}
                        <button
                            onClick={() => this.setState({ selectedTaskId: null })}
                            className="absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-600"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        )
    }
}

export const displayTodo = () => {
    return <Todo />;
};

export default Todo;
