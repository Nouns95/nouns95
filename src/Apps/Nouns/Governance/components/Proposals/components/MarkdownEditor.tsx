import React, { useState } from 'react';
import { MarkdownReason } from './MarkdownReason';
import styles from './MarkdownEditor.module.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

export function MarkdownEditor({ 
  value, 
  onChange, 
  placeholder = "Write your description in markdown...", 
  disabled = false,
  rows = 8 
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const insertText = (before: string, after: string = '') => {
    const textarea = document.querySelector(`.${styles.textarea}`) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    
    onChange(newText);
    
    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatActions = [
    { label: 'Bold', action: () => insertText('**', '**'), icon: 'B' },
    { label: 'Italic', action: () => insertText('*', '*'), icon: 'I' },
    { label: 'Link', action: () => insertText('[', '](url)'), icon: '🔗' },
    { label: 'Image', action: () => insertText('![alt text](', ')'), icon: '🖼️' },
    { label: 'Code', action: () => insertText('`', '`'), icon: '<>' },
    { label: 'Heading', action: () => insertText('## '), icon: 'H' },
    { label: 'List', action: () => insertText('- '), icon: '•' },
    { label: 'Quote', action: () => insertText('> '), icon: '"' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'edit' ? styles.active : ''}`}
            onClick={() => setActiveTab('edit')}
            disabled={disabled}
          >
            ✏️ Edit
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'preview' ? styles.active : ''}`}
            onClick={() => setActiveTab('preview')}
            disabled={disabled}
          >
            👁️ Preview
          </button>
        </div>
        
        {activeTab === 'edit' && (
          <div className={styles.toolbar}>
            {formatActions.map((action, index) => (
              <button
                key={index}
                className={styles.toolbarButton}
                onClick={action.action}
                title={action.label}
                disabled={disabled}
                type="button"
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.content}>
        {activeTab === 'edit' ? (
          <textarea
            className={styles.textarea}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
          />
        ) : (
          <div className={styles.preview}>
            {value.trim() ? (
              <MarkdownReason content={value} />
            ) : (
              <div className={styles.emptyPreview}>
                No content to preview. Switch to Edit tab to start writing.
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'edit' && (
        <div className={styles.help}>
          <details className={styles.helpDetails}>
            <summary>Markdown Help</summary>
            <div className={styles.helpContent}>
              <div className={styles.helpSection}>
                <strong>Formatting:</strong>
                <ul>
                  <li><code>**bold**</code> → <strong>bold</strong></li>
                  <li><code>*italic*</code> → <em>italic</em></li>
                  <li><code>`code`</code> → <code>code</code></li>
                </ul>
              </div>
              <div className={styles.helpSection}>
                <strong>Structure:</strong>
                <ul>
                  <li><code># Heading 1</code></li>
                  <li><code>## Heading 2</code></li>
                  <li><code>- List item</code></li>
                  <li><code>&gt; Quote</code></li>
                </ul>
              </div>
              <div className={styles.helpSection}>
                <strong>Links & Media:</strong>
                <ul>
                  <li><code>[text](url)</code> → link</li>
                  <li><code>![alt](url)</code> → image</li>
                  <li>YouTube/Vimeo/Loom URLs are auto-embedded</li>
                </ul>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}