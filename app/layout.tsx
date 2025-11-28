import React from 'react';
import { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { LocaleProvider } from '../context/LocaleContext';
import { SettingsProvider } from '../context/SettingsContext';
import { BoardProvider } from '../context/BoardContext';
import { NavigationProvider } from '../context/NavigationContext';
import { ErrorBoundary } from '../components/system/ErrorBoundary';
import { bootstrapApp } from '../app/bootstrap';

// Initialize crash logger and global hooks
if (typeof window !== 'undefined') {
  bootstrapApp();
}

export const metadata: Metadata = {
  title: 'ScrumOwl',
  description: 'A sophisticated work item editor.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Hack:wght@400;700&family=Vazirmatn:wght@400;700&display=swap" rel="stylesheet" />
        <script src="https://cdn.tailwindcss.com?plugins=typography"></script>
      </head>
      <body>
        <ErrorBoundary>
          <LocaleProvider>
            <SettingsProvider>
              <AuthProvider>
                <BoardProvider>
                  <NavigationProvider>
                    {children}
                  </NavigationProvider>
                </BoardProvider>
              </AuthProvider>
            </SettingsProvider>
          </LocaleProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}