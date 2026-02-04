'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './EMICalculator.module.css';

const EMICalculator: React.FC = () => {
    const [loanAmount, setLoanAmount] = useState<number>(5000000);
    const [interestRate, setInterestRate] = useState<number>(8.5);
    const [tenureYears, setTenureYears] = useState<number>(20);
    const [emi, setEmi] = useState<number>(0);

    useEffect(() => {
        calculateEMI();
    }, [loanAmount, interestRate, tenureYears]);

    const calculateEMI = () => {
        const principal = loanAmount;
        const ratePerMonth = interestRate / 12 / 100;
        const months = tenureYears * 12;

        if (interestRate === 0) {
            setEmi(principal / months);
            return;
        }

        const emiValue = (principal * ratePerMonth * Math.pow(1 + ratePerMonth, months)) /
            (Math.pow(1 + ratePerMonth, months) - 1);

        setEmi(Math.round(emiValue));
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <section id="calculator" className={styles.section}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {/* Left Content */}
                    <motion.div
                        className={styles.leftContent}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7 }}
                    >
                        <p className={styles.subtitle}>Financial Planning</p>
                        <h2 className={styles.title}>EMI Calculator</h2>
                        <p className={styles.description}>
                            Plan your home loan with our easy-to-use calculator.
                            Get an estimate of your monthly payments instantly.
                        </p>
                    </motion.div>

                    {/* Calculator */}
                    <motion.div
                        className={styles.calculator}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ delay: 0.2, duration: 0.7 }}
                    >
                        {/* Inputs */}
                        <div className={styles.inputs}>
                            {/* Loan Amount */}
                            <div className={styles.inputGroup}>
                                <div className={styles.inputHeader}>
                                    <label className={styles.label}>Loan Amount</label>
                                    <span className={styles.value}>{formatCurrency(loanAmount)}</span>
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
                            </div>

                            {/* Interest Rate */}
                            <div className={styles.inputGroup}>
                                <div className={styles.inputHeader}>
                                    <label className={styles.label}>Interest Rate</label>
                                    <span className={styles.value}>{interestRate}%</span>
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
                            </div>

                            {/* Tenure */}
                            <div className={styles.inputGroup}>
                                <div className={styles.inputHeader}>
                                    <label className={styles.label}>Loan Tenure</label>
                                    <span className={styles.value}>{tenureYears} Years</span>
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
                            </div>
                        </div>

                        {/* Result */}
                        <div className={styles.result}>
                            <p className={styles.resultLabel}>Monthly EMI</p>
                            <motion.p
                                className={styles.emiValue}
                                key={emi}
                                initial={{ scale: 0.98 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                {formatCurrency(emi)}
                            </motion.p>

                            <div className={styles.breakdown}>
                                <div className={styles.breakdownItem}>
                                    <span>Total Interest</span>
                                    <span>{formatCurrency((emi * tenureYears * 12) - loanAmount)}</span>
                                </div>
                                <div className={styles.breakdownItem}>
                                    <span>Total Payable</span>
                                    <span>{formatCurrency(emi * tenureYears * 12)}</span>
                                </div>
                            </div>

                            <motion.a
                                href="#contact"
                                className={styles.ctaBtn}
                                whileHover={{ y: -2 }}
                            >
                                Get Pre-Approved
                            </motion.a>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default EMICalculator;
