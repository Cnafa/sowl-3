
// components/RichTextEditor.tsx
import React, { useEffect, useRef } from 'react';
import { useLocale } from '../context/LocaleContext';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    onValidityChange?: (isValid: boolean) => void;
    editable?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, onValidityChange, editable = true }) => {
    const { locale } = useLocale();
    const editorRef = useRef<HTMLDivElement>(null);
    const quillInstance = useRef<any>(null);
    const isInternalChange = useRef(false);

    useEffect(() => {
        if (!editorRef.current) return;

        // Initialize Quill
        // @ts-ignore - Quill is loaded globally via CDN in index.html
        if (window.Quill && !quillInstance.current) {
            // @ts-ignore
            quillInstance.current = new window.Quill(editorRef.current, {
                theme: 'snow',
                readOnly: !editable,
                modules: {
                    toolbar: editable ? [
                        [{ 'font': [] }, { 'size': ['small', false, 'large', 'huge'] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'script': 'sub'}, { 'script': 'super' }],
                        [{ 'header': 1 }, { 'header': 2 }, 'blockquote', 'code-block'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'direction': 'rtl' }, { 'align': [] }],
                        ['link', 'image', 'video', 'formula'],
                        ['clean']
                    ] : false
                },
                placeholder: 'Type something...',
            });

            // Set initial content
            if (value) {
                quillInstance.current.root.innerHTML = value;
            }

            // Handle Text Change
            quillInstance.current.on('text-change', () => {
                isInternalChange.current = true;
                const html = quillInstance.current.root.innerHTML;
                const text = quillInstance.current.getText();
                onChange(html === '<p><br></p>' ? '' : html);
                
                // Simple validation: limit chars
                if (onValidityChange) {
                    onValidityChange(text.length > 20000);
                }
            });
        }

        return () => {
            // Cleanup if necessary, though standard Quill doesn't have a strict destroy
        };
    }, []);

    // Update content if changed externally
    useEffect(() => {
        if (quillInstance.current) {
            if (isInternalChange.current) {
                isInternalChange.current = false;
                return;
            }
            const currentContent = quillInstance.current.root.innerHTML;
            if (value !== currentContent && value !== undefined) {
                quillInstance.current.root.innerHTML = value;
            }
        }
    }, [value]);

    // Update ReadOnly state
    useEffect(() => {
        if (quillInstance.current) {
            quillInstance.current.enable(editable);
        }
    }, [editable]);

    // Update direction based on locale
    useEffect(() => {
        if (quillInstance.current && quillInstance.current.root) {
            quillInstance.current.root.setAttribute('dir', locale === 'fa-IR' ? 'rtl' : 'ltr');
            if (locale === 'fa-IR') {
                quillInstance.current.root.classList.add('font-vazir');
            } else {
                quillInstance.current.root.classList.remove('font-vazir');
            }
        }
    }, [locale]);

    return (
        <div className="bg-white text-slate-900">
            <div ref={editorRef} className={`${locale === 'fa-IR' ? 'font-vazir text-right' : ''}`} style={{ minHeight: '200px' }} />
        </div>
    );
};
