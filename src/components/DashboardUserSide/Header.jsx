import { Home, Search, FileText, Settings } from 'lucide-react';

const Header = () => {
  const navItems = [
    { icon: Home, label: 'Dashboard', active: true },
    { icon: Search, label: 'Search', active: false },
    { icon: FileText, label: 'Reports', active: false },
    { icon: Settings, label: 'Settings', active: false }
  ];

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <nav className="flex space-x-8">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <a
                  key={item.label}
                  href="#"
                  className={`flex items-center space-x-2 text-sm font-medium transition-colors duration-200 ${
                    item.active
                      ? 'text-gray-900 border-b-2 border-blue-500 pb-4'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;