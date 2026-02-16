import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function EmailConfirmedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900">Email Confirmed!</h1>

                <p className="text-gray-600 text-lg">
                    Your email address has been successfully verified. You are now logged in and ready to access your account.
                </p>

                <div className="pt-4">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-medium text-white bg-[var(--dark-turquoise)] hover:bg-[#0d4e4e] rounded-md transition-colors duration-200"
                    >
                        Go to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}
