'use client';

import React from "react";

interface PasswordInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    name?: string;
    required?: boolean;
}

const PasswordInput = ({
    value,
    onChange,
    placeholder = "Password",
    name = "password",
    required = true
}: PasswordInputProps) => {

    return (
        <div className="relative">
            <input
                type="password"
                name={name}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="auth-input"
                required={required}
            />
        </div>
    );
};

export default PasswordInput;
