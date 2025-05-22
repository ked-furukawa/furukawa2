// src/components/StoreList.tsx
import { useState, useEffect } from 'react';
import { Box, List, ListItem, ListItemButton, ListItemText, Typography, Divider } from '@mui/material';
import { Store } from '../types';
import { fetchStores } from '../services/dataService';

interface StoreListProps {
  selectedStoreId: string | null;
  onSelectStore: (storeId: string) => void;
}

const StoreList = ({ selectedStoreId, onSelectStore }: StoreListProps) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const loadStores = async () => {
      try {
        setLoading(true);
        const storesData = await fetchStores();
        setStores(storesData);
      } catch (error) {
        console.error('Failed to load stores:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStores();
  }, []);

  return (
    <Box 
      sx={{ 
        width: '200px', 
        height: '60%', 
        borderRight: '1px solid #ddd',
        overflowY: 'auto',
        bgcolor: '#f5f5f5'
      }}
    >
      <Typography variant="h6" sx={{ p: 2, textAlign: 'center' }}>
        店舗一覧
      </Typography>
      <Divider />
      
      {loading ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>読み込み中...</Box>
      ) : (
        <List>
          {stores.map((store) => (
            <ListItem key={store.id} disablePadding>
              <ListItemButton 
                selected={store.id === selectedStoreId}
                onClick={() => onSelectStore(store.id)}
                sx={{ 
                  py: 1.5,
                  bgcolor: store.id === selectedStoreId ? 'primary.light' : 'inherit',
                  '&:hover': {
                    bgcolor: store.id === selectedStoreId ? 'primary.light' : 'action.hover',
                  }
                }}
              >
                <ListItemText 
                  primary={store.storeName} 
                  secondary={`店舗番号: ${store.storeNumber}`} 
                  primaryTypographyProps={{ 
                    fontWeight: store.id === selectedStoreId ? 'bold' : 'normal',
                    fontSize: '0.95rem'
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.8rem'
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default StoreList;