import { FC, useCallback, useState } from 'react';
import Image from 'next/image';
import { SpaceIFeeds } from '@pushprotocol/restapi';
import styles from './SpacesTab.module.css';
import { useSpace } from '../../hooks/feature/useSpace';
import { SpaceService } from '../../services/spaceService';
import { StreamService } from '../../services/streamService';

interface SpacesTabProps {
  spaceService: SpaceService;
  streamService: StreamService | null;
  isStreamConnected: boolean;
}

export const SpacesTab: FC<SpacesTabProps> = ({
  spaceService,
  streamService,
  isStreamConnected
}) => {
  const {
    spaces,
    spaceStatus,
    isLoading,
    error,
    getTrendingSpaces,
    createSpace,
    joinSpace
  } = useSpace(spaceService, streamService, isStreamConnected);

  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceData, setNewSpaceData] = useState({
    spaceName: '',
    spaceDescription: '',
    isPublic: true
  });

  const handleRefresh = useCallback(async () => {
    await getTrendingSpaces();
  }, [getTrendingSpaces]);

  const handleJoinSpace = useCallback(async (spaceId: string) => {
    await joinSpace(spaceId);
  }, [joinSpace]);

  const handleCreateSpace = useCallback(async () => {
    if (!newSpaceData.spaceName) return;
    
    await createSpace({
      spaceName: newSpaceData.spaceName,
      spaceDescription: newSpaceData.spaceDescription,
      isPublic: newSpaceData.isPublic
    });
    
    setIsCreating(false);
    setNewSpaceData({
      spaceName: '',
      spaceDescription: '',
      isPublic: true
    });
  }, [createSpace, newSpaceData]);

  const renderSpaceItem = (space: SpaceIFeeds) => {
    const isLive = spaceStatus[space.spaceId || '']?.isLive;

    return (
      <div 
        key={space.spaceId}
        className={styles.spaceItem}
        onClick={() => space.spaceId && handleJoinSpace(space.spaceId)}
      >
        <Image
          src={space.spaceInformation?.spaceImage || '/default-space.png'}
          alt={space.spaceInformation?.spaceName || 'Space'}
          width={48}
          height={48}
          className={styles.spaceImage}
        />
        <div className={styles.spaceInfo}>
          <span className={styles.spaceName}>{space.spaceInformation?.spaceName || 'Unnamed Space'}</span>
          <span className={styles.spaceDescription}>
            {space.spaceInformation?.spaceDescription || 'No description available'}
          </span>
          {isLive && <span className={styles.liveIndicator}>LIVE</span>}
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Error: {error.message}
          <button 
            onClick={handleRefresh}
            className={styles.createButton}
            style={{ marginLeft: '8px' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Trending Spaces</span>
        <div>
          <button 
            className={styles.createButton}
            style={{ marginRight: '8px' }}
            onClick={() => setIsCreating(true)}
          >
            Create Space
          </button>
          <button 
            className={styles.createButton}
            onClick={handleRefresh}
          >
            Refresh
          </button>
        </div>
      </div>
      
      {isCreating ? (
        <div className={styles.createForm}>
          <input
            type="text"
            placeholder="Space Name"
            value={newSpaceData.spaceName}
            onChange={(e) => setNewSpaceData(prev => ({ ...prev, spaceName: e.target.value }))}
            className={styles.input}
          />
          <textarea
            placeholder="Space Description"
            value={newSpaceData.spaceDescription}
            onChange={(e) => setNewSpaceData(prev => ({ ...prev, spaceDescription: e.target.value }))}
            className={styles.textarea}
          />
          <div className={styles.checkboxGroup}>
            <label>
              <input
                type="checkbox"
                checked={newSpaceData.isPublic}
                onChange={(e) => setNewSpaceData(prev => ({ ...prev, isPublic: e.target.checked }))}
              />
              Public Space
            </label>
          </div>
          <div className={styles.formButtons}>
            <button 
              className={styles.createButton}
              onClick={handleCreateSpace}
              disabled={!newSpaceData.spaceName}
            >
              Create
            </button>
            <button 
              className={styles.createButton}
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.spacesList}>
          {isLoading ? (
            <div className={styles.error}>Loading spaces...</div>
          ) : spaces.length === 0 ? (
            <div className={styles.error}>No spaces found</div>
          ) : (
            spaces.map(renderSpaceItem)
          )}
        </div>
      )}
    </div>
  );
}; 