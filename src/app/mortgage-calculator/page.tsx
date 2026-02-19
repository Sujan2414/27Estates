'use client';

import React, { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

import MortgageCalculator from '@/components/ui/mortgage-calculator';
import PageHero from '@/components/PageHero';
import styles from '@/components/ui/mortgage-article.module.css';

function StickyContactForm() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');
        setSuccess(false);

        try {
            const res = await fetch('/api/inquiries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${firstName} ${lastName}`.trim(),
                    email: formEmail,
                    phone: formPhone || null,
                    message,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit');
            }

            setSuccess(true);
            setFirstName('');
            setLastName('');
            setFormEmail('');
            setFormPhone('');
            setMessage('');
        } catch (err: any) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.stickyForm}>
            <motion.div
                className={styles.stickyFormCard}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
            >
                <h3 className={styles.stickyFormTitle}>Get Expert Advice</h3>
                <p className={styles.stickyFormSubtitle}>
                    Have questions about home loans? Our team will guide you through every step.
                </p>

                {success && (
                    <div className={styles.stickyFormSuccess}>
                        Thank you! We&apos;ll get back to you within 24 hours.
                    </div>
                )}

                {error && (
                    <div className={styles.stickyFormError}>{error}</div>
                )}

                <form onSubmit={handleSubmit} className={styles.stickyFormGroup}>
                    <div className={styles.stickyFormNameRow}>
                        <div>
                            <label className={styles.stickyFormLabel}>First Name</label>
                            <input
                                type="text"
                                placeholder="John"
                                required
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                className={styles.stickyFormInput}
                            />
                        </div>
                        <div>
                            <label className={styles.stickyFormLabel}>Last Name</label>
                            <input
                                type="text"
                                placeholder="Doe"
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                className={styles.stickyFormInput}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={styles.stickyFormLabel}>Email</label>
                        <input
                            type="email"
                            placeholder="john@example.com"
                            required
                            value={formEmail}
                            onChange={e => setFormEmail(e.target.value)}
                            className={styles.stickyFormInput}
                        />
                    </div>

                    <div>
                        <label className={styles.stickyFormLabel}>Phone</label>
                        <input
                            type="tel"
                            placeholder="+91 99999 99999"
                            value={formPhone}
                            onChange={e => setFormPhone(e.target.value)}
                            className={styles.stickyFormInput}
                        />
                    </div>

                    <div>
                        <label className={styles.stickyFormLabel}>Message</label>
                        <textarea
                            placeholder="Tell us about your requirements..."
                            rows={3}
                            required
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            className={styles.stickyFormTextarea}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className={styles.stickyFormBtn}
                    >
                        {submitting ? 'Sending...' : 'Send Message'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

export default function MortgageCalculatorPage() {
    return (
            <main className="min-h-screen bg-white">
                <Navigation alwaysScrolled={false} />

                {/* Hero Section */}
                <PageHero
                    title="Mortgage Calculator"
                    subtitle="Plan Your Investment"
                    backgroundImage="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=2073"
                />

                {/* Content scrolls over the sticky hero with rounded top corners */}
                <div style={{
                    position: 'relative',
                    zIndex: 10,
                    borderRadius: '24px 24px 0 0',
                    marginTop: '-24px',
                    backgroundColor: '#ffffff',
                }}>
                    {/* Calculator Section */}
                    <MortgageCalculator />

                    {/* Article / Explainer Section */}
                    <section className={styles.article}>
                        <div className={styles.container}>
                            {/* Article Header */}
                            <div className={styles.articleHeader}>
                                <motion.p
                                    className={styles.articleSubtitle}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-100px' }}
                                    transition={{ duration: 0.6 }}
                                >
                                    Guide
                                </motion.p>
                                <motion.h2
                                    className={styles.articleTitle}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-100px' }}
                                    transition={{ delay: 0.1, duration: 0.7 }}
                                >
                                    Everything You Need to Know About Home Loan EMIs
                                </motion.h2>
                                <motion.p
                                    className={styles.articleIntro}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-100px' }}
                                    transition={{ delay: 0.2, duration: 0.6 }}
                                >
                                    A home loan is one of the biggest financial commitments you will make. Understanding how EMIs work, when to take a loan, and how to optimise your repayment can save you lakhs over the loan tenure.
                                </motion.p>
                            </div>

                            {/* Two-column: Article content + Sticky contact form */}
                            <div className={styles.articleGrid}>
                                <div className={styles.articleContent}>
                                    {/* What is EMI? */}
                                    <motion.div
                                        className={styles.block}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        <h3 className={styles.blockTitle}>What is an EMI?</h3>
                                        <p className={styles.blockText}>
                                            EMI stands for Equated Monthly Instalment. It is the fixed amount you pay to the bank every month until the loan is fully repaid. Each EMI payment is a combination of two components — the principal repayment and the interest charged on the outstanding balance.
                                        </p>
                                        <p className={styles.blockText}>
                                            In the early years of your loan, a larger portion of your EMI goes towards paying interest. As the outstanding principal reduces over time, the interest component decreases and more of your EMI goes towards repaying the actual principal. This is why prepayments in the early years of a loan are most effective.
                                        </p>

                                        <div className={styles.formulaCard}>
                                            <p className={styles.formulaLabel}>EMI Formula</p>
                                            <p className={styles.formula}>
                                                EMI = P × r × (1 + r)ⁿ / [(1 + r)ⁿ − 1]
                                            </p>
                                            <p className={styles.formulaWhere}>
                                                Where <strong>P</strong> = Principal loan amount, <strong>r</strong> = Monthly interest rate (annual rate ÷ 12 ÷ 100), and <strong>n</strong> = Total number of monthly instalments (tenure in years × 12).
                                            </p>
                                        </div>
                                    </motion.div>

                                    <div className={styles.divider} />

                                    {/* When is the Best Time? */}
                                    <motion.div
                                        className={styles.block}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        <h3 className={styles.blockTitle}>When is the Best Time to Take a Home Loan?</h3>
                                        <p className={styles.blockText}>
                                            Timing your home loan well can significantly impact the total cost of ownership. While there is no universally perfect time, several factors can help you make a more informed decision.
                                        </p>
                                        <p className={styles.blockText}>
                                            Interest rates in India are influenced by the Reserve Bank of India&apos;s repo rate. When the RBI lowers the repo rate, home loan rates tend to follow. Historically, rates have ranged from 6.5% to 10.5% over the last decade. If rates are at or below the historical average, it can be a favourable time to lock in your loan.
                                        </p>
                                        <p className={styles.blockText}>
                                            Property prices also play a role. During market corrections or early phases of new project launches, developers may offer competitive pricing. Combining a low interest rate environment with a fair property price creates the ideal window for purchase.
                                        </p>
                                        <p className={styles.blockText}>
                                            Your personal financial readiness matters most. A stable income, a healthy credit score (750+), minimal existing debt, and a sufficient down payment (at least 20% of property value) are the prerequisites before committing to a home loan.
                                        </p>
                                    </motion.div>

                                    <div className={styles.divider} />

                                    {/* Smart Strategies */}
                                    <motion.div
                                        className={styles.block}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        <h3 className={styles.blockTitle}>Smart Strategies to Reduce Your EMI Burden</h3>
                                        <ul className={styles.tipsList}>
                                            <li className={styles.tipItem}>
                                                <span className={styles.tipNumber}>1</span>
                                                <div className={styles.tipContent}>
                                                    <p className={styles.tipTitle}>Make Prepayments Early</p>
                                                    <p className={styles.tipText}>
                                                        Even small lump-sum prepayments in the first 5–7 years can reduce your total interest by several lakhs. Since early EMIs are interest-heavy, prepayments directly reduce the principal and shorten the effective tenure.
                                                    </p>
                                                </div>
                                            </li>
                                            <li className={styles.tipItem}>
                                                <span className={styles.tipNumber}>2</span>
                                                <div className={styles.tipContent}>
                                                    <p className={styles.tipTitle}>Choose a Shorter Tenure When Possible</p>
                                                    <p className={styles.tipText}>
                                                        A 15-year loan costs significantly less in total interest compared to a 30-year loan at the same rate. If your monthly cash flow allows it, opt for a shorter tenure. The EMI will be higher, but the savings over the loan&apos;s lifetime are substantial.
                                                    </p>
                                                </div>
                                            </li>
                                            <li className={styles.tipItem}>
                                                <span className={styles.tipNumber}>3</span>
                                                <div className={styles.tipContent}>
                                                    <p className={styles.tipTitle}>Negotiate Your Interest Rate</p>
                                                    <p className={styles.tipText}>
                                                        Banks compete for home loan customers. If you have a credit score above 750 and a stable income, you can negotiate a lower rate. Even a 0.25% reduction on a ₹50 lakh loan over 20 years saves approximately ₹3 lakhs in interest.
                                                    </p>
                                                </div>
                                            </li>
                                            <li className={styles.tipItem}>
                                                <span className={styles.tipNumber}>4</span>
                                                <div className={styles.tipContent}>
                                                    <p className={styles.tipTitle}>Consider Balance Transfer</p>
                                                    <p className={styles.tipText}>
                                                        If your current lender&apos;s rate is higher than what other banks offer, you can transfer your outstanding balance. Most banks charge a nominal processing fee for balance transfers, and the interest savings often outweigh the switching costs.
                                                    </p>
                                                </div>
                                            </li>
                                            <li className={styles.tipItem}>
                                                <span className={styles.tipNumber}>5</span>
                                                <div className={styles.tipContent}>
                                                    <p className={styles.tipTitle}>Increase Your Down Payment</p>
                                                    <p className={styles.tipText}>
                                                        The more you pay upfront, the less you borrow. A higher down payment reduces both your EMI and the total interest outgo. It also improves your loan-to-value ratio, which can help you secure a better interest rate.
                                                    </p>
                                                </div>
                                            </li>
                                        </ul>
                                    </motion.div>

                                    <div className={styles.divider} />

                                    {/* Tax Benefits */}
                                    <motion.div
                                        className={styles.block}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        <h3 className={styles.blockTitle}>Tax Benefits on Home Loans in India</h3>
                                        <p className={styles.blockText}>
                                            The Indian Income Tax Act provides several deductions for home loan borrowers. These benefits can significantly reduce your annual tax liability and effectively lower the cost of your home loan.
                                        </p>

                                        <div className={styles.benefitsGrid}>
                                            <div className={styles.benefitCard}>
                                                <p className={styles.benefitSection}>Section 24(b)</p>
                                                <p className={styles.benefitTitle}>Interest Deduction — Up to ₹2,00,000/year</p>
                                                <p className={styles.benefitText}>
                                                    You can claim deduction on the interest paid on your home loan up to ₹2 lakhs per financial year for a self-occupied property. For let-out or deemed let-out properties, there is no upper limit on the interest deduction.
                                                </p>
                                            </div>
                                            <div className={styles.benefitCard}>
                                                <p className={styles.benefitSection}>Section 80C</p>
                                                <p className={styles.benefitTitle}>Principal Repayment — Up to ₹1,50,000/year</p>
                                                <p className={styles.benefitText}>
                                                    The principal component of your EMI qualifies for deduction under Section 80C, subject to the overall limit of ₹1.5 lakhs (shared with PPF, ELSS, life insurance, etc.). Stamp duty and registration charges paid in the year of purchase also qualify.
                                                </p>
                                            </div>
                                            <div className={styles.benefitCard}>
                                                <p className={styles.benefitSection}>Section 80EEA</p>
                                                <p className={styles.benefitTitle}>Additional Interest — Up to ₹1,50,000/year</p>
                                                <p className={styles.benefitText}>
                                                    First-time home buyers can claim an additional deduction of up to ₹1.5 lakhs on interest paid, provided the stamp duty value of the property does not exceed ₹45 lakhs. This is over and above the Section 24(b) deduction.
                                                </p>
                                            </div>
                                            <div className={styles.benefitCard}>
                                                <p className={styles.benefitSection}>Joint Loan Benefit</p>
                                                <p className={styles.benefitTitle}>Double Deductions for Co-Borrowers</p>
                                                <p className={styles.benefitText}>
                                                    If you take a joint home loan with a co-applicant (spouse, parent, or sibling), each borrower can individually claim the full tax deductions. This effectively doubles the tax benefit available on the same property.
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>

                                    <div className={styles.divider} />

                                    {/* Fixed vs Floating */}
                                    <motion.div
                                        className={styles.block}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        <h3 className={styles.blockTitle}>Fixed vs Floating Interest Rate</h3>
                                        <p className={styles.blockText}>
                                            <strong>Fixed rate</strong> loans lock your interest rate for the entire tenure or a specific period. Your EMI remains constant regardless of market fluctuations. This offers predictability but is typically 1–2% higher than floating rates.
                                        </p>
                                        <p className={styles.blockText}>
                                            <strong>Floating rate</strong> loans are linked to an external benchmark (usually the RBI repo rate). When the benchmark changes, your interest rate adjusts accordingly. While this introduces variability, floating rates are generally lower and have historically benefited borrowers during rate-cut cycles.
                                        </p>
                                        <p className={styles.blockText}>
                                            In India, most lenders now offer floating rate loans linked to the External Benchmark Lending Rate (EBLR). For most borrowers, floating rate loans are the preferred choice due to the transparency in rate transmission and the overall lower cost over time.
                                        </p>
                                    </motion.div>

                                    <div className={styles.divider} />

                                    {/* Common Mistakes */}
                                    <motion.div
                                        className={styles.block}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6 }}
                                    >
                                        <h3 className={styles.blockTitle}>Common Mistakes to Avoid</h3>
                                        <p className={styles.blockText}>
                                            <strong>Not comparing lenders:</strong> Different banks offer different rates, processing fees, and prepayment terms. Always compare at least 3–4 lenders before finalising. A small difference in rate can translate to lakhs in savings over the tenure.
                                        </p>
                                        <p className={styles.blockText}>
                                            <strong>Ignoring additional costs:</strong> Beyond EMIs, factor in stamp duty (varies by state, typically 5–7%), registration fees (1%), GST on under-construction properties (5% without ITC), and maintenance charges. These can add 10–15% to the property cost.
                                        </p>
                                        <p className={styles.blockText}>
                                            <strong>Stretching beyond capacity:</strong> Financial advisors recommend that your total EMI burden (including all loans) should not exceed 40% of your monthly take-home income. Overcommitting can create financial stress during emergencies.
                                        </p>
                                        <p className={styles.blockText}>
                                            <strong>Choosing maximum tenure by default:</strong> While a longer tenure reduces your monthly EMI, it dramatically increases the total interest paid. A ₹50 lakh loan at 8.5% for 20 years costs ₹52.5 lakhs in interest, whereas the same loan for 30 years costs ₹88.2 lakhs — a difference of ₹35.7 lakhs.
                                        </p>
                                    </motion.div>

                                    {/* Disclaimer */}
                                    <div className={styles.disclaimer}>
                                        <p className={styles.disclaimerText}>
                                            The information provided above is for educational purposes only and should not be considered as financial advice. Interest rates, tax laws, and regulations are subject to change. Please consult a qualified financial advisor or chartered accountant before making any investment decisions.
                                        </p>
                                    </div>
                                </div>

                                {/* Sticky Contact Form */}
                                <StickyContactForm />
                            </div>
                        </div>
                    </section>

                    <Footer />
                </div>
            </main>
    );
}
