'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './mortgage-calculator.module.css';

// --- Helpers ---

const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatLakhsCrores = (amount: number) => {
    if (amount >= 10000000) return `${(amount / 10000000).toFixed(2)} Cr`;
    if (amount >= 100000) return `${(amount / 100000).toFixed(2)} L`;
    return formatINR(amount);
};

// --- Donut Chart (pure SVG) ---

interface DonutProps {
    principal: number;
    interest: number;
    size?: number;
}

const DonutChart = ({ principal, interest, size = 180 }: DonutProps) => {
    const total = principal + interest;
    const principalPct = total > 0 ? principal / total : 0;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const principalArc = circumference * principalPct;
    const interestArc = circumference - principalArc;

    return (
        <svg width={size} height={size} viewBox="0 0 200 200">
            {/* Interest arc (bottom layer) */}
            <circle
                cx="100" cy="100" r={radius}
                fill="none" stroke="#BFA270" strokeWidth="24"
                strokeDasharray={`${interestArc} ${circumference}`}
                strokeDashoffset={-principalArc}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
            />
            {/* Principal arc (top layer) */}
            <circle
                cx="100" cy="100" r={radius}
                fill="none" stroke="#183C38" strokeWidth="24"
                strokeDasharray={`${principalArc} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
        </svg>
    );
};

// --- Yearly Amortization ---

interface YearRow {
    year: number;
    principalPaid: number;
    interestPaid: number;
    balance: number;
}

function getYearlySchedule(principal: number, annualRate: number, tenureYears: number, emi: number): YearRow[] {
    const monthlyRate = annualRate / 12 / 100;
    let balance = principal;
    const rows: YearRow[] = [];

    for (let yr = 1; yr <= tenureYears; yr++) {
        let yearPrincipal = 0;
        let yearInterest = 0;
        for (let m = 0; m < 12; m++) {
            if (balance <= 0) break;
            const interestPart = balance * monthlyRate;
            const principalPart = Math.min(emi - interestPart, balance);
            yearInterest += interestPart;
            yearPrincipal += principalPart;
            balance -= principalPart;
        }
        rows.push({
            year: yr,
            principalPaid: Math.round(yearPrincipal),
            interestPaid: Math.round(yearInterest),
            balance: Math.max(0, Math.round(balance)),
        });
        if (balance <= 0) break;
    }
    return rows;
}

// --- Main Component ---

export default function MortgageCalculator() {
    const [loanAmount, setLoanAmount] = useState(5000000);
    const [interestRate, setInterestRate] = useState(8.5);
    const [tenureYears, setTenureYears] = useState(20);
    const [showSchedule, setShowSchedule] = useState(false);

    const calc = useMemo(() => {
        const P = loanAmount;
        const r = interestRate / 12 / 100;
        const n = tenureYears * 12;

        let emi: number;
        if (interestRate === 0) {
            emi = P / n;
        } else {
            emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        }
        emi = Math.round(emi);

        const totalPayable = emi * n;
        const totalInterest = totalPayable - P;

        // First year interest for tax benefit
        let firstYearInterest = 0;
        let balance = P;
        for (let m = 0; m < 12; m++) {
            const intPart = balance * r;
            firstYearInterest += intPart;
            balance -= (emi - intPart);
        }

        // Stamp duty estimate (5% Karnataka default)
        const stampDuty = Math.round(P * 0.05);
        const registrationFee = Math.round(P * 0.01);
        const processingFee = Math.round(P * 0.005);

        return {
            emi,
            totalPayable,
            totalInterest,
            principal: P,
            firstYearInterest: Math.round(firstYearInterest),
            stampDuty,
            registrationFee,
            processingFee,
        };
    }, [loanAmount, interestRate, tenureYears]);

    const schedule = useMemo(
        () => getYearlySchedule(loanAmount, interestRate, tenureYears, calc.emi),
        [loanAmount, interestRate, tenureYears, calc.emi]
    );

    return (
        <section className={styles.section}>
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <motion.p
                        className={styles.subtitle}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ duration: 0.6 }}
                    >
                        Financial Planning
                    </motion.p>
                    <motion.h2
                        className={styles.title}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ delay: 0.1, duration: 0.7 }}
                    >
                        Home Loan EMI Calculator
                    </motion.h2>
                    <motion.p
                        className={styles.description}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-100px' }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                    >
                        Plan your dream home purchase with our comprehensive EMI calculator. Get instant estimates with visual breakdowns.
                    </motion.p>
                </div>

                {/* Calculator Grid */}
                <div className={styles.calcGrid}>
                    {/* Left — Inputs */}
                    <motion.div
                        className={styles.inputPanel}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Loan Amount */}
                        <div className={styles.inputGroup}>
                            <div className={styles.inputHeader}>
                                <label className={styles.label}>Loan Amount</label>
                                <span className={styles.inputValue}>{formatINR(loanAmount)}</span>
                            </div>
                            <input
                                type="range"
                                min="500000"
                                max="100000000"
                                step="100000"
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(Number(e.target.value))}
                                className={styles.slider}
                            />
                            <div className={styles.sliderRange}>
                                <span>5 L</span>
                                <span>10 Cr</span>
                            </div>
                        </div>

                        {/* Interest Rate */}
                        <div className={styles.inputGroup}>
                            <div className={styles.inputHeader}>
                                <label className={styles.label}>Interest Rate (p.a.)</label>
                                <span className={styles.inputValue}>{interestRate}%</span>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="15"
                                step="0.1"
                                value={interestRate}
                                onChange={(e) => setInterestRate(Number(e.target.value))}
                                className={styles.slider}
                            />
                            <div className={styles.sliderRange}>
                                <span>5%</span>
                                <span>15%</span>
                            </div>
                        </div>

                        {/* Tenure */}
                        <div className={styles.inputGroup}>
                            <div className={styles.inputHeader}>
                                <label className={styles.label}>Loan Tenure</label>
                                <span className={styles.inputValue}>{tenureYears} Years</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="30"
                                step="1"
                                value={tenureYears}
                                onChange={(e) => setTenureYears(Number(e.target.value))}
                                className={styles.slider}
                            />
                            <div className={styles.sliderRange}>
                                <span>1 Yr</span>
                                <span>30 Yrs</span>
                            </div>
                        </div>

                        {/* Tax Benefits */}
                        <div className={styles.taxCard}>
                            <p className={styles.taxTitle}>Tax Benefits (per year)</p>
                            <div className={styles.taxGrid}>
                                <div className={styles.taxItem}>
                                    <span className={styles.taxLabel}>Sec 24 — Interest</span>
                                    <span className={styles.taxValue}>
                                        Up to {formatINR(Math.min(calc.firstYearInterest, 200000))}
                                    </span>
                                </div>
                                <div className={styles.taxItem}>
                                    <span className={styles.taxLabel}>Sec 80C — Principal</span>
                                    <span className={styles.taxValue}>Up to {formatINR(150000)}</span>
                                </div>
                                <div className={styles.taxItem}>
                                    <span className={styles.taxLabel}>Stamp Duty (5%)</span>
                                    <span className={styles.taxValue}>{formatINR(calc.stampDuty)}</span>
                                </div>
                                <div className={styles.taxItem}>
                                    <span className={styles.taxLabel}>Processing Fee</span>
                                    <span className={styles.taxValue}>{formatINR(calc.processingFee)}</span>
                                </div>
                            </div>
                            <p className={styles.taxNote}>* Tax deductions subject to applicable limits under Income Tax Act.</p>
                        </div>
                    </motion.div>

                    {/* Right — Results */}
                    <motion.div
                        className={styles.resultsPanel}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.15, duration: 0.6 }}
                    >
                        {/* EMI Card */}
                        <div className={styles.emiCard}>
                            <p className={styles.emiLabel}>Monthly EMI</p>
                            <motion.p
                                className={styles.emiAmount}
                                key={calc.emi}
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                {formatINR(calc.emi)}
                            </motion.p>
                            <p className={styles.emiSub}>for {tenureYears} years at {interestRate}% p.a.</p>
                        </div>

                        {/* Donut Chart + Legend */}
                        <div className={styles.chartSection}>
                            <div className={styles.chartWrapper}>
                                <DonutChart principal={calc.principal} interest={calc.totalInterest} />
                                <div className={styles.chartCenter}>
                                    <p className={styles.chartCenterLabel}>Total</p>
                                    <p className={styles.chartCenterValue}>{formatLakhsCrores(calc.totalPayable)}</p>
                                </div>
                            </div>
                            <div className={styles.legend}>
                                <div className={styles.legendItem}>
                                    <div className={styles.legendDot} style={{ backgroundColor: '#183C38' }} />
                                    <div className={styles.legendInfo}>
                                        <p className={styles.legendLabel}>Principal Amount</p>
                                        <p className={styles.legendValue}>{formatINR(calc.principal)}</p>
                                    </div>
                                </div>
                                <div className={styles.legendItem}>
                                    <div className={styles.legendDot} style={{ backgroundColor: '#BFA270' }} />
                                    <div className={styles.legendInfo}>
                                        <p className={styles.legendLabel}>Total Interest</p>
                                        <p className={styles.legendValue}>{formatINR(calc.totalInterest)}</p>
                                    </div>
                                </div>
                                <div className={styles.legendItem}>
                                    <div className={styles.legendDot} style={{ backgroundColor: '#e0e0e0' }} />
                                    <div className={styles.legendInfo}>
                                        <p className={styles.legendLabel}>Total Payable</p>
                                        <p className={styles.legendValue}>{formatINR(calc.totalPayable)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Yearly Breakdown */}
                        <div className={styles.breakdownCard}>
                            <div className={styles.breakdownHeader}>
                                <span className={styles.breakdownTitle}>Year-wise Breakdown</span>
                                <button
                                    className={styles.toggleBtn}
                                    onClick={() => setShowSchedule(!showSchedule)}
                                >
                                    {showSchedule ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {showSchedule && (
                                <div className={styles.tableWrapper}>
                                    <table className={styles.table}>
                                        <thead>
                                            <tr>
                                                <th>Year</th>
                                                <th>Principal</th>
                                                <th>Interest</th>
                                                <th>Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {schedule.map((row) => (
                                                <tr key={row.year}>
                                                    <td>{row.year}</td>
                                                    <td>{formatINR(row.principalPaid)}</td>
                                                    <td>{formatINR(row.interestPaid)}</td>
                                                    <td>{formatINR(row.balance)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
