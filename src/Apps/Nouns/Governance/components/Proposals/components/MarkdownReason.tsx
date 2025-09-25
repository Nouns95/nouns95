import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Image from 'next/image';
import styles from './MarkdownReason.module.css';

// Type for React element props that might contain data-video-url
interface VideoLinkProps {
  'data-video-url'?: string;
  [key: string]: unknown;
}

interface MarkdownReasonProps {
  content: string;
}

// Video embed utilities
const getYouTubeVideoId = (url: string) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const getVimeoVideoId = (url: string) => {
  const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_-]+)?/i;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

const getLoomVideoId = (url: string) => {
  const regExp = /loom\.com\/share\/([a-zA-Z0-9-]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

const isVideoUrl = (url: string): boolean => {
  const youtubeId = getYouTubeVideoId(url);
  const vimeoId = getVimeoVideoId(url);
  const loomId = getLoomVideoId(url);
  return Boolean(youtubeId || vimeoId || loomId);
};

const isImageUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname.toLowerCase();
    return pathname.endsWith('.gif') || 
           pathname.endsWith('.jpg') || 
           pathname.endsWith('.jpeg') || 
           pathname.endsWith('.png') || 
           pathname.endsWith('.webp') || 
           pathname.endsWith('.svg');
  } catch {
    return false;
  }
};

const isGifUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname.toLowerCase();
    return pathname.endsWith('.gif');
  } catch {
    return false;
  }
};

