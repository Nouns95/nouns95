import { FC, useCallback, useState } from 'react';
import Image from 'next/image';
import { IFeeds } from '@pushprotocol/restapi';
import { useChannel } from '../../hooks/feature/useChannel';
import { ChannelService } from '../../services/channelService';
import { StreamService } from '../../services/streamService';
import styles from './ChannelsTab.module.css';

interface ChannelsTabProps {
  channelService: ChannelService;
  streamService: StreamService | null;
  isStreamConnected: boolean;
}

export const ChannelsTab: FC<ChannelsTabProps> = ({
  channelService,
  streamService,
  isStreamConnected
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newChannelData, setNewChannelData] = useState({
    name: '',
    description: '',
    icon: '',
    url: ''
  });

  const {
    channels,
    isLoading,
    error,
    loadChannels,
    createChannel,
    searchByTags
  } = useChannel(channelService, streamService, isStreamConnected);

  const handleRefresh = useCallback(async () => {
    await loadChannels();
  }, [loadChannels]);

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim()) {
      await searchByTags(searchQuery);
    } else {
      await loadChannels();
    }
  }, [searchQuery, searchByTags, loadChannels]);

  const handleCreateChannel = useCallback(async () => {
    if (!newChannelData.name) return;
    
    await createChannel({
      name: newChannelData.name,
      description: newChannelData.description,
      icon: newChannelData.icon,
      url: newChannelData.url || 'https://push.org'
    });
    
    setIsCreating(false);
    setNewChannelData({
      name: '',
      description: '',
      icon: '',
      url: ''
    });
  }, [createChannel, newChannelData]);

  const renderChannelItem = (channel: IFeeds) => (
    <div key={channel.did} className={styles.channelItem}>
      <div className={styles.channelIcon}>
        {channel.profilePicture ? (
          <Image
            src={channel.profilePicture}
            alt={channel.name || 'Channel'}
            width={48}
            height={48}
            className={styles.iconImage}
          />
        ) : (
          <div className={styles.defaultIcon}>
            {(channel.name || 'C').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className={styles.channelInfo}>
        <span className={styles.channelName}>
          {channel.name || 'Unnamed Channel'}
        </span>
        <span className={styles.channelDescription}>
          {channel.about || 'No description available'}
        </span>
        <div className={styles.channelStats}>
          <span className={styles.subscriberCount}>
            Subscribers
          </span>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Error: {error.message}
          <button 
            onClick={handleRefresh}
            className={styles.refreshButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const channelsList = Array.isArray(channels) ? channels : [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className={styles.searchInput}
          />
          <button 
            onClick={handleSearch}
            className={styles.searchButton}
          >
            Search
          </button>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.createButton}
            onClick={() => setIsCreating(true)}
          >
            Create Channel
          </button>
          <button 
            className={styles.refreshButton}
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
            placeholder="Channel Name"
            value={newChannelData.name}
            onChange={(e) => setNewChannelData(prev => ({ ...prev, name: e.target.value }))}
            className={styles.input}
          />
          <textarea
            placeholder="Channel Description"
            value={newChannelData.description}
            onChange={(e) => setNewChannelData(prev => ({ ...prev, description: e.target.value }))}
            className={styles.textarea}
          />
          <input
            type="text"
            placeholder="Channel Icon URL (base64 encoded)"
            value={newChannelData.icon}
            onChange={(e) => setNewChannelData(prev => ({ ...prev, icon: e.target.value }))}
            className={styles.input}
          />
          <input
            type="text"
            placeholder="Channel URL (e.g., https://push.org)"
            value={newChannelData.url}
            onChange={(e) => setNewChannelData(prev => ({ ...prev, url: e.target.value }))}
            className={styles.input}
          />
          <div className={styles.formButtons}>
            <button 
              className={styles.createButton}
              onClick={handleCreateChannel}
              disabled={!newChannelData.name}
            >
              Create
            </button>
            <button 
              className={styles.cancelButton}
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.channelsList}>
          {isLoading ? (
            <div className={styles.loading}>Loading channels...</div>
          ) : channelsList.length === 0 ? (
            <div className={styles.empty}>No channels found</div>
          ) : (
            channelsList.map(renderChannelItem)
          )}
        </div>
      )}
    </div>
  );
}; 