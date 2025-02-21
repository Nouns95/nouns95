import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import styles from './MarkdownReason.module.css';

interface MarkdownReasonProps {
  content: string;
}

const ImageComponent = ({ src, alt }: { src: string, alt?: string }) => {
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  if (!src || error) {
    return (
      <span className={styles.imageError}>
        Failed to load image
        {alt && <span className={styles.imageCaption}>{alt}</span>}
      </span>
    );
  }

  // Handle data URIs
  if (src.startsWith('data:')) {
    try {
      // Validate and decode data URI
      const [header, base64] = src.split(',');
      
      if (!header.includes('image/')) {
        setError(true);
        throw new Error('Invalid data URI format - not an image');
      }
      
      if (!base64) {
        setError(true);
        throw new Error('Invalid data URI format - no content');
      }

      try {
        atob(base64);
      } catch {
        setError(true);
        throw new Error('Invalid data URI format - invalid base64');
      }

      return (
        <span className={styles.imageContainer}>
          <span className={styles.imageWrapper}>
            <Image
              src={src}
              alt={alt || ''}
              width={500}
              height={300}
              className={styles.image}
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                display: loading ? 'none' : 'block',
                objectFit: 'contain'
              }}
              onLoadingComplete={() => setLoading(false)}
              onError={() => setError(true)}
            />
            {loading && (
              <div className={styles.loading}>Loading...</div>
            )}
          </span>
          {alt && <span className={styles.imageCaption}>{alt}</span>}
        </span>
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(true);
      return (
        <span className={styles.imageError}>
          Invalid data URI format: {errorMessage}
          {alt && <span className={styles.imageCaption}>{alt}</span>}
        </span>
      );
    }
  }

  // Handle IPFS URLs
  let imageSrc = src;
  if (src.startsWith('ipfs://')) {
    imageSrc = `https://ipfs.io/ipfs/${src.slice(7)}`;
  }

  return (
    <span className={styles.imageContainer}>
      <span className={`${styles.imageWrapper} ${loading ? styles.loading : ''}`}>
        <Image
          src={imageSrc}
          alt={alt || ''}
          width={500}
          height={300}
          className={styles.image}
          style={{ objectFit: 'contain' }}
          onLoadingComplete={() => setLoading(false)}
          onError={() => setError(true)}
        />
      </span>
      {alt && <span className={styles.imageCaption}>{alt}</span>}
    </span>
  );
};

export function MarkdownReason({ content }: MarkdownReasonProps) {
  console.log('MarkdownReason rendering with content length:', content?.length);
  console.log('Content preview:', content?.substring(0, 200));

  // Pre-process content to handle data URIs
  const [processedContent, dataUris] = React.useMemo(() => {
    const uris: Record<string, string> = {};
    let count = 0;
    
    // Replace data URIs with placeholders
    const processed = content.replace(
      /!\[(.*?)\]\((data:image\/[^;]+;base64,[^)]+)\)/g,
      (match, alt, uri) => {
        const placeholder = `__DATA_URI_${count}__`;
        uris[placeholder] = uri;
        count++;
        return `![${alt}](${placeholder})`;
      }
    );
    
    console.log('Pre-processed content:', {
      originalLength: content.length,
      processedLength: processed.length,
      dataUrisFound: Object.keys(uris).length
    });
    
    return [processed, uris] as const;
  }, [content]);

  const components: Components = {
    p: ({ children, node }) => {
      // Check if the paragraph only contains an image
      const childNodes = node?.children || [];
      console.log('Paragraph node children:', JSON.stringify(childNodes, null, 2));
      
      if (childNodes.length === 1 && 
          'tagName' in childNodes[0] && 
          childNodes[0].tagName === 'img') {
        
        // Extract the actual source from the node's value or properties
        if ('properties' in childNodes[0]) {
          const imgProps = childNodes[0].properties || {};
          const imgSrc = String(imgProps.src || '');
          
          // Check if this is a data URI placeholder
          if (imgSrc && imgSrc in dataUris) {
            console.log('Found data URI placeholder:', imgSrc);
            return <ImageComponent src={dataUris[imgSrc]} alt={String(imgProps.alt || '')} />;
          }
          
          // If we have a valid src in properties, use that
          if (imgSrc.length > 0) {
            return <ImageComponent src={imgSrc} alt={String(imgProps.alt || '')} />;
          }
        }
        
        return children;
      }
      return <p className={styles.paragraph}>{children}</p>;
    },
    h1: ({ children }) => <h1 className={styles.heading1}>{children}</h1>,
    h2: ({ children }) => <h2 className={styles.heading2}>{children}</h2>,
    h3: ({ children }) => <h3 className={styles.heading3}>{children}</h3>,
    h4: ({ children }) => <h4 className={styles.heading4}>{children}</h4>,
    
    a: ({ href, children }) => (
      <a 
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        {children}
      </a>
    ),
    
    ul: ({ children }) => <ul className={styles.list}>{children}</ul>,
    ol: ({ children }) => <ol className={styles.list}>{children}</ol>,
    li: ({ children }) => <li className={styles.listItem}>{children}</li>,
    
    code: ({ className, children }) => {
      const match = /language-(\w+)/.exec(className || '');
      return match ? (
        <pre className={`${styles.codeBlock} ${styles[match[1]]}`}>
          <code>{children}</code>
        </pre>
      ) : (
        <code className={styles.inlineCode}>{children}</code>
      );
    },
    
    img: ({ src, alt }) => {
      // Check if this is a data URI placeholder
      const imgSrc = String(src || '');
      if (imgSrc && imgSrc in dataUris) {
        console.log('Found data URI placeholder in img component:', imgSrc);
        return <ImageComponent src={dataUris[imgSrc]} alt={alt || ''} />;
      }
      
      return imgSrc ? <ImageComponent src={imgSrc} alt={alt || ''} /> : null;
    },
    
    table: ({ children }) => (
      <div className={styles.tableContainer}>
        <table className={styles.table}>{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className={styles.tableHead}>{children}</thead>,
    tbody: ({ children }) => <tbody className={styles.tableBody}>{children}</tbody>,
    tr: ({ children }) => <tr className={styles.tableRow}>{children}</tr>,
    th: ({ children }) => <th className={styles.tableHeader}>{children}</th>,
    td: ({ children }) => <td className={styles.tableCell}>{children}</td>,
    
    blockquote: ({ children }) => (
      <blockquote className={styles.blockquote}>{children}</blockquote>
    ),
    
    hr: () => <hr className={styles.hr} />,
  };

  return (
    <div className={styles.container}>
      <ReactMarkdown
        className={styles.markdown}
        remarkPlugins={[remarkGfm]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
} 