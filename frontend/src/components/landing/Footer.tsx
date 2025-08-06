import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center text-xs text-black dark:text-white">
          <div>
            © 2025 ChatApp
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="#" 
              className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              GitHub
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link 
              href="#" 
              className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              Docs
            </Link>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <Link 
              href="#" 
              className="hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            >
              Twitter
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
