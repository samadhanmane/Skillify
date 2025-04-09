@echo off
echo Installing and fixing dependencies...

echo 1. Removing existing TailwindCSS installation
npm uninstall tailwindcss postcss autoprefixer

echo 2. Installing TailwindCSS v3 (more compatible)
npm install -D tailwindcss@3.3.3 postcss@8.4.29 autoprefixer@10.4.15

echo 3. Installing Radix UI components
npm install @radix-ui/react-avatar @radix-ui/react-label @radix-ui/react-select @radix-ui/react-dropdown-menu @radix-ui/react-switch @radix-ui/react-slider @radix-ui/react-progress @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-tooltip @radix-ui/react-slot

echo 4. Installing utility packages
npm install clsx tailwind-merge class-variance-authority tailwindcss-animate date-fns

echo 5. Generating Tailwind configuration
npx tailwindcss init -p

echo All dependencies installed successfully!
echo You can now run 'npm run dev' to start the development server.
pause 