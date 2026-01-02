import React, { Component } from 'react';

export class Todo extends Component {
    constructor() {
        super();
        this.state = {
            tasks: [],
            inputValue: '',
            filter: 'all' // all, active, completed
        };
    }

    componentDidMount() {
        const savedTasks = localStorage.getItem('alphery-todos');
        if (savedTasks) {
            this.setState({ tasks: JSON.parse(savedTasks) });
        }
    }

    saveTasks = (tasks) => {
        localStorage.setItem('alphery-todos', JSON.stringify(tasks));
        this.setState({ tasks });
    }

    addTask = (e) => {
        if (e.key === 'Enter' && this.state.inputValue.trim()) {
            const newTask = {
                id: Date.now(),
                text: this.state.inputValue.trim(),
                completed: false,
                createdAt: new Date().toISOString()
            };
            this.saveTasks([newTask, ...this.state.tasks]);
            this.setState({ inputValue: '' });
        }
    }

    toggleTask = (id) => {
        const updatedTasks = this.state.tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        this.saveTasks(updatedTasks);
    }

    deleteTask = (id) => {
        const updatedTasks = this.state.tasks.filter(task => task.id !== id);
        this.saveTasks(updatedTasks);
    }

    clearCompleted = () => {
        const updatedTasks = this.state.tasks.filter(task => !task.completed);
        this.saveTasks(updatedTasks);
    }

    render() {
        const { tasks, filter, inputValue } = this.state;

        const filteredTasks = tasks.filter(task => {
            if (filter === 'active') return !task.completed;
            if (filter === 'completed') return task.completed;
            return true;
        });

        const activeCount = tasks.filter(t => !t.completed).length;

        return (
            <div className="w-full h-full flex flex-col bg-white text-slate-800 font-sans">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shrink-0">
                    <h1 className="text-2xl font-bold mb-1">My Tasks</h1>
                    <p className="text-white text-opacity-80 text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>

                    <div className="mt-4 relative">
                        <input
                            type="text"
                            className="w-full bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg py-2 pl-10 pr-4 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:bg-opacity-30 transition"
                            placeholder="Add a new task..."
                            value={inputValue}
                            onChange={(e) => this.setState({ inputValue: e.target.value })}
                            onKeyDown={this.addTask}
                        />
                        <span className="absolute left-3 top-2.5 text-white text-opacity-70">➕</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex bg-slate-50 border-b border-slate-200 p-1 shrink-0">
                    {['all', 'active', 'completed'].map(f => (
                        <button
                            key={f}
                            onClick={() => this.setState({ filter: f })}
                            className={`flex-1 py-2 text-sm font-medium rounded capitalize transition ${filter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Task List */}
                <div className="flex-grow overflow-y-auto p-4 content-start">
                    {filteredTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="text-4xl mb-2">✨</div>
                            <p>No {filter} tasks</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredTasks.map(task => (
                                <div key={task.id} className="group flex items-center bg-white border border-slate-100 shadow-sm p-3 rounded-lg hover:shadow-md transition">
                                    <button
                                        onClick={() => this.toggleTask(task.id)}
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 transition ${task.completed ? 'bg-green-500 border-green-500' : 'border-slate-300 hover:border-blue-500'}`}
                                    >
                                        {task.completed && <span className="text-white text-xs">✓</span>}
                                    </button>
                                    <span className={`flex-grow text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                        {task.text}
                                    </span>
                                    <button
                                        onClick={() => this.deleteTask(task.id)}
                                        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition px-2"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-50 border-t border-slate-200 p-3 text-xs text-slate-500 flex justify-between items-center shrink-0">
                    <span>{activeCount} items left</span>
                    {tasks.some(t => t.completed) && (
                        <button onClick={this.clearCompleted} className="hover:text-red-500 transition">
                            Clear completed
                        </button>
                    )}
                </div>
            </div>
        )
    }
}

export const displayTodo = () => {
    return <Todo />;
};

export default Todo;
