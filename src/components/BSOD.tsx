'use client';

import { useEffect, useState } from 'react';
import styles from './BSOD.module.css';

export default function BSOD() {
  const [os, setOs] = useState<'mac' | 'windows' | 'other'>('other');

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes('mac')) {
      setOs('mac');
    } else if (userAgent.includes('win')) {
      setOs('windows');
    } else {
      setOs('other');
    }

    // Handle keypress to redirect to BerryOS
    const handleKeyPress = () => {
      window.location.href = 'https://berryos.wtf';
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  const getCloseCommand = () => {
    switch (os) {
      case 'mac':
        return 'CMD+W';
      case 'windows':
        return 'CTRL+W';
      default:
        return 'CTRL+W or CMD+W';
    }
  };

  return (
    <div className={styles.bsod}>
      <div className={styles.container}>
        <div className={styles.header}>
          Nouns 95
        </div>
        
        <div className={styles.content}>
          <p className={styles.errorText}>
            A fatal exception 0E has occurred at 002B:C002AD13 in N0UNS95(01) + 
            0000A3D7. The current application will be terminated.
          </p>

          <ul className={styles.instructions}>
            <li>Press {getCloseCommand()} to close this tab.</li>
            <li>
              Visit{' '}
              <a 
                href="https://berryos.wtf" 
                className={styles.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                berryos.wtf
              </a>
              {' '}for an upgraded experience.
            </li>
          </ul>

          <p className={styles.continueText}>
            Press any key to continue
          </p>
        </div>
      </div>
    </div>
  );
}

