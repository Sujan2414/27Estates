'use client';

import { X, Check } from "lucide-react";

interface PasswordRequirementsProps {
    password: string;
}

const requirements = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "At least one uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "At least one lowercase letter", test: (p: string) => /[a-z]/.test(p) },
    { label: "At least one digit", test: (p: string) => /\d/.test(p) },
    { label: "At least one special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const PasswordRequirements = ({ password }: PasswordRequirementsProps) => {
    return (
        <div className="space-y-2">
            {requirements.map((req, index) => {
                const isValid = req.test(password);
                return (
                    <div
                        key={index}
                        className="password-requirement"
                    >
                        {isValid ? (
                            <Check size={16} style={{ color: 'hsl(142, 76%, 36%)' }} />
                        ) : (
                            <X size={16} className="text-muted-foreground" />
                        )}
                        <span className={isValid ? '' : ''} style={isValid ? { color: 'hsl(142, 76%, 36%)' } : undefined}>
                            {req.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default PasswordRequirements;
