'use client'

import { useState, useEffect } from 'react'
import { Trophy, Users, TrendingUp, Target, Activity, RefreshCw, IndianRupee } from 'lucide-react'

interface AgentStats {
    id: string; name: string; email: string; role: string
    total_leads: number; converted: number; lost: number; active: number; hot_leads: number
    win_rate: number; avg_score: number; total_activities: number; contact_activities: number
    response_rate: number; pipeline_value: number; weighted_value: number
}

function fmtCr(val: number): string {
    if (val === 0) return '—'
    if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)}Cr`
    if (val >= 1e5) return `₹${(val / 1e5).toFixed(1)}L`
    return `₹${val.toLocaleString('en-IN')}`
}

const MEDAL_COLORS = ['#f59e0b', '#9ca3af', '#cd7f32']
const MEDAL_EMOJI = ['🥇', '🥈', '🥉']

function MedalIcon({ rank }: { rank: number }) {
    if (rank <= 3) return <span style={{ fontSize: '1.125rem' }}>{MEDAL_EMOJI[rank - 1]}</span>
    return <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--crm-text-muted)', display: 'inline-block', minWidth: '20px', textAlign: 'center' }}>#{rank}</span>
}

function WinBar({ rate }: { rate: number }) {
    const color = rate >= 20 ? '#22c55e' : rate >= 10 ? '#f59e0b' : '#ef4444'
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color }}>{rate}%</div>
            <div style={{ height: '3px', borderRadius: '2px', backgroundColor: 'var(--crm-border)', margin: '4px auto', width: '48px' }}>
                <div style={{ width: `${Math.min(rate * 3, 100)}%`, height: '100%', borderRadius: '2px', backgroundColor: color }} />
            </div>
        </div>
    )
}

export default function PerformancePage() {
    const [agents, setAgents] = useState<AgentStats[]>([])
    const [loading, setLoading] = useState(true)
    const [days, setDays] = useState(30)

    const load = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/crm/agent-performance?days=${days}`)
            if (res.ok) {
                const d = await res.json()
                setAgents(d.agents || [])
            }
        } finally { setLoading(false) }
    }

    useEffect(() => { load() }, [days]) // eslint-disable-line react-hooks/exhaustive-deps

    const totalConverted = agents.reduce((s, a) => s + a.converted, 0)
    const totalLeads     = agents.reduce((s, a) => s + a.total_leads, 0)
    const totalPipeline  = agents.reduce((s, a) => s + a.pipeline_value, 0)

    const dayBtn = (active: boolean): React.CSSProperties => ({
        padding: '5px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem',
        fontWeight: active ? 600 : 400, border: '1px solid var(--crm-border)',
        backgroundColor: active ? 'var(--crm-btn-primary-bg)' : 'var(--crm-surface)',
        color: active ? 'var(--crm-btn-primary-text)' : 'var(--crm-text-secondary)',
    })

    const thS: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: '0.7rem', color: 'var(--crm-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }
    const thC: React.CSSProperties = { ...thS, textAlign: 'center' }

    return (
        <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--crm-text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Trophy size={18} style={{ color: '#f59e0b' }} /> Agent Performance
                    </h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--crm-text-muted)' }}>Leaderboard, conversion rates, and pipeline value by agent</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {[7, 14, 30, 60, 90].map(d => (
                        <button key={d} onClick={() => setDays(d)} style={dayBtn(days === d)}>{d}d</button>
                    ))}
                    <button onClick={load} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid var(--crm-border)', backgroundColor: 'var(--crm-surface)', cursor: 'pointer', color: 'var(--crm-text-muted)', lineHeight: 0 }}>
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Team summary cards */}
            {!loading && agents.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.75rem' }}>
                    {[
                        { label: 'Team Leads',   value: totalLeads,       icon: <Users size={14} />,       color: '#8b5cf6' },
                        { label: 'Conversions',  value: totalConverted,   icon: <Target size={14} />,      color: '#22c55e' },
                        { label: 'Win Rate',     value: `${totalLeads > 0 ? Math.round((totalConverted / totalLeads) * 100) : 0}%`, icon: <TrendingUp size={14} />, color: '#3b82f6' },
                        { label: 'Pipeline',     value: fmtCr(totalPipeline), icon: <IndianRupee size={14} />, color: '#f59e0b' },
                        { label: 'Agents',       value: agents.length,    icon: <Trophy size={14} />,      color: '#ef4444' },
                    ].map(s => (
                        <div key={s.label} style={{ backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '10px', padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: s.color, marginBottom: '0.5rem' }}>
                                {s.icon}
                                <span style={{ fontSize: '0.7rem', color: 'var(--crm-text-muted)', fontWeight: 500 }}>{s.label}</span>
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{s.value}</div>
                        </div>
                    ))}
                </div>
            )}

            {loading ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--crm-text-muted)' }}>
                    <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <div style={{ fontSize: '0.875rem' }}>Loading performance data…</div>
                </div>
            ) : agents.length === 0 ? (
                <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--crm-text-muted)', backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '12px' }}>
                    <Users size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                    <div style={{ fontWeight: 600, color: 'var(--crm-text-secondary)', marginBottom: '4px' }}>No agents found</div>
                    <div style={{ fontSize: '0.85rem' }}>Add agents with leads assigned to see performance data.</div>
                </div>
            ) : (
                <>
                    {/* Podium — top 3 */}
                    {agents.length >= 2 && (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                            {agents.slice(0, Math.min(3, agents.length)).map((a, i) => {
                                const barHeights = [140, 110, 90]
                                const c = MEDAL_COLORS[i]
                                return (
                                    <div key={a.id} style={{ textAlign: 'center', flex: '1', minWidth: '150px', maxWidth: '200px' }}>
                                        <div style={{ marginBottom: '8px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 6px', backgroundColor: 'var(--crm-elevated)', color: 'var(--crm-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.125rem', fontWeight: 700, border: `2px solid ${c}` }}>
                                                {a.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{a.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--crm-text-muted)' }}>{a.role}</div>
                                        </div>
                                        <div style={{ height: barHeights[i], backgroundColor: `${c}15`, border: `1px solid ${c}50`, borderRadius: '8px 8px 0 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <MedalIcon rank={i + 1} />
                                            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: c }}>{a.converted}</div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--crm-text-muted)' }}>conversions</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--crm-text-muted)' }}>{a.win_rate}% win rate</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Full leaderboard table */}
                    <div style={{ backgroundColor: 'var(--crm-surface)', border: '1px solid var(--crm-border)', borderRadius: '12px', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '780px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--crm-border)', backgroundColor: 'var(--crm-elevated)' }}>
                                        <th style={{ ...thS, width: '40px' }}>#</th>
                                        <th style={thS}>Agent</th>
                                        <th style={thC}>Leads</th>
                                        <th style={thC}>Converted</th>
                                        <th style={thC}>Win Rate</th>
                                        <th style={thC}><span style={{ display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'center' }}><Activity size={11} /> Activities</span></th>
                                        <th style={thC}>🔥 Hot</th>
                                        <th style={thC}>Avg Score</th>
                                        <th style={thC}>Pipeline</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agents.map((a, i) => (
                                        <tr
                                            key={a.id}
                                            style={{ borderBottom: i < agents.length - 1 ? '1px solid var(--crm-border)' : 'none', backgroundColor: i === 0 ? 'var(--crm-accent-bg)' : 'transparent' }}
                                            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--crm-accent-bg)')}
                                            onMouseLeave={e => (e.currentTarget.style.backgroundColor = i === 0 ? 'var(--crm-accent-bg)' : 'transparent')}
                                        >
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}><MedalIcon rank={i + 1} /></td>
                                            <td style={{ padding: '12px 12px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', flexShrink: 0, backgroundColor: 'var(--crm-accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: 700 }}>
                                                        {a.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--crm-text-primary)' }}>{a.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--crm-text-muted)' }}>{a.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{a.total_leads}</div>
                                            </td>
                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#22c55e' }}>{a.converted}</div>
                                            </td>
                                            <td style={{ padding: '12px 8px' }}><WinBar rate={a.win_rate} /></td>
                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--crm-text-primary)' }}>{a.total_activities}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--crm-text-muted)' }}>{a.contact_activities} contacts</div>
                                            </td>
                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ef4444' }}>{a.hot_leads}</div>
                                            </td>
                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: a.avg_score >= 70 ? '#22c55e' : a.avg_score >= 40 ? '#f59e0b' : 'var(--crm-text-muted)' }}>
                                                    {a.avg_score || '—'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: a.pipeline_value > 0 ? '#8b5cf6' : 'var(--crm-text-muted)' }}>
                                                    {fmtCr(a.pipeline_value)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
