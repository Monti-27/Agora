import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-light text-black dark:text-white">
              ChatApp
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Link href="/auth/login">
              <span className="text-sm text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer">
                Sign In
              </span>
            </Link>
            <Link href="/auth/register">
              <span className="text-sm bg-black dark:bg-white text-white dark:text-black px-4 py-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors cursor-pointer">
                Get Started
              </span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
