"use client";

import { useState, useEffect } from "react";
import { Mail, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "@/components/emergent/Agents.module.css";

interface Agent {
    id: string;
    name: string;
    email: string;
    phone: string;
    image: string;
    role: string;
    bio: string;
}

const Agents = () => {
    const supabase = createClient();
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const { data, error } = await supabase
                    .from('agents')
                    .select('*')
                    .order('name');

                if (error) throw error;
                setAgents(data || []);
            } catch (error) {
                console.error("Error fetching agents:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAgents();
    }, []);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingText}>Loading agents...</div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>Agents</h1>
            </div>

            <div className={styles.grid}>
                {agents.map((agent) => (
                    <div key={agent.id} className={styles.agentCard}>
                        {/* Agent Image */}
                        <div className={styles.agentImage}>
                            <img
                                src={agent.image || '/placeholder-agent.jpg'}
                                alt={agent.name}
                                className={styles.image}
                            />
                        </div>

                        {/* Agent Info */}
                        <div className={styles.agentInfo}>
                            <h3 className={styles.agentName}>{agent.name}</h3>
                            <p className={styles.agentRole}>{agent.role}</p>

                            <div className={styles.contactInfo}>
                                <a href={`mailto:${agent.email}`} className={styles.contactLink}>
                                    <Mail size={14} strokeWidth={1.5} />
                                    <span>{agent.email}</span>
                                </a>
                                <a href={`tel:${agent.phone}`} className={styles.contactLink}>
                                    <Phone size={14} strokeWidth={1.5} />
                                    <span>{agent.phone}</span>
                                </a>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Agents;
