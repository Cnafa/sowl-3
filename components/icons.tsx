
// components/icons.tsx
import React from 'react';

const Icon: React.FC<React.SVGProps<SVGSVGElement> & { children: React.ReactNode }> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        {props.children}
    </svg>
);

// General & Actions
export const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></Icon>);
export const PlusCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></Icon>);
export const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></Icon>);
export const ArrowTopRightOnSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6" /><path d="m21 3-9 9" /><path d="M15 3h6v6" /></Icon>);
export const SettingsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1 0 2l-.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></Icon>);
export const PowerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M12 2v10" /><path d="M18.4 6.6a9 9 0 1 1-12.77.04" /></Icon>);
export const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="m15 18-6-6 6-6" /></Icon>);
export const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="m9 18 6-6-6-6" /></Icon>);
export const BellIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></Icon>);

// Form Fields
export const TypeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M14 4h4v4"/><path d="M18 4 8 14"/><path d="M8 20h4v-4"/><path d="m12 20 10-10"/></Icon>);

// Added for LoginScreen, which imports it.
export const GoogleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48px" height="48px" {...props}>
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.223,0-9.65-3.657-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C41.383,36.923,44,30.938,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

// NEW LOGO COMPONENT - Updated to include pixel art owl
export const ScrumOwlLogo: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary shrink-0">
          <path fillRule="evenodd" clipRule="evenodd" d="M7 3H5V5H3V9H2V17H4V20H6V22H10V21H14V22H18V20H20V17H22V9H21V5H19V3H17V5H15V3H9V5H7V3ZM6 9H9V13H6V9ZM15 9H18V13H15V9Z" fill="currentColor"/>
          <rect x="6" y="9" width="3" height="4" fill="white"/>
          <rect x="15" y="9" width="3" height="4" fill="white"/>
          <rect x="8" y="10" width="1" height="2" fill="#1e293b"/>
          <rect x="17" y="10" width="1" height="2" fill="#1e293b"/>
          <rect x="11" y="14" width="2" height="2" fill="#F59E0B"/>
      </svg>
      <span className="font-sans font-bold text-[#3B3936] tracking-tighter text-[1.2em]">
          <span className="text-primary">S</span>crumOw<span className="text-primary">l</span>
      </span>
  </div>
);

