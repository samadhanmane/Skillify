@echo off
echo Installing frontend dependencies...

npm install react react-dom @tanstack/react-query react-router-dom
npm install vite @vitejs/plugin-react-swc
npm install next-themes sonner
npm install @radix-ui/react-tooltip @radix-ui/react-slot @radix-ui/react-toast @radix-ui/react-tabs @radix-ui/react-dialog
npm install @radix-ui/react-avatar @radix-ui/react-select @radix-ui/react-switch @radix-ui/react-label
npm install @radix-ui/react-dropdown-menu @radix-ui/react-separator @radix-ui/react-radio-group @radix-ui/react-checkbox
npm install lucide-react @hookform/resolvers zod react-hook-form
npm install class-variance-authority clsx tailwind-merge tailwindcss-animate
npm install axios recharts

echo.
echo All frontend dependencies installed!
echo You can now run the frontend with: npm run dev
echo. 