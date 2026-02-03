
import React, { Component } from 'react';

export default class FocusMode extends Component {
    render() {
        const { activities = [], opportunities = [], onCompleteActivity } = this.props;

        // Defensive checks
        const safeActivities = Array.isArray(activities) ? activities : [];
        const safeOpportunities = Array.isArray(opportunities) ? opportunities : [];

        // 🧠 LOGIC REFINEMENT
        const highValueDeals = safeOpportunities
            .filter(o => o.value > 5000 && o.status !== 'Won' && o.status !== 'Lost')
            .sort((a, b) => b.value - a.value)
            .slice(0, 3);

        const overdueActivities = safeActivities.filter(a => {
            if (!a.dueDate) return false;
            return new Date(a.dueDate) < new Date() && a.status !== 'Completed';
        });

        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        const todayActivities = safeActivities.filter(a => {
            if (!a.dueDate) return false;
            const due = new Date(a.dueDate);
            return due >= startOfDay && due <= endOfDay && a.status !== 'Completed';
        });

        // Calculate Focus Score
        let score = 100;
        score -= (overdueActivities.length * 15); // Heavy penalty for overdue
        score -= (todayActivities.length > 5 ? 0 : (5 - todayActivities.length) * 5); // Penalty for empty schedule (get busy!)
        score = Math.max(0, Math.min(100, score));

        // Time of Day Greeting
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

        return (
            <div className="focus-mode">
                <div className="focus-hero">
                    <div className="hero-content">
                        <div className="badge">🚀 Founder Mode Activated</div>
                        <h1 className="greeting">{greeting}, Creator.</h1>
                        <p className="subtitle">Your AI has prioritized <strong>{overdueActivities.length + todayActivities.length} missions</strong> for you today.</p>
                    </div>

                    <div className="focus-score-card">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="circle" strokeDasharray={`${score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <div className="score-content">
                            <span className="score-val">{score}</span>
                            <span className="score-label">Productivity Pulse</span>
                        </div>
                    </div>
                </div>

                <div className="insight-banner">
                    <div className="sparkle-icon">✨</div>
                    <div className="insight-text">
                        <strong>Alphery Intelligence:</strong> Closing the <em>{highValueDeals[0]?.name || 'next big deal'}</em> will increase your monthly revenue by 12%. Suggested action: Call them now.
                    </div>
                    <button className="insight-action">Execute</button>
                </div>

                <div className="focus-grid">
                    {/* 🔥 RED ZONE: CRITICAL */}
                    <div className="glass-card danger-zone">
                        <div className="card-header">
                            <div className="header-icon">🔥</div>
                            <h3>Critical Attention</h3>
                            <span className="pill">{overdueActivities.length}</span>
                        </div>
                        <div className="card-body">
                            {overdueActivities.length === 0 ? (
                                <div className="empty-state">
                                    <div className="check-circle">✓</div>
                                    <span>Zero fires to fight. You are in control.</span>
                                </div>
                            ) : (
                                overdueActivities.map(act => (
                                    <div key={act.id} className="task-row overdue">
                                        <div className="task-check" onClick={() => onCompleteActivity(act.id)}></div>
                                        <div className="task-info">
                                            <div className="task-title">{act.title}</div>
                                            <div className="task-meta">Was due {new Date(act.dueDate).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 📅 BLUE ZONE: SCHEDULE */}
                    <div className="glass-card active-zone">
                        <div className="card-header">
                            <div className="header-icon">📅</div>
                            <h3>Today's Mission</h3>
                            <span className="pill">{todayActivities.length}</span>
                        </div>
                        <div className="card-body">
                            {todayActivities.length === 0 ? (
                                <div className="empty-state">
                                    <span>Verify your calendar. Silence is suspicious.</span>
                                    <button className="sm-btn">Add Task</button>
                                </div>
                            ) : (
                                todayActivities.map(act => (
                                    <div key={act.id} className="task-row">
                                        <div className="task-time">{new Date(act.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        <div className="task-info">
                                            <div className="task-title">{act.title}</div>
                                            <div className="task-meta">{act.description || 'Routine check-in'}</div>
                                        </div>
                                        <button className="done-btn" onClick={() => onCompleteActivity(act.id)}>Done</button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* 💎 GREEN ZONE: REVENUE */}
                    <div className="glass-card money-zone">
                        <div className="card-header">
                            <div className="header-icon">💎</div>
                            <h3>high Value Targets</h3>
                            <span className="pill">${highValueDeals.reduce((a, b) => a + b.value, 0).toLocaleString()}</span>
                        </div>
                        <div className="card-body">
                            {highValueDeals.map(opp => (
                                <div key={opp.id} className="deal-row">
                                    <div className="deal-info">
                                        <div className="deal-name">{opp.name}</div>
                                        <div className="deal-company">{opp.company}</div>
                                    </div>
                                    <div className="deal-value">${opp.value.toLocaleString()}</div>
                                    <div className="confidence-pill" style={{
                                        background: opp.value > 20000 ? '#ecfdf5' : '#fffbeb',
                                        color: opp.value > 20000 ? '#059669' : '#d97706'
                                    }}>
                                        {opp.value > 20000 ? '90%' : '65%'} Prob.
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <style jsx>{`
                    .focus-mode {
                        padding: 40px;
                        max-width: 1400px;
                        margin: 0 auto;
                        animation: fadeIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
                    }

                    .focus-hero {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 40px;
                    }
                    
                    .badge {
                        display: inline-block;
                        padding: 6px 12px;
                        background: rgba(139, 92, 246, 0.15);
                        color: #8b5cf6;
                        border-radius: 20px;
                        font-size: 12px;
                        font-weight: 700;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 12px;
                        border: 1px solid rgba(139, 92, 246, 0.2);
                    }

                    .greeting {
                        font-size: 42px;
                        font-weight: 800;
                        color: #111827;
                        margin-bottom: 8px;
                        letter-spacing: -1px;
                    }
                    
                    .subtitle {
                        font-size: 18px;
                        color: #6b7280;
                    }

                    .focus-score-card {
                        background: white;
                        padding: 20px 30px;
                        border-radius: 24px;
                        box-shadow: 0 20px 40px -10px rgba(0,0,0,0.08);
                        display: flex;
                        align-items: center;
                        gap: 20px;
                        border: 1px solid rgba(0,0,0,0.02);
                    }
                    
                    .circular-chart { width: 70px; height: 70px; }
                    .circle-bg { fill: none; stroke: #f3f4f6; stroke-width: 3; }
                    .circle { 
                        fill: none; 
                        stroke-width: 3; 
                        stroke-linecap: round; 
                        stroke: #8b5cf6;
                        transition: stroke-dasharray 1s ease;
                    }
                    
                    .score-content { display: flex; flex-direction: column; }
                    .score-val { font-size: 32px; font-weight: 800; color: #111827; line-height: 1; }
                    .score-label { font-size: 13px; font-weight: 600; color: #9ca3af; text-transform: uppercase; margin-top: 4px; }

                    .insight-banner {
                        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                        border-radius: 20px;
                        padding: 20px 30px;
                        color: white;
                        display: flex;
                        align-items: center;
                        gap: 20px;
                        margin-bottom: 40px;
                        box-shadow: 0 15px 30px -5px rgba(79, 70, 229, 0.3);
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .insight-banner::before {
                        content: '';
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent 70%);
                    }

                    .sparkle-icon { font-size: 24px; animation: bounce 2s infinite; }
                    .insight-text { flex: 1; font-size: 15px; line-height: 1.5; text-shadow: 0 1px 2px rgba(0,0,0,0.1); }
                    .insight-action {
                        background: white;
                        color: #4f46e5;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 12px;
                        font-weight: 700;
                        font-size: 14px;
                        cursor: pointer;
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        transition: transform 0.2s;
                    }
                    .insight-action:hover { transform: translateY(-2px); }

                    .focus-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                        gap: 30px;
                    }

                    .glass-card {
                        background: white;
                        border-radius: 24px;
                        padding: 24px;
                        box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05);
                        border: 1px solid rgba(0,0,0,0.03);
                        transition: transform 0.3s, box-shadow 0.3s;
                        height: 100%;
                    }
                    .glass-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
                    }

                    .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
                    .header-icon { font-size: 20px; background: #f3f4f6; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
                    .card-header h3 { font-size: 16px; font-weight: 700; color: #1f2937; flex: 1; margin: 0; }
                    .pill {
                        background: #f3f4f6;
                        padding: 4px 12px;
                        border-radius: 20px;
                        font-size: 13px;
                        font-weight: 600;
                        color: #6b7280;
                    }

                    .danger-zone .header-icon { background: #fee2e2; }
                    .danger-zone .pill { background: #fee2e2; color: #dc2626; }
                    
                    .active-zone .header-icon { background: #e0e7ff; }
                    .active-zone .pill { background: #e0e7ff; color: #4338ca; }
                    
                    .money-zone .header-icon { background: #d1fae5; }
                    .money-zone .pill { background: #d1fae5; color: #059669; }

                    .task-row {
                        display: flex;
                        align-items: center;
                        gap: 16px;
                        padding: 16px;
                        background: #f9fafb;
                        border-radius: 16px;
                        margin-bottom: 12px;
                        border: 1px solid transparent;
                        transition: all 0.2s;
                    }
                    .task-row:hover { background: white; border-color: #e5e7eb; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
                    
                    .task-check {
                        width: 24px; height: 24px;
                        border: 2px solid #d1d5db;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .task-check:hover { border-color: #ef4444; background: rgba(239, 68, 68, 0.1); }
                    
                    .task-info { flex: 1; }
                    .task-title { font-weight: 600; color: #374151; font-size: 15px; }
                    .task-meta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
                    
                    .task-time { font-weight: 700; color: #6b7280; font-size: 13px; width: 60px; }
                    .done-btn {
                        background: white;
                        border: 1px solid #e5e7eb;
                        padding: 6px 12px;
                        border-radius: 8px;
                        font-weight: 600;
                        font-size: 12px;
                        color: #4b5563;
                        cursor: pointer;
                    }

                    .deal-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px;
                        border-bottom: 1px solid #f3f4f6;
                    }
                    .deal-row:last-child { border-bottom: none; }
                    .deal-name { font-weight: 700; color: #1f2937; }
                    .deal-company { font-size: 12px; color: #9ca3af; }
                    .deal-value { font-weight: 700; color: #059669; }
                    .confidence-pill { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }

                    .empty-state {
                        text-align: center;
                        padding: 40px 20px;
                        color: #9ca3af;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 12px;
                    }
                    .check-circle { 
                        width: 48px; height: 48px; 
                        background: #d1fae5; color: #059669; 
                        border-radius: 50%; display: flex; 
                        align-items: center; justify-content: center; 
                        font-size: 24px;
                    }

                    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
                `}</style>
            </div>
        );
    }
}