// General Work Item Icons
export const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></Icon>);
export const UserRoundIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></Icon>);
export const MilestoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></Icon>);
export const BoxesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="m3.27 6.96 8.73 5.05 8.73-5.05"/><path d="M12 22.08V12"/></Icon>);
export const TimerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="12" y1="14" y2="18"/><path d="M12 22c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/></Icon>);
export const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></Icon>);
export const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></Icon>);
export const FlagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></Icon>);
export const PaperclipIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></Icon>);
export const CheckSquareIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Icon>);
export const GitBranchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></Icon>);
export const TagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.432 0l6.568-6.568a2.426 2.426 0 0 0 0-3.432L12.586 2.586z"/><circle cx="8.5" cy="8.5" r=".5" fill="currentColor"/></Icon>);
export const UsersRoundIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-4-3"/></Icon>);
export const MountainIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></Icon>);
export const LayoutKanbanIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/></Icon>);
export const ClipboardCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></Icon>);
export const BookmarkPlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><line x1="12" x2="12" y1="7" y2="13"/><line x1="9" x2="15" y1="10" y2="10"/></Icon>);
export const FolderCogIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M20 12.58A6 6 0 0 0 12 8a6 6 0 0 0-8 4.42"/><path d="M22 18V9a2 2 0 0 0-2-2h-4.46a2 2 0 0 1-1.41-.59L12.61 4.9a2 2 0 0 0-1.41-.59H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h4.42"/><circle cx="17" cy="18" r="3"/><path d="M17 15.2v.3a2 2 0 0 0 1.9 2c.8 0 1.5-.4 1.9-1"/><path d="m17 20.8-.3-.1a2 2 0 0 0-2-1.9c-.8 0-1.5.4-1.9 1"/><path d="M14.2 18h-.3a2 2 0 0 0-2 1.9c0 .8.4 1.5 1 1.9"/><path d="m19.8 18 .3.1a2 2 0 0 0 2-1.9c0-.8-.4-1.5-1-1.9"/></Icon>);
export const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Icon>);
export const RepeatIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M17 2l4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></Icon>);
export const CalendarRangeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M17 14h-6"/><path d="M13 18H7"/></Icon>);
export const BarChart3Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></Icon>);
export const BookmarkCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/><path d="m9 10 2 2 4-4"/></Icon>);
export const MagnifyingGlassIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Icon>);
export const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></Icon>);
export const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Icon>);
export const LockClosedIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Icon>);
export const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></Icon>);
export const DocumentDuplicateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></Icon>);
export const BoldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></Icon>);
export const ItalicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></Icon>);
export const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Icon>);
export const CodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></Icon>);
export const BulletListIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></Icon>);
export const NumberedListIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><line x1="9" x2="21" y1="6" y2="6"/><line x1="9" x2="21" y1="12" y2="12"/><line x1="9" x2="21" y1="18" y2="18"/><path d="M4.5 6H5a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H3.5a1 1 0 0 0-1 1V5c0 .6.4 1 1 1z"/><path d="M3.5 12H5a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H3.5A1 1 0 0 0 2.5 9v2c0 .6.4 1 1 1z"/><path d="M3.5 18H5a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3.5a1 1 0 0 0-1 1v2c0 .6.4 1 1 1z"/></Icon>);
export const Heading3Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17 18h4"/><path d="M21 12h-4"/><path d="M17 12h2a2 2 0 1 0-2-2V8a2 2 0 1 1 2 2h-2"/></Icon>);
export const Heading4Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17 18v-5.5"/><path d="M21 12.5H17"/><path d="M21 18v-7"/></Icon>);
export const Heading5Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></Icon>);
export const Heading6Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/></Icon>);
export const ColorSwatchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 2v20"/><path d="m19 12-7-3-7 3"/></Icon>);
export const HighlightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="m16 5-8.5 8.5a.5.5 0 0 0 0 .7l4.3 4.3c.2.2.5.2.7 0L21 11.5"/><path d="M22 6l-5 5"/><path d="M2 18h8"/><path d="M3 14h7"/></Icon>);
export const CodeBlockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 9 3 3-3 3"/><path d="m13 15 3-3-3-3"/></Icon>);
export const CalendarDaysIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></Icon>);
export const BugIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="m8 2 1.88 1.88" /><path d="M14.12 3.88 16 2" /><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" /><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" /><path d="M12 20v-9" /><path d="M6.53 9C4.6 8.8 3 7.1 3 5" /><path d="M6 13H2" /><path d="M3 21c0-2.1 1.7-3.9 3.8-4" /><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" /><path d="M22 13h-4" /><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" /></Icon>);
// US-47: Icons for Rich Text Editor
export const TableIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="3" x2="9" y2="21"/></Icon>);
export const ImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></Icon>);
export const AlignLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="17" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></Icon>);
export const AlignCenterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><line x1="21" y1="10" x2="3" y2="10"/><line x1="19" y1="6" x2="5" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="19" y1="18" x2="5" y2="18"/></Icon>);
export const AlignRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="7" y2="14"/><line x1="21" y1="18" x2="3" y2="18"/></Icon>);
export const Heading2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></Icon>);
export const UnderlineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" x2="20" y1="20" y2="20"/></Icon>);
export const StrikethroughIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M16 4H9a3 3 0 0 0-2.83 4"/><path d="M14 12a4 4 0 0 1 0 8H6"/><line x1="4" x2="20" y1="12" y2="12"/></Icon>);