const VideoEmbed = ({ url }: { url: string }) => {
  const youtubeId = getYouTubeVideoId(url);
  const vimeoId = getVimeoVideoId(url);
  const loomId = getLoomVideoId(url);

  if (youtubeId) {
    return (
      <div className={styles.videoContainer}>
        <iframe
          width="800"
          height="450"
          src={`https://www.youtube.com/embed/${youtubeId}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (vimeoId) {
    return (
      <div className={styles.videoContainer}>
        <iframe
          width="800"
          height="450"
          src={`https://player.vimeo.com/video/${vimeoId}`}
          title="Vimeo video player"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (loomId) {
    return (
      <div className={styles.videoContainer}>
        <iframe
          width="800"
          height="450"
          src={`https://www.loom.com/embed/${loomId}`}
          title="Loom video player"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return null;
};

const ImageComponent = ({ src, alt }: { src: string, alt?: string }) => {
  const [error, setError] = React.useState(false);


  if (!src) {
    return (
      <span className={styles.imageError}>
        No image source provided
        {alt && <span className={styles.imageCaption}>{alt}</span>}
      </span>
    );
  }

  if (error) {
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={alt || ''}
              className={styles.image}
              style={{ 
                maxWidth: '100%', 
                height: 'auto',
                objectFit: 'contain',
                display: 'block'
              }}
              onError={() => setError(true)}
            />
          </span>
          {alt && <span className={styles.imageCaption}>{alt}</span>}
        </span>
      );
    } catch {
      setError(true);
      return null; // This will trigger the error state above
    }
  }

  // Handle IPFS URLs
  let imageSrc = src;
  if (src.startsWith('ipfs://')) {
    imageSrc = `https://ipfs.io/ipfs/${src.slice(7)}`;
  }

  return (
    <span className={styles.imageContainer}>
      <span className={styles.imageWrapper}>
        <Image
          src={imageSrc}
          alt={alt || ''}
          width={500}
          height={300}
          className={styles.image}
          style={{ 
            objectFit: 'contain'
          }}
          onError={() => setError(true)}
          priority={false}
        />
      </span>
      {alt && <span className={styles.imageCaption}>{alt}</span>}
    </span>
  );
};

export function MarkdownReason({ content }: MarkdownReasonProps) {

  // Pre-process content to handle data URIs and convert plain image URLs
  const [processedContent, dataUris] = React.useMemo(() => {
    const uris: Record<string, string> = {};
    let count = 0;
    
    console.log('📄 FULL CONTENT:', content);
    
    // Debug: Look for any base64 images in the content
    const base64Matches = content.match(/data:image\/[^)]+/g);
    if (base64Matches) {
      console.log('🔎 Found base64 images in content:', base64Matches.map(m => m.substring(0, 50) + '...'));
    }
    
    // Debug: Look for image links 
    const imageLinkMatches = content.match(/\[!\[[^\]]*\]\([^)]+\)\]\([^)]+\)/g);
    if (imageLinkMatches) {
      console.log('🔗 Found image links:', imageLinkMatches);
    }
    
    // Start with the original content
    let processed = content;
    
    // First, convert plain image URLs (including GIFs) to markdown image syntax
    // Match URLs that end with image extensions and are not already in markdown syntax
    const imageUrlRegex = /(?<!\]\()(https?:\/\/[^\s<>\[\]()]+\.(?:gif|jpg|jpeg|png|webp|svg))(?!\))/gi;
    processed = processed.replace(imageUrlRegex, (match) => {
      console.log('🖼️ Converting plain image URL to markdown:', match);
      // Extract filename for alt text
      const filename = match.split('/').pop()?.split('.')[0] || 'image';
      return `![${filename}](${match})`;
    });
    
    // Handle linked images FIRST: [![alt](data:...)](external-link)
    // This needs to come before standalone images to avoid conflicts
    // More flexible regex to catch various base64 formats
    processed = processed.replace(
      /\[!\[(.*?)\]\((data:image\/[^;]+;base64,[^)]+)\)\]\(([^)]+)\)/g,
      (match, alt, uri, externalLink) => {
        console.log('🔍 REGEX MATCHED linked base64:', { match, alt, uri: uri.substring(0, 50) + '...', externalLink });
        const placeholder = `__DATA_URI_${count}__`;
        const linkPlaceholder = `__LINK_${count}__`;
        uris[placeholder] = uri;
        uris[linkPlaceholder] = externalLink;
        count++;
        // Convert to image with special link marker
        return `[![${alt}](${placeholder})](${linkPlaceholder})`;
      }
    );
    
    // Handle standalone images: ![alt](data:...)
    processed = processed.replace(
      /!\[(.*?)\]\((data:image\/[^;]+;base64,[^)]+)\)/g,
      (match, alt, uri) => {
        const placeholder = `__DATA_URI_${count}__`;
        uris[placeholder] = uri;
        count++;
        return `![${alt}](${placeholder})`;
      }
    );
    

    
    
    return [processed, uris] as const;
  }, [content]);

  const components: Components = {
    p: ({ children, node }) => {
      // Check if the paragraph only contains an image or a link
      const childNodes = node?.children || [];
      
      if (childNodes.length === 1) {
        // Handle image case - return as div to avoid nesting block elements in p
        if ('tagName' in childNodes[0] && childNodes[0].tagName === 'img') {
          if ('properties' in childNodes[0]) {
            const imgProps = childNodes[0].properties || {};
            const imgSrc = String(imgProps.src || '');
            
            if (imgSrc && imgSrc in dataUris) {
              return <div><ImageComponent src={dataUris[imgSrc]} alt={String(imgProps.alt || '')} /></div>;
            }
            
            if (imgSrc.length > 0) {
              return <div><ImageComponent src={imgSrc} alt={String(imgProps.alt || '')} /></div>;
            }
          }
          return <div>{children}</div>;
        }
        
        // Handle linked image case: [![alt](src)](link)
        if ('tagName' in childNodes[0] && childNodes[0].tagName === 'a') {
          if ('properties' in childNodes[0] && 'children' in childNodes[0]) {
            const linkProps = childNodes[0].properties || {};
            const href = String(linkProps.href || '');
            const linkChildren = (childNodes[0].children || []) as unknown as React.ReactNode[];
            
            // Check if this link contains only an image
            if (linkChildren.length === 1 && 
                typeof linkChildren[0] === 'object' && 
                linkChildren[0] !== null &&
                'tagName' in linkChildren[0] && 
                (linkChildren[0] as { tagName: string }).tagName === 'img') {
              const imgProps = (linkChildren[0] as unknown as { properties: Record<string, unknown> }).properties || {};
              const imgSrc = String(imgProps.src || '');
              const imgAlt = String(imgProps.alt || '');
              
              // Handle data URI images with external links
              if (imgSrc && imgSrc in dataUris) {
                const actualLink = href in dataUris ? dataUris[href] : href;
                const base64Src = dataUris[imgSrc];
                
                console.log('🎯 RENDERING linked base64 image:', { 
                  imgSrc, 
                  imgAlt, 
                  hasDataUri: imgSrc in dataUris,
                  base64Preview: base64Src ? base64Src.substring(0, 50) + '...' : 'undefined',
                  actualLink 
                });
                
                // For base64 images, use regular img tag directly
                return (
                  <div>
                    <a href={actualLink} target="_blank" rel="noopener noreferrer">
                      <span className={styles.imageContainer}>
                        <span className={styles.imageWrapper}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={base64Src}
                            alt={imgAlt}
                            className={styles.image}
                            style={{ 
                              maxWidth: '100%', 
                              height: 'auto',
                              objectFit: 'contain',
                              display: 'block'
                            }}
                            onError={(e) => {
                              console.log('❌ Regular img failed for linked base64:', e);
                              console.log('Src that failed:', base64Src ? base64Src.substring(0, 100) + '...' : 'undefined');
                            }}
                            onLoad={() => {
                              console.log('✅ Regular img loaded successfully for linked base64');
                            }}
                          />
                        </span>
                        {imgAlt && <span className={styles.imageCaption}>{imgAlt}</span>}
                      </span>
                    </a>
                  </div>
                );
              }
              
              // Handle regular images with links
              if (imgSrc.length > 0) {
                const actualLink = href in dataUris ? dataUris[href] : href;
                return (
                  <div>
                    <a href={actualLink} target="_blank" rel="noopener noreferrer">
                      <ImageComponent src={imgSrc} alt={imgAlt} />
                    </a>
                  </div>
                );
              }
            }
            
            // Handle video links (existing logic)
            if (href && isVideoUrl(href)) {
              return <VideoEmbed url={href} />;
            }
          }
        }
      }
      
      // For mixed content paragraphs, render as paragraph but avoid nesting div in p
      // Check if any child is a video link and convert to simple text
      const hasVideoLinks = React.Children.toArray(children).some(child => {
        return React.isValidElement(child) && 
               child.type === 'a' && 
               child.props && 
               typeof child.props === 'object' &&
               'data-video-url' in child.props &&
               (child.props as VideoLinkProps)['data-video-url'];
      });
      
      if (hasVideoLinks) {
        // Replace video links with simple text links in mixed content
        const processedChildren = React.Children.map(children, (child) => {
          if (React.isValidElement(child) && 
              child.type === 'a' && 
              child.props && 
              typeof child.props === 'object' &&
              'data-video-url' in child.props &&
              (child.props as VideoLinkProps)['data-video-url']) {
            const newProps = { ...(child.props as VideoLinkProps) };
            delete newProps['data-video-url'];
            return React.cloneElement(child as React.ReactElement, newProps);
          }
          return child;
        });
        return <p className={styles.paragraph}>{processedChildren}</p>;
      }
      
      return <p className={styles.paragraph}>{children}</p>;
    },
    h1: ({ children }) => <h1 className={styles.heading1}>{children}</h1>,
    h2: ({ children }) => <h2 className={styles.heading2}>{children}</h2>,
    h3: ({ children }) => <h3 className={styles.heading3}>{children}</h3>,
    h4: ({ children }) => <h4 className={styles.heading4}>{children}</h4>,
    
    a: ({ href, children }) => {
      // Handle video embeds and image URLs
      if (href && isVideoUrl(href)) {
        return (
          <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            data-video-url={href}
          >
            {children}
          </a>
        );
      }
      
      // If this is an image URL link, render it normally but mark it
      if (href && isImageUrl(href)) {
        return (
          <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            data-image-url={href}
          >
            {children}
          </a>
        );
      }
      
      return (
        <a 
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}
        >
          {children}
        </a>
      );
    },
    
    ul: ({ children }) => <ul className={styles.list}>{children}</ul>,
    ol: ({ children }) => <ol className={styles.list}>{children}</ol>,
    li: ({ children }) => <li className={styles.listItem}>{children}</li>,
    
    code: ({ className, children }) => {
      // If it's a code block (has className with language)
      const match = /language-(\w+)/.exec(className || '');
      
      // Check if this is an address or signature (single line of hex)
      const isAddressOrSignature = typeof children === 'string' && 
        /^(0x)?[0-9a-fA-F]+$/.test(children.trim()) &&
        !children.includes('\n');

      // Check if this is legal text (contains paragraphs or long text)
      const isLegalText = typeof children === 'string' && 
        (children.includes('\n') || children.length > 100);

      if (match || isAddressOrSignature || isLegalText) {
        // For code blocks, use pre instead of div to avoid nesting issues
        return <pre className={styles.codeBlock}>{children}</pre>;
      } else {
        // For inline code
        return <code className={styles.inlineCode}>{children}</code>;
      }
    },
    
    // Remove the pre handler since we're handling everything in the code component
    pre: ({ children }) => children,
    
    img: ({ src, alt }) => {
      // Check if this is a data URI placeholder
      const imgSrc = String(src || '');
      if (imgSrc && imgSrc in dataUris) {
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
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
    >
      {processedContent}
    </ReactMarkdown>
  );
} 