// --- Extended Epic Icon Pack ---
export const RocketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></Icon>);
export const TargetIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Icon>);
export const ZapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>);
export const GlobeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></Icon>);
export const CubeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="m21 16-9 4-9-4"/><path d="m21 8-9 4-9-4"/><path d="m21 12-9 4-9-4"/><path d="M12 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2 2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></Icon>);
export const LightbulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-1 .9-2.6-.2-3.7a3.8 3.8 0 0 0-5.6 0c-1.1 1-1.2 2.6-.2 3.7.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></Icon>);
// New Icons for the Pack
export const ActivityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></Icon>);
export const AnchorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></Icon>);
export const AwardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></Icon>);
export const BanknoteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></Icon>);
export const BookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></Icon>);
export const BotIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></Icon>);
export const BriefcaseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></Icon>);
export const CloudIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19 8.963 24.5 12 24.5s5.5-2.463 5.5-5.5z"/><path d="M12 13.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11z"/></Icon>);
export const CoinsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/></Icon>);
export const CompassIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></Icon>);
export const DatabaseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></Icon>);
export const FlameIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.1.2-2.2.5-3.3.3-1.1 1.1-2.2 2-3.2.5.8 1 1.7 1 2.5z"/></Icon>);
export const GamepadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/></Icon>);
export const GiftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/></Icon>);
export const HeartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></Icon>);
export const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></Icon>);
export const LayersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></Icon>);
export const LifeBuoyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></Icon>);
export const MegaphoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></Icon>);
export const MicroscopeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"/><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"/></Icon>);
export const MonitorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></Icon>);
export const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></Icon>);
export const MusicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></Icon>);
export const PlaneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M2 12h20"/><path d="M13 2v20"/><path d="m9 7 7-5-7-5"/><path d="m9 17 7 5-7 5"/></Icon>);
export const PlugIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></Icon>);
export const PuzzleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M19.439 15.4a2 2 0 0 1-3.04 2.6 2 2 0 0 0-3 1.73V20a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h.5a2 2 0 0 0 1.73-3 2 2 0 0 1 2.6-3.04V2a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-.5a2 2 0 0 0-1.73 3 2 2 0 0 1 2.6 3.04Z"/></Icon>);
export const ServerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></Icon>);
export const ShieldIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></Icon>);
export const ShoppingCartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></Icon>);
export const SmartphoneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></Icon>);
export const SunIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></Icon>);
export const TerminalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></Icon>);
export const TruckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></Icon>);
export const UmbrellaIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M22 12a10.06 10.06 1 0 0 0-20 0Z"/><path d="M12 12v8a2 2 0 0 0 4 0"/><path d="M12 2v1"/></Icon>);
export const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></Icon>);
export const WalletIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></Icon>);
export const WandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></Icon>);
export const WifiIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></Icon>);
export const WrenchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (<Icon {...props}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></Icon>);

// Map for dynamic lookup
export const ICON_MAP: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
    mountain: MountainIcon, rocket: RocketIcon, target: TargetIcon, zap: ZapIcon, globe: GlobeIcon, cube: CubeIcon, lightbulb: LightbulbIcon,
    activity: ActivityIcon, anchor: AnchorIcon, award: AwardIcon, banknote: BanknoteIcon, book: BookIcon, bot: BotIcon, briefcase: BriefcaseIcon,
    cloud: CloudIcon, coins: CoinsIcon, compass: CompassIcon, database: DatabaseIcon, flame: FlameIcon, gamepad: GamepadIcon, gift: GiftIcon,
    heart: HeartIcon, key: KeyIcon, layers: LayersIcon, lifebuoy: LifeBuoyIcon, megaphone: MegaphoneIcon, microscope: MicroscopeIcon,
    monitor: MonitorIcon, moon: MoonIcon, music: MusicIcon, plane: PlaneIcon, plug: PlugIcon, puzzle: PuzzleIcon, server: ServerIcon,
    shield: ShieldIcon, shoppingcart: ShoppingCartIcon, smartphone: SmartphoneIcon, sun: SunIcon, terminal: TerminalIcon, truck: TruckIcon,
    umbrella: UmbrellaIcon, video: VideoIcon, wallet: WalletIcon, wand: WandIcon, wifi: WifiIcon, wrench: WrenchIcon
};

export const getIconByKey = (key: string, props: React.SVGProps<SVGSVGElement> = {}) => {
    const Component = ICON_MAP[key] || MountainIcon;
    return <Component {...props} />;
};